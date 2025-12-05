import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

interface EloRow {
  team: string;
  elo_final: string;
  wins: string;
  losses: string;
  games: string;
}

interface EloRecord {
  team: string;
  elo: number;
  wins: number;
  losses: number;
  games: number;
  winPct: number;
}

export async function GET() {
  try {
    const csvFilePath = path.join(process.cwd(), '..', 'data', 'nba_elo_ranking_2025.csv');
    const csvFile = fs.readFileSync(csvFilePath, 'utf8');

    const parsedCsv = Papa.parse<EloRow>(csvFile, {
      header: true,
      skipEmptyLines: true,
    });

    const rankings: EloRecord[] = parsedCsv.data
      .filter((row) => row.team)
      .map((row) => {
        const wins = Number(row.wins) || 0;
        const games = Number(row.games) || 0;
        return {
          team: row.team,
          elo: Number(row.elo_final) || 0,
          wins,
          losses: Number(row.losses) || 0,
          games,
          winPct: games > 0 ? wins / games : 0,
        };
      })
      .sort((a, b) => b.elo - a.elo);

    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error reading ELO rankings:', error);
    return NextResponse.json({ error: 'Failed to load ELO rankings' }, { status: 500 });
  }
}
