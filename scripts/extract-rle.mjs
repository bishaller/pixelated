import { readFileSync, writeFileSync } from 'fs';

const html = readFileSync('pixel-bishal.html', 'utf-8');

const shadeMatch = html.match(/const SHADE_RLE = `([^`]+)`/);
const hairMatch = html.match(/const HAIR_RLE = `([^`]+)`/);

if (!shadeMatch || !hairMatch) {
  console.error('Could not find RLE data in HTML');
  process.exit(1);
}

function rleDecode(rle) {
  const parts = rle.split(',');
  let out = '';
  for (const p of parts) {
    const ch = p[0];
    const count = parseInt(p.substring(1));
    out += ch.repeat(count);
  }
  return out;
}

const SIZE = 384;
const shades = rleDecode(shadeMatch[1]);
const hairs = rleDecode(hairMatch[1]);

console.log(`Shades: ${shades.length}, Hairs: ${hairs.length} (expected ${SIZE * SIZE})`);

let hairCount = 0;
for (let i = 0; i < hairs.length; i++) if (hairs[i] === '1') hairCount++;
console.log(`Hair pixels: ${hairCount} (${(hairCount / (SIZE * SIZE) * 100).toFixed(1)}%)`);

// --- Write flat RLE strings as TypeScript for canvas use ---
let canvasDataOut = `// Extracted from pixel-bishal.html — 384×384 shade + hair mask data
// Shade string: each char is '0'-'5', length = 384*384 = 147456
// Hair string: each char is '0' or '1', length = 384*384 = 147456

export const SHADE_RLE = \`${shadeMatch[1]}\`;
export const HAIR_RLE = \`${hairMatch[1]}\`;

function rleDecode(rle: string): string {
  const parts = rle.split(',');
  let out = '';
  for (const p of parts) {
    const ch = p[0];
    const count = parseInt(p.substring(1));
    out += ch.repeat(count);
  }
  return out;
}

// Decode at import time
export const shades384 = rleDecode(SHADE_RLE);
export const hairs384 = rleDecode(HAIR_RLE);
export const SIZE_384 = 384;

// Downsample for lower densities
function downsampleStr(src: string, srcSize: number, dstSize: number, isHair: boolean): string {
  const scale = srcSize / dstSize;
  let out = '';
  for (let y = 0; y < dstSize; y++) {
    for (let x = 0; x < dstSize; x++) {
      let sum = 0, count = 0;
      for (let sy = Math.floor(y * scale); sy < Math.floor((y + 1) * scale); sy++) {
        for (let sx = Math.floor(x * scale); sx < Math.floor((x + 1) * scale); sx++) {
          const v = parseInt(src[sy * srcSize + sx]);
          sum += v;
          count++;
        }
      }
      if (isHair) {
        out += sum > count / 2 ? '1' : '0';
      } else {
        out += String(Math.round(sum / count));
      }
    }
  }
  return out;
}

export const shades192 = downsampleStr(shades384, 384, 192, false);
export const hairs192 = downsampleStr(hairs384, 384, 192, true);

export const shades96 = downsampleStr(shades384, 384, 96, false);
export const hairs96 = downsampleStr(hairs384, 384, 96, true);

export const shades48 = downsampleStr(shades384, 384, 48, false);
export const hairs48 = downsampleStr(hairs384, 384, 48, true);

export const allShades: Record<number, string> = {
  48: shades48, 96: shades96, 192: shades192, 384: shades384,
};
export const allHairs: Record<number, string> = {
  48: hairs48, 96: hairs96, 192: hairs192, 384: hairs384,
};
`;

writeFileSync('src/canvasData.ts', canvasDataOut);
console.log('Wrote src/canvasData.ts');
