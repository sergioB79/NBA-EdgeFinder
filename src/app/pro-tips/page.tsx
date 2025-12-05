"use client";
import { useEffect } from 'react';
import { Card, Button, Row, Col, Badge } from 'react-bootstrap';

export default function ProTipsPage() {
  useEffect(() => {
    document.title = "Pro Tips - NBA - Edge Finder";
  }, []);

  const benefits = [
    "Projected totals from real quarter-to-quarter volatility — not guesswork.",
    "True Over/Under probability driven by pace and rhythm, not the bookmaker’s line.",
    "Edge Score: 6.0+ means the line is bending in your favour.",
    "Shock Zone Q3/Q4 flags hidden momentum swings and late-game flips.",
    "Early run alerts when a typical “run pattern” starts to form.",
  ];

  const whyItMatters = [
    "Less noise, more clarity — decide fast and confidently.",
    "Danger patterns trigger immediate action so you’re not late.",
    "Simple numbers = instant control and conviction.",
    "Read the game before the market notices.",
  ];

  const proofPoints = [
    { title: "Pace DNA", desc: "Quarter-by-quarter tempo fingerprints to catch runs early." },
    { title: "Volatility Lens", desc: "We price risk from rhythm, not headlines." },
    { title: "Actionable Now", desc: "Clean signal, no jargon — ready to click." },
  ];

  return (
    <div>
      <div className="p-4 rounded-3 mb-4" style={{ background: "linear-gradient(135deg, #111827, #0d6efd 60%, #111827)" }}>
        <Row className="align-items-center gy-3">
          <Col md={8}>
            <Badge bg="warning" text="dark" className="mb-2">PRO</Badge>
            <h1 className="mb-3">EdgeFinder PRO: where the market isn’t looking</h1>
            <p className="lead mb-0">
              We read quarter-by-quarter pace, anticipate runs, and surface value before the line moves.
              It’s premium. It’s surgical. It’s for people who want an unfair edge powered by data the market ignores.
            </p>
          </Col>
          <Col md={4} className="text-md-end text-start">
            <Button variant="light" size="lg" className="me-2 mb-2">SIGN UP</Button>
            <Button variant="outline-light" size="lg" className="mb-2">See how it works</Button>
          </Col>
        </Row>
      </div>

      <Row className="gy-4 mb-4">
        <Col md={6}>
          <Card bg="dark" text="light" className="h-100">
            <Card.Body>
              <Card.Title className="mb-3">What you get</Card.Title>
              <ul className="mb-0">
                {benefits.map((item) => (
                  <li key={item} className="mb-2">✔ {item}</li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card bg="dark" text="light" className="h-100">
            <Card.Body>
              <Card.Title className="mb-3">Why it matters</Card.Title>
              <ul className="mb-0">
                {whyItMatters.map((item) => (
                  <li key={item} className="mb-2">→ {item}</li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="gy-4 mb-4">
        {proofPoints.map((item) => (
          <Col md={4} key={item.title}>
            <Card bg="dark" text="light" className="h-100">
              <Card.Body>
                <Card.Title>{item.title}</Card.Title>
                <Card.Text>{item.desc}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card bg="dark" text="light" className="mt-3">
        <Card.Body className="d-flex flex-column flex-md-row align-items-md-center justify-content-between">
          <div className="mb-3 mb-md-0">
            <Card.Title className="mb-1">Pro Prognostics</Card.Title>
            <Card.Text className="mb-0">Arrives clean, fast, and actionable — every day.</Card.Text>
          </div>
          <Button variant="primary" size="lg">SIGN UP</Button>
        </Card.Body>
      </Card>
    </div>
  );
}
