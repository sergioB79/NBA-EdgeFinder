import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';

const dataDir = path.join(process.cwd(), '..', 'data');

async function readJsonFile(filename: string) {
  const filePath = path.join(dataDir, filename);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

// Helper function to extract leaders for a specific category
function getLeadersByCategory(rawData: any, categoryName: string, key: string) {
    const category = rawData.categories.find((cat: any) => cat.name === categoryName);
    if (!category) {
        return [];
    }
    return category.ranks.map((rank: any) => ({
        full_name: rank.player.full_name,
        statistics: {
            average: {
                [key]: rank.average[key]
            }
        },
        team_id: rank.teams[0]?.id || '',
        team_name: rank.teams[0]?.name || '',
        team_alias: rank.teams[0]?.market || '',
    }));
}

const aliasToNickname: Record<string, string> = {
  ATL: 'Hawks',
  BOS: 'Celtics',
  BKN: 'Nets',
  CHA: 'Hornets',
  CHI: 'Bulls',
  CLE: 'Cavaliers',
  DAL: 'Mavericks',
  DEN: 'Nuggets',
  DET: 'Pistons',
  GSW: 'Warriors',
  HOU: 'Rockets',
  IND: 'Pacers',
  LAC: 'Clippers',
  LAL: 'Lakers',
  MEM: 'Grizzlies',
  MIA: 'Heat',
  MIL: 'Bucks',
  MIN: 'Timberwolves',
  NOP: 'Pelicans',
  NYK: 'Knicks',
  OKC: 'Thunder',
  ORL: 'Magic',
  PHI: '76ers',
  PHX: 'Suns',
  POR: 'Trail Blazers',
  SAC: 'Kings',
  SAS: 'Spurs',
  TOR: 'Raptors',
  UTA: 'Jazz',
  WAS: 'Wizards',
};

const aliasToFullName: Record<string, string> = {
  ATL: 'Atlanta Hawks',
  BOS: 'Boston Celtics',
  BKN: 'Brooklyn Nets',
  CHA: 'Charlotte Hornets',
  CHI: 'Chicago Bulls',
  CLE: 'Cleveland Cavaliers',
  DAL: 'Dallas Mavericks',
  DEN: 'Denver Nuggets',
  DET: 'Detroit Pistons',
  GSW: 'Golden State Warriors',
  HOU: 'Houston Rockets',
  IND: 'Indiana Pacers',
  LAC: 'Los Angeles Clippers',
  LAL: 'Los Angeles Lakers',
  MEM: 'Memphis Grizzlies',
  MIA: 'Miami Heat',
  MIL: 'Milwaukee Bucks',
  MIN: 'Minnesota Timberwolves',
  NOP: 'New Orleans Pelicans',
  NYK: 'New York Knicks',
  OKC: 'Oklahoma City Thunder',
  ORL: 'Orlando Magic',
  PHI: 'Philadelphia 76ers',
  PHX: 'Phoenix Suns',
  POR: 'Portland Trail Blazers',
  SAC: 'Sacramento Kings',
  SAS: 'San Antonio Spurs',
  TOR: 'Toronto Raptors',
  UTA: 'Utah Jazz',
  WAS: 'Washington Wizards',
};

const nickToAlias: Record<string, string> = Object.entries(aliasToNickname).reduce((acc, [alias, nick]) => {
  acc[nick.toLowerCase()] = alias;
  return acc;
}, {} as Record<string, string>);

const normalize = (value: string | null | undefined) => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Load ELO rankings once
async function loadEloRankings() {
  const csvPath = path.join(dataDir, 'nba_elo_ranking_2025.csv');
  const csvFile = await fs.readFile(csvPath, 'utf-8');
  const parsedCsv = Papa.parse(csvFile, {
    header: true,
    skipEmptyLines: true,
  });
  const rankings = (parsedCsv.data as any[])
    .filter((row: any) => row.team)
    .map((row: any) => ({
      team: row.team as string,
      elo: Number(row.elo_final) || 0,
    }))
    .sort((a, b) => b.elo - a.elo);

  const rankMap: Record<string, number> = {};
  const eloMap: Record<string, number> = {};
  rankings.forEach((row, idx) => {
    const keyNick = normalize(row.team);
    rankMap[keyNick] = idx + 1;
    eloMap[keyNick] = row.elo;

    const alias = nickToAlias[keyNick];
    if (alias) {
      rankMap[normalize(alias)] = idx + 1;
      const full = normalize(aliasToFullName[alias]);
      if (full) rankMap[full] = idx + 1;
      eloMap[normalize(alias)] = row.elo;
      if (full) eloMap[full] = row.elo;
    }
  });
  return { rankMap, eloMap };
}

function getEloRank(teamName: string | null | undefined, teamAlias: string | null | undefined, rankMap: Record<string, number>) {
  const nameKey = normalize(teamName);
  if (rankMap[nameKey]) return rankMap[nameKey];

  const aliasKey = normalize(teamAlias);
  if (rankMap[aliasKey]) return rankMap[aliasKey];

  const nick = aliasToNickname[(teamAlias || '').toUpperCase()];
  if (nick && rankMap[normalize(nick)]) return rankMap[normalize(nick)];

  const full = aliasToFullName[(teamAlias || '').toUpperCase()];
  if (full && rankMap[normalize(full)]) return rankMap[normalize(full)];

  return null;
}

function getEloRating(teamName: string | null | undefined, teamAlias: string | null | undefined, eloMap: Record<string, number>) {
  const nameKey = normalize(teamName);
  if (eloMap[nameKey]) return eloMap[nameKey];

  const aliasKey = normalize(teamAlias);
  if (eloMap[aliasKey]) return eloMap[aliasKey];

  const nick = aliasToNickname[(teamAlias || '').toUpperCase()];
  if (nick && eloMap[normalize(nick)]) return eloMap[normalize(nick)];

  const full = aliasToFullName[(teamAlias || '').toUpperCase()];
  if (full && eloMap[normalize(full)]) return eloMap[normalize(full)];

  return null;
}

function buildTotalsProjection(homeTeam: any, awayTeam: any, leagueAvgTeamPts: number, eloHome: number | null, eloAway: number | null) {
  const pfHome = homeTeam?.points_for || 0;
  const pfAway = awayTeam?.points_for || 0;
  const paHome = homeTeam?.points_against || 0;
  const paAway = awayTeam?.points_against || 0;

  const base1Home = pfHome;
  const base1Away = pfAway;
  const base1Total = base1Home + base1Away;

  const att_home = leagueAvgTeamPts > 0 ? pfHome / leagueAvgTeamPts : 0;
  const def_away = leagueAvgTeamPts > 0 ? paAway / leagueAvgTeamPts : 0;
  const att_away = leagueAvgTeamPts > 0 ? pfAway / leagueAvgTeamPts : 0;
  const def_home = leagueAvgTeamPts > 0 ? paHome / leagueAvgTeamPts : 0;

  const base_home = leagueAvgTeamPts * att_home * def_away;
  const base_away = leagueAvgTeamPts * att_away * def_home;
  const base_total = base_home + base_away;
  const base_margin = base_home - base_away;

  const k = 0.02;
  const delta_elo = (eloHome || 0) - (eloAway || 0);
  const elo_effect = k * delta_elo;
  const home_final = base_home + elo_effect;
  const away_final = base_away - elo_effect;

  return {
    variant_simple: {
      home: base1Home,
      away: base1Away,
      total: base1Total,
    },
    variant_elo_adjusted: {
      home: home_final,
      away: away_final,
      total: home_final + away_final,
      margin: home_final - away_final,
      base_margin,
      base_total,
      elo_effect,
    },
  };
}

function computeForm(parsedQuartersData: any[], teamId: string, context: 'home' | 'away') {
  const closedGames = parsedQuartersData.filter((g: any) => g.status === 'closed' && (g.home_id === teamId || g.away_id === teamId));
  const parseScore = (val: any) => {
    const n = parseInt(val, 10);
    return Number.isNaN(n) ? null : n;
  };

  const sortedGames = [...closedGames].sort((a, b) => {
    const da = new Date(a.scheduled || a.start_time || a.start_time_utc || 0).getTime();
    const db = new Date(b.scheduled || b.start_time || b.start_time_utc || 0).getTime();
    return db - da;
  });

  const now = Date.now();
  const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000;

  const summarize = (games: any[]) => {
    let wins = 0;
    let losses = 0;
    games.forEach(g => {
      const homeScore = parseScore(g.home_score);
      const awayScore = parseScore(g.away_score);
      if (homeScore === null || awayScore === null) return;
      const isHome = g.home_id === teamId;
      const teamScore = isHome ? homeScore : awayScore;
      const oppScore = isHome ? awayScore : homeScore;
      if (teamScore > oppScore) wins += 1;
      else losses += 1;
    });
    return { games: games.length, wins, losses };
  };

  const last10 = summarize(sortedGames.slice(0, 10));
  const contextGames = sortedGames.filter(g => (context === 'home' ? g.home_id === teamId : g.away_id === teamId));
  const last5Context = summarize(contextGames.slice(0, 5));
  const last5Days = summarize(sortedGames.filter(g => {
    const d = new Date(g.scheduled || g.start_time || g.start_time_utc || 0).getTime();
    return d >= fiveDaysAgo;
  }));

  return { last10, last5Context, last5Days };
}

// New interfaces for prognostics
interface QuarterPrognostics {
  expected_for: number;
  expected_against: number;
  expected_diff: number;
  games_count_for: number;
  games_count_against: number;
}

interface TeamPrognostics {
  q1: QuarterPrognostics;
  q2: QuarterPrognostics;
  q3: QuarterPrognostics;
  q4: QuarterPrognostics;
  ot: QuarterPrognostics;
}

// Prognostics based on calculatePrognostics.py logic
interface QuarterPrognosticsV2 {
  quarter: number;
  expected_for: number;
  expected_against: number;
  expected_diff: number;
  games: number;
}

interface TeamPrognosticsV2 {
  byQuarter: QuarterPrognosticsV2[];
}

function calculatePrognostics(parsedQuartersData: any[], homeTeamId: string, awayTeamId: string) {
  const k = 10; // Strength of the league parameter

  // --- 1. Calculate League Averages (For and Against) ---
  const leagueAverages: { [quarter: string]: { home: { pts_for_sum: number, games_for: number, pts_against_sum: number, games_against: number }, away: { pts_for_sum: number, games_for: number, pts_against_sum: number, games_against: number } } } = {};
  ['q1', 'q2', 'q3', 'q4', 'ot'].forEach(q => {
    leagueAverages[q] = {
      home: { pts_for_sum: 0, games_for: 0, pts_against_sum: 0, games_against: 0 },
      away: { pts_for_sum: 0, games_for: 0, pts_against_sum: 0, games_against: 0 }
    };
  });

  parsedQuartersData.forEach((game: any) => {
    if (game.status !== 'closed') return;

    ['q1', 'q2', 'q3', 'q4'].forEach(q => {
      const homeScore = parseInt(game[`home_${q}`], 10);
      const awayScore = parseInt(game[`away_${q}`], 10);
      if (!isNaN(homeScore) && !isNaN(awayScore)) {
        // Home team's points for and against
        leagueAverages[q].home.pts_for_sum += homeScore;
        leagueAverages[q].home.games_for++;
        leagueAverages[q].home.pts_against_sum += awayScore;
        leagueAverages[q].home.games_against++;

        // Away team's points for and against
        leagueAverages[q].away.pts_for_sum += awayScore;
        leagueAverages[q].away.games_for++;
        leagueAverages[q].away.pts_against_sum += homeScore;
        leagueAverages[q].away.games_against++;
      }
    });

    // Handle OT separately
    let homeOtScore = 0;
    let awayOtScore = 0;
    let playedOt = false;
    ['ot1', 'ot2', 'ot3', 'ot4'].forEach(ot => {
      const hs = parseInt(game[`home_${ot}`], 10);
      const as = parseInt(game[`away_${ot}`], 10);
      if (!isNaN(hs) && !isNaN(as)) {
        playedOt = true;
        homeOtScore += hs;
        awayOtScore += as;
      }
    });
    if (playedOt) {
      leagueAverages['ot'].home.pts_for_sum += homeOtScore;
      leagueAverages['ot'].home.games_for++;
      leagueAverages['ot'].home.pts_against_sum += awayOtScore;
      leagueAverages['ot'].home.games_against++;

      leagueAverages['ot'].away.pts_for_sum += awayOtScore;
      leagueAverages['ot'].away.games_for++;
      leagueAverages['ot'].away.pts_against_sum += homeOtScore;
      leagueAverages['ot'].away.games_against++;
    }
  });

  const getLeagueAvg = (quarter: string, isHomeContext: boolean, isFor: boolean) => {
    const data = isHomeContext ? leagueAverages[quarter].home : leagueAverages[quarter].away;
    if (isFor) {
      return data.games_for > 0 ? data.pts_for_sum / data.games_for : 0;
    } else {
      return data.games_against > 0 ? data.pts_against_sum / data.games_against : 0;
    }
  };

  // --- 2. Aggregate Per-Team Data (For and Against) ---
  const teamAggregates: { [teamId: string]: { [quarter: string]: { home: { pts_for_sum: number, games_for: number, pts_against_sum: number, games_against: number }, away: { pts_for_sum: number, games_for: number, pts_against_sum: number, games_against: number } } } } = {};

  parsedQuartersData.forEach((game: any) => {
    if (game.status !== 'closed') return;

    const homeId = game.home_id;
    const awayId = game.away_id;

    [homeId, awayId].forEach(id => {
      if (!teamAggregates[id]) {
        teamAggregates[id] = {};
        ['q1', 'q2', 'q3', 'q4', 'ot'].forEach(q => {
          teamAggregates[id][q] = {
            home: { pts_for_sum: 0, games_for: 0, pts_against_sum: 0, games_against: 0 },
            away: { pts_for_sum: 0, games_for: 0, pts_against_sum: 0, games_against: 0 }
          };
        });
      }
    });

    ['q1', 'q2', 'q3', 'q4'].forEach(q => {
      const homeScore = parseInt(game[`home_${q}`], 10);
      const awayScore = parseInt(game[`away_${q}`], 10);
      if (!isNaN(homeScore) && !isNaN(awayScore)) {
        // Home team playing at home
        teamAggregates[homeId][q].home.pts_for_sum += homeScore;
        teamAggregates[homeId][q].home.games_for++;
        teamAggregates[homeId][q].home.pts_against_sum += awayScore;
        teamAggregates[homeId][q].home.games_against++;

        // Away team playing away
        teamAggregates[awayId][q].away.pts_for_sum += awayScore;
        teamAggregates[awayId][q].away.games_for++;
        teamAggregates[awayId][q].away.pts_against_sum += homeScore;
        teamAggregates[awayId][q].away.games_against++;
      }
    });

    // Handle OT separately for team aggregates
    let homeOtScore = 0;
    let awayOtScore = 0;
    let playedOt = false;
    ['ot1', 'ot2', 'ot3', 'ot4'].forEach(ot => {
      const hs = parseInt(game[`home_${ot}`], 10);
      const as = parseInt(game[`away_${ot}`], 10);
      if (!isNaN(hs) && !isNaN(as)) {
        playedOt = true;
        homeOtScore += hs;
        awayOtScore += as;
      }
    });
    if (playedOt) {
      teamAggregates[homeId]['ot'].home.pts_for_sum += homeOtScore;
      teamAggregates[homeId]['ot'].home.games_for++;
      teamAggregates[homeId]['ot'].home.pts_against_sum += awayOtScore;
      teamAggregates[homeId]['ot'].home.games_against++;

      teamAggregates[awayId]['ot'].away.pts_for_sum += awayOtScore;
      teamAggregates[awayId]['ot'].away.games_for++;
      teamAggregates[awayId]['ot'].away.pts_against_sum += homeOtScore;
      teamAggregates[awayId]['ot'].away.games_against++;
    }
  });

  // --- 3. Apply Regression to the Mean and Calculate Differentials ---
  const prognostics: { homeTeam: TeamPrognostics, awayTeam: TeamPrognostics } = {
    homeTeam: {} as TeamPrognostics,
    awayTeam: {} as TeamPrognostics,
  };

  const calculateRegressedAvg = (teamId: string, quarter: string, isHomeContext: boolean, isFor: boolean) => {
    const teamData = teamAggregates[teamId]?.[quarter]?.[isHomeContext ? 'home' : 'away'];
    const leagueAvg = getLeagueAvg(quarter, isHomeContext, isFor);

    const pts_sum = isFor ? (teamData?.pts_for_sum || 0) : (teamData?.pts_against_sum || 0);
    const games = isFor ? (teamData?.games_for || 0) : (teamData?.games_against || 0);

    return (pts_sum + leagueAvg * k) / (games + k);
  };

  ['q1', 'q2', 'q3', 'q4', 'ot'].forEach(q => {
    // Home Team Prognostics
    const homeTeamExpectedFor = calculateRegressedAvg(homeTeamId, q, true, true);
    const homeTeamExpectedAgainst = calculateRegressedAvg(homeTeamId, q, true, false);
    const homeTeamGamesCountFor = teamAggregates[homeTeamId]?.[q]?.home?.games_for || 0;
    const homeTeamGamesCountAgainst = teamAggregates[homeTeamId]?.[q]?.home?.games_against || 0;

    prognostics.homeTeam[q as keyof TeamPrognostics] = {
      expected_for: homeTeamExpectedFor,
      expected_against: homeTeamExpectedAgainst,
      expected_diff: homeTeamExpectedFor - homeTeamExpectedAgainst,
      games_count_for: homeTeamGamesCountFor,
      games_count_against: homeTeamGamesCountAgainst,
    };

    // Away Team Prognostics
    const awayTeamExpectedFor = calculateRegressedAvg(awayTeamId, q, false, true);
    const awayTeamExpectedAgainst = calculateRegressedAvg(awayTeamId, q, false, false);
    const awayTeamGamesCountFor = teamAggregates[awayTeamId]?.[q]?.away?.games_for || 0;
    const awayTeamGamesCountAgainst = teamAggregates[awayTeamId]?.[q]?.away?.games_against || 0;

    prognostics.awayTeam[q as keyof TeamPrognostics] = {
      expected_for: awayTeamExpectedFor,
      expected_against: awayTeamExpectedAgainst,
      expected_diff: awayTeamExpectedFor - awayTeamExpectedAgainst,
      games_count_for: awayTeamGamesCountFor,
      games_count_against: awayTeamGamesCountAgainst,
    };
  });

  return prognostics;
}

function calculatePrognosticsV2(parsedQuartersData: any[], homeTeamId: string, awayTeamId: string): { homeTeam: TeamPrognosticsV2; awayTeam: TeamPrognosticsV2 } {
  const K = 10;
  const quarters = [1, 2, 3, 4];

  const closedGames = parsedQuartersData.filter((g: any) => !g.status || g.status === 'closed');

  if (closedGames.length === 0) {
    const empty: TeamPrognosticsV2 = { byQuarter: quarters.map((q) => ({
      quarter: q,
      expected_for: 0,
      expected_against: 0,
      expected_diff: 0,
      games: 0,
    })) };
    return { homeTeam: empty, awayTeam: empty };
  }

  type LeagueContext = {
    home_for: number;
    home_against: number;
    away_for: number;
    away_against: number;
  };

  const league: Record<number, LeagueContext> = {} as any;

  for (const q of quarters) {
    const homeKey = `home_q${q}`;
    const awayKey = `away_q${q}`;

    let homeForSum = 0;
    let homeAgainstSum = 0;
    let awayForSum = 0;
    let awayAgainstSum = 0;
    let count = 0;

    for (const g of closedGames) {
      const h = Number(g[homeKey]);
      const a = Number(g[awayKey]);
      if (Number.isNaN(h) || Number.isNaN(a)) continue;
      homeForSum += h;
      homeAgainstSum += a;
      awayForSum += a;
      awayAgainstSum += h;
      count += 1;
    }

    if (count === 0) {
      league[q] = { home_for: 0, home_against: 0, away_for: 0, away_against: 0 };
    } else {
      league[q] = {
        home_for: homeForSum / count,
        home_against: homeAgainstSum / count,
        away_for: awayForSum / count,
        away_against: awayAgainstSum / count,
      };
    }
  }

  function getTeamQuarterStats(teamId: string, context: 'home' | 'away'): TeamPrognosticsV2 {
    const byQuarter: QuarterPrognosticsV2[] = [];

    for (const q of quarters) {
      const homeKey = `home_q${q}`;
      const awayKey = `away_q${q}`;

      let sumFor = 0;
      let sumAgainst = 0;
      let gamesFor = 0;
      let gamesAgainst = 0;

      for (const g of closedGames) {
        const isHome = g.home_id === teamId;
        const isAway = g.away_id === teamId;

        if (context === 'home' && isHome) {
          const f = Number(g[homeKey]);
          const ag = Number(g[awayKey]);
          if (!Number.isNaN(f)) {
            sumFor += f;
            gamesFor += 1;
          }
          if (!Number.isNaN(ag)) {
            sumAgainst += ag;
            gamesAgainst += 1;
          }
        } else if (context === 'away' && isAway) {
          const f = Number(g[awayKey]);
          const ag = Number(g[homeKey]);
          if (!Number.isNaN(f)) {
            sumFor += f;
            gamesFor += 1;
          }
          if (!Number.isNaN(ag)) {
            sumAgainst += ag;
            gamesAgainst += 1;
          }
        }
      }

      const leagueCtx = league[q];
      const leagueFor = context === 'home' ? leagueCtx.home_for : leagueCtx.away_for;
      const leagueAgainst = context === 'home' ? leagueCtx.home_against : leagueCtx.away_against;

      const expected_for = (sumFor + leagueFor * K) / (gamesFor + K);
      const expected_against = (sumAgainst + leagueAgainst * K) / (gamesAgainst + K);

      byQuarter.push({
        quarter: q,
        expected_for,
        expected_against,
        expected_diff: expected_for - expected_against,
        games: Math.max(gamesFor, gamesAgainst),
      });
    }

    return { byQuarter };
  }

  const homePrognostics = getTeamQuarterStats(homeTeamId, 'home');
  const awayPrognostics = getTeamQuarterStats(awayTeamId, 'away');

  return { homeTeam: homePrognostics, awayTeam: awayPrognostics };
}

export async function GET(request: NextRequest, context: { params: { gameId: string } }) {
  const { gameId } = await context.params;

  try {
    // 1. Read all necessary data files
    const quartersCsvFile = await fs.readFile(path.join(dataDir, 'quarters_2025_REG.csv'), 'utf-8');
    const gamesTodayJson = await readJsonFile('games_today.json'); // Read games_today.json
    const standingsJson = await readJsonFile('standings.json');
    const injuriesActiveJson = await readJsonFile('injuries_active.json');
    const leadersRawJson = await readJsonFile('leaders_raw.json');
    const { rankMap: eloRankMap, eloMap } = await loadEloRankings();

    // 2. Parse quarters CSV to find the specific game
    const parsedQuarters = Papa.parse(quartersCsvFile, {
      header: true,
      skipEmptyLines: true,
    });

    const gameDetailsFromCsv = parsedQuarters.data.find((game: any) => game.game_id === gameId);
    const gameDetailsFromJson = gamesTodayJson.games.find((game: any) => game.id === gameId); // Find in games_today.json

    if (!gameDetailsFromCsv && !gameDetailsFromJson) {
      return NextResponse.json({ message: 'Game not found in any schedule' }, { status: 404 });
    }

    // Combine game details, prioritizing gamesTodayJson for scheduled/venue, and quartersCsvFile for scores/status
    const gameDetails = {
      id: gameId,
      home_id: gameDetailsFromJson?.home?.id || gameDetailsFromCsv?.home_id,
      home_name: gameDetailsFromJson?.home?.name || gameDetailsFromCsv?.home_name,
      home_alias: gameDetailsFromJson?.home?.alias || gameDetailsFromCsv?.home_alias,
      away_id: gameDetailsFromJson?.away?.id || gameDetailsFromCsv?.away_id,
      away_name: gameDetailsFromJson?.away?.name || gameDetailsFromCsv?.away_name,
      away_alias: gameDetailsFromJson?.away?.alias || gameDetailsFromCsv?.away_alias,
      scheduled: gameDetailsFromJson?.scheduled || gameDetailsFromCsv?.scheduled,
      venue: gameDetailsFromJson?.venue || { name: "N/A", city: "N/A", state: "N/A" }, // Use venue from games_today.json
      status: gameDetailsFromCsv?.status || gameDetailsFromJson?.status || 'upcoming', // Status from CSV if available, else JSON, else upcoming
      home_score: gameDetailsFromCsv?.home_score || '',
      away_score: gameDetailsFromCsv?.away_score || '',
    };

    // Extract home and away team IDs (from combined gameDetails)
    const homeTeamId = gameDetails.home_id;
    const awayTeamId = gameDetails.away_id;

    // 3. Get Standings for home and away teams
    const allConferences = standingsJson.conferences;
    const allTeams = allConferences.flatMap((conf: any) => conf.divisions.flatMap((div: any) => div.teams));

    // Calculate overall league rank
    const sortedAllTeams = [...allTeams].sort((a, b) => b.win_pct - a.win_pct);
    sortedAllTeams.forEach((team: any, index: number) => {
      team.overall_rank = index + 1;
    });

    const homeTeamOverallStandings = sortedAllTeams.find((team: any) => team.id === homeTeamId);
    const awayTeamOverallStandings = sortedAllTeams.find((team: any) => team.id === awayTeamId);

    const getDetailedStandings = (team: any) => {
      if (!team) return null;
      const homeRecord = team.records.find((r: any) => r.record_type === 'home') || { wins: 0, losses: 0, win_pct: 0 };
      const roadRecord = team.records.find((r: any) => r.record_type === 'road') || { wins: 0, losses: 0, win_pct: 0 };
      return {
      overall: {
        wins: team.wins,
        losses: team.losses,
        win_pct: team.win_pct,
        conference_games_behind: team.games_behind.conference,
        conference_rank: team.calc_rank.conf_rank,
        overall_rank: team.overall_rank, // Added overall_rank
        points_for: team.points_for,
        points_against: team.points_against,
      },
      home: {
        wins: homeRecord.wins,
        losses: homeRecord.losses,
        win_pct: homeRecord.win_pct,
        },
        away: {
          wins: roadRecord.wins,
          losses: roadRecord.losses,
          win_pct: roadRecord.win_pct,
        },
      };
    };

    const homeTeamDetailedStandings = getDetailedStandings(homeTeamOverallStandings);
    const awayTeamDetailedStandings = getDetailedStandings(awayTeamOverallStandings);

    // League averages for totals logic
    const leagueAvgTeamPts =
      allTeams.length > 0
        ? allTeams.reduce((sum: number, t: any) => sum + (t.points_for || 0), 0) / allTeams.length
        : 0;

    const eloHomeRating = getEloRating(gameDetails.home_name, gameDetails.home_alias, eloMap);
    const eloAwayRating = getEloRating(gameDetails.away_name, gameDetails.away_alias, eloMap);
    const totalsProjection = buildTotalsProjection(homeTeamOverallStandings, awayTeamOverallStandings, leagueAvgTeamPts, eloHomeRating, eloAwayRating);
    const homeForm = computeForm(parsedQuarters.data, homeTeamId, 'home');
    const awayForm = computeForm(parsedQuarters.data, awayTeamId, 'away');

    // 4. Get Injuries for home and away teams
    const homeTeamInjuries = injuriesActiveJson.find((team: any) => team.team_id === homeTeamId)?.players || [];
    const awayTeamInjuries = injuriesActiveJson.find((team: any) => team.team_id === awayTeamId)?.players || [];

    // 5. Get Leaders for home and away teams
    const allLeaders = [
      ...getLeadersByCategory(leadersRawJson, 'points', 'points'),
      ...getLeadersByCategory(leadersRawJson, 'assists', 'assists'),
      ...getLeadersByCategory(leadersRawJson, 'rebounds', 'rebounds'),
      ...getLeadersByCategory(leadersRawJson, 'three_points_made', 'three_points_made'),
    ];

    const homeTeamLeaders = allLeaders.filter((leader: any) => leader.team_id === homeTeamId);
    const awayTeamLeaders = allLeaders.filter((leader: any) => leader.team_id === awayTeamId);

    // 6. Calculate Prognostics (existing and new regression-to-mean version)
    const prognosticsData = calculatePrognostics(parsedQuarters.data, homeTeamId, awayTeamId);
    const prognosticsV2 = calculatePrognosticsV2(parsedQuarters.data, homeTeamId, awayTeamId);

    // 7. Construct the response
    const analysisData = {
      game: gameDetails,
      homeTeam: {
        id: homeTeamId,
        name: gameDetails.home_name,
        alias: gameDetails.home_alias,
        standings: homeTeamDetailedStandings,
        elo_rank: getEloRank(gameDetails.home_name, gameDetails.home_alias, eloRankMap),
        elo_rating: eloHomeRating,
        form: homeForm,
        injuries: homeTeamInjuries,
        leaders: homeTeamLeaders,
        prognostics: prognosticsData.homeTeam, // Added prognostics
        proPrognostics: prognosticsV2.homeTeam,
      },
      awayTeam: {
        id: awayTeamId,
        name: gameDetails.away_name,
        alias: gameDetails.away_alias,
        standings: awayTeamDetailedStandings,
        elo_rank: getEloRank(gameDetails.away_name, gameDetails.away_alias, eloRankMap),
        elo_rating: eloAwayRating,
        form: awayForm,
        injuries: awayTeamInjuries,
        leaders: awayTeamLeaders,
        prognostics: prognosticsData.awayTeam, // Added prognostics
        proPrognostics: prognosticsV2.awayTeam,
      },
      totalsProjection,
    };

    return NextResponse.json(analysisData);

  } catch (error: any) {
    console.error('Error fetching game analysis data:', error);
    return NextResponse.json({ message: 'Error fetching game analysis data', details: error.message, stack: error.stack }, { status: 500 });
  }
}
