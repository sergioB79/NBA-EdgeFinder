"use client";
import { useState, useEffect } from 'react';
import { Table, ButtonGroup, Button } from 'react-bootstrap';
import { getSelectedTeamIds } from '../utils/localStorage'; // Added import

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

function QuarterStandingsTable({ teams, quarter, recordType }: { teams: TeamData[], quarter: string, recordType: 'all' | 'home' | 'away' }) {
  const [selectedHomeTeamId, setSelectedHomeTeamId] = useState<string | null>(null);
  const [selectedAwayTeamId, setSelectedAwayTeamId] = useState<string | null>(null);
  const [selectedHomeTeamAlias, setSelectedHomeTeamAlias] = useState<string | null>(null);
  const [selectedAwayTeamAlias, setSelectedAwayTeamAlias] = useState<string | null>(null);

  useEffect(() => {
    const updateHighlightedTeams = () => {
      const { homeTeamId, awayTeamId, homeTeamAlias, awayTeamAlias } = getSelectedTeamIds();
      setSelectedHomeTeamId(homeTeamId);
      setSelectedAwayTeamId(awayTeamId);
      setSelectedHomeTeamAlias(homeTeamAlias);
      setSelectedAwayTeamAlias(awayTeamAlias);
    };

    updateHighlightedTeams(); // Initial load

    window.addEventListener('storage', updateHighlightedTeams); // Listen for storage changes
    window.addEventListener('focus', updateHighlightedTeams); // Listen for window focus

    return () => {
      window.removeEventListener('storage', updateHighlightedTeams); // Clean up
      window.removeEventListener('focus', updateHighlightedTeams); // Clean up
    };
  }, []); // Empty dependency array, runs once on mount and cleans up on unmount
  
  const sortedTeams = [...teams].map(team => {
    const stats = (team.stats && team.stats[quarter]) ? team.stats[quarter][recordType] : { gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0 };
    const diff = stats.pointsFor - stats.pointsAgainst;
    return {
      ...team,
      displayStats: {
        ...stats,
        diff,
        avgFor: stats.gamesPlayed > 0 ? (stats.pointsFor / stats.gamesPlayed) : 0,
        avgAgainst: stats.gamesPlayed > 0 ? (stats.pointsAgainst / stats.gamesPlayed) : 0,
        avgDiff: stats.gamesPlayed > 0 ? ((stats.pointsFor / stats.gamesPlayed) - (stats.pointsAgainst / stats.gamesPlayed)) : 0,
      }
    };
  }).sort((a, b) => b.displayStats.diff - a.displayStats.diff);

  return (
    <Table striped bordered hover variant="dark" responsive>
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>Played</th>
          <th>PF</th>
          <th>PA</th>
          <th>Diff</th>
          <th>Avg. PF</th>
          <th>Avg. PA</th>
          <th>Avg. Diff</th>
        </tr>
      </thead>
      <tbody>
        {sortedTeams.map((team, index) => {
          const isHome = team.id === selectedHomeTeamId;
          const isAway = team.id === selectedAwayTeamId;
          const rowClassName = isHome || isAway ? 'table-info' : '';

          return (
            <tr key={team.id} className={rowClassName}>
              <td>{index + 1}</td>
              <td>{team.name}</td>
              <td>{team.displayStats.gamesPlayed}</td>
              <td>{team.displayStats.pointsFor}</td>
              <td>{team.displayStats.pointsAgainst}</td>
              <td>{team.displayStats.diff}</td>
              <td>{team.displayStats.avgFor.toFixed(2)}</td>
              <td>{team.displayStats.avgAgainst.toFixed(2)}</td>
              <td>{team.displayStats.avgDiff.toFixed(2)}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}


export default function QuarterStandingsPage() {
  const [teamsData, setTeamsData] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordTypes, setRecordTypes] = useState<{ [key: string]: 'all' | 'home' | 'away' }>({
    q1: 'all',
    q2: 'all',
    q3: 'all',
    q4: 'all',
    ot: 'all',
  });

  useEffect(() => {
    document.title = "Quarter Standings - NBA - Edge Finder";
    const fetchQuarterStandings = async () => {
      try {
        const response = await fetch('/api/quarter-standings');
        if (!response.ok) {
          throw new Error('Failed to fetch quarter standings');
        }
        const data = await response.json();
        setTeamsData(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch quarter standings';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuarterStandings();
  }, []);

  const handleRecordTypeChange = (quarter: string, type: 'all' | 'home' | 'away') => {
    setRecordTypes(prev => ({ ...prev, [quarter]: type }));
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  const quarters = [
    { key: 'q1', title: '1st Quarter Standings' },
    { key: 'q2', title: '2nd Quarter Standings' },
    { key: 'q3', title: '3rd Quarter Standings' },
    { key: 'q4', title: '4th Quarter Standings' },
    { key: 'ot', title: 'Overtime Standings' },
  ];

  return (
    <div>
      <h1 className="mb-4">Quarter Standings</h1>
      {quarters.map(({ key, title }) => (
        <div className="mb-5" key={key}>
          <h5 className="mb-3">{title}</h5>
          <ButtonGroup className="mb-3">
            <Button variant={recordTypes[key] === 'all' ? 'primary' : 'secondary'} onClick={() => handleRecordTypeChange(key, 'all')}>All Games</Button>
            <Button variant={recordTypes[key] === 'home' ? 'primary' : 'secondary'} onClick={() => handleRecordTypeChange(key, 'home')}>Home</Button>
            <Button variant={recordTypes[key] === 'away' ? 'primary' : 'secondary'} onClick={() => handleRecordTypeChange(key, 'away')}>Away</Button>
          </ButtonGroup>
          <QuarterStandingsTable teams={teamsData} quarter={key} recordType={recordTypes[key]} />
        </div>
      ))}
    </div>
  );
}
