"use client";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { Container, Nav, Navbar } from "react-bootstrap";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar bg="dark" data-bs-theme="dark" expand="lg">
          <Container>
            <Navbar.Brand href="/">NBA - Edge Finder</Navbar.Brand>
<Navbar.Toggle aria-controls="basic-navbar-nav" />
<Navbar.Collapse id="basic-navbar-nav">
  <Nav className="me-auto">
    <Nav.Link href="/games">Game List</Nav.Link>
    <Nav.Link href="/standings">Standings</Nav.Link>
    <Nav.Link href="/quarter-standings">Quarter Standings</Nav.Link>
    <Nav.Link href="/nba-elo">NBA ELO</Nav.Link>
    <Nav.Link href="/player-info">Player Info</Nav.Link>
    <Nav.Link href="/analysis">Game Analysis</Nav.Link>
    <Nav.Link href="/pro-tips">Pro Tips</Nav.Link>
    <Nav.Link href="/disclaimer">Disclaimer</Nav.Link>
  </Nav>
</Navbar.Collapse>
          </Container>
        </Navbar>
        <Container className="mt-4">
          {children}
        </Container>
        <footer className="bg-dark text-light py-3 mt-4">
          <Container className="text-center small text-secondary">
            Disclaimer: NBA EdgeFinder provides statistical information and experimental projections only. Nothing on this site should be interpreted as betting advice or a guarantee of future performance. Use at your own risk and bet responsibly.
          </Container>
        </footer>
      </body>
    </html>
  );
}
