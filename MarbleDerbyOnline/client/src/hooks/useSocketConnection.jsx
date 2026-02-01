import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../stores/gameStore";
import { useSocketManager } from "../providers/SocketProvider";

// Generate or retrieve persistent client ID
function getOrCreateClientId() {
  const storageKey = "game_client_id";
  let clientId = localStorage.getItem(storageKey);
  if (!clientId) {
    clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(storageKey, clientId);
  }
  return clientId;
}

// Singleton client ID for this browser session
export const CLIENT_ID = getOrCreateClientId();

/**
 * Custom hook for managing socket.io connection and multiplayer state
 * @param {string|object} args - Optional name or options object
 * @returns {Object} Socket connection state and utilities
 */
export function useSocketConnection(args = {}) {
  const { acquireSocket, releaseSocket } = useSocketManager();

  // Always use a single "game" connection internally for efficiency
  // The "name" parameter is used as entityType for batched updates
  const connectionKey = "game";
  let entityType = "player";
  let serverUrl = "http://localhost:5000";
  let environmentId = "default";
  
  if (typeof args === "string") {
    entityType = args || entityType;
  } else if (args && typeof args === "object") {
    entityType = args.name || entityType;
    serverUrl = args.serverUrl || serverUrl;
    environmentId = args.environmentId || environmentId;
  }

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState(null);

  // Zustand store actions
  const setCurrentPlayerId = useGameStore((state) => state.setCurrentPlayerId);
  const setOtherEntities = useGameStore((state) => state.setOtherEntities);
  const setMyEntities = useGameStore((state) => state.setMyEntities);
  const updateEntityPosition = useGameStore((state) => state.updateEntityPosition);
  const updateMyEntityPosition = useGameStore((state) => state.updateMyEntityPosition);
  const removeEntitiesByClientId = useGameStore((state) => state.removeEntitiesByClientId);
  const setPlayerLatency = useGameStore((state) => state.setPlayerLatency);
  const removePlayerLatency = useGameStore((state) => state.removePlayerLatency);

  useEffect(() => {
    const socket = acquireSocket(connectionKey, serverUrl);
    socketRef.current = socket;

    // Reflect current connection state immediately
    setIsConnected(socket.connected);

    // Define event listeners
    function onConnect() {
      setIsConnected(true);
      console.log("Connected to websocket server");
      // Send clientId to server for persistent entity identification
      socket.emit("registerClient", { clientId: CLIENT_ID, environmentId });
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log("Disconnected from server");
    }

    function onReceiveMessage(value) {
      setMessage(value);
      console.log("Received message:", value);
    }

    function onWelcome(data) {
      console.log("Server says:", data.message);
    }

    function onPlayerId(playerId) {
      console.log("Your player ID:", playerId);
      setCurrentPlayerId(playerId);
    }

    function onOtherEntities(entities) {
      console.log("All entities from server:", entities);
      
      // Separating logic:
      // otherEntities = only stuff from other clients
      // myEntities = stuff belonging to us
      const others = {};
      const mine = {};

      Object.entries(entities).forEach(([key, entity]) => {
        if (key.startsWith(`${CLIENT_ID}:`)) {
          mine[key] = entity;
        } else {
          others[key] = entity;
        }
      });

      console.log("Number of other entities:", Object.keys(others).length);
      console.log("Number of my entities:", Object.keys(mine).length);
      
      setOtherEntities(others);
      setMyEntities(mine);
    }

    function onNewPlayer(playerData) {
      console.log("New player connected:", playerData.id);
      // Entity will be created when they send their first entityUpdate
    }

    function onEntityMoved(entityData) {
      // Direct update to appropriate store slice
      if (entityData.clientId === CLIENT_ID) {
        updateMyEntityPosition(
          entityData.id,
          entityData.socketId,
          entityData.entityType,
          entityData.position,
          entityData.rotation
        );
      } else {
        updateEntityPosition(
          entityData.id,
          entityData.socketId,
          entityData.entityType,
          entityData.position,
          entityData.rotation
        );
      }
    }

    function onServerEntityState(entityData) {
      // Handle server-controlled NPC updates only
      // Player reconciliation now uses a separate "playerReconciliation" event
      updateEntityPosition(
        entityData.id,
        "SERVER",
        entityData.entityType,
        entityData.position,
        entityData.rotation,
        entityData.radius
      );
    }

    function onPlayerReconciliation(entityData) {
      // Handle authoritative server state for our own player (client reconciliation)
      // This is sent only to us, so no filtering needed
      updateMyEntityPosition(
        entityData.id,
        entityData.socketId,
        entityData.entityType || "player",
        entityData.position,
        entityData.rotation
      );
    }

    function onPlayerDisconnected(clientId) {
      console.log("Player disconnected:", clientId);
      
      // Find and remove latency entries for this client's entities before removing them
      const otherEntities = useGameStore.getState().otherEntities;
      Object.entries(otherEntities).forEach(([key, entity]) => {
        if (key.startsWith(`${clientId}:`) && entity.socketId) {
          removePlayerLatency(entity.socketId);
        }
      });
      
      removeEntitiesByClientId(clientId);
    }

    function onCollision(collisionData) {
      console.log("Collision detected:", collisionData);
      // Collision will be applied by Rapier's physics system
      // This is for game logic (sounds, effects, etc.)
    }

    function onPong(timestamp) {
      const latency = Date.now() - timestamp;
      setPlayerLatency(socket.id, latency);
      //console.log(`Latency to server: ${latency}ms`);
      
      // Send latency to server for broadcasting to other players
      socket.emit('latencyUpdate', latency);
    }

    function onPlayerLatencies(latenciesObject) {
      // Update all player latencies at once
      //console.log("Received latencies for all players:", latenciesObject);
      Object.entries(latenciesObject).forEach(([socketId, latency]) => {
        setPlayerLatency(socketId, latency);
      });
    }

    // Register listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message", onReceiveMessage);
    socket.on("welcome", onWelcome);
    socket.on("playerId", onPlayerId);
    socket.on("otherEntities", onOtherEntities);
    socket.on("newPlayer", onNewPlayer);
    socket.on("entityMoved", onEntityMoved);
    socket.on("serverEntityState", onServerEntityState);
    socket.on("playerReconciliation", onPlayerReconciliation);
    socket.on("playerDisconnected", onPlayerDisconnected);
    socket.on("collision", onCollision);
    socket.on("pong", onPong);
    socket.on("playerLatencies", onPlayerLatencies);

    // Measure latency periodically (every 2 seconds)
    const latencyInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', Date.now());
      }
    }, 2000);

    // Cleanup function
    return () => {
      clearInterval(latencyInterval);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message", onReceiveMessage);
      socket.off("welcome", onWelcome);
      socket.off("playerId", onPlayerId);
      socket.off("otherEntities", onOtherEntities);
      socket.off("newPlayer", onNewPlayer);
      socket.off("entityMoved", onEntityMoved);
      socket.off("serverEntityState", onServerEntityState);
      socket.off("playerReconciliation", onPlayerReconciliation);
      socket.off("playerDisconnected", onPlayerDisconnected);
      socket.off("collision", onCollision);
      socket.off("pong", onPong);
      socket.off("playerLatencies", onPlayerLatencies);
      releaseSocket(connectionKey);
    };
  }, [
    acquireSocket,
    releaseSocket,
    connectionKey,
    serverUrl,
    setCurrentPlayerId,
    setOtherEntities,
    updateEntityPosition,
    removeEntitiesByClientId,
    setPlayerLatency,
    removePlayerLatency,
  ]);

  // Utility function to send messages
  const sendMessage = (msg) => {
    if (socketRef.current) {
      socketRef.current.emit('message', msg);
    }
  };

  // Utility function to measure latency
  const measureLatency = () => {
    if (socketRef.current) {
      socketRef.current.emit('ping', Date.now());
    }
  };

  // Utility function for batched entity updates
  // Sends position/rotation with entityType for server to distinguish
  const emitEntityUpdate = (data) => {
    if (socketRef.current) {
      socketRef.current.emit('entityUpdate', {
        clientId: CLIENT_ID,
        entityType,
        ...data,
      });
    }
  };

  // Expose socket for direct access if needed
  const getSocket = () => socketRef.current;

  return {
    socketRef: socketRef,
    socket: socketRef.current,
    clientId: CLIENT_ID,
    entityType,
    environmentId,
    isConnected,
    message,
    sendMessage,
    measureLatency,
    emitEntityUpdate,
    getSocket,
  };
}
