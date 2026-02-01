
import { useGameStore } from "../../stores/gameStore";

// Helper to get latency color based on ping
function getLatencyColor(latency) {
  if (!latency) return '#888';
  if (latency < 50) return '#4caf50'; // Green - excellent
  if (latency < 100) return '#8bc34a'; // Light green - good
  if (latency < 150) return '#ffc107'; // Yellow - moderate
  if (latency < 250) return '#ff9800'; // Orange - poor
  return '#f44336'; // Red - very poor
}

export function ConnectionStatusOverlay({ isConnected, message, sendMessage, measureLatency, socket, clientId }) {

  const otherEntities = useGameStore((state) => state.otherEntities);
  const myEntities = useGameStore((state) => state.myEntities);
  const playerLatencies = useGameStore((state) => state.playerLatencies);
  const currentSocketId = socket?.id;
  const currentLatency = currentSocketId ? playerLatencies[currentSocketId] : null;

  // We filter out our own player entity from myEntities for the NPC section
  const yourNpcs = Object.entries(myEntities).filter(([key, entity]) => entity.entityType !== 'player');

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      background: 'rgba(30,30,30,0.95)',
      color: '#fff',
      padding: '16px 24px',
      borderRadius: '10px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      zIndex: 1000,
      minWidth: 280,
      maxHeight: '80vh',
      overflowY: 'auto',
      fontFamily: 'inherit',
      fontSize: 15,
      lineHeight: 1.5
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
        Connection status: <span style={{ color: isConnected ? '#4caf50' : '#f44336' }}>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
      
      {/* Current Player Info */}
      {currentSocketId && (
        <div style={{ marginTop: 8, fontSize: 13, padding: '10px', background: 'rgba(76, 175, 80, 0.15)', borderRadius: '5px', borderLeft: '3px solid #4caf50' }}>
          <div style={{ fontWeight: 'bold', color: '#4caf50', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>You (Player)</span>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              color: getLatencyColor(currentLatency),
              background: 'rgba(0,0,0,0.3)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              {currentLatency ? `${currentLatency}ms` : '...'}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#ccc' }}>
            Socket: {currentSocketId.slice(0, 8)}...
          </div>
          <div style={{ fontSize: 11, color: '#ccc' }}>
            Client: {clientId?.slice(0, 16)}...
          </div>
        </div>
      )}

      {/* Your NPCs Info */}
      {yourNpcs.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 4 }}>
            Your NPCs ({yourNpcs.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {yourNpcs.map(([entityKey, entity]) => (
              <div 
                key={entityKey} 
                style={{ 
                  padding: '10px',
                  background: 'rgba(255, 152, 0, 0.15)',
                  borderRadius: '5px',
                  borderLeft: '3px solid #ff9800'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#ff9800', fontSize: '13px', marginBottom: 6 }}>
                  [{entity.entityType}] {entityKey.split(':')[1] || entityKey.slice(0, 8)}
                </div>
                <div style={{ fontSize: 11, color: '#aaa' }}>
                  Pos: {entity.position 
                    ? `(${entity.position.x.toFixed(1)}, ${entity.position.y.toFixed(1)}, ${entity.position.z.toFixed(1)})` 
                    : 'awaiting...'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: 12, fontSize: 14 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 4 }}>
          Other Players ({Object.keys(otherEntities).length})
        </div>
        {Object.keys(otherEntities).length === 0 ? (
          <div style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
            No other players
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(otherEntities).map(([entityKey, entity]) => {
              const entityLatency = playerLatencies[entity.socketId];
              return (
                <div 
                  key={entityKey} 
                  style={{ 
                    padding: '10px',
                    background: entity.entityType === 'player' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                    borderRadius: '5px',
                    borderLeft: `3px solid ${entity.entityType === 'player' ? '#4caf50' : '#ff9800'}`
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 6
                  }}>
                    <div style={{ 
                      fontWeight: 'bold',
                      color: entity.entityType === 'player' ? '#4caf50' : '#ff9800',
                      fontSize: '13px'
                    }}>
                      [{entity.entityType}] {entity.socketId?.slice(0, 8)}
                    </div>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: 'bold',
                      color: getLatencyColor(entityLatency),
                      background: 'rgba(0,0,0,0.3)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      minWidth: '55px',
                      textAlign: 'center'
                    }}>
                      {entityLatency ? `${entityLatency}ms` : '-'}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>
                    Pos: {entity.position 
                      ? `(${entity.position.x.toFixed(1)}, ${entity.position.y.toFixed(1)}, ${entity.position.z.toFixed(1)})` 
                      : 'awaiting...'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}