/**
 * Capitalizes the first letter of every word in a string.
 * Example: "admin group" -> "Admin Group"
 */
export const toTitleCase = (str: string): string => {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
