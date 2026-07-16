/** "#rrggbb" -> [r, g, b, a] (0-255), the color tuple format deck.gl layers expect. */
export function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b, alpha];
}
