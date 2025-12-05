"use client";
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <Container className="mt-5 text-center">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <Image src="/globe.svg" alt="NBA - Edge Finder Logo" width={150} height={150} className="mb-4" />
          <h1 className="display-4">Welcome to NBA - Edge Finder</h1>
          <p className="lead">
            Your ultimate source for NBA game analysis, real-time standings, player statistics, and expert tips.
          </p>
          <hr className="my-4" />
          <p>
            Dive deep into the data and gain an edge with our comprehensive tools and insights.
          </p>
          <Button href="/games" variant="primary" size="lg">Get Started</Button>
        </Col>
      </Row>

      <Row className="mt-5">
        <Col md={4}>
          <Card bg="dark" text="white" className="mb-4">
            <Card.Body>
              <Card.Title>Real-Time Game Data</Card.Title>
              <Card.Text>
                Follow today's games with live countdowns and essential details.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="dark" text="white" className="mb-4">
            <Card.Body>
              <Card.Title>In-Depth Standings</Card.Title>
              <Card.Text>
                Analyze team performance with filterable standings for home, away, and conference games.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="dark" text="white" className="mb-4">
            <Card.Body>
              <Card.Title>Comprehensive Analysis</Card.Title>
              <Card.Text>
                Explore league leaders, injury reports, and detailed quarter-by-quarter statistics.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
