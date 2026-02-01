import { create } from "zustand";

// Initial spawn point for the ghost character
const INITIAL_POSITION = { x: 0, y: 1, z: 0 };
const INITIAL_ROTATION = Math.PI; // 180 degrees

export const useGameStore = create((set) => ({
  // Char state
  charPosition: INITIAL_POSITION,
  charRotation: INITIAL_ROTATION,
  charVelocity: { x: 0, y: 0, z: 0 },

  // Initial values (read-only)
  initialPosition: INITIAL_POSITION,
  initialRotation: INITIAL_ROTATION,

  // Sensor state
  sensorStates: {},
  
  // One-time events state
  triggeredEvents: {},

  // Sensor zone trigger state
  triggeredZones: {},

  // Progress states
  progressStates: {},

  // Character selection state
  selectedCharacter: "ghost",

  // Multiplayer state
  currentPlayerId: null,
  otherEntities: {}, // { [entityKey]: { socketId, entityType, position, rotation } }
  myEntities: {}, // Our own entities as seen by the server { [entityKey]: { socketId, entityType, position, rotation } }
  playerLatencies: {}, // { [socketId]: latencyMs }

  // Actions
  setCharPosition: (p) => set({ charPosition: p }),
  setCharRotation: (r) => set({ charRotation: r }),
  setCharVelocity: (v) => set({ charVelocity: v }),
  setSelectedCharacter: (c) => set({ selectedCharacter: c }),
  setSensorState: (id, isWithin) =>
    set((state) => ({
      sensorStates: { ...state.sensorStates, [id]: isWithin },
    })),
  setEventTriggered: (eventId) => 
    set((state) => ({
      triggeredEvents: { ...state.triggeredEvents, [eventId]: true }
    })),
  setZoneTriggered: (zoneId) =>
    set((state) => ({
      triggeredEvents: { ...state.triggeredEvents, [zoneId]: true },
      triggeredZones: { ...state.triggeredZones, [zoneId]: true },
    })),
  setZoneUntriggered: (zoneId) =>
    set((state) => ({
      triggeredZones: { ...state.triggeredZones, [zoneId]: false },
    })),
  setProgressState: (id, value) =>
    set((state) => ({
      progressStates: { ...state.progressStates, [id]: value },
    })),
  
  // Multiplayer actions
  setCurrentPlayerId: (playerId) => set({ currentPlayerId: playerId }),
  setOtherEntities: (entities) => set({ otherEntities: entities }),
  setMyEntities: (entities) => set({ myEntities: entities }),
  updateMyEntityPosition: (entityKey, socketId, entityType, position, rotation, radius) =>
    set((state) => ({
      myEntities: {
        ...state.myEntities,
        [entityKey]: { socketId, entityType, position, rotation, radius },
      },
    })),
  updateEntityPosition: (entityKey, socketId, entityType, position, rotation, radius) =>
    set((state) => ({
      otherEntities: {
        ...state.otherEntities,
        [entityKey]: { socketId, entityType, position, rotation, radius },
      },
    })),
  removeEntitiesByClientId: (clientId) =>
    set((state) => {
      const filtered = Object.fromEntries(
        Object.entries(state.otherEntities).filter(
          ([key]) => !key.startsWith(`${clientId}:`)
        )
      );
      return { otherEntities: filtered };
    }),
  setPlayerLatency: (socketId, latency) =>
    set((state) => ({
      playerLatencies: {
        ...state.playerLatencies,
        [socketId]: latency,
      },
    })),
  removePlayerLatency: (socketId) =>
    set((state) => {
      const { [socketId]: _, ...rest } = state.playerLatencies;
      return { playerLatencies: rest };
    }),
  // Clean up latencies for all socketIds associated with a clientId
  removeLatenciesBySocketIds: (socketIds) =>
    set((state) => {
      const filtered = Object.fromEntries(
        Object.entries(state.playerLatencies).filter(
          ([key]) => !socketIds.includes(key)
        )
      );
      return { playerLatencies: filtered };
    }),
}));
