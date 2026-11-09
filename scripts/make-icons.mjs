// Generates public/icon.svg, icon-192.png and icon-512.png without any image libraries.
// The PNGs are rasterised from the same simple shapes as the SVG (with 4×4 supersampling).
// Run: node scripts/make-icons.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const C = {
  bgTop: [139, 108, 255],
  bgBottom: [91, 63, 214],
  main: [76, 195, 138],
  dark: [43, 138, 94],
  belly: [211, 245, 227],
  white: [255, 255, 255],
  ink: [42, 30, 74],
  mouth: [107, 33, 64],
  cheek: [255, 111, 145],
  star: [255, 217, 59],
};

// Shapes in a 512×512 coordinate system, painted in order.
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const inTri = (x, y, [ax, ay], [bx, by], [cx, cy]) => {
  const s = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  const d1 = s(x, y, ax, ay, bx, by);
  const d2 = s(x, y, bx, by, cx, cy);
  const d3 = s(x, y, cx, cy, ax, ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};
const inRoundRect = (x, y, w, h, r) => {
  const qx = Math.max(r - x, 0, x - (w - r));
  const qy = Math.max(r - y, 0, y - (h - r));
  return qx * qx + qy * qy <= r * r;
};

const shapes = [
  { color: C.main, test: (x, y) => inTri(x, y, [130, 230], [118, 92], [220, 170]) },
  { color: C.main, test: (x, y) => inTri(x, y, [382, 230], [394, 92], [292, 170]) },
  { color: C.belly, test: (x, y) => inTri(x, y, [146, 200], [140, 130], [190, 168]) },
  { color: C.belly, test: (x, y) => inTri(x, y, [366, 200], [372, 130], [322, 168]) },
  { color: C.dark, test: (x, y) => inEllipse(x, y, 186, 452, 46, 22) },
  { color: C.dark, test: (x, y) => inEllipse(x, y, 326, 452, 46, 22) },
  { color: C.main, test: (x, y) => inEllipse(x, y, 256, 300, 168, 156) },
  { color: C.belly, test: (x, y) => inEllipse(x, y, 256, 358, 100, 80) },
  { color: C.cheek, alpha: 0.45, test: (x, y) => inEllipse(x, y, 166, 318, 24, 15) },
  { color: C.cheek, alpha: 0.45, test: (x, y) => inEllipse(x, y, 346, 318, 24, 15) },
  { color: C.white, test: (x, y) => inEllipse(x, y, 204, 268, 32, 32) },
  { color: C.white, test: (x, y) => inEllipse(x, y, 308, 268, 32, 32) },
  { color: C.ink, test: (x, y) => inEllipse(x, y, 209, 273, 19, 19) },
  { color: C.ink, test: (x, y) => inEllipse(x, y, 313, 273, 19, 19) },
  { color: C.white, test: (x, y) => inEllipse(x, y, 216, 265, 7, 7) },
  { color: C.white, test: (x, y) => inEllipse(x, y, 320, 265, 7, 7) },
  { color: C.mouth, test: (x, y) => y >= 322 && inEllipse(x, y, 256, 322, 40, 36) },
];

function pixel(x, y) {
  if (!inRoundRect(x, y, 512, 512, 112)) return [0, 0, 0, 0];
  const t = y / 512;
  let rgb = C.bgTop.map((v, i) => v + (C.bgBottom[i] - v) * t);
  for (const s of shapes) {
    if (s.test(x, y)) {
      const a = s.alpha ?? 1;
      rgb = rgb.map((v, i) => v * (1 - a) + s.color[i] * a);
    }
  }
  return [...rgb, 255];
}

function render(size) {
  const ss = 4;
  const scale = 512 / size;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0; // filter: none
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0, 0];
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const [r, g, b, a] = pixel((px + (sx + 0.5) / ss) * scale, (py + (sy + 0.5) / ss) * scale);
          acc[0] += r * a;
          acc[1] += g * a;
          acc[2] += b * a;
          acc[3] += a;
        }
      }
      const o = py * (size * 4 + 1) + 1 + px * 4;
      const alpha = acc[3] / (ss * ss);
      raw[o] = acc[3] ? Math.round(acc[0] / acc[3]) : 0;
      raw[o + 1] = acc[3] ? Math.round(acc[1] / acc[3]) : 0;
      raw[o + 2] = acc[3] ? Math.round(acc[2] / acc[3]) : 0;
      raw[o + 3] = Math.round(alpha);
    }
  }
  return png(size, size, raw);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const hex = (rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hex(C.bgTop)}"/><stop offset="1" stop-color="${hex(C.bgBottom)}"/></linearGradient></defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <path d="M130 230 L118 92 L220 170 Z M382 230 L394 92 L292 170 Z" fill="${hex(C.main)}"/>
  <path d="M146 200 L140 130 L190 168 Z M366 200 L372 130 L322 168 Z" fill="${hex(C.belly)}"/>
  <ellipse cx="186" cy="452" rx="46" ry="22" fill="${hex(C.dark)}"/>
  <ellipse cx="326" cy="452" rx="46" ry="22" fill="${hex(C.dark)}"/>
  <ellipse cx="256" cy="300" rx="168" ry="156" fill="${hex(C.main)}"/>
  <ellipse cx="256" cy="358" rx="100" ry="80" fill="${hex(C.belly)}"/>
  <ellipse cx="166" cy="318" rx="24" ry="15" fill="${hex(C.cheek)}" opacity="0.45"/>
  <ellipse cx="346" cy="318" rx="24" ry="15" fill="${hex(C.cheek)}" opacity="0.45"/>
  <circle cx="204" cy="268" r="32" fill="#fff"/><circle cx="308" cy="268" r="32" fill="#fff"/>
  <circle cx="209" cy="273" r="19" fill="${hex(C.ink)}"/><circle cx="313" cy="273" r="19" fill="${hex(C.ink)}"/>
  <circle cx="216" cy="265" r="7" fill="#fff"/><circle cx="320" cy="265" r="7" fill="#fff"/>
  <path d="M216 322 A40 36 0 0 0 296 322 Z" fill="${hex(C.mouth)}"/>
</svg>
`;

const out = new URL("../public/", import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL("icon.svg", out), svg);
for (const size of [192, 512]) writeFileSync(new URL(`icon-${size}.png`, out), render(size));
console.log("Wrote public/icon.svg, icon-192.png, icon-512.png");

