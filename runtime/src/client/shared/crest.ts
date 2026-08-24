/**
 * G4: renders one crest from design/assets/team-crests-set.svg as a CSS
 * sprite. The file is a single 1020x200 sheet of five 196-wide cells
 * (Ironworks/Northstar/Harbor/Summit/Vale, left to right, each inset 10px
 * from the top) — cropping a single crest is a background-position trick,
 * not five separate asset files, so this stays "consume, never edit" the
 * design asset itself.
 */
const CELL_X = [20, 216, 412, 608, 804] as const;
const SPRITE_W = 1020;
const SPRITE_H = 200;
const CELL_W = 196;
const CELL_Y_INSET = 10;
const CELL_H_VISIBLE = 190;

/** Inline style attribute value for a <div> (or similar) that should render as one crest, `sizePx` wide. */
export function crestStyle(crestIndex: number, sizePx: number): string {
  const scale = sizePx / CELL_W;
  const x = CELL_X[((crestIndex % CELL_X.length) + CELL_X.length) % CELL_X.length]!;
  const bgW = Math.round(SPRITE_W * scale);
  const bgH = Math.round(SPRITE_H * scale);
  const posX = Math.round(x * scale);
  const posY = Math.round(CELL_Y_INSET * scale);
  const height = Math.round(CELL_H_VISIBLE * scale);
  return `width:${sizePx}px;height:${height}px;background-image:url(/assets/team-crests-set.svg);background-repeat:no-repeat;background-size:${bgW}px ${bgH}px;background-position:-${posX}px -${posY}px;flex-shrink:0;`;
}
