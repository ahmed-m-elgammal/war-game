/**
 * Vite Raw-Asset Module Declaration
 *
 * Lets database contract tests import migration SQL as text through Vitest's
 * Vite pipeline without adding Node filesystem globals to the package.
 */

declare module "*?raw" {
  const content: string;
  export default content;
}
