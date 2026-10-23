import { describe, expect, it } from 'vitest';
import { playerClaimProblem, recapFactProblem, type RecapGame } from '@/lib/ai';

const tallies = [
  { name: 'M. Celebrini', goals: 2, assists: 1 },
  { name: 'M. Rantanen', goals: 3, assists: 0 },
  { name: 'B. Tkachuk', goals: 1, assists: 0 },
  { name: 'M. Tkachuk', goals: 0, assists: 1 },
  { name: 'C. Knuble', goals: 2, assists: 0 },
];

describe('playerClaimProblem', () => {
  it('rejects a hat trick the feed does not have (recap of 2026-10-20)', () => {
    expect(playerClaimProblem("Macklin Celebrini's hat trick led a Sharks comeback.", tallies)).toMatch(/M\. Celebrini had 2G 1A/);
  });
  it('accepts claims that match the feed', () => {
    const ok = 'Mikko Rantanen completed a hat trick. Cole Knuble scored twice. Macklin Celebrini had two goals and one assist for a three-point night.';
    expect(playerClaimProblem(ok, tallies)).toBeNull();
  });
  it('checks assists and points', () => {
    expect(playerClaimProblem('Macklin Celebrini added three assists.', tallies)).toMatch(/not three assists/);
    expect(playerClaimProblem('Cole Knuble had a four-point night.', tallies)).toMatch(/not four points/);
  });
  it('tells players who share a last name apart by first name', () => {
    expect(playerClaimProblem('Brady Tkachuk scored one goal.', tallies)).toBeNull();
    expect(playerClaimProblem('Matthew Tkachuk scored two goals.', tallies)).toMatch(/M\. Tkachuk had 0G 1A/);
  });
  it('leaves sentences about several players or about teams alone', () => {
    expect(playerClaimProblem('Ottawa scored five goals.', tallies)).toBeNull();
    expect(playerClaimProblem('Cole Knuble and Mikko Rantanen combined for five goals.', tallies)).toBeNull();
  });
  it('rejects any hat trick on a night without one', () => {
    expect(playerClaimProblem('A hat trick lit up the night.', [{ name: 'C. Knuble', goals: 2, assists: 0 }])).toMatch(/nobody scored three/);
  });
});

describe('recapFactProblem', () => {
  it('runs the player check over every game', () => {
    const games = [{ awayTeam: 'SJS', homeTeam: 'MTL', awayScore: 4, homeScore: 3, predictedCorrectly: null, homeWinProbability: null, tallies }] as RecapGame[];
    const out = { title: 'Celebrini hat trick sinks Montreal', summary: '', content: '' };
    expect(recapFactProblem(out, games)).toMatch(/Celebrini/);
  });
});

describe('playerClaimProblem — attribution', () => {
  it('a claim belongs to the nearest player named before it', () => {
    expect(playerClaimProblem("Macklin Celebrini's hat trick led the Sharks, while Mikko Rantanen scored three goals.", tallies)).toMatch(/M\. Celebrini/);
    expect(playerClaimProblem('Mikko Rantanen had a hat trick and Cole Knuble scored twice.', tallies)).toBeNull();
  });
  it('team margins are not player claims (recap of 2026-10-16)', () => {
    expect(playerClaimProblem('Macklin Celebrini turned a two-goal deficit into a win.', tallies)).toBeNull();
  });
  it('reads feed names without a space after the initial', () => {
    expect(playerClaimProblem('Jiri Kulich scored two goals.', [{ name: 'J.Kulich', goals: 1, assists: 0 }])).toMatch(/J\.Kulich had 1G/);
  });
});

describe('playerClaimProblem — team numbers', () => {
  it('a team answer in another clause is not the player\'s (recap of 2026-10-18)', () => {
    expect(playerClaimProblem('Cole Knuble opened the scoring, only for Calgary to respond with three goals.', tallies)).toBeNull();
  });
  it('a hyphenated count describes a player only for a night or performance', () => {
    expect(playerClaimProblem('Macklin Celebrini sparked a five-goal unanswered run.', tallies)).toBeNull();
    expect(playerClaimProblem('Macklin Celebrini had a three-point night.', tallies)).toBeNull();
    expect(playerClaimProblem('Macklin Celebrini had a four-point night.', tallies)).toMatch(/not four points/);
  });
});

describe('recapFactProblem — team names', () => {
  const base = { awayScore: 1, homeScore: 2, predictedCorrectly: null, homeWinProbability: null } as const;
  const night = [
    { ...base, awayTeam: 'NYR', homeTeam: 'TOR', awayName: 'New York Rangers', homeName: 'Toronto Maple Leafs' },
    { ...base, awayTeam: 'LAK', homeTeam: 'NYI', awayName: 'Los Angeles Kings', homeName: 'New York Islanders' },
    { ...base, awayTeam: 'FLA', homeTeam: 'BUF', awayName: 'Florida Panthers', homeName: 'Buffalo Sabres' },
  ] as RecapGame[];
  const check = (content: string) => recapFactProblem({ title: 't', summary: '', content }, night);
  it('allows two teams from one city on the same night (2026-10-22)', () => {
    expect(check('The New York Rangers won in Toronto while the New York Islanders beat Los Angeles.')).toBeNull();
  });
  it('still catches an invented name', () => {
    expect(check('The Buffalo Bills fell to Florida.')).toMatch(/Buffalo Bills/);
    expect(check('The New York Knicks won.')).toMatch(/New York Knicks/);
  });
});
