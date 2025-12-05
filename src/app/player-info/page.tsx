"use client";
import { useState, useEffect } from 'react';
import { Table, Tabs, Tab, Card, Col, Row } from 'react-bootstrap';
import { getSelectedTeamIds } from '../utils/localStorage'; // Added import

// Define interfaces for the data structures
interface Player {
  full_name: string;
  statistics: {
    average: {
      [key: string]: number;
    };
  };
  team_name: string;
  team_alias: string;
  team_id: string; // Added for highlighting
}

interface LeaderCategory {
  leaders: Player[];
}

interface Injury {
  status: string;
  desc: string;
}

interface InjuredPlayer {
  full_name: string;
  injuries: Injury[];
}

interface TeamWithInjuries {
  name: string;
  players: InjuredPlayer[];
  team_id: string; // Added for highlighting
}

interface AnalysisData {
  injuries: { teams: TeamWithInjuries[] };
  leaders: {
    points: Player[];
    assists: Player[];
    rebounds: Player[];
    threePointers: Player[];
  };
}

const LeaderTable = ({ category }: { category: LeaderCategory }) => {
  const [selectedHomeTeamId, setSelectedHomeTeamId] = useState<string | null>(null);
  const [selectedAwayTeamId, setSelectedAwayTeamId] = useState<string | null>(null);

  useEffect(() => {
    const updateHighlightedTeams = () => {
      const { homeTeamId, awayTeamId } = getSelectedTeamIds();
      setSelectedHomeTeamId(homeTeamId);
      setSelectedAwayTeamId(awayTeamId);
    };

    updateHighlightedTeams(); // Initial load

    window.addEventListener('storage', updateHighlightedTeams); // Listen for storage changes
    window.addEventListener('focus', updateHighlightedTeams); // Listen for window focus

    return () => {
      window.removeEventListener('storage', updateHighlightedTeams); // Clean up
      window.removeEventListener('focus', updateHighlightedTeams); // Clean up
    };
  }, []); // Empty dependency array, runs once on mount and cleans up on unmount

  if (!category || !category.leaders || category.leaders.length === 0) {
    return <p>No leader data available for this category.</p>;
  }
  const statKey = Object.keys(category.leaders[0]?.statistics.average || {})[0];
  if (!statKey) {
    return <p>Statistic not available for this category.</p>;
  }
  return (
    <Table striped bordered hover variant="dark">
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>Team</th>
          <th>Stat</th>
        </tr>
      </thead>
      <tbody>
        {category.leaders.map((player, index) => {
          let rowClassName = '';
          if (player.team_id === selectedHomeTeamId) {
            rowClassName = 'table-info';
          } else if (player.team_id === selectedAwayTeamId) {
            rowClassName = 'table-info';
          }

          return (
            <tr key={player.full_name} className={rowClassName}>
              <td>{index + 1}</td>
              <td>{player.full_name}</td>
              <td>{player.team_alias}</td>
              <td>{player.statistics.average[statKey]?.toFixed(2)}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default function PlayerInfoPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHomeTeamId, setSelectedHomeTeamId] = useState<string | null>(null);
  const [selectedAwayTeamId, setSelectedAwayTeamId] = useState<string | null>(null);

  // Effect for fetching analysis data
  useEffect(() => {
    document.title = "Player Info - NBA - Edge Finder";
    const fetchAnalysisData = async () => {
      try {
        const response = await fetch('/api/analysis');
        if (!response.ok) throw new Error('Failed to fetch analysis data');
        const data = await response.json();
        setAnalysisData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysisData();
  }, []); // Runs once on mount

  // Effect for updating highlighted teams from localStorage
  useEffect(() => {
    const updateHighlightedTeams = () => {
      const { homeTeamId, awayTeamId } = getSelectedTeamIds();
      setSelectedHomeTeamId(homeTeamId);
      setSelectedAwayTeamId(awayTeamId);
    };

    updateHighlightedTeams(); // Initial load

    window.addEventListener('storage', updateHighlightedTeams); // Listen for storage changes
    window.addEventListener('focus', updateHighlightedTeams); // Listen for window focus

    return () => {
      window.removeEventListener('storage', updateHighlightedTeams); // Clean up
      window.removeEventListener('focus', updateHighlightedTeams); // Clean up
    };
  }, []); // Runs once on mount and cleans up on unmount

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!analysisData) return <p>No data available.</p>;

  return (
    <div>
      <h1 className="mb-4">Player Info</h1>
      <Tabs defaultActiveKey="leaders" id="player-info-tabs" className="mb-3">
        <Tab eventKey="leaders" title="League Leaders">
          <Tabs defaultActiveKey="points" id="leaders-sub-tabs" className="mb-3">
            <Tab eventKey="points" title="Points"><LeaderTable category={{ leaders: analysisData.leaders.points }} /></Tab>
            <Tab eventKey="assists" title="Assists"><LeaderTable category={{ leaders: analysisData.leaders.assists }} /></Tab>
            <Tab eventKey="rebounds" title="Rebounds"><LeaderTable category={{ leaders: analysisData.leaders.rebounds }} /></Tab>
            <Tab eventKey="threes" title="3-Pointers Made"><LeaderTable category={{ leaders: analysisData.leaders.threePointers }} /></Tab>
          </Tabs>
        </Tab>
        <Tab eventKey="injuries" title="Today's Injuries">
          {analysisData.injuries.teams.length === 0 ? (
            <p>No injuries reported for today.</p>
          ) : (
            <Row>
              {analysisData.injuries.teams.map((team) => {
                let cardClassName = '';
                if (team.team_id === selectedHomeTeamId) {
                  cardClassName = 'border-info table-info';
                } else if (team.team_id === selectedAwayTeamId) {
                  cardClassName = 'border-info table-info';
                }

                return (
                  <Col md={4} key={team.name} className="mb-4">
                    <Card bg="dark" text="white" border="light" className={cardClassName}>
                      <Card.Header as="h5">{team.name}</Card.Header>
                      <Card.Body>
                        {team.players.map((player) => (
                          <div key={player.full_name}>
                            <strong>{player.full_name}</strong>
                            {player.injuries.map((injury, index) => (
                              <p key={index} className="mb-0"><small>({injury.status}) - {injury.desc}</small></p>
                            ))}
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Tab>
      </Tabs>
    </div>
  );
}
