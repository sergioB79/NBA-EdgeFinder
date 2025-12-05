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

const aliasToNickname: Record<string, string> = {
  ATL: 'Hawks', BOS: 'Celtics', BKN: 'Nets', CHA: 'Hornets', CHI: 'Bulls',
  CLE: 'Cavaliers', DAL: 'Mavericks', DEN: 'Nuggets', DET: 'Pistons', GSW: 'Warriors',
  HOU: 'Rockets', IND: 'Pacers', LAC: 'Clippers', LAL: 'Lakers', MEM: 'Grizzlies',
  MIA: 'Heat', MIL: 'Bucks', MIN: 'Timberwolves', NOP: 'Pelicans', NYK: 'Knicks',
  OKC: 'Thunder', ORL: 'Magic', PHI: '76ers', PHX: 'Suns', POR: 'Trail Blazers',
  SAC: 'Kings', SAS: 'Spurs', TOR: 'Raptors', UTA: 'Jazz', WAS: 'Wizards',
};

const aliasToFullName: Record<string, string> = {
  ATL: 'Atlanta Hawks', BOS: 'Boston Celtics', BKN: 'Brooklyn Nets', CHA: 'Charlotte Hornets', CHI: 'Chicago Bulls',
  CLE: 'Cleveland Cavaliers', DAL: 'Dallas Mavericks', DEN: 'Denver Nuggets', DET: 'Detroit Pistons', GSW: 'Golden State Warriors',
  HOU: 'Houston Rockets', IND: 'Indiana Pacers', LAC: 'Los Angeles Clippers', LAL: 'Los Angeles Lakers', MEM: 'Memphis Grizzlies',
  MIA: 'Miami Heat', MIL: 'Milwaukee Bucks', MIN: 'Minnesota Timberwolves', NOP: 'New Orleans Pelicans', NYK: 'New York Knicks',
  OKC: 'Oklahoma City Thunder', ORL: 'Orlando Magic', PHI: 'Philadelphia 76ers', PHX: 'Phoenix Suns', POR: 'Portland Trail Blazers',
  SAC: 'Sacramento Kings', SAS: 'San Antonio Spurs', TOR: 'Toronto Raptors', UTA: 'Utah Jazz', WAS: 'Washington Wizards',
};

const nickToAlias: Record<string, string> = Object.entries(aliasToNickname).reduce((acc, [alias, nick]) => {
  acc[nick.toLowerCase()] = alias;
  return acc;
}, {} as Record<string, string>);

const normalize = (value: string | null | undefined) => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function loadEloRankings() {
  const csvPath = path.join(dataDir, 'nba_elo_ranking_2025.csv');
  const csvFile = await fs.readFile(csvPath, 'utf-8');
  const parsedCsv = Papa.parse(csvFile, { header: true, skipEmptyLines: true });

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

  const base_home = leagueAvgTeamPts > 0 ? leagueAvgTeamPts * (pfHome / leagueAvgTeamPts) * (paAway / leagueAvgTeamPts) : 0;
  const base_away = leagueAvgTeamPts > 0 ? leagueAvgTeamPts * (pfAway / leagueAvgTeamPts) * (paHome / leagueAvgTeamPts) : 0;
  const base_total = base_home + base_away;
  const base_margin = base_home - base_away;

  const k = 0.02;
  const delta_elo = (eloHome || 0) - (eloAway || 0);
  const elo_effect = k * delta_elo;
  const home_final = base_home + elo_effect;
  const away_final = base_away - elo_effect;

  return {
    baseline_home: pfHome,
    baseline_away: pfAway,
    baseline_total: pfHome + pfAway,
    elo_home: home_final,
    elo_away: away_final,
    elo_total: home_final + away_final,
    elo_margin: home_final - away_final,
    base_total,
    base_margin,
  };
}

function computeForm(parsedGames: any[], teamId: string, context: 'home' | 'away') {
  const closedGames = parsedGames.filter((g: any) => g.status === 'closed' && (g.home_id === teamId || g.away_id === teamId));
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

export async function GET(request: NextRequest) {
  try {
    const quartersCsv = await fs.readFile(path.join(dataDir, 'quarters_2025_REG.csv'), 'utf-8');
    const gamesToday = await readJsonFile('games_today.json');
    const standingsJson = await readJsonFile('standings.json');
    const { rankMap: eloRankMap, eloMap } = await loadEloRankings();

    const parsedQuarters = Papa.parse(quartersCsv, { header: true, skipEmptyLines: true });
    const quartersData = parsedQuarters.data as any[];

    const allTeams = standingsJson.conferences.flatMap((conf: any) => conf.divisions.flatMap((div: any) => div.teams));
    const leagueAvgTeamPts =
      allTeams.length > 0
        ? allTeams.reduce((sum: number, t: any) => sum + (t.points_for || 0), 0) / allTeams.length
        : 0;

    const summaries = gamesToday.games.map((game: any) => {
      const homeId = game.home.id;
      const awayId = game.away.id;
      const home = allTeams.find((t: any) => t.id === homeId);
      const away = allTeams.find((t: any) => t.id === awayId);

      const eloHome = getEloRating(game.home.name, game.home.alias, eloMap);
      const eloAway = getEloRating(game.away.name, game.away.alias, eloMap);
      const eloHomeRank = getEloRank(game.home.name, game.home.alias, eloRankMap);
      const eloAwayRank = getEloRank(game.away.name, game.away.alias, eloRankMap);

      const totals = buildTotalsProjection(home, away, leagueAvgTeamPts, eloHome, eloAway);
      const homeForm = computeForm(quartersData, homeId, 'home');
      const awayForm = computeForm(quartersData, awayId, 'away');

      return {
        game_id: game.id,
        title: game.title,
        scheduled: game.scheduled,
        home_name: game.home.name,
        home_alias: game.home.alias,
        away_name: game.away.name,
        away_alias: game.away.alias,
        home_elo_rank: eloHomeRank,
        away_elo_rank: eloAwayRank,
        home_elo_rating: eloHome,
        away_elo_rating: eloAway,
        proj_home: totals.elo_home,
        proj_away: totals.elo_away,
        proj_total: totals.elo_total,
        proj_margin: totals.elo_margin,
        baseline_total: totals.baseline_total,
        home_last10_w: homeForm.last10.wins,
        home_last10_l: homeForm.last10.losses,
        away_last10_w: awayForm.last10.wins,
        away_last10_l: awayForm.last10.losses,
        home_last5_ctx_w: homeForm.last5Context.wins,
        home_last5_ctx_l: homeForm.last5Context.losses,
        away_last5_ctx_w: awayForm.last5Context.wins,
        away_last5_ctx_l: awayForm.last5Context.losses,
        home_last5_days_w: homeForm.last5Days.wins,
        home_last5_days_l: homeForm.last5Days.losses,
        away_last5_days_w: awayForm.last5Days.wins,
        away_last5_days_l: awayForm.last5Days.losses,
      };
    });

    const format = request.nextUrl.searchParams.get('format');
    if (format === 'csv') {
      const csv = Papa.unparse(summaries);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="edgefinder_upcoming_analysis.csv"',
        },
      });
    }

    return NextResponse.json({ games: summaries });
  } catch (error: any) {
    console.error('Error exporting analysis:', error);
    return NextResponse.json({ error: 'Failed to export analysis', details: error.message }, { status: 500 });
  }
}
