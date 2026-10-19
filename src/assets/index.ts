import { ASSETS, ASSET_IMAGES } from './generated/assets';

/** [x, y, width, height, offsetX, offsetY] inside the sprite atlas. */
export type Sprite = readonly [number, number, number, number, number, number];
/** [x, y, width, height, offsetX, offsetY, advance] inside the font sheet. */
export type Glyph = readonly [number, number, number, number, number, number, number];

export interface PersonMeta {
  expr: string;
  walker: readonly [readonly number[], readonly number[]];
  scripted: boolean;
  fw: number;
  extra?: readonly (readonly number[])[];
}

export type FontSize = 8 | 10 | 12;

export const FONT = ASSETS.font as unknown as Record<FontSize, Record<string, Glyph>>;
export const SPRITES: Record<string, Sprite> = ASSETS.sprites;
export const PEOPLE: Record<string, PersonMeta> = ASSETS.people;
export const IMAGE_SOURCES = ASSET_IMAGES;

/** Atlas images, populated by loadImages() before the first frame. */
export let FONT_IMG: HTMLImageElement;
export let ATLAS_IMG: HTMLImageElement;
export let BG_IMG: HTMLImageElement;
export let WIN_IMG: HTMLImageElement;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 48)}...`));
    image.src = src;
  });
}

export async function loadImages(): Promise<void> {
  const [font, atlas, bg, win] = await Promise.all([
    loadImage(IMAGE_SOURCES.font),
    loadImage(IMAGE_SOURCES.atlas),
    loadImage(IMAGE_SOURCES.bg),
    loadImage(IMAGE_SOURCES.win),
  ]);
  FONT_IMG = font;
  ATLAS_IMG = atlas;
  BG_IMG = bg;
  WIN_IMG = win;
}
