import React from 'react'
import { Cards, Card } from '../styles/LandingPage.styles'

export default function TokenShop() {
  return (
    <>
      <Cards>
        <Card>
          <h3>Token Shop</h3>
          <p>Purchase tokens to unlock new features and characters</p>
        </Card>

        <Card>
          <h3>100 Tokens</h3>
          <p>$4.99</p>
        </Card>

        <Card>
          <h3>500 Tokens</h3>
          <p>$19.99</p>
        </Card>

        <Card>
          <h3>1000 Tokens</h3>
          <p>$34.99</p>
        </Card>
      </Cards>
    </>
  )
}
