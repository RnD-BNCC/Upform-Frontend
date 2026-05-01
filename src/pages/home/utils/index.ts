export function formatCompactNumber(value: number) {
  if (value < 1000) return String(value);

  const compactValue = value / 1000;
  return `${compactValue % 1 === 0 ? compactValue : compactValue.toFixed(1)}k`;
}

