import { useGameStore } from "../../stores/gameStore";
import { GlassMarbleBallMesh } from "../characters/GlassMarbleBall";
import { BallMesh } from "../characters/Ball";
import { SoccerBallMesh } from "../characters/SoccerBall";

export function RemoteEntities({
  defaultPlayerRadius = 0.6,
  defaultBallRadius = 0.7,
  entities = null,
  renderPlayer = (radius) => <GlassMarbleBallMesh radius={radius} />,
  renderBall = (radius) => <SoccerBallMesh radius={radius} />,
}) {
  const storeEntities = useGameStore((state) => state.otherEntities);
  const otherEntities = entities || storeEntities;
  
  return (
    <>
      {Object.entries(otherEntities).map(([entityKey, entity]) => {
        if (!entity.position) return null;
        
        const { position, rotation, entityType, radius } = entity;
        
        // Use server-provided radius or fallback to defaults
        const entityRadius = radius ?? (entityType === "player" ? defaultPlayerRadius : defaultBallRadius);
        
        // Rotation from server is a quaternion {x, y, z, w}, not Euler angles
        // Use quaternion prop directly instead of euler rotation
        const quaternion = rotation && rotation.w !== undefined 
          ? [rotation.x, rotation.y, rotation.z, rotation.w] 
          : undefined;
        
        return (
          <group 
            key={entityKey} 
            position={[position.x, position.y, position.z]}
            quaternion={quaternion}
          >
            {entityType === "player" 
              ? renderPlayer(entityRadius) 
              : renderBall(entityRadius)}
          </group>
        );
      })}
    </>
  );
}
