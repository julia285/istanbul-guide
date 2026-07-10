const TURKISH_ASCII_MAP: Record<string, string> = {
  ı: "i", İ: "I", ş: "s", Ş: "S", ğ: "g", Ğ: "G",
  ü: "u", Ü: "U", ö: "o", Ö: "O", ç: "c", Ç: "C",
};

export function slugify(input: string): string {
  const asciiApproximated = input.replace(
    /[ışŞğĞüÜöÖçÇİ]/g,
    (ch) => TURKISH_ASCII_MAP[ch] ?? ch,
  );
  return asciiApproximated
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
