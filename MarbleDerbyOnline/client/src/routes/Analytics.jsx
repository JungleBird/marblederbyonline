import React from 'react'
import { Cards, Card } from '../styles/LandingPage.styles'

export default function Analytics() {
  return (
    <>
      <Cards>
        <Card>
          <h3>User Stats</h3>
          <p>Total Users: 1,247 | Active Today: 342</p>
        </Card>

        <Card>
          <h3>Performance</h3>
          <p>Avg Load Time: 1.2s | Response Time: 45ms</p>
        </Card>

        <Card>
          <h3>Engagement</h3>
          <p>Session Duration: 8m 34s | Bounce Rate: 24%</p>
        </Card>

        <Card className="large">
          <h3>Traffic Overview</h3>
          <p>Traffic is up 23% compared to last week. Most popular features: Dashboard (45%), Projects (32%), Analytics (23%).</p>
        </Card>
      </Cards>
    </>
  )
}
