import React, { createContext, useContext, useMemo, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SocketManagerContext = createContext(null);

export function SocketProvider({ children }) {
  const socketsRef = useRef(new Map());
  // Track last access time for garbage collection
  const lastAccessTimeRef = useRef(new Map());
  const STALE_SOCKET_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  const acquireSocket = useCallback((name = "default", serverUrl = "http://localhost:5000") => {
    const key = name || "default";
    let entry = socketsRef.current.get(key);

    if (entry) {
      // Socket already exists - reuse it
      if (!entry.socket.connected) {
        // Socket is disconnected, try to reconnect
        console.log(`Reconnecting to existing socket '${key}'`);
        entry.socket.connect();
      }
      entry.refCount += 1;
      lastAccessTimeRef.current.set(key, Date.now());
      console.log(`Reusing socket '${key}' (refCount: ${entry.refCount})`);
      return entry.socket;
    }

    // No socket exists, create a new one
    const socket = io(serverUrl);
    entry = { socket, refCount: 1, serverUrl, createdAt: Date.now() };
    socketsRef.current.set(key, entry);
    lastAccessTimeRef.current.set(key, Date.now());
    console.log(`Created new socket '${key}'`);
    return socket;
  }, []);

  const releaseSocket = useCallback((name = "default") => {
    const key = name || "default";
    const entry = socketsRef.current.get(key);
    if (!entry) return;

    entry.refCount -= 1;
    lastAccessTimeRef.current.set(key, Date.now());

    // Keep socket in Map even when refCount reaches 0 for potential reuse
    if (entry.refCount <= 0) {
      console.log(`Socket '${key}' released and idle (refCount: 0). Will be garbage collected if unused.`);
      
      // Clean up listeners but don't disconnect yet - allows reuse on reconnection
      entry.socket.removeAllListeners();
    }
  }, []);

  // Garbage collect stale sockets (unused for 5+ minutes)
  const garbageCollectStaleSocket = useCallback((key) => {
    const entry = socketsRef.current.get(key);
    const lastAccessTime = lastAccessTimeRef.current.get(key);
    
    if (entry && lastAccessTime && entry.refCount <= 0) {
      const timeSinceLastAccess = Date.now() - lastAccessTime;
      
      if (timeSinceLastAccess > STALE_SOCKET_TIMEOUT) {
        console.log(`Garbage collecting stale socket '${key}' (idle for ${Math.round(timeSinceLastAccess / 1000)}s)`);
        entry.socket.disconnect();
        entry.socket.removeAllListeners();
        socketsRef.current.delete(key);
        lastAccessTimeRef.current.delete(key);
      }
    }
  }, []);

  // Optional: expose garbage collection for manual cleanup
  const cleanupStaleConnections = useCallback(() => {
    const now = Date.now();
    for (const [key, lastAccessTime] of lastAccessTimeRef.current.entries()) {
      if (now - lastAccessTime > STALE_SOCKET_TIMEOUT) {
        garbageCollectStaleSocket(key);
      }
    }
  }, [garbageCollectStaleSocket]);

  const value = useMemo(
    () => ({ acquireSocket, releaseSocket, cleanupStaleConnections }),
    [acquireSocket, releaseSocket, cleanupStaleConnections]
  );

  return (
    <SocketManagerContext.Provider value={value}>
      {children}
    </SocketManagerContext.Provider>
  );
}

export function useSocketManager() {
  const ctx = useContext(SocketManagerContext);
  if (!ctx) {
    throw new Error("useSocketManager must be used within a SocketProvider");
  }
  return ctx;
}
