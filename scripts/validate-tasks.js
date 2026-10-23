#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tasksPath = resolve(__dirname, "../plan/tasks.json");

function validate() {
  console.log("🔍 Validating plan/tasks.json register integrity...");

  let content;
  try {
    content = readFileSync(tasksPath, "utf-8");
  } catch (err) {
    console.error(`❌ Failed to read tasks file at ${tasksPath}:`, err.message);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error(`❌ JSON parse error in ${tasksPath}:`, err.message);
    process.exit(1);
  }

  const errors = [];
  const statusValues = new Set(data.statusValues || []);
  const priorityValues = new Set(data.priorityValues || []);

  const gateIds = new Set((data.gates || []).map((g) => g.id));
  const decisionIds = new Set((data.decisions || []).map((d) => d.id));
  const taskIds = new Set();

  const tasks = data.tasks || [];
  if (!Array.isArray(tasks) || tasks.length === 0) {
    errors.push("No tasks found in tasks array.");
  }

  // First pass: collect task IDs & check duplicates
  for (const task of tasks) {
    if (!task.id) {
      errors.push("Found task without an id.");
      continue;
    }
    if (taskIds.has(task.id)) {
      errors.push(`Duplicate task ID found: "${task.id}"`);
    }
    taskIds.add(task.id);
  }

  // Second pass: validate task fields and relations
  for (const task of tasks) {
    const id = task.id;

    if (!statusValues.has(task.status)) {
      errors.push(
        `[${id}] Invalid status: "${task.status}". Expected one of: ${[...statusValues].join(", ")}`
      );
    }

    if (!priorityValues.has(task.priority)) {
      errors.push(
        `[${id}] Invalid priority: "${task.priority}". Expected one of: ${[...priorityValues].join(", ")}`
      );
    }

    if (!Array.isArray(task.acceptance) || task.acceptance.length === 0) {
      errors.push(`[${id}] Missing or empty acceptance criteria array.`);
    }

    if (!Array.isArray(task.tests) || task.tests.length === 0) {
      errors.push(`[${id}] Missing or empty tests array.`);
    }

    // Validate dependsOn
    if (Array.isArray(task.dependsOn)) {
      for (const dep of task.dependsOn) {
        if (!taskIds.has(dep)) {
          errors.push(`[${id}] dependsOn references non-existent task ID: "${dep}"`);
        }
      }
    }

    // Validate decisionGate
    if (Array.isArray(task.decisionGate)) {
      for (const gate of task.decisionGate) {
        if (!decisionIds.has(gate)) {
          errors.push(`[${id}] decisionGate references non-existent decision ID: "${gate}"`);
        }
      }
    }

    // Validate blockedBy
    if (Array.isArray(task.blockedBy)) {
      for (const blocker of task.blockedBy) {
        if (!gateIds.has(blocker) && !decisionIds.has(blocker)) {
          errors.push(`[${id}] blockedBy references unknown gate/decision: "${blocker}"`);
        }
      }
    }
  }

  // Validate decisions blocks array
  for (const decision of data.decisions || []) {
    if (Array.isArray(decision.blocks)) {
      for (const blockedTaskId of decision.blocks) {
        if (!taskIds.has(blockedTaskId)) {
          errors.push(`Decision [${decision.id}] blocks non-existent task ID: "${blockedTaskId}"`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(`❌ Validation failed with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(
    `✅ Success: ${tasks.length} tasks, ${data.gates?.length || 0} gates, and ${data.decisions?.length || 0} decisions validated with 0 errors.`
  );
}

validate();
