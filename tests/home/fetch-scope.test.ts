import { beforeEach, describe, expect, it, vi } from 'vitest';

const empty = { games: [], predictions: [], odds: [], topPlayerByGame: new Map(), topHeatByGameTeam: new Map() };
const fetchGamesRange = vi.fn();
vi.mock('@/lib/data', () => ({
  fetchGamesRange: (d: string[]) => fetchGamesRange(d),
  fetchRecentCompletedGames: async () => ({ games: [], predMap: new Map() }),
  fetchRankings: async () => null,
  fetchGoalieRankings: async () => [],
  fetchNewcomerWatch: async () => [],
  fetchRecentRecaps: async () => [],
  fetchSeasonPickAccuracy: async () => null,
  fetchSnapshotHeat: async () => new Map(),
}));

const game = (id: number, gameDate: string) => ({ id, gameDate, startTimeUTC: `${gameDate}T23:00:00Z`, gameState: 'FUT', awayTeam: { abbrev: 'EDM' }, homeTeam: { abbrev: 'COL' } });

describe('fetchHomeData scope', () => {
  beforeEach(() => fetchGamesRange.mockReset());

  it('fetches only today when there are games tonight', async () => {
    fetchGamesRange.mockResolvedValue({ ...empty, games: [game(1, '2026-10-19')] });
    const { fetchHomeData } = await import('@/lib/home');
    const d = await fetchHomeData('2026-10-19');
    expect(fetchGamesRange).toHaveBeenCalledTimes(1);
    expect(fetchGamesRange).toHaveBeenCalledWith(['2026-10-19']);
    expect(d.tonight).toHaveLength(1);
  });

  it('looks ahead a week only on an off-day, for the next game date', async () => {
    fetchGamesRange.mockResolvedValueOnce(empty).mockResolvedValueOnce({ ...empty, games: [game(2, '2026-10-21')] });
    const { fetchHomeData } = await import('@/lib/home');
    const d = await fetchHomeData('2026-10-19');
    expect(fetchGamesRange).toHaveBeenCalledTimes(2);
    expect(fetchGamesRange.mock.calls[1][0]).toHaveLength(7);
    expect(d.tonight).toHaveLength(0);
    expect(d.nextGameDate).toBe('2026-10-21');
  });
});
