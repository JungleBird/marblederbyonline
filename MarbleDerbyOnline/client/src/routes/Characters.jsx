import React from "react";
import { useGameStore } from "../stores/gameStore";
import { Cards, Card } from "../styles/LandingPage.styles";
import { CardDisplay as WaterDropCardDisplay } from "../components/characters/WaterDrop";
import { CardDisplay as GhostCardDisplay } from "../components/characters/Ghost";
import { CardDisplay as BallCardDisplay } from "../components/characters/Ball";
import { CardDisplay as DiscoBallCardDisplay } from "../components/characters/DiscoBall";
import { CardDisplay as MarbleCardDisplay } from "../components/characters/MarbleBall";

const CHARACTER_CARDS = [
  {
    id: "ball",
    title: "Ball",
    description: "This is a simple ball.",
    component: BallCardDisplay,
    height: "300px",
    width: "300px",
  },
  {
    id: "water-drop",
    title: "Water Drop",
    description:
      "Interactive 3D water drop built with Three.js and react-three-fiber",
    component: WaterDropCardDisplay,
    height: "300px",
    width: "300px",
  },
  {
    id: "ghost",
    title: "Marshmellow Ghost 👻",
    description: "Classic ghost with floating animation",
    component: GhostCardDisplay,
    height: "300px",
    width: "300px",
  },
  {
    id: "marble",
    title: "Marble",
    description: "A shiny marble with colorful lights",
    component: MarbleCardDisplay,
    height: "300px",
    width: "300px",
  },
];

export default function Characters() {
  const selectedCharacter = useGameStore((state) => state.selectedCharacter);
  const setSelectedCharacter = useGameStore(
    (state) => state.setSelectedCharacter
  );

  return (
    <>
      <Cards>
        {CHARACTER_CARDS.map((card) => {
          const Component = card.component;
          const isSelected = selectedCharacter === card.id;

          return (
            <Card
              key={card.id}
              onClick={() => setSelectedCharacter(card.id)}
              style={{
                cursor: "pointer",
                border: isSelected ? "4px solid #00ced1" : "1px solid #ccc",
                transform: isSelected ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s ease-in-out",
              }}
            >
              <h3>
                {card.title} {isSelected}
              </h3>
              <p>{card.description}</p>
              <div
                style={{
                  width: card.width,
                  height: card.height,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {Component && <Component height={card.height} />}
              </div>
            </Card>
          );
        })}
      </Cards>
    </>
  );
}
