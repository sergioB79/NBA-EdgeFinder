"use client";
import { useEffect } from 'react';
import { Card } from 'react-bootstrap';

export default function DisclaimerPage() {
  useEffect(() => {
    document.title = "Disclaimer - NBA - Edge Finder";
  }, []);

  return (
    <div>
      <h1 className="mb-4">Disclaimer / Legal Notice</h1>
      <Card bg="dark" text="light" className="mb-4">
        <Card.Body>
          <Card.Title>1. Nature of the content</Card.Title>
          <Card.Text>
            NBA EdgeFinder is a personal project focused on statistical analysis and visualization of NBA data.
            All information shown on this site (averages, rankings, projections, &quot;prognostics&quot;, etc.) is for informational and educational purposes only.
            Nothing on this site constitutes betting advice or betting recommendations, financial or investment advice, or any guarantee of future results or outcomes.
          </Card.Text>
        </Card.Body>
      </Card>

      <Card bg="dark" text="light" className="mb-4">
        <Card.Body>
          <Card.Title>2. User responsibility and risk</Card.Title>
          <Card.Text>
            By using this site, you accept that you do so entirely at your own risk. If you choose to use any data, projection, or &quot;edge&quot; from NBA EdgeFinder to place real-money bets, you take full responsibility for your own decisions, acknowledge that you can lose part or all of the money you stake, and agree that the creator of this project is not responsible for any losses, financial damage, or other consequences resulting from your use of this site.
          </Card.Text>
        </Card.Body>
      </Card>

      <Card bg="dark" text="light" className="mb-4">
        <Card.Body>
          <Card.Title>3. Limitations of data and projections</Card.Title>
          <Card.Text>
            The data used on this site may contain errors, be incomplete, or be delayed. Projections are based on experimental statistical models and historical data. They can be wrong and are affected by many factors outside the control of the author (injuries, rotations, scheduling, coaching decisions, etc.). Therefore, there is no guarantee regarding accuracy or completeness of the data, timeliness or freshness of the information, or future performance of teams, players, or betting markets.
          </Card.Text>
        </Card.Body>
      </Card>

      <Card bg="dark" text="light" className="mb-4">
        <Card.Body>
          <Card.Title>4. Responsible gambling and age restrictions</Card.Title>
          <Card.Text>
            The content of this site is intended for adult users only (18+ or the legal age in your jurisdiction). If you gamble, only bet money you can afford to lose, set clear limits for yourself, and if you feel you are losing control, seek professional help or contact local responsible gambling support lines. If betting or access to this type of content is restricted or illegal in your country or region, you are responsible for complying with the laws that apply to you.
          </Card.Text>
        </Card.Body>
      </Card>

      <Card bg="dark" text="light" className="mb-4">
        <Card.Body>
          <Card.Title>5. No official affiliation</Card.Title>
          <Card.Text>
            NBA EdgeFinder is not affiliated with, sponsored by, or endorsed by the NBA, any NBA team, player, betting operator, or any official organization. All names, logos, and trademarks belong to their respective owners and are used for identification and analytical purposes only.
          </Card.Text>
        </Card.Body>
      </Card>

      <Card bg="dark" text="light" className="mb-4">
        <Card.Body>
          <Card.Title>6. No legal, tax, or professional advice</Card.Title>
          <Card.Text>
            Nothing on this site should be interpreted as legal, tax, or professional financial advice. If you need legal clarity about betting, taxation of winnings, or data usage in your country, you should consult a lawyer, accountant, or other qualified professional.
          </Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
}
