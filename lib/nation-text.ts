// Every word a nation page says, per language. lib/nations.ts builds the
// sentences from these; components/nation/NationBody.tsx shows the labels.
//
// Sentences are built so a player's name never has to be declined: "Nylander
// (2 mål och 1 assist)", never "Nylanderovi se podařilo". Plurals are each
// language's own rule (Czech 1 / 2–4 / 5+, Latvian by the last digit).

export type Noun = 'goal' | 'assist' | 'point' | 'shot' | 'save' | 'game' | 'start' | 'goalie' | 'player';
export type Decision = 'W' | 'L' | 'O';

export type NationText = {
  count: (n: number, noun: Noun) => string;
  // What a skater did in one game: "gól a 2 asistence", "hattrick", "bez bodu".
  phrase: (goals: number, assists: number) => string;
  toi: (toi: string) => string;
  decision: Record<Decision, string> & { relief: string };
  saves: (saves: number, shots: number) => string;
  // The night an ET date is played, as the fans' calendar has it.
  night: (weekday: number, day: number, month: number) => string;
  // The lead sentence: `best` is "Name (phrase)", already formatted.
  summary: (night: string, played: number, points: number, best: string[]) => string;
  kicker: Record<string, string>;
  period: (n: number) => string;            // "3. TŘ."
  overtime: string;                         // "PRODL."
  seasonGoal: (n: number) => string;        // "12. gól v sezoně"
  skaterLeague: (heat: { rank: number; of: number } | null, season: { points: number; rank: number } | null) => string | null;
  goalieLeague: (svPct: string, rank: number | null, of: number, games: number, min: number) => string;
  pct?: (share: number) => string;          // "90.3%"; the default is "90,3 %"
  ui: {
    name: string;              // "Češi v NHL"
    sub: (count: number) => string;
    partial: string;
    results: string;           // kicker before the night label
    nightTitle: string;
    final: string; ot: string; so: string;
    scratched: string; idle: string;
    goalsKicker: (n: number) => string;
    goalsTitle: string;
    watch: string; onNhl: string; close: string;
    schedule: string; localTime: string;
    nextTitle: string; derby: string; tonight: string;
    formKicker: string; formTitle: string; heatSub: string;
    vsLeague: string; leader: (name: string, heat: number) => string; median: (m: number) => string; and: string;
    howHeat: string; empty: string; notPlayed: string;
    goalieKicker: string; goalieTitle: string; goalieSub: string; goalieAvg: (pct: string) => string; goalieEmpty: string;
    bestInNhl: string; allResults: string;
    title: string; description: string; snippetTail: string;
  };
};

// ─── Plural rules ─────────────────────────────────────────────────────────────

type Forms = readonly string[];
// Czech, Slovak: 1 · 2–4 · 0, 5+
const slavic = (n: number, [one, few, many]: Forms) => n === 1 ? one : n >= 2 && n <= 4 ? few : many;
// Swedish, Danish, German, Finnish: 1 · everything else
const two = (n: number, [one, other]: Forms) => n === 1 ? one : other;
// Latvian: ends in 1 (not 11) · 0 · everything else
const latvian = (n: number, [one, other, zero]: Forms) => n % 10 === 1 && n % 100 !== 11 ? one : n === 0 ? zero : other;

const counter = (rule: (n: number, f: Forms) => string, nouns: Record<Noun, Forms>) =>
  (n: number, noun: Noun) => `${n} ${rule(n, nouns[noun])}`;

export const decimal = (n: number, d: number) => n.toFixed(d).replace('.', ',');

// "2 góly a 2 asistence": goals and assists, joined by the language's "and".
function phraseOf(opts: { none: string; and: string; hattrick: string; goal: (n: number) => string; assist: (n: number) => string }) {
  return (goals: number, assists: number) => {
    if (!goals && !assists) return opts.none;
    const g = goals === 3 ? opts.hattrick : goals ? opts.goal(goals) : '';
    return [g, assists ? opts.assist(assists) : ''].filter(Boolean).join(` ${opts.and} `);
  };
}

// The goal-card kickers from lib/moments, in the order they're listed there.
const KICKERS = ['OT WINNER', 'LATE WINNER', 'LATE EQUALIZER', 'GAME WINNER', 'LATE GO-AHEAD', 'PENALTY SHOT', 'SHORTHANDED', 'HAT TRICK', 'EMPTY NET', 'OWN GOAL', 'POWER PLAY', 'GOAL'] as const;
const kickers = (words: string[]) => Object.fromEntries(KICKERS.map((k, i) => [k, words[i]]));

// ─── Czech ────────────────────────────────────────────────────────────────────

const CS_NA = ['neděli', 'pondělí', 'úterý', 'středu', 'čtvrtek', 'pátek', 'sobotu'];
const csCount = counter(slavic, {
  goal: ['gól', 'góly', 'gólů'], assist: ['asistence', 'asistence', 'asistencí'], point: ['bod', 'body', 'bodů'],
  shot: ['střela', 'střely', 'střel'], save: ['zákrok', 'zákroky', 'zákroků'], game: ['zápas', 'zápasy', 'zápasů'],
  start: ['start', 'starty', 'startů'], goalie: ['brankář', 'brankáři', 'brankářů'], player: ['hráč', 'hráči', 'hráčů'],
});

export const CS: NationText = {
  count: csCount,
  phrase: phraseOf({ none: 'bez bodu', and: 'a', hattrick: 'hattrick', goal: n => n === 1 ? 'gól' : csCount(n, 'goal'), assist: n => n === 1 ? 'asistence' : csCount(n, 'assist') }),
  toi: t => `${t} na ledě`,
  decision: { W: 'výhra', L: 'prohra', O: 'prohra po prodl.', relief: 'střídal' },
  saves: (s, sa) => `${csCount(s, 'save')} z ${sa}`,
  night: (w, d, m) => `noc na ${CS_NA[w]} ${d}. ${m}.`,
  summary: (night, played, points, best) => {
    const head = `V ${night.replace(/^noc /, 'noci ')} ${slavic(played, ['nastoupil', 'nastoupili', 'nastoupilo'])} ${played} ${slavic(played, ['Čech', 'Češi', 'Čechů'])}`;
    return best.length
      ? `${head} a ${slavic(played, ['nasbíral', 'nasbírali', 'nasbíralo'])} ${csCount(points, 'point')}. Nejlépe: ${best.join(', ')}.`
      : `${head}, bodově se ale neprosadil nikdo.`;
  },
  kicker: kickers(['VÍTĚZNÝ V PRODLOUŽENÍ', 'VÍTĚZNÝ V ZÁVĚRU', 'VYROVNÁNÍ V ZÁVĚRU', 'VÍTĚZNÝ GÓL', 'VEDENÍ V ZÁVĚRU', 'TRESTNÉ STŘÍLENÍ', 'V OSLABENÍ', 'HATTRICK', 'DO PRÁZDNÉ BRÁNY', 'VLASTNÍ GÓL', 'V PŘESILOVCE', 'GÓL']),
  period: n => `${n}. TŘ.`, overtime: 'PRODL.',
  seasonGoal: n => `${n}. gól v sezoně`,
  skaterLeague: (heat, season) => {
    const parts = [heat ? `forma ${heat.rank}. z ${heat.of}` : null, season ? `${csCount(season.points, 'point')} v sezoně, ${season.rank}. místo` : null].filter(Boolean);
    return parts.length ? `NHL: ${parts.join(' · ')}` : null;
  },
  goalieLeague: (sv, rank, of, games, min) => rank != null ? `NHL: sezona ${sv}, ${rank}. z ${csCount(of, 'goalie')}` : `NHL: sezona ${sv} · na pořadí chybí zápasy (${games}/${min})`,
  ui: {
    name: 'Češi v NHL',
    sub: c => `Jak hráli v noci, jejich góly, forma a kdo hraje dnes. ${csCount(c, 'player')} na soupiskách NHL, aktualizováno po každém zápase.`,
    partial: 'Část dat z NHL se teď nepodařilo načíst — chybějící hráči se doplní při další aktualizaci za pár minut.',
    results: 'VÝSLEDKY', nightTitle: 'Jak hráli v noci.', final: 'KONEC', ot: 'PP', so: 'SN',
    scratched: 'Nenastoupili', idle: 'Jejich tým nehrál',
    goalsKicker: n => `GÓLY · ${csCount(n, 'goal').toUpperCase()} S VIDEEM`, goalsTitle: 'České góly posledních dnů.',
    watch: 'přehrát gól', onNhl: 'PŘEHRÁT NA NHL.COM', close: 'Zavřít',
    schedule: 'PROGRAM', localTime: 'ČAS V PRAZE', nextTitle: 'Kdo hraje příště.', derby: 'ČESKÉ DERBY', tonight: 'dnes v noci',
    formKicker: 'FORMA · HEAT 0–100', formTitle: 'Kdo je ve formě.',
    heatSub: 'Heat = body za minutu na ledě v posledních 5 zápasech, procento je rozdíl proti jeho tempu v celé sezoně.',
    vsLeague: 'Pro srovnání v NHL:', leader: (n, h) => `nejlepší formu má ${n} (Heat ${h})`, median: m => `polovina hráčů ligy má Heat pod ${m}`, and: 'a',
    howHeat: 'Jak funguje Heat', empty: 'Zatím žádné zápasy.', notPlayed: 'V sezoně zatím nehráli',
    goalieKicker: 'BRANKÁŘI · POSLEDNÍCH 5 STARTŮ', goalieTitle: 'Čeští gólmani.',
    goalieSub: 'Úspěšnost zákroků v posledních pěti startech, bilance výher, proher a proher po prodloužení.',
    goalieAvg: p => `Průměr NHL v sezoně: ${p}.`, goalieEmpty: 'Zatím žádné starty.',
    bestInNhl: 'Nejlepší forma v celé NHL', allResults: 'Všechny výsledky',
    title: 'Češi v NHL – výsledky, góly a forma českých hráčů',
    description: 'Jak hráli Češi v NHL v noci: body, čas na ledě, góly s videem, forma podle Heat, čeští brankáři a kdo hraje dnes. Aktualizováno po každém zápase.',
    snippetTail: ' Góly s videem, forma podle Heat a kdo hraje dnes.',
  },
};

// ─── Slovak ───────────────────────────────────────────────────────────────────

const SK_NA = ['nedeľu', 'pondelok', 'utorok', 'stredu', 'štvrtok', 'piatok', 'sobotu'];
const skCount = counter(slavic, {
  goal: ['gól', 'góly', 'gólov'], assist: ['asistencia', 'asistencie', 'asistencií'], point: ['bod', 'body', 'bodov'],
  shot: ['strela', 'strely', 'striel'], save: ['zákrok', 'zákroky', 'zákrokov'], game: ['zápas', 'zápasy', 'zápasov'],
  start: ['štart', 'štarty', 'štartov'], goalie: ['brankár', 'brankári', 'brankárov'], player: ['hráč', 'hráči', 'hráčov'],
});

export const SK: NationText = {
  count: skCount,
  phrase: phraseOf({ none: 'bez bodu', and: 'a', hattrick: 'hetrik', goal: n => n === 1 ? 'gól' : skCount(n, 'goal'), assist: n => n === 1 ? 'asistencia' : skCount(n, 'assist') }),
  toi: t => `${t} na ľade`,
  decision: { W: 'výhra', L: 'prehra', O: 'prehra po predĺž.', relief: 'striedal' },
  saves: (s, sa) => `${skCount(s, 'save')} z ${sa}`,
  night: (w, d, m) => `noc na ${SK_NA[w]} ${d}. ${m}.`,
  summary: (night, played, points, best) => {
    const head = `V ${night.replace(/^noc /, 'noci ')} ${slavic(played, ['nastúpil', 'nastúpili', 'nastúpilo'])} ${played} ${slavic(played, ['Slovák', 'Slováci', 'Slovákov'])}`;
    return best.length
      ? `${head} a ${slavic(played, ['nazbieral', 'nazbierali', 'nazbieralo'])} ${skCount(points, 'point')}. Najlepšie: ${best.join(', ')}.`
      : `${head}, bodovo sa však nepresadil nikto.`;
  },
  kicker: kickers(['VÍŤAZNÝ V PREDĹŽENÍ', 'VÍŤAZNÝ V ZÁVERE', 'VYROVNANIE V ZÁVERE', 'VÍŤAZNÝ GÓL', 'VEDENIE V ZÁVERE', 'TRESTNÉ STRIEĽANIE', 'V OSLABENÍ', 'HETRIK', 'DO PRÁZDNEJ BRÁNKY', 'VLASTNÝ GÓL', 'V PRESILOVKE', 'GÓL']),
  period: n => `${n}. TR.`, overtime: 'PREDĹŽ.',
  seasonGoal: n => `${n}. gól v sezóne`,
  skaterLeague: (heat, season) => {
    const parts = [heat ? `forma ${heat.rank}. z ${heat.of}` : null, season ? `${skCount(season.points, 'point')} v sezóne, ${season.rank}. miesto` : null].filter(Boolean);
    return parts.length ? `NHL: ${parts.join(' · ')}` : null;
  },
  goalieLeague: (sv, rank, of, games, min) => rank != null ? `NHL: sezóna ${sv}, ${rank}. z ${skCount(of, 'goalie')}` : `NHL: sezóna ${sv} · na poradie chýbajú zápasy (${games}/${min})`,
  ui: {
    name: 'Slováci v NHL',
    sub: c => `Ako hrali v noci, ich góly, forma a kto hrá dnes. ${skCount(c, 'player')} na súpiskách NHL, aktualizované po každom zápase.`,
    partial: 'Časť dát z NHL sa teraz nepodarilo načítať — chýbajúci hráči sa doplnia pri ďalšej aktualizácii o pár minút.',
    results: 'VÝSLEDKY', nightTitle: 'Ako hrali v noci.', final: 'KONIEC', ot: 'PP', so: 'SN',
    scratched: 'Nenastúpili', idle: 'Ich tím nehral',
    goalsKicker: n => `GÓLY · ${skCount(n, 'goal').toUpperCase()} S VIDEOM`, goalsTitle: 'Slovenské góly posledných dní.',
    watch: 'prehrať gól', onNhl: 'PREHRAŤ NA NHL.COM', close: 'Zavrieť',
    schedule: 'PROGRAM', localTime: 'ČAS NA SLOVENSKU', nextTitle: 'Kto hrá najbližšie.', derby: 'SLOVENSKÉ DERBY', tonight: 'dnes v noci',
    formKicker: 'FORMA · HEAT 0–100', formTitle: 'Kto je vo forme.',
    heatSub: 'Heat = body za minútu na ľade v posledných 5 zápasoch, percento je rozdiel oproti jeho tempu v celej sezóne.',
    vsLeague: 'Pre porovnanie v NHL:', leader: (n, h) => `najlepšiu formu má ${n} (Heat ${h})`, median: m => `polovica hráčov ligy má Heat pod ${m}`, and: 'a',
    howHeat: 'Ako funguje Heat', empty: 'Zatiaľ žiadne zápasy.', notPlayed: 'V sezóne zatiaľ nehrali',
    goalieKicker: 'BRANKÁRI · POSLEDNÝCH 5 ŠTARTOV', goalieTitle: 'Slovenskí brankári.',
    goalieSub: 'Úspešnosť zákrokov v posledných piatich štartoch, bilancia výhier, prehier a prehier po predĺžení.',
    goalieAvg: p => `Priemer NHL v sezóne: ${p}.`, goalieEmpty: 'Zatiaľ žiadne štarty.',
    bestInNhl: 'Najlepšia forma v celej NHL', allResults: 'Všetky výsledky',
    title: 'Slováci v NHL – výsledky, góly a forma slovenských hráčov',
    description: 'Ako hrali Slováci v NHL v noci: body, čas na ľade, góly s videom, forma podľa Heat, slovenskí brankári a kto hrá dnes. Aktualizované po každom zápase.',
    snippetTail: ' Góly s videom, forma podľa Heat a kto hrá dnes.',
  },
};

// ─── Swedish ──────────────────────────────────────────────────────────────────

const SV_DAY = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
// 1:a, 2:a, 3:e … 21:a, 22:a; 11:e, 12:e.
const svOrd = (n: number) => `${n}:${(n % 10 === 1 || n % 10 === 2) && n % 100 !== 11 && n % 100 !== 12 ? 'a' : 'e'}`;
const svCount = counter(two, {
  goal: ['mål', 'mål'], assist: ['assist', 'assist'], point: ['poäng', 'poäng'], shot: ['skott', 'skott'],
  save: ['räddning', 'räddningar'], game: ['match', 'matcher'], start: ['start', 'starter'],
  goalie: ['målvakt', 'målvakter'], player: ['spelare', 'spelare'],
});

export const SV: NationText = {
  count: svCount,
  phrase: phraseOf({ none: 'utan poäng', and: 'och', hattrick: 'hattrick', goal: n => n === 1 ? 'ett mål' : svCount(n, 'goal'), assist: n => n === 1 ? 'en assist' : svCount(n, 'assist') }),
  toi: t => `${t} istid`,
  decision: { W: 'vinst', L: 'förlust', O: 'förlust efter förl.', relief: 'byttes in' },
  saves: (s, sa) => `${svCount(s, 'save')} av ${sa}`,
  night: (w, d, m) => `natten till ${SV_DAY[w]} ${d}/${m}`,
  summary: (night, played, points, best) => {
    const head = `${night[0].toUpperCase()}${night.slice(1)} spelade ${played} ${two(played, ['svensk', 'svenskar'])}`;
    return best.length ? `${head} och gjorde ${svCount(points, 'point')}. Bäst: ${best.join(', ')}.` : `${head}, men ingen gjorde poäng.`;
  },
  kicker: kickers(['AVGÖRANDE I FÖRLÄNGNINGEN', 'SENT AVGÖRANDE', 'SEN KVITTERING', 'MATCHVINNANDE MÅL', 'SEN LEDNING', 'STRAFFSLAG', 'I BOXPLAY', 'HATTRICK', 'I TOM BUR', 'SJÄLVMÅL', 'I POWERPLAY', 'MÅL']),
  period: n => `${svOrd(n).toUpperCase()} PER.`, overtime: 'FÖRL.',
  seasonGoal: n => `${svOrd(n)} målet för säsongen`,
  skaterLeague: (heat, season) => {
    const parts = [heat ? `form ${svOrd(heat.rank)} av ${heat.of}` : null, season ? `${svCount(season.points, 'point')} i säsongen, ${svOrd(season.rank)} plats` : null].filter(Boolean);
    return parts.length ? `NHL: ${parts.join(' · ')}` : null;
  },
  goalieLeague: (sv, rank, of, games, min) => rank != null ? `NHL: säsong ${sv}, ${svOrd(rank)} av ${svCount(of, 'goalie')}` : `NHL: säsong ${sv} · för få matcher för placering (${games}/${min})`,
  ui: {
    name: 'Svenskar i NHL',
    sub: c => `Hur de spelade i natt, deras mål, form och vem som spelar idag. ${svCount(c, 'player')} i NHL-trupperna, uppdaterat efter varje match.`,
    partial: 'En del NHL-data kunde inte hämtas just nu — de saknade spelarna fylls i vid nästa uppdatering om några minuter.',
    results: 'RESULTAT', nightTitle: 'Så spelade de i natt.', final: 'SLUT', ot: 'FÖRL.', so: 'STRAFF',
    scratched: 'Spelade inte', idle: 'Laget spelade inte',
    goalsKicker: n => `MÅL · ${svCount(n, 'goal').toUpperCase()} MED VIDEO`, goalsTitle: 'Svenska mål de senaste dagarna.',
    watch: 'spela upp målet', onNhl: 'SPELA UPP PÅ NHL.COM', close: 'Stäng',
    schedule: 'PROGRAM', localTime: 'SVENSK TID', nextTitle: 'Vem spelar härnäst.', derby: 'SVENSKT DERBY', tonight: 'i natt',
    formKicker: 'FORM · HEAT 0–100', formTitle: 'Vem är i form.',
    heatSub: 'Heat = poäng per minut på isen de senaste 5 matcherna, procenten är skillnaden mot spelarens takt under hela säsongen.',
    vsLeague: 'Som jämförelse i NHL:', leader: (n, h) => `bäst form har ${n} (Heat ${h})`, median: m => `halva ligan har Heat under ${m}`, and: 'och',
    howHeat: 'Så fungerar Heat', empty: 'Inga matcher än.', notPlayed: 'Har inte spelat i säsongen än',
    goalieKicker: 'MÅLVAKTER · SENASTE 5 STARTERNA', goalieTitle: 'Svenska målvakter.',
    goalieSub: 'Räddningsprocent de senaste fem starterna, vinster, förluster och förluster efter förlängning.',
    goalieAvg: p => `NHL-snitt i säsongen: ${p}.`, goalieEmpty: 'Inga starter än.',
    bestInNhl: 'Bäst form i hela NHL', allResults: 'Alla resultat',
    title: 'Svenskar i NHL – resultat, mål och form för svenska spelare',
    description: 'Så spelade svenskarna i NHL i natt: poäng, istid, mål med video, form enligt Heat, svenska målvakter och vem som spelar idag. Uppdateras efter varje match.',
    snippetTail: ' Mål med video, form enligt Heat och vem som spelar idag.',
  },
};

// ─── Finnish ──────────────────────────────────────────────────────────────────

// Genitive weekday: "tiistain vastainen yö" (the night before Tuesday).
const FI_DAY = ['sunnuntain', 'maanantain', 'tiistain', 'keskiviikon', 'torstain', 'perjantain', 'lauantain'];
// Numbers take the partitive singular: 1 maali, 2 maalia.
const fiCount = counter(two, {
  goal: ['maali', 'maalia'], assist: ['syöttö', 'syöttöä'], point: ['piste', 'pistettä'], shot: ['laukaus', 'laukausta'],
  save: ['torjunta', 'torjuntaa'], game: ['ottelu', 'ottelua'], start: ['ottelu', 'ottelua'],
  goalie: ['maalivahti', 'maalivahtia'], player: ['pelaaja', 'pelaajaa'],
});

export const FI: NationText = {
  count: fiCount,
  phrase: phraseOf({ none: 'ei pisteitä', and: 'ja', hattrick: 'hattrick', goal: n => n === 1 ? 'maali' : fiCount(n, 'goal'), assist: n => n === 1 ? 'syöttö' : fiCount(n, 'assist') }),
  toi: t => `${t} jäällä`,
  decision: { W: 'voitto', L: 'tappio', O: 'jatkoaikatappio', relief: 'tuli vaihdosta' },
  saves: (s, sa) => `${s}/${sa} torjuntaa`,
  night: (w, d, m) => `${FI_DAY[w]} vastainen yö ${d}.${m}.`,
  summary: (night, played, points, best) => {
    const when = night.replace(/vastainen yö/, 'vastaisena yönä');
    const head = `${when[0].toUpperCase()}${when.slice(1)} pelasi ${played} ${two(played, ['suomalainen', 'suomalaista'])}`;
    return best.length ? `${head}, pisteitä yhteensä ${points}. Parhaat: ${best.join(', ')}.` : `${head}, mutta kukaan ei tehnyt pisteitä.`;
  },
  kicker: kickers(['JATKOAIKAVOITTOMAALI', 'MYÖHÄINEN VOITTOMAALI', 'MYÖHÄINEN TASOITUS', 'VOITTOMAALI', 'MYÖHÄINEN JOHTOMAALI', 'RANGAISTUSLAUKAUS', 'ALIVOIMALLA', 'HATTRICK', 'TYHJÄÄN MAALIIN', 'OMA MAALI', 'YLIVOIMALLA', 'MAALI']),
  period: n => `${n}. ERÄ`, overtime: 'JA',
  seasonGoal: n => `kauden ${n}. maali`,
  skaterLeague: (heat, season) => {
    const parts = [heat ? `vire ${heat.rank}./${heat.of}` : null, season ? `kaudella ${fiCount(season.points, 'point')}, sija ${season.rank}.` : null].filter(Boolean);
    return parts.length ? `NHL: ${parts.join(' · ')}` : null;
  },
  goalieLeague: (sv, rank, of, games, min) => rank != null ? `NHL: kausi ${sv}, sija ${rank}./${of} maalivahtia` : `NHL: kausi ${sv} · sijoitukseen tarvitaan otteluita (${games}/${min})`,
  ui: {
    name: 'Suomalaiset NHL:ssä',
    sub: c => `Miten he pelasivat yöllä, heidän maalinsa, vireensä ja kuka pelaa tänään. ${fiCount(c, 'player')} NHL-joukkueiden kokoonpanoissa, päivittyy jokaisen ottelun jälkeen.`,
    partial: 'Osaa NHL:n tiedoista ei saatu juuri nyt ladattua — puuttuvat pelaajat lisätään seuraavassa päivityksessä muutaman minuutin päästä.',
    results: 'TULOKSET', nightTitle: 'Näin he pelasivat yöllä.', final: 'PÄÄTTYNYT', ot: 'JA', so: 'VL',
    scratched: 'Eivät pelanneet', idle: 'Joukkue ei pelannut',
    goalsKicker: n => `MAALIT · ${fiCount(n, 'goal').toUpperCase()} VIDEOLLA`, goalsTitle: 'Suomalaisten maalit viime päiviltä.',
    watch: 'katso maali', onNhl: 'KATSO NHL.COMISSA', close: 'Sulje',
    schedule: 'OHJELMA', localTime: 'SUOMEN AIKAA', nextTitle: 'Kuka pelaa seuraavaksi.', derby: 'SUOMALAISDERBY', tonight: 'tänä yönä',
    formKicker: 'VIRE · HEAT 0–100', formTitle: 'Kuka on vireessä.',
    heatSub: 'Heat = pisteet jääminuuttia kohden viidessä viime ottelussa, prosentti on ero pelaajan koko kauden tahtiin.',
    vsLeague: 'Vertailuksi NHL:ssä:', leader: (n, h) => `paras vire on pelaajalla ${n} (Heat ${h})`, median: m => `puolella liigan pelaajista Heat on alle ${m}`, and: 'ja',
    howHeat: 'Miten Heat toimii', empty: 'Ei vielä otteluita.', notPlayed: 'Eivät ole vielä pelanneet tällä kaudella',
    goalieKicker: 'MAALIVAHDIT · VIISI VIIME OTTELUA', goalieTitle: 'Suomalaiset maalivahdit.',
    goalieSub: 'Torjuntaprosentti viidessä viime ottelussa, voitot, tappiot ja jatkoaikatappiot.',
    goalieAvg: p => `NHL:n keskiarvo tällä kaudella: ${p}.`, goalieEmpty: 'Ei vielä otteluita.',
    bestInNhl: 'Paras vire koko NHL:ssä', allResults: 'Kaikki tulokset',
    title: 'Suomalaiset NHL:ssä – tulokset, maalit ja suomalaispelaajien vire',
    description: 'Näin suomalaiset pelasivat NHL:ssä yöllä: pisteet, peliaika, maalit videolla, vire Heatin mukaan, suomalaiset maalivahdit ja kuka pelaa tänään. Päivittyy jokaisen ottelun jälkeen.',
    snippetTail: ' Maalit videolla, vire Heatin mukaan ja kuka pelaa tänään.',
  },
};

// ─── German (Germany, Switzerland) ────────────────────────────────────────────

const DE_DAY = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const deCount = counter(two, {
  goal: ['Tor', 'Tore'], assist: ['Vorlage', 'Vorlagen'], point: ['Punkt', 'Punkte'], shot: ['Schuss', 'Schüsse'],
  save: ['Parade', 'Paraden'], game: ['Spiel', 'Spiele'], start: ['Einsatz', 'Einsätze'],
  goalie: ['Goalie', 'Goalies'], player: ['Spieler', 'Spieler'],
});

// `people`: [one, many] — "Deutscher"/"Deutsche"; `adj`: "deutsche"/"Schweizer".
function german(o: { people: [string, string]; adj: string; Adj: string; name: string; localTime: string; derby: string; swiss: boolean }): NationText {
  // Swiss German writes ss for ß.
  const w = (s: string) => o.swiss ? s.replace(/ß/g, 'ss') : s;
  return {
    count: deCount,
    phrase: phraseOf({ none: 'ohne Punkt', and: 'und', hattrick: 'Hattrick', goal: n => n === 1 ? 'ein Tor' : deCount(n, 'goal'), assist: n => n === 1 ? 'eine Vorlage' : deCount(n, 'assist') }),
    toi: t => `${t} Eiszeit`,
    decision: { W: 'Sieg', L: 'Niederlage', O: 'Niederlage n. V.', relief: 'eingewechselt' },
    saves: (s, sa) => `${deCount(s, 'save')} bei ${deCount(sa, 'shot')}`,
    night: (wd, d, m) => `Nacht auf ${DE_DAY[wd]}, ${d}.${m}.`,
    summary: (night, played, points, best) => {
      const head = `In der ${night}, ${played === 1 ? 'spielte' : 'spielten'} ${played} ${two(played, o.people)}`;
      return best.length
        ? `${head} und ${played === 1 ? 'sammelte' : 'sammelten'} ${deCount(points, 'point')}. Am besten: ${best.join(', ')}.`
        : `${head}, gepunktet hat aber keiner.`;
    },
    kicker: kickers(['SIEGTOR IN DER VERLÄNGERUNG', 'SPÄTES SIEGTOR', 'SPÄTER AUSGLEICH', 'SIEGTOR', 'SPÄTE FÜHRUNG', 'PENALTY', 'IN UNTERZAHL', 'HATTRICK', 'INS LEERE TOR', 'EIGENTOR', 'IN ÜBERZAHL', 'TOR']),
    period: n => `${n}. DRITTEL`, overtime: 'VERL.',
    seasonGoal: n => `${n}. Saisontor`,
    skaterLeague: (heat, season) => {
      const parts = [heat ? `Form Platz ${heat.rank} von ${heat.of}` : null, season ? `${deCount(season.points, 'point')} in der Saison, Platz ${season.rank}` : null].filter(Boolean);
      return parts.length ? `NHL: ${parts.join(' · ')}` : null;
    },
    goalieLeague: (sv, rank, of, games, min) => rank != null ? `NHL: Saison ${sv}, Platz ${rank} von ${deCount(of, 'goalie')}` : `NHL: Saison ${sv} · für eine Platzierung fehlen Spiele (${games}/${min})`,
    ui: {
      name: o.name,
      sub: c => `Wie sie in der Nacht gespielt haben, ihre Tore, ihre Form und wer heute spielt. ${deCount(c, 'player')} in NHL-Kadern, aktualisiert nach jedem Spiel.`,
      partial: w('Ein Teil der NHL-Daten ließ sich gerade nicht laden — fehlende Spieler kommen beim nächsten Update in wenigen Minuten dazu.'),
      results: 'ERGEBNISSE', nightTitle: 'So haben sie in der Nacht gespielt.', final: 'ENDE', ot: 'N. V.', so: 'N. P.',
      scratched: 'Nicht eingesetzt', idle: 'Team spielte nicht',
      goalsKicker: n => `TORE · ${deCount(n, 'goal').toUpperCase()} MIT VIDEO`, goalsTitle: `${o.Adj} Tore der letzten Tage.`,
      watch: 'Tor abspielen', onNhl: 'AUF NHL.COM ABSPIELEN', close: w('Schließen'),
      schedule: 'SPIELPLAN', localTime: o.localTime, nextTitle: 'Wer als Nächstes spielt.', derby: o.derby, tonight: 'heute Nacht',
      formKicker: 'FORM · HEAT 0–100', formTitle: 'Wer in Form ist.',
      heatSub: 'Heat = Punkte pro Minute Eiszeit in den letzten 5 Spielen, der Prozentwert ist der Unterschied zu seinem Tempo in der ganzen Saison.',
      vsLeague: 'Zum Vergleich in der NHL:', leader: (n, h) => `die beste Form hat ${n} (Heat ${h})`, median: m => `die Hälfte der Liga hat Heat unter ${m}`, and: 'und',
      howHeat: 'So funktioniert Heat', empty: 'Noch keine Spiele.', notPlayed: 'In dieser Saison noch nicht gespielt',
      goalieKicker: w('GOALIES · LETZTE 5 EINSÄTZE'), goalieTitle: `${o.Adj} Goalies.`,
      goalieSub: 'Fangquote in den letzten fünf Einsätzen, Siege, Niederlagen und Niederlagen nach Verlängerung.',
      goalieAvg: p => `NHL-Schnitt in der Saison: ${p}.`, goalieEmpty: 'Noch keine Einsätze.',
      bestInNhl: 'Beste Form in der ganzen NHL', allResults: 'Alle Ergebnisse',
      title: `${o.name} – Ergebnisse, Tore und Form der ${o.adj} Spieler`,
      description: w(`Wie die ${o.people[1]} in der NHL in der Nacht gespielt haben: Punkte, Eiszeit, Tore mit Video, Form nach Heat, ${o.adj} Goalies und wer heute spielt. Aktualisiert nach jedem Spiel.`),
      snippetTail: ' Tore mit Video, Form nach Heat und wer heute spielt.',
    },
  };
}

export const DE = german({ people: ['Deutscher', 'Deutsche'], adj: 'deutschen', Adj: 'Deutsche', name: 'Deutsche in der NHL', localTime: 'DEUTSCHE ZEIT', derby: 'DEUTSCHES DUELL', swiss: false });
export const CH = german({ people: ['Schweizer', 'Schweizer'], adj: 'Schweizer', Adj: 'Schweizer', name: 'Schweizer in der NHL', localTime: 'SCHWEIZER ZEIT', derby: 'SCHWEIZER DUELL', swiss: true });

// ─── Latvian ──────────────────────────────────────────────────────────────────

// Accusative weekday: "nakts uz otrdienu".
const LV_DAY = ['svētdienu', 'pirmdienu', 'otrdienu', 'trešdienu', 'ceturtdienu', 'piektdienu', 'sestdienu'];
// [ends in 1, other, zero]; "vārti" (a goal) exists only in the plural.
const lvCount = counter(latvian, {
  goal: ['vārti', 'vārti', 'vārtu'], assist: ['rezultatīva piespēle', 'rezultatīvas piespēles', 'rezultatīvu piespēļu'],
  point: ['punkts', 'punkti', 'punktu'], shot: ['metiens', 'metieni', 'metienu'], save: ['atvairīts metiens', 'atvairīti metieni', 'atvairītu metienu'],
  game: ['spēle', 'spēles', 'spēļu'], start: ['spēle', 'spēles', 'spēļu'], goalie: ['vārtsargs', 'vārtsargi', 'vārtsargu'],
  player: ['spēlētājs', 'spēlētāji', 'spēlētāju'],
});

export const LV: NationText = {
  count: lvCount,
  phrase: phraseOf({ none: 'bez punktiem', and: 'un', hattrick: 'het-triks', goal: n => n === 1 ? 'vārti' : lvCount(n, 'goal'), assist: n => n === 1 ? 'rezultatīva piespēle' : lvCount(n, 'assist') }),
  toi: t => `${t} uz ledus`,
  decision: { W: 'uzvara', L: 'zaudējums', O: 'zaudējums papildlaikā', relief: 'nomainīja' },
  saves: (s, sa) => `${s} no ${sa} atvairīti`,
  night: (w, d, m) => `nakts uz ${LV_DAY[w]} ${d}.${m}.`,
  summary: (night, played, points, best) => {
    const head = `${night.replace(/^nakts /, 'Naktī ')} spēlēja ${played} ${latvian(played, ['latvietis', 'latvieši', 'latviešu'])}`;
    return best.length ? `${head}, kopā ${lvCount(points, 'point')}. Labākie: ${best.join(', ')}.` : `${head}, bet punktus neguva neviens.`;
  },
  kicker: kickers(['UZVARAS VĀRTI PAPILDLAIKĀ', 'VĒLI UZVARAS VĀRTI', 'VĒLA IZLĪDZINĀŠANA', 'UZVARAS VĀRTI', 'VĒLI VADĪBAS VĀRTI', 'SODA METIENS', 'MAZĀKUMĀ', 'HET-TRIKS', 'TUKŠOS VĀRTOS', 'PAŠU VĀRTI', 'VAIRĀKUMĀ', 'VĀRTI']),
  period: n => `${n}. TR.`, overtime: 'PL',
  seasonGoal: n => `${n}. vārti sezonā`,
  skaterLeague: (heat, season) => {
    const parts = [heat ? `forma ${heat.rank}. no ${heat.of}` : null, season ? `${lvCount(season.points, 'point')} sezonā, ${season.rank}. vieta` : null].filter(Boolean);
    return parts.length ? `NHL: ${parts.join(' · ')}` : null;
  },
  goalieLeague: (sv, rank, of, games, min) => rank != null ? `NHL: sezona ${sv}, ${rank}. no ${of} vārtsargiem` : `NHL: sezona ${sv} · vietai trūkst spēļu (${games}/${min})`,
  ui: {
    name: 'Latvieši NHL',
    sub: c => `Kā viņi spēlēja naktī, viņu vārti, forma un kas spēlē šodien. ${lvCount(c, 'player')} NHL komandu sastāvos, atjaunots pēc katras spēles.`,
    partial: 'Daļu NHL datu pašlaik neizdevās ielādēt — trūkstošie spēlētāji parādīsies nākamajā atjauninājumā pēc dažām minūtēm.',
    results: 'REZULTĀTI', nightTitle: 'Kā viņi spēlēja naktī.', final: 'BEIGAS', ot: 'PL', so: 'PM',
    scratched: 'Nespēlēja', idle: 'Komanda nespēlēja',
    goalsKicker: n => `VĀRTI · ${lvCount(n, 'goal').toUpperCase()} AR VIDEO`, goalsTitle: 'Latviešu vārti pēdējās dienās.',
    watch: 'skatīt vārtus', onNhl: 'SKATĪT NHL.COM', close: 'Aizvērt',
    schedule: 'PROGRAMMA', localTime: 'LATVIJAS LAIKS', nextTitle: 'Kas spēlē nākamie.', derby: 'LATVIEŠU DERBIJS', tonight: 'šonakt',
    formKicker: 'FORMA · HEAT 0–100', formTitle: 'Kurš ir formā.',
    heatSub: 'Heat = punkti minūtē uz ledus pēdējās 5 spēlēs, procenti ir starpība pret viņa tempu visā sezonā.',
    vsLeague: 'Salīdzinājumam NHL:', leader: (n, h) => `labākā forma ir ${n} (Heat ${h})`, median: m => `pusei līgas spēlētāju Heat ir zem ${m}`, and: 'un',
    howHeat: 'Kā darbojas Heat', empty: 'Vēl nav spēļu.', notPlayed: 'Šajā sezonā vēl nav spēlējuši',
    goalieKicker: 'VĀRTSARGI · PĒDĒJĀS 5 SPĒLES', goalieTitle: 'Latviešu vārtsargi.',
    goalieSub: 'Atvairīto metienu procents pēdējās piecās spēlēs, uzvaras, zaudējumi un zaudējumi papildlaikā.',
    goalieAvg: p => `NHL vidējais sezonā: ${p}.`, goalieEmpty: 'Vēl nav spēļu.',
    bestInNhl: 'Labākā forma visā NHL', allResults: 'Visi rezultāti',
    title: 'Latvieši NHL – rezultāti, vārti un latviešu spēlētāju forma',
    description: 'Kā latvieši spēlēja NHL naktī: punkti, laiks uz ledus, vārti ar video, forma pēc Heat, latviešu vārtsargi un kas spēlē šodien. Atjaunots pēc katras spēles.',
    snippetTail: ' Vārti ar video, forma pēc Heat un kas spēlē šodien.',
  },
};

// ─── Danish ───────────────────────────────────────────────────────────────────

const DA_DAY = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
const daCount = counter(two, {
  goal: ['mål', 'mål'], assist: ['assist', 'assists'], point: ['point', 'point'], shot: ['skud', 'skud'],
  save: ['redning', 'redninger'], game: ['kamp', 'kampe'], start: ['start', 'starter'],
  goalie: ['målmand', 'målmænd'], player: ['spiller', 'spillere'],
});

export const DA: NationText = {
  count: daCount,
  phrase: phraseOf({ none: 'uden point', and: 'og', hattrick: 'hattrick', goal: n => n === 1 ? 'et mål' : daCount(n, 'goal'), assist: n => n === 1 ? 'en assist' : daCount(n, 'assist') }),
  toi: t => `${t} istid`,
  decision: { W: 'sejr', L: 'nederlag', O: 'nederlag efter forl.', relief: 'kom ind' },
  saves: (s, sa) => `${daCount(s, 'save')} på ${daCount(sa, 'shot')}`,
  night: (w, d, m) => `natten til ${DA_DAY[w]} ${d}/${m}`,
  summary: (night, played, points, best) => {
    const head = `${night[0].toUpperCase()}${night.slice(1)} spillede ${played} ${two(played, ['dansker', 'danskere'])}`;
    return best.length ? `${head} og fik ${daCount(points, 'point')}. Bedst: ${best.join(', ')}.` : `${head}, men ingen fik point.`;
  },
  kicker: kickers(['AFGØRENDE I FORLÆNGELSEN', 'SENT SEJRSMÅL', 'SEN UDLIGNING', 'SEJRSMÅL', 'SEN FØRING', 'STRAFFESLAG', 'I UNDERTAL', 'HATTRICK', 'I TOMT MÅL', 'SELVMÅL', 'I OVERTAL', 'MÅL']),
  period: n => `${n}. PER.`, overtime: 'FORL.',
  seasonGoal: n => `${n}. mål i sæsonen`,
  skaterLeague: (heat, season) => {
    const parts = [heat ? `form nr. ${heat.rank} af ${heat.of}` : null, season ? `${daCount(season.points, 'point')} i sæsonen, nr. ${season.rank}` : null].filter(Boolean);
    return parts.length ? `NHL: ${parts.join(' · ')}` : null;
  },
  goalieLeague: (sv, rank, of, games, min) => rank != null ? `NHL: sæson ${sv}, nr. ${rank} af ${daCount(of, 'goalie')}` : `NHL: sæson ${sv} · for få kampe til placering (${games}/${min})`,
  ui: {
    name: 'Danskere i NHL',
    sub: c => `Sådan spillede de i nat, deres mål, form og hvem der spiller i dag. ${daCount(c, 'player')} på NHL-holdene, opdateret efter hver kamp.`,
    partial: 'En del af NHL-dataene kunne ikke hentes lige nu — de manglende spillere kommer med ved næste opdatering om få minutter.',
    results: 'RESULTATER', nightTitle: 'Sådan spillede de i nat.', final: 'SLUT', ot: 'FORL.', so: 'STR.',
    scratched: 'Spillede ikke', idle: 'Holdet spillede ikke',
    goalsKicker: n => `MÅL · ${daCount(n, 'goal').toUpperCase()} MED VIDEO`, goalsTitle: 'Danske mål de seneste dage.',
    watch: 'afspil målet', onNhl: 'AFSPIL PÅ NHL.COM', close: 'Luk',
    schedule: 'PROGRAM', localTime: 'DANSK TID', nextTitle: 'Hvem spiller næste gang.', derby: 'DANSK DUEL', tonight: 'i nat',
    formKicker: 'FORM · HEAT 0–100', formTitle: 'Hvem er i form.',
    heatSub: 'Heat = point pr. minut på isen i de seneste 5 kampe, procenten er forskellen fra hans tempo i hele sæsonen.',
    vsLeague: 'Til sammenligning i NHL:', leader: (n, h) => `bedst form har ${n} (Heat ${h})`, median: m => `halvdelen af ligaen har Heat under ${m}`, and: 'og',
    howHeat: 'Sådan virker Heat', empty: 'Ingen kampe endnu.', notPlayed: 'Har ikke spillet i sæsonen endnu',
    goalieKicker: 'MÅLMÆND · SENESTE 5 STARTER', goalieTitle: 'Danske målmænd.',
    goalieSub: 'Redningsprocent i de seneste fem starter, sejre, nederlag og nederlag efter forlængelse.',
    goalieAvg: p => `NHL-gennemsnit i sæsonen: ${p}.`, goalieEmpty: 'Ingen starter endnu.',
    bestInNhl: 'Bedst form i hele NHL', allResults: 'Alle resultater',
    title: 'Danskere i NHL – resultater, mål og form for danske spillere',
    description: 'Sådan spillede danskerne i NHL i nat: point, istid, mål med video, form efter Heat, danske målmænd og hvem der spiller i dag. Opdateres efter hver kamp.',
    snippetTail: ' Mål med video, form efter Heat og hvem der spiller i dag.',
  },
};


// ─── English ──────────────────────────────────────────────────────────────────
// The homepage's "your country" section: the site is English, the players are
// still theirs — "6 Czechs played".

const EN_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const enOrd = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
const enCount = counter(two, {
  goal: ['goal', 'goals'], assist: ['assist', 'assists'], point: ['point', 'points'], shot: ['shot', 'shots'],
  save: ['save', 'saves'], game: ['game', 'games'], start: ['start', 'starts'], goalie: ['goalie', 'goalies'], player: ['player', 'players'],
});

export function english(o: { people: [string, string]; adj: string }): NationText {
  return {
    count: enCount,
    phrase: phraseOf({ none: 'no points', and: 'and', hattrick: 'a hat trick', goal: n => n === 1 ? 'a goal' : enCount(n, 'goal'), assist: n => n === 1 ? 'an assist' : enCount(n, 'assist') }),
    toi: t => `${t} TOI`,
    decision: { W: 'win', L: 'loss', O: 'OT loss', relief: 'in relief' },
    saves: (s, sa) => `${s} saves on ${sa}`,
    // The fans' night: Monday's games are their Tuesday morning.
    night: (w, d, m) => `overnight into ${EN_DAY[w]} ${d} ${EN_MONTH[m - 1]}`,
    summary: (_night, played, points, best) => {
      const head = `${played} ${two(played, o.people)} played`;
      return best.length ? `${head}, ${enCount(points, 'point')} between them. Best: ${best.join(', ')}.` : `${head} — no points between them.`;
    },
    kicker: kickers(['OT WINNER', 'LATE WINNER', 'LATE EQUALIZER', 'GAME WINNER', 'LATE GO-AHEAD', 'PENALTY SHOT', 'SHORTHANDED', 'HAT TRICK', 'EMPTY NET', 'OWN GOAL', 'POWER PLAY', 'GOAL']),
    period: n => enOrd(n).toUpperCase(), overtime: 'OT',
    seasonGoal: n => `${enOrd(n)} goal of the season`,
    skaterLeague: (heat, season) => {
      const parts = [heat ? `form ${enOrd(heat.rank)} of ${heat.of}` : null, season ? `${enCount(season.points, 'point')} this season, ${enOrd(season.rank)}` : null].filter(Boolean);
      return parts.length ? `NHL: ${parts.join(' · ')}` : null;
    },
    goalieLeague: (sv, rank, of, games, min) => rank != null ? `NHL: ${sv} this season, ${enOrd(rank)} of ${of}` : `NHL: ${sv} this season · not enough games to rank (${games}/${min})`,
    pct: s => `${(s * 100).toFixed(1)}%`,
    ui: {
      name: `${o.people[1]} in the NHL`,
      sub: c => `How they did last night, their goals, form and who plays tonight. ${enCount(c, 'player')} on NHL rosters.`,
      partial: 'Some NHL data did not load — the missing players fill in on the next update.',
      results: 'RESULTS', nightTitle: 'How they did last night.', final: 'FINAL', ot: 'OT', so: 'SO',
      scratched: 'Scratched', idle: 'Team off',
      goalsKicker: n => `GOALS · ${enCount(n, 'goal').toUpperCase()} WITH VIDEO`, goalsTitle: `${o.adj} goals, last few nights.`,
      watch: 'watch the goal', onNhl: 'WATCH ON NHL.COM', close: 'Close',
      schedule: 'SCHEDULE', localTime: 'YOUR TIME', nextTitle: 'Who plays next.', derby: `${o.adj.toUpperCase()} DERBY`, tonight: 'tonight',
      formKicker: 'FORM · HEAT 0–100', formTitle: 'Who is hot.',
      heatSub: 'Heat = points per minute on ice over the last 5 games; the % is the change against his pace for the whole season.',
      vsLeague: 'Across the NHL:', leader: (n, h) => `${n} has the best form (Heat ${h})`, median: m => `half the league is below Heat ${m}`, and: 'and',
      howHeat: 'How Heat works', empty: 'No games yet.', notPlayed: 'No games this season yet',
      goalieKicker: 'GOALIES · LAST 5 STARTS', goalieTitle: `${o.adj} goalies.`,
      goalieSub: 'Save % over the last five starts, wins, losses and OT losses.',
      goalieAvg: p => `NHL average this season: ${p}.`, goalieEmpty: 'No starts yet.',
      bestInNhl: 'Best form in the whole NHL', allResults: 'All results',
      title: `${o.people[1]} in the NHL – results, goals and form`,
      description: `How the ${o.people[1]} in the NHL did last night: points, ice time, goals with video, form by Heat and who plays tonight.`,
      snippetTail: ' Goals with video, form by Heat and who plays tonight.',
    },
  };
}
