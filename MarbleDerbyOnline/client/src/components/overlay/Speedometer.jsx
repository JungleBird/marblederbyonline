import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

// Component that lives inside Canvas and uses useFrame to calculate speed
export function SpeedUpdater({ rigidBodyRef, speedDisplayRef, positionRefs, sphereRadius = 0 }) {
  const lastReportedSpeedRef = useRef(0);
  const SPEED_THRESHOLD = 0.001;

  useFrame(() => {
    if (rigidBodyRef?.current && speedDisplayRef?.current) {
      const velocity = rigidBodyRef.current.linvel();
      const position = rigidBodyRef.current.translation();
      const newSpeed = Math.sqrt(
        velocity.x * velocity.x +
        velocity.z * velocity.z
      );

      // Only update DOM if change exceeds threshold
      if (Math.abs(newSpeed - lastReportedSpeedRef.current) > SPEED_THRESHOLD) {
        const yPos = (position.y - sphereRadius + 0.02) + 0; // Adding +0 converts -0.0 to 0.0
        speedDisplayRef.current.textContent = `${newSpeed.toFixed(2)} units/s`;
        
        // Update individual position refs safely
        if (positionRefs?.x?.current) positionRefs.x.current.textContent = position.x.toFixed(1);
        if (positionRefs?.y?.current) positionRefs.y.current.textContent = yPos.toFixed(1);
        if (positionRefs?.z?.current) positionRefs.z.current.textContent = position.z.toFixed(1);
        
        lastReportedSpeedRef.current = newSpeed;
      }
    }
  });

  return null;
}

// HTML overlay component that displays speed
export function SpeedometerDisplay({ speedDisplayRef, positionRefs }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 40,
      background: 'rgba(30,30,30,0.95)',
      color: '#fff',
      padding: '16px 24px',
      borderRadius: '10px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      zIndex: 1000,
      minWidth: 180,
      fontFamily: 'inherit',
      fontSize: 15,
      lineHeight: 1.5
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
        Speed
      </div>
      <div ref={speedDisplayRef} style={{ color: '#4caf50', fontSize: 18 }}>
        0.00 units/s
      </div>
      <div style={{ marginTop: 8, fontSize: 14 }}>
        <div style={{ color: '#af4c4c' }}>
          x: <span ref={positionRefs?.x}>??</span>
        </div>
        <div style={{ color: '#afad4c' }}>
          y: <span ref={positionRefs?.y}>??</span>
        </div>
        <div style={{ color: '#4c56af' }}>
          z: <span ref={positionRefs?.z}>??</span>
        </div>
      </div>
    </div>
  );
}

export default SpeedometerDisplay;
