/**
 * Escapes special regex/LIKE characters in user input
 * to prevent injection in ILIKE queries.
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\%_]/g, "\\$&");
}
