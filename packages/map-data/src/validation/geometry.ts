/**
 * Map Geometry Helpers
 *
 * Bounds checks shared by province centroids and art anchors. Coordinates are
 * mask-space pixels, not screen space; the renderer applies pan and zoom later.
 * Inputs may originate from untyped map JSON, so malformed points are reported
 * as out of bounds instead of throwing.
 */

export function isPointInBounds(point: unknown, width: number, height: number): boolean {
  if (typeof point !== "object" || point === null || !("x" in point) || !("y" in point)) {
    return false;
  }

  const { x, y } = point;

  return (
    typeof x === "number" &&
    Number.isFinite(x) &&
    typeof y === "number" &&
    Number.isFinite(y) &&
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height
  );
}
