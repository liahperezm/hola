/** Upper-cases the first letter, skipping leading "¿" or "¡". */
export function capitalize(text: string): string {
  const i = text.search(/\p{L}/u);
  if (i === -1) return text;
  return text.slice(0, i) + text.charAt(i).toUpperCase() + text.slice(i + 1);
}
