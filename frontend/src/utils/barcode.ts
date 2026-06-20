// In-store barcode generation for products with no manufacturer barcode.
//
// We mint a valid EAN-13 using the GS1 "restricted distribution" prefix range
// 20–29 — reserved for in-store/internal use, so it never collides with a real
// brand GTIN. 12 data digits + a correct check digit means it scans on any
// EAN-13 reader (our ZXing scanner AND external POS scanners), and JsBarcode
// renders it as a real EAN-13 on the printed label.

const ean13CheckDigit = (twelve: string): number => {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    // GS1 weighting: from the left, odd positions ×1, even positions ×3.
    sum += Number(twelve[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
};

/** True if `v` is a syntactically valid EAN-13 (13 digits, correct check digit). */
export const isValidEan13 = (v: string): boolean => {
  if (!/^\d{13}$/.test(v)) return false;
  return ean13CheckDigit(v.slice(0, 12)) === Number(v[12]);
};

/**
 * Mint a fresh in-store EAN-13. Pass the codes you already use (e.g. existing
 * product barcodes) so a regenerate can't clash locally.
 */
export const generateEan13 = (existing: Iterable<string> = []): string => {
  const taken = new Set<string>();
  for (const c of existing) if (c) taken.add(c);
  for (let attempt = 0; attempt < 100; attempt++) {
    // First digit 2, second 0–9 → prefix 20–29 (restricted/in-store range).
    let body = '2';
    for (let i = 0; i < 11; i++) body += Math.floor(Math.random() * 10);
    const code = body + ean13CheckDigit(body);
    if (!taken.has(code)) return code;
  }
  // Practically unreachable; return a last code anyway rather than throw.
  let body = '2';
  for (let i = 0; i < 11; i++) body += Math.floor(Math.random() * 10);
  return body + ean13CheckDigit(body);
};
