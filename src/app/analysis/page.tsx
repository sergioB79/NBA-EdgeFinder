"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Row, Col, Table } from 'react-bootstrap';
import { getNicknameFromAlias } from '../utils/localStorage';

// Define interfaces for the data structures
interface DetailedTeamStandings {
  overall: {
    wins: number;
    losses: number;
    win_pct: number;
    conference_games_behind: number;
    conference_rank: number;
    overall_rank: number; // Added
    points_for?: number;
    points_against?: number;
  };
  home: {
    wins: number;
    losses: number;
    win_pct: number;
  };
  away: {
    wins: number;
    losses: number;
    win_pct: number;
  };
}

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

interface PlayerInjury {
  player_name: string;
  status: string;
  desc: string;
}

interface PlayerLeader {
  full_name: string;
  team_alias: string;
  statistics: {
    average: {
      [key: string]: number;
    };
  };
  team_id: string; // Added
}

interface GameTeamAnalysis {
  id: string;
  name: string;
  alias: string;
  standings: DetailedTeamStandings;
  elo_rank?: number | null;
  elo_rating?: number | null;
  form?: {
    last10: { games: number; wins: number; losses: number };
    last5Context: { games: number; wins: number; losses: number };
    last5Days: { games: number; wins: number; losses: number };
  };
  injuries: PlayerInjury[];
  leaders: PlayerLeader[];
  prognostics: TeamPrognostics; // Added
  proPrognostics?: TeamPrognosticsV2; // New regressed-to-mean prognostics
}

interface TotalsProjection {
  variant_simple: {
    home: number;
    away: number;
    total: number;
  };
  variant_elo_adjusted: {
    home: number;
    away: number;
    total: number;
    margin: number;
    base_total: number;
    base_margin: number;
    elo_effect: number;
  };
}

interface GameAnalysisData {
  game: {
    id: string;
    home_name: string;
    away_name: string;
    scheduled: string;
    home_score: string;
    away_score: string;
    venue: { name: string; city: string; state: string; }; // Added venue
    status: string; // Added status
  };
  homeTeam: GameTeamAnalysis;
  awayTeam: GameTeamAnalysis;
  totalsProjection?: TotalsProjection;
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<p>Loading analysis...</p>}>
      <AnalysisContent />
    </Suspense>
  );
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  let gameId = searchParams.get('gameId'); // Use 'let' to allow reassignment

  const [analysisData, setAnalysisData] = useState<GameAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Game Analysis - NBA - Edge Finder";
    if (!gameId) {
      // Try to get gameId from localStorage if not in URL
      gameId = localStorage.getItem('selectedGameId');
    }

    if (!gameId) {
      setError('No game ID provided or found in local storage.');
      setLoading(false);
      return;
    }

    const fetchGameAnalysis = async () => {
      try {
        const response = await fetch(`/api/game-analysis/${gameId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch game analysis data');
        }
        const data = await response.json();
        setAnalysisData(data);

        // Store home and away team IDs in localStorage for other pages
        localStorage.setItem('selectedHomeTeamId', data.homeTeam.id);
        localStorage.setItem('selectedHomeTeamAlias', data.homeTeam.alias);
        localStorage.setItem('selectedAwayTeamId', data.awayTeam.id);
        localStorage.setItem('selectedAwayTeamAlias', data.awayTeam.alias);
        localStorage.setItem('selectedHomeTeamName', data.homeTeam.name);
        localStorage.setItem('selectedAwayTeamName', data.awayTeam.name);
        localStorage.setItem(
          'selectedHomeTeamNickname',
          getNicknameFromAlias(data.homeTeam.alias) || data.homeTeam.name
        );
        localStorage.setItem(
          'selectedAwayTeamNickname',
          getNicknameFromAlias(data.awayTeam.alias) || data.awayTeam.name
        );

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch game analysis data';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchGameAnalysis();
  }, [gameId]); // Depend on gameId, which might change from localStorage

  if (loading) {
    return <p>Loading game analysis...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!analysisData) {
    return <p>No analysis data available for this game.</p>;
  }

  const { game, homeTeam, awayTeam } = analysisData;

  const renderStandingsTable = (team: GameTeamAnalysis, isHomeTeam: boolean) => {
    const standings = team.standings;
    if (!standings) return <p>Standings data not available.</p>;

    const teamSpecificRecord = isHomeTeam ? standings.home : standings.away;

    return (
      <>
        <h6>General Standing (Overall)</h6>
        <Table striped bordered hover variant="dark" size="sm">
          <tbody>
            <tr><td>Rank</td><td>{standings.overall.overall_rank}</td></tr>
            <tr><td>Wins</td><td>{standings.overall.wins}</td></tr>
            <tr><td>Losses</td><td>{standings.overall.losses}</td></tr>
            <tr><td>Win %</td><td>{(standings.overall.win_pct * 100).toFixed(1)}%</td></tr>
          </tbody>
        </Table>

        <h6>Conference Standing</h6>
        <Table striped bordered hover variant="dark" size="sm">
          <tbody>
            <tr><td>Rank</td><td>{standings.overall.conference_rank}</td></tr>
            <tr><td>Games Behind</td><td>{standings.overall.conference_games_behind}</td></tr>
          </tbody>
        </Table>

        {typeof team.elo_rank === 'number' && (
          <>
            <h6>ELO Rank</h6>
            <Table striped bordered hover variant="dark" size="sm">
              <tbody>
                <tr><td>Rank</td><td>{team.elo_rank}</td></tr>
              </tbody>
            </Table>
          </>
        )}

        <h6>{isHomeTeam ? 'Home' : 'Away'} Record</h6>
        <Table striped bordered hover variant="dark" size="sm">
          <tbody>
            <tr><td>Wins</td><td>{teamSpecificRecord.wins}</td></tr>
            <tr><td>Losses</td><td>{teamSpecificRecord.losses}</td></tr>
            <tr><td>Win %</td><td>{(teamSpecificRecord.win_pct * 100).toFixed(1)}%</td></tr>
          </tbody>
        </Table>
      </>
    );
  };

  return (
    <div>
      <h1 className="mb-4">
        {homeTeam.name} vs {awayTeam.name} at {game.venue.name}, {new Date(game.scheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </h1>
      {game.home_score && game.away_score && (
        <p>Final Score: {game.home_name} {game.home_score} - {game.away_name} {game.away_score}</p>
      )}

      <Row className="mb-4">
        {[homeTeam, awayTeam].map((team, index) => (
          <Col md={6} key={team.id}>
            <Card bg="dark" text="white" border="light">
              <Card.Header as="h5">
                {index === 0 ? 'Home' : 'Away'}: {team.name} ({team.alias})
              </Card.Header>
              <Card.Body>
                {renderStandingsTable(team, index === 0)} {/* Pass isHomeTeam based on index */}

                {team.form && (
                  <>
                    <h6 className="mt-3">Recent Form</h6>
                    <Table striped bordered hover variant="dark" size="sm">
                      <tbody>
                        <tr>
                          <td>Last 10</td>
                          <td>{team.form.last10.games} games</td>
                          <td>{team.form.last10.wins}W {team.form.last10.losses}L</td>
                        </tr>
                        <tr>
                          <td>{index === 0 ? 'Last 5 Home' : 'Last 5 Away'}</td>
                          <td>{team.form.last5Context.games} games</td>
                          <td>{team.form.last5Context.wins}W {team.form.last5Context.losses}L</td>
                        </tr>
                        <tr>
                          <td>Last 5 days</td>
                          <td>{team.form.last5Days.games} games</td>
                          <td>{team.form.last5Days.wins}W {team.form.last5Days.losses}L</td>
                        </tr>
                      </tbody>
                    </Table>
                  </>
                )}

                <h6 className="mt-3">Injuries</h6>
                {team.injuries && team.injuries.length > 0 ? (
                  <ul>
                    {team.injuries.map((injury, idx) => (
                      <li key={idx}>{injury.player_name}: {injury.desc} ({injury.status})</li>
                    ))}
                  </ul>
                ) : (
                  <p>No active injuries reported.</p>
                )}

                <h6 className="mt-3">Top Leaders</h6>
                {team.leaders && team.leaders.length > 0 ? (
                  <ul>
                    {team.leaders.map((leader, idx) => (
                      <li key={idx}>{leader.full_name} ({leader.team_alias}): {Object.keys(leader.statistics.average)[0]} - {leader.statistics.average[Object.keys(leader.statistics.average)[0]]?.toFixed(2)}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No players on leaderboards.</p>
                )}

                <h6 className="mt-3">Prognostics</h6>
                <p className="text-secondary small mb-2">Note: Projections are experimental and based on historical data only. They are not betting advice.</p>
                {team.prognostics ? (
                  <Card bg="dark" text="white" border="light" className="mt-2">
                    <Card.Body>
                      {Object.entries(team.prognostics).map(([quarterKey, prognostics]) => (
                        <div key={quarterKey} className="mb-2">
                          <strong>{quarterKey.toUpperCase()}:</strong>
                          <p className="mb-0">Expected For: {prognostics.expected_for.toFixed(2)} (Games: {prognostics.games_count_for})</p>
                          <p className="mb-0">Expected Against: {prognostics.expected_against.toFixed(2)} (Games: {prognostics.games_count_against})</p>
                          <p className="mb-0">Expected Diff: {prognostics.expected_diff.toFixed(2)}</p>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                ) : (
                  <p>Prognostics data not available.</p>
                )}

                <h6 className="mt-3">Pace Prognostics (regressed)</h6>
                <p className="text-secondary small mb-2">Blends team quarter splits with league averages (K=10) for smoother expected pace.</p>
                {team.proPrognostics && team.proPrognostics.byQuarter.length > 0 ? (
                  <Table striped bordered hover variant="dark" size="sm">
                    <thead>
                      <tr>
                        <th>Q</th>
                        <th>Exp For</th>
                        <th>Exp Against</th>
                        <th>Diff</th>
                        <th>Games</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.proPrognostics.byQuarter.map((q) => (
                        <tr key={q.quarter}>
                          <td>{q.quarter}</td>
                          <td>{q.expected_for.toFixed(2)}</td>
                          <td>{q.expected_against.toFixed(2)}</td>
                          <td>{q.expected_diff.toFixed(2)}</td>
                          <td>{q.games}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p>Pace prognostics not available.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {analysisData.totalsProjection && (
        <Row className="mb-4">
          <Col md={12}>
            <Card bg="dark" text="white" border="light">
              <Card.Header as="h5">Total Points Projections</Card.Header>
              <Card.Body>
                <p className="text-secondary small">Variants combining team scoring profiles and ELO tilt (totals stay coherent; ELO only shifts who scores more).</p>
                <Table striped bordered hover variant="dark" responsive size="sm" className="mb-3">
                  <thead>
                    <tr>
                      <th>Variant</th>
                      <th>Home</th>
                      <th>Away</th>
                      <th>Total</th>
                      <th>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Baseline (PF sums)</td>
                      <td>{analysisData.totalsProjection.variant_simple.home.toFixed(2)}</td>
                      <td>{analysisData.totalsProjection.variant_simple.away.toFixed(2)}</td>
                      <td>{analysisData.totalsProjection.variant_simple.total.toFixed(2)}</td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <td>ELO-adjusted</td>
                      <td>{analysisData.totalsProjection.variant_elo_adjusted.home.toFixed(2)}</td>
                      <td>{analysisData.totalsProjection.variant_elo_adjusted.away.toFixed(2)}</td>
                      <td>{analysisData.totalsProjection.variant_elo_adjusted.total.toFixed(2)}</td>
                      <td>{analysisData.totalsProjection.variant_elo_adjusted.margin.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </Table>
                <p className="text-secondary small mb-0">
                  Baseline = PF_home + PF_away. ELO-adjusted uses pace vs defense matchup with ELO tilt (k=0.02 per ELO point).
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
