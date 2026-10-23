// Renders the HeatPulse mark into every icon the site serves:
// app/icon.svg, app/favicon.ico (16/32/48), app/apple-icon.png, public/icon-{192,512}.png.
// Run: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

// components/ds/HeatPulseMark.tsx, thickened and centred for small sizes.
// `radius` 0 for the Apple touch icon: iOS rounds the corners itself.
const mark = (radius = 10) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="${radius}" fill="#0a0b0f"/>
  <g transform="translate(-1.5 -6.6) scale(1.2)">
    <path d="M4 30 L12 30 L15 22 L19 36 L23 14 L27 28 L30 24 C32 22 35 22 36 26 C37 30 35 34 30 36 C28 37 26 37 24 36"
      fill="none" stroke="#ff5a24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="36" cy="26" r="2.5" fill="#ff5a24"/>
  </g>
</svg>
`;
const svg = mark();
const png = (size, src = svg) => sharp(Buffer.from(src), { density: 72 * size / 48 * 4 }).resize(size, size).png().toBuffer();

writeFileSync('app/icon.svg', svg);
writeFileSync('app/apple-icon.png', await png(180, mark(0)));
writeFileSync('public/icon-192.png', await png(192));
writeFileSync('public/icon-512.png', await png(512));

// ICO with PNG entries (supported by every current browser).
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(s => png(s)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e); header.writeUInt8(s, e + 1); header.writeUInt8(0, e + 2); header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(images[i].length, e + 8); header.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
writeFileSync('app/favicon.ico', Buffer.concat([header, ...images]));
console.log('icons written');
