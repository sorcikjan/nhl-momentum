// Topic pages under a nation page (/cesi-v-nhl/forma, /cesi-v-nhl/statistiky…):
// each answers one question people search for, in its title and heading,
// with a part of the nation page's data (lib/nation-data.ts, no database).
// The nation page stays the hub: last night, goals, everything at once.
//
// Czech first (2026-11-26): Google showed only old articles for "Češi v NHL
// forma", "komu se daří v NHL", "čeští brankáři"… Other nations follow once
// Search Console shows these pages picking up queries.
import type { Nation } from '@/lib/nations';

export type TopicKey = 'forma' | 'statistiky' | 'brankari' | 'dnes';
export type Topic = {
  key: TopicKey;
  slug: string;          // URL segment, in the nation's language
  nav: string;           // link text on the hub and sibling pages
  title: string;         // <title>, without the brand
  description: string;
  kicker: string;
  h1: string;
  sub: string;
  faq: { q: string; a: string }[];
};

const seasonLabel = (season: string) => `${season.slice(0, 4)}/${season.slice(6, 8)}`;

function czech(season: string): Topic[] {
  const s = seasonLabel(season);
  return [
    {
      key: 'forma', slug: 'forma', nav: 'Komu se daří',
      title: 'Komu se daří v NHL? Forma českých hráčů',
      description: 'Kteří Češi jsou v NHL právě ve formě? Všichni čeští hráči seřazení podle Heat (body za minutu na ledě v posledních 5 zápasech) a srovnaní s celou ligou. Aktualizováno po každém zápase.',
      kicker: 'FORMA · POSLEDNÍCH 5 ZÁPASŮ',
      h1: 'Komu se daří? Forma Čechů v NHL.',
      sub: 'Všichni čeští hráči v NHL podle aktuální formy. Heat 0–100 počítá body za minutu na ledě v posledních pěti zápasech, procento ukazuje rozdíl proti jejich tempu v celé sezoně.',
      faq: [
        { q: 'Jak se forma počítá?', a: 'Heat je počet bodů za minutu na ledě v posledních pěti zápasech, převedený na stupnici 0–100. Hráč, který boduje ve třetí lajně za 12 minut, tak může mít lepší formu než hvězda s 20 minutami.' },
        { q: 'Co znamená procento u hráče?', a: 'O kolik je jeho tempo v posledních pěti zápasech vyšší nebo nižší než v celé sezoně. +40 % znamená, že boduje o 40 % rychleji než obvykle: chytil formu.' },
        { q: 'Proč tu někdo chybí?', a: 'Hráči, kteří v posledních zápasech nenastoupili (zranění, farma, nominace mimo sestavu), jsou vypsaní pod žebříčkem. Gólmani mají vlastní stránku.' },
      ],
    },
    {
      key: 'statistiky', slug: 'statistiky', nav: 'Statistiky sezony',
      title: `Statistiky Čechů v NHL ${s} – body, góly, asistence`,
      description: `Kolik mají Češi v NHL bodů v sezoně ${s}? Kompletní tabulka všech českých hráčů: zápasy, góly, asistence, body, plus/minus a čas na ledě, s pořadím v celé lize.`,
      kicker: `SEZONA ${s} · ZÁKLADNÍ ČÁST`,
      h1: `Statistiky Čechů v NHL ${s}.`,
      sub: 'Všichni čeští hráči, kteří letos v NHL nastoupili, seřazení podle bodů. U každého je jeho pořadí mezi všemi hráči ligy.',
      faq: [
        { q: 'Kdo z Čechů má v NHL nejvíc bodů?', a: 'Tabulka je seřazená podle bodů v základní části, první řádek je aktuální český lídr. Pořadí v lize ukazuje, kolik hráčů celé NHL má víc bodů.' },
        { q: 'Jak často se statistiky aktualizují?', a: 'Po každém odehraném zápase, z oficiálních dat NHL.' },
        { q: 'Kde najdu formu, ne jen součty?', a: 'Součty za sezonu ukazují celek. Kdo je ve formě právě teď, ukazuje stránka Komu se daří.' },
      ],
    },
    {
      key: 'brankari', slug: 'brankari', nav: 'Čeští brankáři',
      title: 'Čeští brankáři v NHL – úspěšnost zákroků a forma',
      description: 'Jak chytají čeští brankáři v NHL? Úspěšnost zákroků za posledních 5 startů i za celou sezonu, průměr inkasovaných gólů, výhry a nuly, se srovnáním s ligovým průměrem.',
      kicker: 'BRANKÁŘI · FORMA A SEZONA',
      h1: 'Čeští brankáři v NHL.',
      sub: 'Forma podle úspěšnosti zákroků v posledních pěti startech a pod ní celá sezona.',
      faq: [
        { q: 'Podle čeho se brankáři řadí?', a: 'Podle úspěšnosti zákroků v posledních pěti startech: kolik procent střel chytili. Výhry závisí na celém týmu, úspěšnost je nejbližší číslo tomu, jak chytá sám brankář.' },
        { q: 'Proč někdo nemá pořadí v lize?', a: 'Pořadí v lize dostávají brankáři s aspoň pěti zápasy v sezoně. S méně zápasy úspěšnost moc neříká.' },
        { q: 'Kde najdu nejlepší brankáře celé NHL?', a: 'Na stránce Hottest NHL goalies jsou všichni brankáři ligy podle posledních pěti startů.' },
      ],
    },
    {
      key: 'dnes', slug: 'dnes', nav: 'Kdo hraje dnes',
      title: 'Kdo z Čechů hraje dnes v NHL – zápasy v českém čase',
      description: 'Které zápasy NHL s Čechy se hrají dnes v noci? Přehled zápasů s časem začátku v českém čase a čeští hráči na obou stranách.',
      kicker: 'PROGRAM · ČESKÝ ČAS',
      h1: 'Kdo z Čechů hraje dnes v noci.',
      sub: 'Nejbližší zápasy NHL s českými hráči, časy začátku v českém čase.',
      faq: [
        { q: 'V kolik se hrají zápasy NHL u nás?', a: 'Většina zápasů začíná mezi 0:00 a 4:30 českého času, víkendové odpolední zápasy už kolem 18:00 nebo 21:00. Časy u zápasů jsou přepočtené na český čas.' },
        { q: 'Co když dnes žádný Čech nehraje?', a: 'Stránka ukáže nejbližší den, kdy nastoupí. Výsledky poslední noci jsou na hlavní stránce Češi v NHL.' },
      ],
    },
  ];
}

const TOPICS: Record<string, (season: string) => Topic[]> = { CZE: czech };

export function nationTopics(n: Nation, season: string): Topic[] {
  return TOPICS[n.code]?.(season) ?? [];
}

export function topicPaths(n: Nation, season: string): string[] {
  return nationTopics(n, season).map(t => `${n.path}/${t.slug}`);
}
