"use client";
import { useState, useEffect } from 'react';
import { Table, Tabs, Tab, ButtonGroup, Button } from 'react-bootstrap';
import { getSelectedTeamIds } from '../utils/localStorage';

interface TeamRecord {
  wins: number;
  losses: number;
}

interface Team {
  id: string;
  name: string;
  market: string;
  alias: string;
  wins: number;
  losses: number;
  win_pct: number;
  games_behind: {
    conference: number;
  };
  streak: {
    kind: 'win' | 'loss';
    length: number;
  };
  records: {
    home: TeamRecord;
    road: TeamRecord;
  };
}

interface Division {
  teams: Team[];
}

interface Conference {
  name: string;
  divisions: Division[];
}

interface ConferenceViewModel {
  name: string;
  teams: Team[];
}

function StandingsTable({ teams, recordType }: { teams: Team[], recordType: 'all' | 'home' | 'road' }) {
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

  const getRecord = (team: Team): TeamRecord => {
    if (recordType === 'home') {
      return team.records.home;
    }
    if (recordType === 'road') {
      return team.records.road;
    }
    return { wins: team.wins, losses: team.losses };
  };

  const sortedTeams = [...teams].sort((a, b) => {
    const recordA = getRecord(a);
    const recordB = getRecord(b);
    const winPctA = recordA.wins / (recordA.wins + recordA.losses) || 0;
    const winPctB = recordB.wins / (recordB.wins + recordB.losses) || 0;
    return winPctB - winPctA;
  });

  return (
    <Table striped bordered hover variant="dark">
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>Played</th>
          <th>Wins</th>
          <th>Losses</th>
          <th>%</th>
          {recordType === 'all' && <th>Streak</th>}
        </tr>
      </thead>
      <tbody>
        {sortedTeams.map((team, index) => {
          const record = getRecord(team);
          const winPct = recordType === 'all'
            ? team.win_pct
            : (record.wins / (record.wins + record.losses) || 0);
          const streak = team.streak ? `${team.streak.kind.charAt(0).toUpperCase()}${team.streak.length}` : '-';
          
          const isHome = team.id === selectedHomeTeamId;
          const isAway = team.id === selectedAwayTeamId;
          const rowClassName = isHome || isAway ? 'table-info' : '';

          return (
            <tr key={team.id} className={rowClassName}>
              <td>{index + 1}</td>
              <td>{`${team.market} ${team.name}`}</td>
              <td>{record.wins + record.losses}</td>
              <td>{record.wins}</td>
              <td>{record.losses}</td>
              <td>{(winPct * 100).toFixed(1)}%</td>
              {recordType === 'all' && <td>{streak}</td>}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

export default function StandingsPage() {
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [conferences, setConferences] = useState<ConferenceViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'general' | 'conference'>('conference');
  const [recordType, setRecordType] = useState<'all' | 'home' | 'road'>('all');

  useEffect(() => {
    document.title = "Standings - NBA - Edge Finder";
    const fetchStandings = async () => {
      try {
        const response = await fetch('/api/standings');
        if (!response.ok) {
          throw new Error('Failed to fetch standings');
        }
        const data = await response.json();

        const processTeam = (team: any): Team => {
          const homeRecord = team.records.find((r: any) => r.record_type === 'home') || { wins: 0, losses: 0 };
          const roadRecord = team.records.find((r: any) => r.record_type === 'road') || { wins: 0, losses: 0 };
          return {
            ...team,
            records: {
              home: { wins: homeRecord.wins, losses: homeRecord.losses },
              road: { wins: roadRecord.wins, losses: roadRecord.losses },
            },
          };
        };

        const allTeamsProcessed: Team[] = data.conferences
          .flatMap((conf: any) => conf.divisions.flatMap((div: any) => div.teams))
          .map(processTeam);

        const conferenceViewModels: ConferenceViewModel[] = data.conferences.map((conf: any) => ({
          name: conf.name,
          teams: conf.divisions.flatMap((div: any) => div.teams).map(processTeam)
        }));

        setAllTeams(allTeamsProcessed);
        setConferences(conferenceViewModels);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch standings';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h1 className="mb-4">NBA Standings</h1>

      <ButtonGroup className="mb-3">
        <Button variant={view === 'conference' ? 'primary' : 'secondary'} onClick={() => setView('conference')}>Conference</Button>
        <Button variant={view === 'general' ? 'primary' : 'secondary'} onClick={() => setView('general')}>General</Button>
      </ButtonGroup>

      <ButtonGroup className="mb-3 ms-3">
        <Button variant={recordType === 'all' ? 'primary' : 'secondary'} onClick={() => setRecordType('all')}>All Games</Button>
        <Button variant={recordType === 'home' ? 'primary' : 'secondary'} onClick={() => setRecordType('home')}>Home</Button>
        <Button variant={recordType === 'road' ? 'primary' : 'secondary'} onClick={() => setRecordType('road')}>Away</Button>
      </ButtonGroup>

      {view === 'conference' ? (
        <Tabs defaultActiveKey="EASTERN CONFERENCE" id="standings-tabs" className="mb-3">
          {conferences.map((conference) => (
            <Tab eventKey={conference.name} title={conference.name} key={conference.name}>
              <StandingsTable teams={conference.teams} recordType={recordType} />
            </Tab>
          ))}
        </Tabs>
      ) : (
        <StandingsTable teams={allTeams} recordType={recordType} />
      )}
    </div>
  );
}
