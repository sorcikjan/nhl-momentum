---
name: push
description: Decide whether and when to push nhl-momentum to main (every push is a Netlify deploy that empties the page cache) and do it safely. Use before any `git push`, when commits are waiting locally, or when the user asks to push or deploy.
---

# Pushing nhl-momentum

Every push to `main` is a Netlify deploy. Every deploy empties the ISR page cache, and
the next visits and crawls re-render ~1,200+ pages from a free Supabase instance that
runs at its memory limit. Too many deploys, or one at the wrong moment, has taken the
database down (3, 4 and 5 Nov 2026). The user does not want to think about this: decide
by these rules, push or hold, and tell them which and why.

Commit after every edit as usual; these rules are only about `git push`.

## 1. What is waiting

```bash
git log --oneline origin/main..main
```

Nothing waiting: stop. Otherwise sort the commits:

- **P0**: fixes the prediction pipeline, data syncing, an outage, or something broken that
  users see right now (wrong numbers, 500s). P0 goes out now, skipping the budget and the
  window in steps 3 and 4. It still needs the checks in steps 2 and 5. A P0 that fixes the
  outage itself goes out even if the database is struggling.
- **Normal**: features, design, SEO, cleanups, docs. Batch these.

## 2. Is the app healthy enough to take a deploy?

```bash
set -a && source .env.local && set +a
curl -s -m 60 "https://hockeymomentum.com/api/pipeline-health?key=$INGEST_API_KEY" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['checks']['database'], d['issues'])"
```

Hold the push when:
- `database.reachable` is false, or the probe is slow (repeatedly over ~1.5 s from the
  health check), or the user mentioned a Supabase warning e-mail (Disk IO, memory) today;
- a P0 data issue is open (e.g. `GAMES NOT RECORDED`, missing predictions, no outcomes
  after a game night). Fix the data first, then push. A deploy on top of broken data
  re-renders every page with the broken data.

Not a reason to hold: `SNAPSHOTS: N player(s) have stale snapshots`. This is usually a
false alarm, because the pipeline skips unchanged snapshots, so players whose team didn't
play look stale. To check it, verify that the players from last night's games have fresh
snapshots.

Also hold while a pipeline run you started by hand is still going (worker, backfill).

## 3. Deploy budget: at most 2–3 a day

Count today's pushes from the remote-tracking reflog:

```bash
git reflog show origin/main --date=iso | grep "update by push" | grep "$(date -u +%Y-%m-%d)"
```

With 3 already today, normal commits wait for tomorrow. Two is comfortable, three is the
ceiling.

## 4. Time window

All times UTC. Game nights run from about 22:00 (first puck drop) to about 09:00 (post-game
pipeline and morning runs).

- **Best**: late morning to afternoon, ~10:00–20:00, after the morning pipeline and the
  10:30 health check, and well before games.
- **Avoid**: from 2 h before the first puck drop until the post-game processing finishes,
  and around the scheduled crons (05:00, 06:30, 08:00, 09:30, 10:00, 18:00). Traffic and
  pipeline load peak then, and an empty cache makes every visitor hit the database.
- On an off-day without games, the window is open all day (still respect the budget).

Check tonight's first game:

```bash
curl -s "https://api-web.nhle.com/v1/schedule/$(date -u +%Y-%m-%d)" \
  | python3 -c "import json,sys; g=json.load(sys.stdin)['gameWeek'][0]['games']; print(len(g), min((x['startTimeUTC'] for x in g), default=None))"
```

## 5. Before pushing

```bash
npx tsc --noEmit && npx vitest run
git status --short   # nothing stray: helper scripts, .env files, scratch output
```

Never push failing tests or a stray file. Scratch scripts belong in the session
scratchpad, not the repo (`git add -A` once committed one by mistake).

## 6. Push and verify

```bash
git push origin main
```

About 5 minutes later, check that the deploy went through and the site serves:

```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://hockeymomentum.com/
```

Never call `/api/revalidate` without a body to "test" anything. Without a body it
re-renders the whole site.

## 7. Tell the user

Always say one of:
- **Pushed**: what went out, in plain words, and the push count today ("second push
  today").
- **Holding**: what is waiting, why (database, window, budget, open P0), and when it
  goes out ("tomorrow morning after the health check").

When holding, offer the override in one line. The user can always say "push now".
