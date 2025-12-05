import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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
        team_name: rank.teams[0]?.name || '',
        team_alias: rank.teams[0]?.market || '',
    }));
}

export async function GET() {
  try {
    const injuriesRaw = await readJsonFile('injuries_active.json');
    const leadersRaw = await readJsonFile('leaders_raw.json');

    const transformedInjuries = {
      teams: injuriesRaw.map((team: any) => ({
        name: team.team_name,
        players: team.players.map((player: any) => ({
          full_name: player.player_name,
          injuries: [{
            status: player.status,
            desc: player.desc,
          }],
        })),
      })),
    };

    const analysisData = {
      injuries: transformedInjuries,
      leaders: {
        points: getLeadersByCategory(leadersRaw, 'points', 'points'),
        assists: getLeadersByCategory(leadersRaw, 'assists', 'assists'),
        rebounds: getLeadersByCategory(leadersRaw, 'rebounds', 'rebounds'),
        threePointers: getLeadersByCategory(leadersRaw, 'three_points_made', 'three_points_made'),
      }
    };

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error('Error reading analysis data:', error);
    return NextResponse.json({ message: 'Error reading data file' }, { status: 500 });
  }
}
