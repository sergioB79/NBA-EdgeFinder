"use client";
import { useEffect, useState } from 'react';
import { Table, Alert } from 'react-bootstrap';
import { getSelectedTeamIds, getNicknameFromAlias, getFullNameFromAlias } from '../utils/localStorage';

interface EloRecord {
  team: string;
  elo: number;
  wins: number;
  losses: number;
  games: number;
  winPct: number;
}

export default function NbaEloPage() {
  const [rankings, setRankings] = useState<EloRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHomeTeamName, setSelectedHomeTeamName] = useState<string | null>(null);
  const [selectedAwayTeamName, setSelectedAwayTeamName] = useState<string | null>(null);
  const [selectedHomeTeamNickname, setSelectedHomeTeamNickname] = useState<string | null>(null);
  const [selectedAwayTeamNickname, setSelectedAwayTeamNickname] = useState<string | null>(null);
  const [selectedHomeTeamAlias, setSelectedHomeTeamAlias] = useState<string | null>(null);
  const [selectedAwayTeamAlias, setSelectedAwayTeamAlias] = useState<string | null>(null);

  useEffect(() => {
    document.title = "NBA ELO - NBA - Edge Finder";
    const fetchEloRankings = async () => {
      try {
        const response = await fetch('/api/nba-elo');
        if (!response.ok) {
          throw new Error('Failed to fetch ELO rankings');
        }
        const data = await response.json();
        setRankings(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch ELO rankings';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchEloRankings();
  }, []);

  useEffect(() => {
    const updateSelectedTeams = () => {
      const {
        homeTeamName,
        awayTeamName,
        homeTeamNickname,
        awayTeamNickname,
        homeTeamAlias,
        awayTeamAlias,
      } = getSelectedTeamIds();
      setSelectedHomeTeamName(homeTeamName);
      setSelectedAwayTeamName(awayTeamName);
      setSelectedHomeTeamNickname(homeTeamNickname);
      setSelectedAwayTeamNickname(awayTeamNickname);
      setSelectedHomeTeamAlias(homeTeamAlias);
      setSelectedAwayTeamAlias(awayTeamAlias);
    };

    updateSelectedTeams();
    window.addEventListener('storage', updateSelectedTeams);
    window.addEventListener('focus', updateSelectedTeams);
    return () => {
      window.removeEventListener('storage', updateSelectedTeams);
      window.removeEventListener('focus', updateSelectedTeams);
    };
  }, []);

  if (loading) {
    return <p>Loading ELO rankings...</p>;
  }

  if (error) {
    return <Alert variant="danger">Error: {error}</Alert>;
  }

  return (
    <div>
      <h1 className="mb-3">NBA ELO Rankings</h1>
      <p className="text-muted mb-4">
        Ratings snapshot derived from the precomputed dataset for the 2025 season.
      </p>

      <Table striped bordered hover variant="dark" responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>ELO</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Games</th>
            <th>Win %</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((team, index) => {
            const normalize = (value: string | null) =>
              (value || '').toLowerCase().replace(/[^a-z]/g, '');
            const normalizedTeam = normalize(team.team);
            const homeCandidates = [
              normalize(selectedHomeTeamNickname),
              normalize(getNicknameFromAlias(selectedHomeTeamAlias)),
              normalize(getFullNameFromAlias(selectedHomeTeamAlias)),
              normalize(selectedHomeTeamName),
            ].filter(Boolean);
            const awayCandidates = [
              normalize(selectedAwayTeamNickname),
              normalize(getNicknameFromAlias(selectedAwayTeamAlias)),
              normalize(getFullNameFromAlias(selectedAwayTeamAlias)),
              normalize(selectedAwayTeamName),
            ].filter(Boolean);

            const isHomeMatch = homeCandidates.some((candidate) => candidate === normalizedTeam);
            const isAwayMatch = awayCandidates.some((candidate) => candidate === normalizedTeam);
            const rowClassName = isHomeMatch || isAwayMatch ? 'table-info' : '';

            return (
              <tr key={team.team} className={rowClassName}>
                <td>{index + 1}</td>
                <td>{team.team}</td>
                <td>{team.elo.toFixed(1)}</td>
                <td>{team.wins}</td>
                <td>{team.losses}</td>
                <td>{team.games}</td>
                <td>{(team.winPct * 100).toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
