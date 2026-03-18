export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function playerUrl(id: number | string, firstName: string, lastName: string) {
  return `/players/${id}/${slugify(`${firstName} ${lastName}`)}`;
}

export function teamUrl(id: number | string, name: string) {
  return `/teams/${id}/${slugify(name)}`;
}

export function gameUrl(id: number | string, awayAbbrev: string, homeAbbrev: string, date?: string) {
  const datePart = date ? `-${date.slice(5).replace('-', '')}` : '';
  return `/games/${id}/${awayAbbrev.toLowerCase()}-at-${homeAbbrev.toLowerCase()}${datePart}`;
}
