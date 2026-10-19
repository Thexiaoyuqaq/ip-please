/** Palette: muted greys and browns; only the red/green stamps and Claude orange are bright. */
export type RGB = readonly [number, number, number];

export const C = {
  INK: [22, 19, 19],
  OUTLINE: [34, 27, 25],
  GROUND: [93, 87, 78],
  GROUND_D: [80, 74, 67],
  WALL_D: [48, 45, 43],
  BOOTH_WALL: [52, 48, 44],
  COUNTER: [98, 86, 73],
  COUNTER_L: [124, 110, 93],
  COUNTER_D: [70, 61, 52],
  DESK: [68, 57, 50],
  DESK_D: [56, 47, 42],
  DESK_L: [84, 72, 63],
  PAPER: [226, 215, 196],
  PAPER_D: [200, 187, 167],
  PAPER_LINE: [216, 204, 184],
  PINK: [224, 198, 186],
  PINK_D: [196, 166, 156],
  SAGE: [208, 214, 190],
  SAGE_D: [172, 180, 152],
  XRAY_BG: [18, 40, 42],
  XRAY_FG: [70, 140, 136],
  XRAY_L: [150, 220, 210],
  TEXT: [74, 56, 48],
  TEXT_L: [128, 106, 92],
  NAVY: [42, 50, 76],
  NAVY_L: [60, 70, 100],
  RED: [180, 46, 40],
  RED_D: [120, 30, 28],
  RED_L: [222, 92, 76],
  GREEN: [84, 128, 70],
  GREEN_D: [56, 88, 48],
  GREEN_L: [122, 178, 98],
  METAL: [92, 90, 86],
  METAL_D: [60, 58, 56],
  METAL_L: [124, 122, 116],
  WHITE: [228, 223, 212],
  GREY: [150, 145, 136],
  GREY_D: [100, 94, 88],
  ORANGE: [220, 150, 70],
  CLAUDE: [204, 112, 80],
  CLAUDE_L: [232, 156, 116],
  LED: [214, 72, 52],
  SWEAT: [156, 186, 204],
  BOOK: [92, 64, 50],
  BOOK_L: [130, 100, 70],
  GOLD: [190, 160, 100],
  SKIN: [198, 152, 120],
} as const satisfies Record<string, RGB>;

export type ColorName = keyof typeof C;

export const K = Object.fromEntries(
  Object.entries(C).map(([name, value]) => [name, rgb(value)]),
) as { readonly [Name in ColorName]: string };

export function rgb(color: readonly number[]): string {
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

export function rgba(color: readonly number[], alpha: number): string {
  return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
}
