const UNSAFE = new RegExp("[<>&" + String.fromCodePoint(0x2028, 0x2029) + "]", "g");

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE, (c) => "\\u" + (c.codePointAt(0) ?? 0).toString(16).padStart(4, "0"));
}
