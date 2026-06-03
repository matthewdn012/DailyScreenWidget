export function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text
	return text.slice(0, maxLength) + "..."
}

export function stripSource(title: string): string {
  const parts = title.split(" - ")
  if (parts.length <= 1) return title
  parts.pop()
  return parts.join(" - ")
}