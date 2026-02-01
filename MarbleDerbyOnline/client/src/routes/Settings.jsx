import React from 'react'
import { Cards, Card } from '../styles/LandingPage.styles'
import { CardDisplay as GhostCardDisplay }  from "../components/characters/Ghost";

export default function Settings() {
  return (
    <>
      <Cards>
        <Card>
          <h3>Account</h3>
          <p>Manage your account settings, profile information, and preferences.</p>
        </Card>

        <Card>
          <h3>3D Ghost Character 👻</h3>
          <p>Classic ghost with floating animation</p>
          <GhostCardDisplay height="250px" />
        </Card>

        <Card>
          <h3>Privacy</h3>
          <p>Control your data sharing and privacy settings.</p>
        </Card>

        <Card className="large">
          <h3>Appearance</h3>
          <p>Customize theme, layout, and display preferences to match your workflow.</p>
        </Card>
      </Cards>
    </>
  )
}
