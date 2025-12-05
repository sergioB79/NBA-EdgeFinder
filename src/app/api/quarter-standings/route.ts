import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

interface TeamQuarterStats {
  gamesPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface TeamStats {
  [key: string]: { // Quarter key: q1, q2, q3, q4, ot
    all: TeamQuarterStats;
    home: TeamQuarterStats;
    away: TeamQuarterStats;
  };
}

interface TeamData {
  id: string;
  name: string;
  alias: string;
  stats: TeamStats;
}

export async function GET() {
  try {
    const csvFilePath = path.join(process.cwd(), '..', 'data', 'quarters_2025_REG.csv');
    const csvFile = fs.readFileSync(csvFilePath, 'utf8');

    const teamsData: { [id: string]: TeamData } = {};

    const parsedCsv = Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
    });

    for (const row of parsedCsv.data) {
      const game = row as any;

      if (game.status !== 'closed') continue;

      const {
        home_id, home_name, home_alias,
        away_id, away_name, away_alias,
      } = game;

      if (!home_id || !away_id) continue;

      // Initialize team data
      for (const team of [{ id: home_id, name: home_name, alias: home_alias }, { id: away_id, name: away_name, alias: away_alias }]) {
        if (!teamsData[team.id]) {
          teamsData[team.id] = {
            id: team.id,
            name: `${team.name}`,
            alias: team.alias,
            stats: {},
          };
          for (let i = 1; i <= 4; i++) {
            teamsData[team.id].stats[`q${i}`] = { all: { gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0 }, home: { gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0 }, away: { gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0 } };
          }
          teamsData[team.id].stats['ot'] = { all: { gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0 }, home: { gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0 }, away: { gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0 } };
        }
      }
      
      const quarters = ['q1', 'q2', 'q3', 'q4'];
      const ots = ['ot1', 'ot2', 'ot3', 'ot4'];

      // Process quarters
      quarters.forEach((q) => {
          const homeScore = parseInt(game[`home_${q}`], 10);
          const awayScore = parseInt(game[`away_${q}`], 10);

          if (!isNaN(homeScore) && !isNaN(awayScore)) {
              // Home team
              teamsData[home_id].stats[q].all.gamesPlayed++;
              teamsData[home_id].stats[q].home.gamesPlayed++;
              teamsData[home_id].stats[q].all.pointsFor += homeScore;
              teamsData[home_id].stats[q].home.pointsFor += homeScore;
              teamsData[home_id].stats[q].all.pointsAgainst += awayScore;
              teamsData[home_id].stats[q].home.pointsAgainst += awayScore;

              // Away team
              teamsData[away_id].stats[q].all.gamesPlayed++;
              teamsData[away_id].stats[q].away.gamesPlayed++;
              teamsData[away_id].stats[q].all.pointsFor += awayScore;
              teamsData[away_id].stats[q].away.pointsFor += awayScore;
              teamsData[away_id].stats[q].all.pointsAgainst += homeScore;
              teamsData[away_id].stats[q].away.pointsAgainst += homeScore;
          }
      });

      // Process OT
      let homeOtScore = 0;
      let awayOtScore = 0;
      let playedOt = false;
      ots.forEach(ot => {
          const homeScore = parseInt(game[`home_${ot}`], 10);
          const awayScore = parseInt(game[`away_${ot}`], 10);
          if (!isNaN(homeScore) && !isNaN(awayScore)) {
              playedOt = true;
              homeOtScore += homeScore;
              awayOtScore += awayScore;
          }
      });

      if (playedOt) {
          // Home team
          teamsData[home_id].stats['ot'].all.gamesPlayed++;
          teamsData[home_id].stats['ot'].home.gamesPlayed++;
          teamsData[home_id].stats['ot'].all.pointsFor += homeOtScore;
          teamsData[home_id].stats['ot'].home.pointsFor += homeOtScore;
          teamsData[home_id].stats['ot'].all.pointsAgainst += awayOtScore;
          teamsData[home_id].stats['ot'].home.pointsAgainst += awayOtScore;

          // Away team
          teamsData[away_id].stats['ot'].all.gamesPlayed++;
          teamsData[away_id].stats['ot'].away.gamesPlayed++;
          teamsData[away_id].stats['ot'].all.pointsFor += awayOtScore;
          teamsData[away_id].stats['ot'].away.pointsFor += awayOtScore;
          teamsData[away_id].stats['ot'].all.pointsAgainst += homeOtScore;
          teamsData[away_id].stats['ot'].away.pointsAgainst += homeOtScore;
      }
    }

    return NextResponse.json(Object.values(teamsData));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load quarter standings data' }, { status: 500 });
  }
}
