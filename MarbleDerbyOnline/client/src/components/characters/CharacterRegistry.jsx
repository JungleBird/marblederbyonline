import { lazy } from "react";

// Helper to lazy load named exports
const lazyLoad = (importPromise, namedExport) => {
  return lazy(() =>
    importPromise.then((module) => ({ default: module[namedExport] }))
  );
};

export const CharacterRegistry = {
  ghost: {
    component: lazyLoad(import("./Ghost"), "GhostMesh"),
    controlType: "standard",
    colliderType: "hull",
    enabledRotations: [false, true, false],
    description: "A spooky ghost that floats through the environment... or Medjed The Unseen if you prefer.",
  },
  "water-drop": {
    component: lazyLoad(import("./WaterDrop"), "WaterDropMesh"),
    controlType: "standard",
    colliderType: "hull",
    enabledRotations: [false, true, false]
  },
  ball: {
    component: lazyLoad(import("./Ball"), "BallMesh"),
    controlType: "sphere",
    colliderType: "ball",
    enabledRotations: [true, true, true]
  },
  "disco-ball": {
    component: lazyLoad(import("./DiscoBall"), "DiscoBallMesh"),
    controlType: "sphere",
    colliderType: "ball",
    enabledRotations: [true, true, true]
  },
  marble: {
    component: lazyLoad(import("./MarbleBall"), "MarbleBallMesh"),
    controlType: "sphere",
    colliderType: "ball",
    enabledRotations: [true, true, true]
  },
};

// Helper functions
export const getCharacterConfig = (characterId) => {
  return CharacterRegistry[characterId];
};

export const isBallCharacter = (characterId) => {
  const config = CharacterRegistry[characterId];
  return config?.controlType === "sphere";
};
