// Letters that don't decompose under NFD (ø is not o + accent).
const FOLD: Record<string, string> = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', đ: 'd', ł: 'l', þ: 'th', ð: 'd' };

export function slugify(text: string): string {
  return text
    .toLowerCase()
    // Stützle → stutzle, Montréal → montreal (not st-tzle / montr-al).
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[øæœßđłþð]/g, c => FOLD[c])
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

export function recapUrl(date: string, title: string) {
  const cleaned = title.replace(/^NHL Recap[^:]*:\s*/i, '');
  return `/recaps/${date}/${slugify(cleaned)}`;
}
