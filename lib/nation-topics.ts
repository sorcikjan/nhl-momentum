// Topic pages under a nation page (/cesi-v-nhl/forma, /cesi-v-nhl/statistiky…):
// each answers one question people search for, in its title and heading,
// with a part of the nation page's data (lib/nation-data.ts, no database).
// The nation page stays the hub: last night, goals, everything at once.
//
// Started 2026-11-26: Google showed only old articles for "Češi v NHL forma",
// "komu se daří v NHL", "čeští brankáři"… Same pages for every nation, in its
// language and its URL words.
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

// The words around the data on topic pages, in the nation's language.
export type Labels = {
  faqKicker: string; faqTitle: string;
  player: string; gp: string; g: string; a: string; p: string; toi: string; league: string;
  goalie: string; w: string; sv: string; gaa: string; so: string;
  legend: string;
  goalieSeasonKicker: string; goalieSeasonTitle: string;
  noTonight: string;
};
export type NationTopics = { labels: Labels; topics: Topic[] };

const seasonLabel = (season: string) => `${season.slice(0, 4)}/${season.slice(6, 8)}`;

const CS_LABELS: Labels = {
  faqKicker: 'OTÁZKY', faqTitle: 'Časté otázky.',
  player: 'HRÁČ', gp: 'Z', g: 'G', a: 'A', p: 'B', toi: 'ČAS/Z', league: 'V LIZE',
  goalie: 'BRANKÁŘ', w: 'V', sv: 'ÚSPĚŠNOST', gaa: 'PRŮMĚR', so: 'NULY',
  legend: 'Z = zápasy, G = góly, A = asistence, B = body, ČAS/Z = průměrný čas na ledě, V LIZE = pořadí podle bodů mezi všemi hráči NHL.',
  goalieSeasonKicker: 'BRANKÁŘI · CELÁ SEZONA', goalieSeasonTitle: 'Brankáři v číslech.',
  noTonight: 'Tento týden žádný zápas s českými hráči nenacházíme.',
};

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

function slovak(season: string): Topic[] {
  const s = seasonLabel(season);
  return [
    {
      key: 'forma', slug: 'forma', nav: 'Komu sa darí',
      title: 'Komu sa darí v NHL? Forma slovenských hráčov',
      description: 'Ktorí Slováci sú v NHL práve vo forme? Všetci slovenskí hráči zoradení podľa Heat (body za minútu na ľade v posledných 5 zápasoch) a porovnaní s celou ligou. Aktualizované po každom zápase.',
      kicker: 'FORMA · POSLEDNÝCH 5 ZÁPASOV',
      h1: 'Komu sa darí? Forma Slovákov v NHL.',
      sub: 'Všetci slovenskí hráči v NHL podľa aktuálnej formy. Heat 0–100 počíta body za minútu na ľade v posledných piatich zápasoch, percento ukazuje rozdiel oproti ich tempu v celej sezóne.',
      faq: [
        { q: 'Ako sa forma počíta?', a: 'Heat je počet bodov za minútu na ľade v posledných piatich zápasoch, prevedený na stupnicu 0–100. Hráč, ktorý boduje v tretej formácii za 12 minút, tak môže mať lepšiu formu ako hviezda s 20 minútami.' },
        { q: 'Čo znamená percento pri hráčovi?', a: 'O koľko je jeho tempo v posledných piatich zápasoch vyššie alebo nižšie ako v celej sezóne. +40 % znamená, že boduje o 40 % rýchlejšie ako zvyčajne: chytil formu.' },
        { q: 'Prečo tu niekto chýba?', a: 'Hráči, ktorí v posledných zápasoch nenastúpili (zranenie, farma, mimo zostavy), sú vypísaní pod rebríčkom.' },
      ],
    },
    {
      key: 'statistiky', slug: 'statistiky', nav: 'Štatistiky sezóny',
      title: `Štatistiky Slovákov v NHL ${s} – body, góly, asistencie`,
      description: `Koľko bodov majú Slováci v NHL v sezóne ${s}? Kompletná tabuľka všetkých slovenských hráčov: zápasy, góly, asistencie, body, plus/mínus a čas na ľade, s poradím v celej lige.`,
      kicker: `SEZÓNA ${s} · ZÁKLADNÁ ČASŤ`,
      h1: `Štatistiky Slovákov v NHL ${s}.`,
      sub: 'Všetci slovenskí hráči, ktorí tento rok v NHL nastúpili, zoradení podľa bodov. Pri každom je jeho poradie medzi všetkými hráčmi ligy.',
      faq: [
        { q: 'Kto zo Slovákov má v NHL najviac bodov?', a: 'Tabuľka je zoradená podľa bodov v základnej časti, prvý riadok je aktuálny slovenský líder. Poradie v lige ukazuje, koľko hráčov celej NHL má viac bodov.' },
        { q: 'Ako často sa štatistiky aktualizujú?', a: 'Po každom odohranom zápase, z oficiálnych dát NHL.' },
        { q: 'Kde nájdem formu, nielen súčty?', a: 'Súčty za sezónu ukazujú celok. Kto je vo forme práve teraz, ukazuje stránka Komu sa darí.' },
      ],
    },
    {
      key: 'dnes', slug: 'dnes', nav: 'Kto hrá dnes',
      title: 'Kto zo Slovákov hrá dnes v NHL – zápasy v slovenskom čase',
      description: 'Ktoré zápasy NHL so Slovákmi sa hrajú dnes v noci? Prehľad zápasov s časom začiatku v slovenskom čase a slovenskí hráči na oboch stranách.',
      kicker: 'PROGRAM · SLOVENSKÝ ČAS',
      h1: 'Kto zo Slovákov hrá dnes v noci.',
      sub: 'Najbližšie zápasy NHL so slovenskými hráčmi, časy začiatku v slovenskom čase.',
      faq: [
        { q: 'O koľkej sa hrajú zápasy NHL u nás?', a: 'Väčšina zápasov začína medzi 0:00 a 4:30 slovenského času, víkendové popoludňajšie zápasy už okolo 18:00 alebo 21:00. Časy pri zápasoch sú prepočítané na slovenský čas.' },
        { q: 'Čo ak dnes žiadny Slovák nehrá?', a: 'Stránka ukáže najbližší deň, keď nastúpia. Výsledky poslednej noci sú na hlavnej stránke Slováci v NHL.' },
      ],
    },
  ];
}

const SK_LABELS: Labels = {
  faqKicker: 'OTÁZKY', faqTitle: 'Časté otázky.',
  player: 'HRÁČ', gp: 'Z', g: 'G', a: 'A', p: 'B', toi: 'ČAS/Z', league: 'V LIGE',
  goalie: 'BRANKÁR', w: 'V', sv: 'ÚSPEŠNOSŤ', gaa: 'PRIEMER', so: 'NULY',
  legend: 'Z = zápasy, G = góly, A = asistencie, B = body, ČAS/Z = priemerný čas na ľade, V LIGE = poradie podľa bodov medzi všetkými hráčmi NHL.',
  goalieSeasonKicker: 'BRANKÁRI · CELÁ SEZÓNA', goalieSeasonTitle: 'Brankári v číslach.',
  noTonight: 'Tento týždeň nenachádzame žiadny zápas so slovenskými hráčmi.',
};

function swedish(season: string): Topic[] {
  const s = seasonLabel(season);
  return [
    {
      key: 'forma', slug: 'form', nav: 'Vem är i form',
      title: 'Vem är i form i NHL? Svenskarnas form just nu',
      description: 'Vilka svenskar är heta i NHL just nu? Alla svenska spelare rankade efter Heat (poäng per minut på isen de senaste 5 matcherna) och jämförda med hela ligan. Uppdateras efter varje match.',
      kicker: 'FORM · SENASTE 5 MATCHERNA',
      h1: 'Vem är i form? Svenskarna i NHL.',
      sub: 'Alla svenska spelare i NHL efter aktuell form. Heat 0–100 räknar poäng per minut på isen de senaste fem matcherna; procenten visar skillnaden mot tempot under hela säsongen.',
      faq: [
        { q: 'Hur räknas formen?', a: 'Heat är poäng per minut på isen de senaste fem matcherna, omräknat till en skala 0–100. En spelare som gör poäng i tredjekedjan på 12 minuter kan alltså vara i bättre form än en stjärna med 20 minuter.' },
        { q: 'Vad betyder procenten?', a: 'Hur mycket högre eller lägre tempot de senaste fem matcherna är jämfört med hela säsongen. +40 % betyder att han gör poäng 40 % snabbare än vanligt.' },
        { q: 'Varför saknas någon?', a: 'Spelare som inte spelat de senaste matcherna (skada, farmarlag, utanför laget) listas under rankingen. Målvakterna har en egen sida.' },
      ],
    },
    {
      key: 'statistiky', slug: 'statistik', nav: 'Säsongsstatistik',
      title: `Svenskar i NHL ${s} – statistik: poäng, mål, assist`,
      description: `Hur många poäng har svenskarna i NHL säsongen ${s}? Komplett tabell över alla svenska spelare: matcher, mål, assist, poäng, plus/minus och istid, med placering i hela ligan.`,
      kicker: `SÄSONG ${s} · GRUNDSERIEN`,
      h1: `Svenskarnas statistik i NHL ${s}.`,
      sub: 'Alla svenska spelare som spelat i NHL i år, sorterade efter poäng. Vid varje spelare står hans placering bland alla spelare i ligan.',
      faq: [
        { q: 'Vilken svensk har flest poäng i NHL?', a: 'Tabellen är sorterad efter poäng i grundserien; första raden är den svenska poängledaren just nu. Placeringen i ligan visar hur många spelare i hela NHL som har fler poäng.' },
        { q: 'Hur ofta uppdateras statistiken?', a: 'Efter varje spelad match, från NHL:s officiella data.' },
        { q: 'Var ser jag formen, inte bara summorna?', a: 'Säsongssummorna visar helheten. Vem som är i form just nu visar sidan Vem är i form.' },
      ],
    },
    {
      key: 'brankari', slug: 'malvakter', nav: 'Svenska målvakter',
      title: 'Svenska målvakter i NHL – räddningsprocent och form',
      description: 'Hur står sig de svenska målvakterna i NHL? Räddningsprocent de senaste 5 starterna och hela säsongen, insläppta mål per match, vinster och nollor, jämfört med ligasnittet.',
      kicker: 'MÅLVAKTER · FORM OCH SÄSONG',
      h1: 'Svenska målvakter i NHL.',
      sub: 'Form efter räddningsprocent de senaste fem starterna, och under den hela säsongen.',
      faq: [
        { q: 'Hur rankas målvakterna?', a: 'Efter räddningsprocent de senaste fem starterna: hur stor andel av skotten de räddat. Vinster beror på hela laget, räddningsprocenten är det närmaste måttet på hur målvakten själv spelar.' },
        { q: 'Varför saknar någon placering i ligan?', a: 'Placering i ligan får målvakter med minst fem matcher den här säsongen. Med färre matcher säger räddningsprocenten för lite.' },
        { q: 'Var hittar jag de bästa målvakterna i hela NHL?', a: 'På sidan Hottest NHL goalies finns alla ligans målvakter efter de senaste fem starterna.' },
      ],
    },
    {
      key: 'dnes', slug: 'i-natt', nav: 'Vem spelar i natt',
      title: 'Vilka svenskar spelar i NHL i natt – matcher i svensk tid',
      description: 'Vilka NHL-matcher med svenskar spelas i natt? Matcherna med starttid i svensk tid och de svenska spelarna i båda lagen.',
      kicker: 'SPELSCHEMA · SVENSK TID',
      h1: 'Vilka svenskar spelar i natt.',
      sub: 'De närmaste NHL-matcherna med svenska spelare, starttider i svensk tid.',
      faq: [
        { q: 'När spelas NHL-matcherna i Sverige?', a: 'De flesta matcher börjar mellan 00:00 och 04:30 svensk tid; helgmatcher på eftermiddagen redan runt 18:00 eller 21:00. Tiderna vid matcherna är omräknade till svensk tid.' },
        { q: 'Om ingen svensk spelar i natt?', a: 'Sidan visar närmaste dag då de spelar. Resultaten från senaste natten finns på huvudsidan Svenskar i NHL.' },
      ],
    },
  ];
}

const SV_LABELS: Labels = {
  faqKicker: 'FRÅGOR', faqTitle: 'Vanliga frågor.',
  player: 'SPELARE', gp: 'M', g: 'G', a: 'A', p: 'P', toi: 'ISTID/M', league: 'I LIGAN',
  goalie: 'MÅLVAKT', w: 'V', sv: 'RÄDD%', gaa: 'GAA', so: 'NOLLOR',
  legend: 'M = matcher, G = mål, A = assist, P = poäng, ISTID/M = snittistid per match, I LIGAN = placering efter poäng bland alla spelare i NHL.',
  goalieSeasonKicker: 'MÅLVAKTER · HELA SÄSONGEN', goalieSeasonTitle: 'Säsongen i siffror.',
  noTonight: 'Ingen match med svenska spelare den här veckan.',
};

function finnish(season: string): Topic[] {
  const s = seasonLabel(season);
  return [
    {
      key: 'forma', slug: 'vire', nav: 'Kuka on vireessä',
      title: 'Kuka on vireessä NHL:ssä? Suomalaisten pelivire nyt',
      description: 'Ketkä suomalaiset ovat NHL:ssä nyt kuumimmassa vireessä? Kaikki suomalaispelaajat Heat-luvun mukaan (pisteet peliminuuttia kohden viidessä viime ottelussa) koko liigaan verrattuna. Päivittyy jokaisen ottelun jälkeen.',
      kicker: 'VIRE · VIISI VIIME OTTELUA',
      h1: 'Kuka on vireessä? Suomalaiset NHL:ssä.',
      sub: 'Kaikki suomalaiset NHL-pelaajat nykyisen vireen mukaan. Heat 0–100 laskee pisteet peliminuuttia kohden viidessä viime ottelussa; prosentti näyttää eron koko kauden tahtiin.',
      faq: [
        { q: 'Miten vire lasketaan?', a: 'Heat on pisteet peliminuuttia kohden viidessä viime ottelussa asteikolla 0–100. Kolmosketjussa 12 minuutissa pisteitä tekevä pelaaja voi siis olla paremmassa vireessä kuin 20 minuuttia pelaava tähti.' },
        { q: 'Mitä prosentti tarkoittaa?', a: 'Kuinka paljon viiden viime ottelun tahti on korkeampi tai matalampi kuin koko kaudella. +40 % tarkoittaa, että hän tekee pisteitä 40 % tavallista nopeammin.' },
        { q: 'Miksi joku puuttuu?', a: 'Pelaajat, jotka eivät ole pelanneet viime otteluissa (loukkaantuminen, farmi, kokoonpanon ulkopuolella), on lueteltu listan alla. Maalivahdeilla on oma sivunsa.' },
      ],
    },
    {
      key: 'statistiky', slug: 'tilastot', nav: 'Kauden tilastot',
      title: `Suomalaiset NHL:ssä ${s} – tilastot: pisteet, maalit, syötöt`,
      description: `Paljonko suomalaisilla on pisteitä NHL-kaudella ${s}? Kaikkien suomalaispelaajien taulukko: ottelut, maalit, syötöt, pisteet, plus/miinus ja peliaika sekä sijoitus koko liigassa.`,
      kicker: `KAUSI ${s} · RUNKOSARJA`,
      h1: `Suomalaisten tilastot NHL:ssä ${s}.`,
      sub: 'Kaikki tällä kaudella NHL:ssä pelanneet suomalaiset pisteiden mukaan. Jokaisen kohdalla on sijoitus kaikkien liigan pelaajien joukossa.',
      faq: [
        { q: 'Kenellä suomalaisella on eniten pisteitä NHL:ssä?', a: 'Taulukko on järjestetty runkosarjan pisteiden mukaan; ensimmäinen rivi on suomalaisten pistekärki nyt. Sijoitus liigassa kertoo, monellako koko NHL:n pelaajalla on enemmän pisteitä.' },
        { q: 'Kuinka usein tilastot päivittyvät?', a: 'Jokaisen pelatun ottelun jälkeen, NHL:n virallisista tiedoista.' },
        { q: 'Mistä näen vireen enkä vain summia?', a: 'Kauden summat näyttävät kokonaisuuden. Kuka on vireessä juuri nyt, näkyy sivulla Kuka on vireessä.' },
      ],
    },
    {
      key: 'brankari', slug: 'maalivahdit', nav: 'Suomalaiset maalivahdit',
      title: 'Suomalaiset maalivahdit NHL:ssä – torjuntaprosentti ja vire',
      description: 'Miten suomalaiset maalivahdit torjuvat NHL:ssä? Torjuntaprosentti viidessä viime avauksessa ja koko kaudella, päästettyjen maalien keskiarvo, voitot ja nollapelit liigan keskiarvoon verrattuna.',
      kicker: 'MAALIVAHDIT · VIRE JA KAUSI',
      h1: 'Suomalaiset maalivahdit NHL:ssä.',
      sub: 'Vire torjuntaprosentin mukaan viidessä viime avauksessa ja sen alla koko kausi.',
      faq: [
        { q: 'Miten maalivahdit järjestetään?', a: 'Torjuntaprosentin mukaan viidessä viime avauksessa: kuinka suuren osan laukauksista he torjuivat. Voitot riippuvat koko joukkueesta, torjuntaprosentti kertoo lähimmin maalivahdin omasta pelistä.' },
        { q: 'Miksi joltakulta puuttuu sijoitus liigassa?', a: 'Sijoituksen saavat maalivahdit, joilla on tällä kaudella vähintään viisi ottelua. Pienemmällä otoksella torjuntaprosentti kertoo liian vähän.' },
        { q: 'Mistä löydän koko NHL:n parhaat maalivahdit?', a: 'Sivulla Hottest NHL goalies ovat kaikki liigan maalivahdit viiden viime avauksen mukaan.' },
      ],
    },
    {
      key: 'dnes', slug: 'tanaan', nav: 'Ketkä pelaavat tänään',
      title: 'Ketkä suomalaiset pelaavat NHL:ssä tänä yönä – ottelut Suomen ajassa',
      description: 'Mitkä NHL-ottelut, joissa pelaa suomalaisia, pelataan tänä yönä? Ottelut alkamisaikoineen Suomen ajassa ja suomalaispelaajat molemmissa joukkueissa.',
      kicker: 'OHJELMA · SUOMEN AIKA',
      h1: 'Ketkä suomalaiset pelaavat tänä yönä.',
      sub: 'Lähimmät NHL-ottelut, joissa pelaa suomalaisia, alkamisajat Suomen ajassa.',
      faq: [
        { q: 'Mihin aikaan NHL-ottelut pelataan Suomessa?', a: 'Useimmat ottelut alkavat klo 1.00–5.30 Suomen aikaa, viikonlopun iltapäiväottelut jo noin klo 19 tai 22. Ajat on muutettu Suomen aikaan.' },
        { q: 'Entä jos kukaan suomalainen ei pelaa tänään?', a: 'Sivu näyttää lähimmän päivän, jolloin he pelaavat. Viime yön tulokset ovat pääsivulla Suomalaiset NHL:ssä.' },
      ],
    },
  ];
}

const FI_LABELS: Labels = {
  faqKicker: 'KYSYMYKSET', faqTitle: 'Usein kysyttyä.',
  player: 'PELAAJA', gp: 'O', g: 'M', a: 'S', p: 'P', toi: 'AIKA/O', league: 'LIIGASSA',
  goalie: 'MAALIVAHTI', w: 'V', sv: 'TORJ-%', gaa: 'KA', so: 'NOLLAT',
  legend: 'O = ottelut, M = maalit, S = syötöt, P = pisteet, AIKA/O = keskimääräinen peliaika, LIIGASSA = sijoitus pisteissä kaikkien NHL-pelaajien joukossa.',
  goalieSeasonKicker: 'MAALIVAHDIT · KOKO KAUSI', goalieSeasonTitle: 'Kausi numeroina.',
  noTonight: 'Tällä viikolla ei ole otteluita, joissa pelaa suomalaisia.',
};

// German, for Germany and Switzerland: the same pages, different players.
type GermanWords = { hub: string; plural: string; adj: string; one: string; zone: string; zoneCaps: string };
const DE_WORDS: GermanWords = { hub: 'Deutsche', plural: 'Deutschen', adj: 'deutschen', one: 'Deutsche', zone: 'deutscher Zeit', zoneCaps: 'DEUTSCHE ZEIT' };
const CH_WORDS: GermanWords = { hub: 'Schweizer', plural: 'Schweizer', adj: 'Schweizer', one: 'Schweizer', zone: 'Schweizer Zeit', zoneCaps: 'SCHWEIZER ZEIT' };

function german(w: GermanWords) {
  return (season: string): Topic[] => {
    const s = seasonLabel(season);
    return [
      {
        key: 'forma', slug: 'form', nav: 'Wer ist in Form',
        title: `Wer ist in Form? Die ${w.adj} NHL-Spieler aktuell`,
        description: `Welche ${w.plural} sind in der NHL gerade in Form? Alle ${w.adj} Spieler nach Heat (Punkte pro Minute Eiszeit in den letzten 5 Spielen) im Vergleich mit der ganzen Liga. Aktualisiert nach jedem Spiel.`,
        kicker: 'FORM · LETZTE 5 SPIELE',
        h1: `Wer ist in Form? ${w.hub} in der NHL.`,
        sub: `Alle ${w.adj} NHL-Spieler nach ihrer aktuellen Form. Heat 0–100 misst Punkte pro Minute Eiszeit in den letzten fünf Spielen; die Prozentzahl zeigt den Unterschied zu ihrem Tempo in der ganzen Saison.`,
        faq: [
          { q: 'Wie wird die Form berechnet?', a: 'Heat sind die Punkte pro Minute Eiszeit in den letzten fünf Spielen, umgerechnet auf eine Skala von 0 bis 100. Ein Spieler, der in der dritten Reihe in 12 Minuten punktet, kann also besser in Form sein als ein Star mit 20 Minuten.' },
          { q: 'Was bedeutet die Prozentzahl?', a: 'Um wie viel sein Tempo in den letzten fünf Spielen über oder unter dem der ganzen Saison liegt. +40 % heißt: Er punktet 40 % schneller als sonst.' },
          { q: 'Warum fehlt jemand?', a: 'Spieler, die zuletzt nicht gespielt haben (Verletzung, Farmteam, nicht im Aufgebot), stehen unter der Liste.' },
        ],
      },
      {
        key: 'statistiky', slug: 'statistiken', nav: 'Saisonstatistik',
        title: `${w.hub} in der NHL ${s} – Statistik: Punkte, Tore, Assists`,
        description: `Wie viele Punkte haben die ${w.plural} in der NHL-Saison ${s}? Die komplette Tabelle aller ${w.adj} Spieler: Spiele, Tore, Assists, Punkte, Plus/Minus und Eiszeit, mit Platz in der ganzen Liga.`,
        kicker: `SAISON ${s} · HAUPTRUNDE`,
        h1: `Statistik der ${w.plural} in der NHL ${s}.`,
        sub: `Alle ${w.adj} Spieler, die in dieser Saison in der NHL gespielt haben, nach Punkten sortiert. Bei jedem steht sein Platz unter allen Spielern der Liga.`,
        faq: [
          { q: `Welcher ${w.one} hat die meisten Punkte in der NHL?`, a: 'Die Tabelle ist nach Punkten in der Hauptrunde sortiert; die erste Zeile ist der aktuelle Topscorer. Der Platz in der Liga zeigt, wie viele Spieler der ganzen NHL mehr Punkte haben.' },
          { q: 'Wie oft wird die Statistik aktualisiert?', a: 'Nach jedem Spiel, aus den offiziellen NHL-Daten.' },
          { q: 'Wo sehe ich die Form, nicht nur die Summen?', a: 'Die Saisonsummen zeigen das Ganze. Wer gerade in Form ist, zeigt die Seite Wer ist in Form.' },
        ],
      },
      {
        key: 'dnes', slug: 'heute', nav: 'Wer spielt heute',
        title: `Welche ${w.plural} spielen heute Nacht in der NHL – Spiele in ${w.zone}`,
        description: `Welche NHL-Spiele mit ${w.adj} Spielern laufen heute Nacht? Die Spiele mit Anfangszeit in ${w.zone} und die ${w.adj} Spieler beider Teams.`,
        kicker: `SPIELPLAN · ${w.zoneCaps}`,
        h1: `Welche ${w.plural} heute Nacht spielen.`,
        sub: `Die nächsten NHL-Spiele mit ${w.adj} Spielern, Anfangszeiten in ${w.zone}.`,
        faq: [
          { q: 'Wann laufen die NHL-Spiele bei uns?', a: 'Die meisten Spiele beginnen zwischen 0:00 und 4:30 Uhr unserer Zeit, Wochenendspiele am Nachmittag schon gegen 18:00 oder 21:00 Uhr. Die Zeiten sind in unsere Zeit umgerechnet.' },
          { q: `Und wenn heute kein ${w.one} spielt?`, a: 'Die Seite zeigt den nächsten Tag, an dem sie spielen. Die Ergebnisse der letzten Nacht stehen auf der Hauptseite.' },
        ],
      },
    ];
  };
}

const germanLabels = (w: GermanWords): Labels => ({
  faqKicker: 'FRAGEN', faqTitle: 'Häufige Fragen.',
  player: 'SPIELER', gp: 'SP', g: 'T', a: 'A', p: 'P', toi: 'EZ/SP', league: 'LIGA',
  goalie: 'TORHÜTER', w: 'S', sv: 'SV%', gaa: 'GAA', so: 'SO',
  legend: 'SP = Spiele, T = Tore, A = Assists, P = Punkte, EZ/SP = Eiszeit pro Spiel, LIGA = Platz nach Punkten unter allen NHL-Spielern.',
  goalieSeasonKicker: 'TORHÜTER · GANZE SAISON', goalieSeasonTitle: 'Die Saison in Zahlen.',
  noTonight: `Diese Woche kein Spiel mit ${w.adj} Spielern.`,
});

function latvian(season: string): Topic[] {
  const s = seasonLabel(season);
  return [{
    key: 'statistiky', slug: 'statistika', nav: 'Sezonas statistika',
    title: `Latvieši NHL ${s} – statistika: punkti, vārti, rezultatīvas piespēles`,
    description: `Cik punktu latviešiem ir NHL sezonā ${s}? Visu latviešu spēlētāju tabula: spēles, vārti, rezultatīvas piespēles, punkti, +/− un laiks uz ledus, ar vietu visā līgā.`,
    kicker: `SEZONA ${s} · REGULĀRAIS ČEMPIONĀTS`,
    h1: `Latviešu statistika NHL ${s}.`,
    sub: 'Visi latviešu spēlētāji, kuri šosezon spēlējuši NHL, sakārtoti pēc punktiem. Pie katra ir viņa vieta starp visiem līgas spēlētājiem.',
    faq: [
      { q: 'Kuram latvietim NHL ir visvairāk punktu?', a: 'Tabula sakārtota pēc punktiem regulārajā čempionātā; pirmā rinda ir pašreizējais latviešu līderis. Vieta līgā rāda, cik visas NHL spēlētājiem ir vairāk punktu.' },
      { q: 'Cik bieži statistika tiek atjaunota?', a: 'Pēc katras spēles, no oficiālajiem NHL datiem.' },
    ],
  }];
}

const LV_LABELS: Labels = {
  faqKicker: 'JAUTĀJUMI', faqTitle: 'Biežāk uzdotie jautājumi.',
  player: 'SPĒLĒTĀJS', gp: 'S', g: 'V', a: 'RP', p: 'P', toi: 'LAIKS/S', league: 'LĪGĀ',
  goalie: 'VĀRTSARGS', w: 'U', sv: 'ATV.%', gaa: 'VID.', so: 'SAUSĀS',
  legend: 'S = spēles, V = vārti, RP = rezultatīvas piespēles, P = punkti, LAIKS/S = vidējais laiks uz ledus, LĪGĀ = vieta pēc punktiem starp visiem NHL spēlētājiem.',
  goalieSeasonKicker: 'VĀRTSARGI · VISA SEZONA', goalieSeasonTitle: 'Sezona skaitļos.',
  noTonight: 'Šonedēļ nav spēļu ar latviešu spēlētājiem.',
};

function danish(season: string): Topic[] {
  const s = seasonLabel(season);
  return [{
    key: 'statistiky', slug: 'statistik', nav: 'Sæsonstatistik',
    title: `Danskere i NHL ${s} – statistik: point, mål, assists`,
    description: `Hvor mange point har danskerne i NHL i sæsonen ${s}? Den komplette tabel over alle danske spillere: kampe, mål, assists, point, plus/minus og istid, med placering i hele ligaen.`,
    kicker: `SÆSON ${s} · GRUNDSPIL`,
    h1: `Danskernes statistik i NHL ${s}.`,
    sub: 'Alle danske spillere, der har spillet i NHL i denne sæson, sorteret efter point. Ved hver spiller står hans placering blandt alle ligaens spillere.',
    faq: [
      { q: 'Hvilken dansker har flest point i NHL?', a: 'Tabellen er sorteret efter point i grundspillet; første række er den aktuelle danske topscorer. Placeringen i ligaen viser, hvor mange spillere i hele NHL der har flere point.' },
      { q: 'Hvor ofte opdateres statistikken?', a: "Efter hver kamp, fra NHL's officielle data." },
    ],
  }];
}

const DA_LABELS: Labels = {
  faqKicker: 'SPØRGSMÅL', faqTitle: 'Ofte stillede spørgsmål.',
  player: 'SPILLER', gp: 'K', g: 'M', a: 'A', p: 'P', toi: 'ISTID/K', league: 'I LIGAEN',
  goalie: 'MÅLMAND', w: 'S', sv: 'RED.%', gaa: 'GNS.', so: 'NULLER',
  legend: 'K = kampe, M = mål, A = assists, P = point, ISTID/K = gennemsnitlig istid, I LIGAEN = placering efter point blandt alle NHL-spillere.',
  goalieSeasonKicker: 'MÅLMÆND · HELE SÆSONEN', goalieSeasonTitle: 'Sæsonen i tal.',
  noTonight: 'Ingen kampe med danske spillere i denne uge.',
};

// Which pages each nation gets. A topic page needs enough players to say more
// than the nation page already does: goalie pages from two goalies up, and
// the smallest nations (a handful of players) only get the season table.
const TOPICS: Record<string, { labels: Labels; topics: (season: string) => Topic[] }> = {
  CZE: { labels: CS_LABELS, topics: czech },
  SVK: { labels: SK_LABELS, topics: slovak },
  SWE: { labels: SV_LABELS, topics: swedish },
  FIN: { labels: FI_LABELS, topics: finnish },
  DEU: { labels: germanLabels(DE_WORDS), topics: german(DE_WORDS) },
  CHE: { labels: germanLabels(CH_WORDS), topics: german(CH_WORDS) },
  LVA: { labels: LV_LABELS, topics: latvian },
  DNK: { labels: DA_LABELS, topics: danish },
};

export function nationTopics(n: Nation, season: string): Topic[] {
  return TOPICS[n.code]?.topics(season) ?? [];
}

export function topicLabels(n: Nation): Labels {
  return TOPICS[n.code]?.labels ?? CS_LABELS;
}

export function topicPaths(n: Nation, season: string): string[] {
  return nationTopics(n, season).map(t => `${n.path}/${t.slug}`);
}
