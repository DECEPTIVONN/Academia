/**
 * qr-generator.ts — Gerador mínimo de QR Code (v4.11.0)
 *
 * Gera um QR Code SVG a partir de uma string, sem dependências externas.
 * Usado no modal "Conectar Novo Dispositivo" para pareamento rápido.
 *
 * Implementação baseada no algoritmo QR Code (byte mode, error correction L).
 * Suporta versões 1–10 (até 271 bytes) — suficiente para códigos de pareamento.
 */

/* ── Tabelas de Reed-Solomon ECC (error correction level L) ── */
const ECC_L_PER_VERSION = [
  7, 10, 15, 20, 26, 18, 20, 24, 30, 18,
];

/* ── Capacidade de dados por versão (byte mode, level L) ── */
const DATA_CAPACITY = [
  17, 32, 53, 78, 106, 134, 154, 192, 230, 271,
];

/* ── Alignment pattern positions ── */
const ALIGNMENT_POS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

function getModulus(version: number): number {
  return version * 4 + 17;
}

/* ── GF(256) arithmetic for Reed-Solomon ── */
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

/* ── Reed-Solomon ECC generator ── */
function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], GF_EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, eccLen: number): Uint8Array {
  const gen = rsGeneratorPoly(eccLen);
  const result = new Uint8Array(eccLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0];
    result.copyWithin(0, 1);
    result[eccLen - 1] = 0;
    for (let j = 0; j < eccLen; j++) {
      result[j] ^= gfMul(gen[j + 1], factor);
    }
  }
  return result;
}

/* ── Version selection ── */
function pickVersion(dataLen: number): number {
  for (let v = 1; v <= 10; v++) {
    if (DATA_CAPACITY[v - 1] >= dataLen) return v;
  }
  return 10;
}

/* ── Build QR matrix ── */
function buildMatrix(version: number, data: Uint8Array, ecc: Uint8Array): number[][] {
  const size = getModulus(version);
  const matrix: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  /* Finder patterns */
  function placeFinder(r: number, c: number) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inFinder = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        if (inFinder) {
          const isBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
          const isCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          matrix[rr][cc] = isBorder || isCenter ? 1 : 0;
        } else {
          matrix[rr][cc] = 0;
        }
        reserved[rr][cc] = true;
      }
    }
  }
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  /* Alignment patterns */
  const alignPos = ALIGNMENT_POS[version] || [];
  for (const r of alignPos) {
    for (const c of alignPos) {
      /* Skip if overlaps finder */
      if ((r <= 7 && c <= 7) || (r <= 7 && c >= size - 8) || (r >= size - 8 && c <= 7)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const rr = r + dr, cc = c + dc;
          const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const isCenter = dr === 0 && dc === 0;
          matrix[rr][cc] = isBorder || isCenter ? 1 : 0;
          reserved[rr][cc] = true;
        }
      }
    }
  }

  /* Timing patterns */
  for (let i = 0; i < size; i++) {
    if (!reserved[6][i]) { matrix[6][i] = i % 2 === 0 ? 1 : 0; reserved[6][i] = true; }
    if (!reserved[i][6]) { matrix[i][6] = i % 2 === 0 ? 1 : 0; reserved[i][6] = true; }
  }

  /* Dark module */
  matrix[size - 8][8] = 1;
  reserved[size - 8][8] = true;

  /* Reserve format info areas */
  for (let i = 0; i < 9; i++) {
    if (!reserved[8][i]) reserved[8][i] = true;
    if (!reserved[i][8]) reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  /* Version info (v7+) */
  if (version >= 7) {
    const vInfo = versionInfo(version);
    for (let i = 0; i < 18; i++) {
      const bit = (vInfo >> i) & 1;
      const r = Math.floor(i / 3);
      const c = i % 3;
      matrix[r][size - 11 + c] = bit;
      matrix[size - 11 + c][r] = bit;
      reserved[r][size - 11 + c] = true;
      reserved[size - 11 + c][r] = true;
    }
  }

  /* Place data + ECC bits */
  const allBits = new Uint8Array(data.length + ecc.length);
  allBits.set(data);
  allBits.set(ecc, data.length);
  let bitIdx = 0;
  const totalBits = allBits.length * 8;

  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col--; /* skip timing column */
    for (let row = 0; row < size; row++) {
      for (let dc = 0; dc < 2; dc++) {
        const cc = col - dc;
        const upward = ((col + 1) >> 1) % 2 === 0;
        const rr = upward ? size - 1 - row : row;
        if (reserved[rr][cc]) continue;
        if (bitIdx < totalBits) {
          const byte = allBits[bitIdx >> 3];
          matrix[rr][cc] = (byte >> (7 - (bitIdx & 7))) & 1;
          bitIdx++;
        } else {
          matrix[rr][cc] = 0;
        }
      }
    }
  }

  /* Apply mask (mask 0) and format info */
  applyMaskAndFormat(matrix, reserved, size, 0);
  return matrix;
}

function versionInfo(version: number): number {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  return (version << 12) | rem;
}

function formatInfoBits(mask: number): number {
  const data = (0b01 << 3) | mask; /* ECC level L = 01 */
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

function applyMaskAndFormat(
  matrix: number[][],
  reserved: boolean[][],
  size: number,
  mask: number
) {
  /* Apply mask */
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      let flip = false;
      switch (mask) {
        case 0: flip = (r + c) % 2 === 0; break;
        case 1: flip = r % 2 === 0; break;
        case 2: flip = c % 3 === 0; break;
        case 3: flip = (r + c) % 3 === 0; break;
        case 4: flip = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; break;
        case 5: flip = ((r * c) % 2) + ((r * c) % 3) === 0; break;
        case 6: flip = (((r * c) % 2) + ((r * c) % 3)) % 2 === 0; break;
        case 7: flip = (((r + c) % 2) + ((r * c) % 3)) % 2 === 0; break;
      }
      if (flip) matrix[r][c] ^= 1;
    }
  }

  /* Format info */
  const fmt = formatInfoBits(mask);
  for (let i = 0; i < 15; i++) {
    const bit = (fmt >> i) & 1;
    if (i < 6) {
      matrix[i][8] = bit;
    } else if (i < 8) {
      matrix[i + 1][8] = bit;
    } else {
      matrix[size - 15 + i][8] = bit;
    }
    if (i < 8) {
      matrix[8][size - 1 - i] = bit;
    } else {
      matrix[8][15 - i - 1 + 1] = bit;
    }
  }
  matrix[size - 8][8] = 1;
}

/* ── Encode data into codewords ── */
function encodeData(data: Uint8Array, version: number): { data: Uint8Array; ecc: Uint8Array } {
  const capacity = DATA_CAPACITY[version - 1];
  const eccLen = ECC_L_PER_VERSION[version - 1];

  /* Bit buffer */
  const bits: number[] = [];
  const pushBits = (val: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  /* Mode indicator: byte mode = 0100 */
  pushBits(0b0100, 4);
  /* Character count (8 bits for v1-9, 16 for v10+) */
  pushBits(data.length, version <= 9 ? 8 : 16);
  /* Data */
  for (const b of data) pushBits(b, 8);
  /* Terminator */
  const capacityBits = capacity * 8;
  for (let i = 0; i < 4 && bits.length < capacityBits; i++) bits.push(0);
  /* Pad to byte boundary */
  while (bits.length % 8 !== 0) bits.push(0);
  /* Pad bytes */
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < capacityBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  /* Convert to bytes */
  const codewords = new Uint8Array(bits.length / 8);
  for (let i = 0; i < codewords.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i * 8 + j];
    codewords[i] = byte;
  }

  const ecc = rsEncode(codewords, eccLen);
  return { data: codewords, ecc };
}

/* ── Public API ── */

/**
 * Gera um QR Code SVG para a string informada.
 * @param text Texto a codificar (ex.: código de pareamento)
 * @param pixelSize Tamanho total do QR em pixels (padrão 160)
 * @returns String SVG do QR Code
 */
export function generateQRCodeSVG(text: string, pixelSize = 160): string {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(text);
  const version = pickVersion(dataBytes.length);
  const { data, ecc } = encodeData(dataBytes, version);
  const matrix = buildMatrix(version, data, ecc);
  const size = matrix.length;

  /* Build SVG path */
  const cellSize = pixelSize / size;
  let path = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = cellSize.toFixed(2);
        path += `M${x},${y}h${w}v${w}h-${w}z`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pixelSize} ${pixelSize}" width="${pixelSize}" height="${pixelSize}"><rect width="${pixelSize}" height="${pixelSize}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}

/**
 * Gera um código de pareamento de 6 dígitos.
 */
export function generatePairingCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
