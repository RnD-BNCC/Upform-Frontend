function parseHex(hex: string): [number, number, number] {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  const value = parseInt(normalized, 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function lightenHex(hex: string, amount: number) {
  const [red, green, blue] = parseHex(hex);

  return `rgb(${Math.min(255, red + amount)},${Math.min(
    255,
    green + amount,
  )},${Math.min(255, blue + amount)})`;
}

export function darkenHex(hex: string, amount: number) {
  const [red, green, blue] = parseHex(hex);

  return `rgb(${Math.max(0, red - amount)},${Math.max(
    0,
    green - amount,
  )},${Math.max(0, blue - amount)})`;
}
