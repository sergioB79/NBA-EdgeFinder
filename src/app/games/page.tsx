"use client";
import { useState, useEffect } from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import CountdownTimer from '../components/CountdownTimer';
import { useRouter } from 'next/navigation'; // Added
import { getNicknameFromAlias } from '../utils/localStorage';

interface Game {
  id: string;
  title: string;
  home: { id: string; name: string; alias: string; };
  away: { id: string; name: string; alias: string; };
  venue: { name: string; city: string; state: string; };
  scheduled: string;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const router = useRouter(); // Added

  useEffect(() => {
    document.title = "Upcoming Games - NBA - Edge Finder";
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/games-today');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setGames(data.games);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
    const storedId = localStorage.getItem('selectedGameId');
    if (storedId) setSelectedGameId(storedId);

    const syncSelection = () => {
      const id = localStorage.getItem('selectedGameId');
      setSelectedGameId(id);
    };
    window.addEventListener('storage', syncSelection);
    window.addEventListener('focus', syncSelection);
    return () => {
      window.removeEventListener('storage', syncSelection);
      window.removeEventListener('focus', syncSelection);
    };
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  const handleCardClick = (game: Game) => {
    const homeNickname = getNicknameFromAlias(game.home.alias) || game.home.name;
    const awayNickname = getNicknameFromAlias(game.away.alias) || game.away.name;

    localStorage.setItem('selectedGameId', game.id);
    setSelectedGameId(game.id);
    localStorage.setItem('selectedHomeTeamId', game.home.id);
    localStorage.setItem('selectedHomeTeamAlias', game.home.alias);
    localStorage.setItem('selectedAwayTeamId', game.away.id);
    localStorage.setItem('selectedAwayTeamAlias', game.away.alias);
    localStorage.setItem('selectedHomeTeamName', game.home.name);
    localStorage.setItem('selectedAwayTeamName', game.away.name);
    localStorage.setItem('selectedHomeTeamNickname', homeNickname);
    localStorage.setItem('selectedAwayTeamNickname', awayNickname);
    router.push(`/analysis?gameId=${game.id}`);
  };

  return (
    <main>
      <h1 className="mb-4">Upcoming Games</h1>
      <Row>
        {games.map((game) => (
          <Col key={game.id} md={4} className="mb-4">
            <div onClick={() => handleCardClick(game)} style={{ cursor: 'pointer' }}>
              <Card
                bg="dark"
                text="white"
                border={game.id === selectedGameId ? "info" : "light"}
                className={game.id === selectedGameId ? "shadow selected-game-card" : ""}
              >
                <Card.Header as="h5">{game.title}</Card.Header>
                <Card.Body>
                  <Card.Title>{game.away.name} @ {game.home.name}</Card.Title>
                  <Card.Text>
                    <strong>Venue:</strong> {game.venue.name}, {game.venue.city}, {game.venue.state}
                    <br />
                    <strong>Time:</strong> {new Date(game.scheduled).toLocaleTimeString()}
                  </Card.Text>
                  <hr />
                  <CountdownTimer targetDate={game.scheduled} />
                  <hr />
                </Card.Body>
              </Card>
            </div>
          </Col>
        ))}
      </Row>
    </main>
  );
}
