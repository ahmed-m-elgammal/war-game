/**
 * TypeScript AST helpers for repository contract validators.
 *
 * Replaces regex scanning with brace-balanced declaration discovery so generics,
 * heritage clauses, nested object types, index signatures and method signatures are
 * all handled correctly. Types are compared as expanded, canonical text: local type
 * aliases are resolved before comparison so `UInt` and `number` are equivalent, but
 * branded IDs stay opaque because their representations intentionally differ between
 * the plan and the package.
 *
 * The module is intentionally side-effect free. Callers own file discovery, policy,
 * reporting and exit codes.
 */

import { readFileSync } from "node:fs";
import ts from "typescript";

const KIND_BY_SYNTAX = new Map([
  [ts.SyntaxKind.InterfaceDeclaration, "interface"],
  [ts.SyntaxKind.TypeAliasDeclaration, "type"],
  [ts.SyntaxKind.ClassDeclaration, "class"],
  [ts.SyntaxKind.EnumDeclaration, "enum"],
  [ts.SyntaxKind.FunctionDeclaration, "function"]
]);

export function parseSourceFile(filePath) {
  return ts.createSourceFile(
    filePath,
    readFileSync(filePath, "utf-8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
}

export function formatLocation(node) {
  const sourceFile = node.getSourceFile();
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return `${sourceFile.fileName}:${position.line + 1}:${position.character + 1}`;
}

function hasExportModifier(node) {
  return (
    ts.canHaveModifiers(node) === true &&
    (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
}

function hasReadonlyModifier(node) {
  return (node.modifiers ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword);
}

function declarationKind(node) {
  if (ts.isVariableDeclaration(node)) {
    return "const";
  }
  return KIND_BY_SYNTAX.get(node.kind) ?? "unknown";
}

function memberName(nameNode) {
  if (!nameNode) {
    return "[anonymous]";
  }
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) {
    return nameNode.text;
  }
  return nameNode.getText();
}

export function collectExportedDeclarations(sourceFile) {
  const declarations = new Map();
  const add = (name, kind, node) => {
    if (!declarations.has(name)) {
      declarations.set(name, { name, kind, node, sourceFile });
    }
  };
  const visit = (node) => {
    if (hasExportModifier(node)) {
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) {
            add(declaration.name.text, "const", declaration);
          }
        }
      } else if (
        (ts.isInterfaceDeclaration(node) ||
          ts.isTypeAliasDeclaration(node) ||
          ts.isClassDeclaration(node) ||
          ts.isEnumDeclaration(node) ||
          ts.isFunctionDeclaration(node)) &&
        node.name
      ) {
        add(node.name.text, declarationKind(node), node);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return declarations;
}

export function normalizeTypeText(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/\r?\n/g, " ")
    .replace(/["']/g, '"')
    .replace(/\s+/g, " ")
    .replace(/\s*([|&,:<>()[\]{}?=;])\s*/g, "$1")
    .replace(/,([}\]>])/g, "$1")
    .replace(/;+([}\]])/g, "$1")
    .trim();
}

export function createTypeExpander(aliasTexts, options = {}) {
  const skipped = options.skip ?? new Set();
  const maxDepth = options.maxDepth ?? 8;
  const expandSegment = (segment, seen, depth) =>
    segment.replace(/\b[A-Za-z_$][\w$]*\b/g, (name, offset, whole) => {
      if (skipped.has(name) || seen.has(name) || !aliasTexts.has(name)) {
        return name;
      }
      if (/^\s*:/.test(whole.slice(offset + name.length))) {
        return name;
      }
      const nextSeen = new Set(seen).add(name);
      return expandSegment(aliasTexts.get(name), nextSeen, depth + 1);
    });
  return (text, depth = 0) => {
    if (!text) {
      return "";
    }
    if (depth >= maxDepth) {
      return normalizeTypeText(text);
    }
    const withoutStrings = text.split(/("[^"]*"|'[^']*'|`[^`]*`)/g);
    const expanded = withoutStrings
      .map((part, index) => (index % 2 === 1 ? part : expandSegment(part, new Set(), depth)))
      .join(" ");
    return normalizeTypeText(expanded);
  };
}

export function describeInterface(node, expandType) {
  const properties = new Map();
  for (const member of node.members) {
    if (ts.isPropertySignature(member)) {
      properties.set(memberName(member.name), {
        optional: Boolean(member.questionToken),
        readonly: hasReadonlyModifier(member),
        type: expandType(member.type ? member.type.getText() : "unknown")
      });
    } else if (ts.isIndexSignatureDeclaration(member)) {
      properties.set("[index]", {
        optional: false,
        readonly: hasReadonlyModifier(member),
        type: expandType(member.type.getText())
      });
    } else if (ts.isMethodSignature(member)) {
      properties.set(memberName(member.name), {
        optional: Boolean(member.questionToken),
        readonly: hasReadonlyModifier(member),
        type: expandType(member.getText())
      });
    } else if (ts.isCallSignatureDeclaration(member)) {
      properties.set("[call]", {
        optional: false,
        readonly: false,
        type: expandType(member.getText())
      });
    }
  }
  return {
    typeParameters: (node.typeParameters ?? []).map((parameter) => expandType(parameter.getText())),
    heritage: (node.heritageClauses ?? []).map((clause) => expandType(clause.getText())),
    properties
  };
}

export function readLiteralArray(node) {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  if (!ts.isArrayLiteralExpression(current)) {
    return null;
  }
  const values = [];
  for (const element of current.elements) {
    if (ts.isStringLiteral(element) || ts.isNumericLiteral(element)) {
      values.push(element.text);
    } else if (
      ts.isPrefixUnaryExpression(element) &&
      element.operator === ts.SyntaxKind.MinusToken &&
      ts.isNumericLiteral(element.operand)
    ) {
      values.push(`-${element.operand.text}`);
    } else {
      return null;
    }
  }
  return values;
}

export function unwrapZodObject(initializer) {
  let current = initializer;
  while (current && ts.isCallExpression(current)) {
    const callee = current.expression;
    if (!ts.isPropertyAccessExpression(callee)) {
      return null;
    }
    if (callee.name.text === "object") {
      return current.arguments[0] ?? null;
    }
    current = callee.expression;
  }
  return null;
}

export function isStrictZodSchema(initializer) {
  let current = initializer;
  while (current && ts.isCallExpression(current)) {
    const callee = current.expression;
    if (!ts.isPropertyAccessExpression(callee)) {
      return false;
    }
    if (callee.name.text === "strict") {
      return true;
    }
    if (callee.name.text === "object") {
      return false;
    }
    current = callee.expression;
  }
  return false;
}

export function readObjectKeys(objectLiteral) {
  const keys = [];
  for (const property of objectLiteral.properties) {
    if (ts.isPropertyAssignment(property)) {
      keys.push(memberName(property.name));
    } else if (ts.isShorthandPropertyAssignment(property)) {
      keys.push(property.name.text);
    } else {
      return null;
    }
  }
  return keys;
}

export function readBrandAlias(node) {
  if (!ts.isTypeAliasDeclaration(node) || !ts.isTypeReferenceNode(node.type)) {
    return null;
  }
  if (node.type.typeName.getText() !== "Brand") {
    return null;
  }
  const [baseNode, literalNode] = node.type.typeArguments ?? [];
  const brand = literalNode && ts.isLiteralTypeNode(literalNode) ? literalNode.literal.text : null;
  return { name: node.name.text, base: baseNode ? baseNode.getText() : "", brand };
}

export function readBrand(node) {
  let current = node;
  let base = null;
  let brand = null;
  while (current && ts.isCallExpression(current)) {
    const callee = current.expression;
    if (!ts.isPropertyAccessExpression(callee)) {
      break;
    }
    if (callee.name.text === "brand") {
      const literal = (current.typeArguments ?? [])[0];
      brand = literal && ts.isLiteralTypeNode(literal) ? literal.literal.text : null;
    }
    if (callee.name.text === "string" || callee.name.text === "number") {
      base = callee.name.text;
    }
    current = callee.expression;
  }
  return brand ? { base, brand } : null;
}
