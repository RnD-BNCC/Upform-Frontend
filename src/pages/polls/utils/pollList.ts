export function formatDeletedAt(value?: string | null) {
  if (!value) return "Unknown date";

  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatPollUpdatedAt(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

