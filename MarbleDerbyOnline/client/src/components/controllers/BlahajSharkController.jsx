import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../../stores/gameStore";
import { BlahajShark } from "../../assets/shark-blahaj/BlahajSharkModel";
import { RigidBody } from "@react-three/rapier";

export function BlahajSharkController(props) {
  const rigidBodyRef = useRef();
  
  // Get progress and event state from the store
  const progress =
    useGameStore((state) => state.progressStates?.DoorLatchedProgress) || 0;
  const triggeredEvents = useGameStore((state) => state.triggeredEvents);
  const isMoving = !!triggeredEvents?.FrontDoorLatched;

  // Map 0-90 progress to 0-1 opacity
  const opacity = Math.min(Math.max(progress / 90, 0), 1);

  // Movement: track local position state so we can animate the shark along +z when door is latched
  const { position = [0, 0, 0], ...rest } = props;
  const posRef = useRef({ x: position[0], y: position[1], z: position[2] });
  const [emission, setEmission] = useState(0.1);
  const speed = 11.0; // units per second along +z
  const bounceForce = 35; // Extra impulse force when colliding with character

  // Handle collision with other objects - apply extra bounce force
  const handleCollision = (event) => {
    const otherRigidBody = event.other.rigidBody;
    if (otherRigidBody) {
      // Get direction from shark to the other object
      const sharkPos = rigidBodyRef.current.translation();
      const otherPos = otherRigidBody.translation();
      
      // Get current velocity to compensate for momentum
      const currentVel = otherRigidBody.linvel();
      
      // Calculate push direction - prioritize X axis to push off walkway
      const dirX = otherPos.x - sharkPos.x;
      
      // Determine push direction: use existing X direction if significant, otherwise random
      // Ensure minimum force magnitude to always knock off walkway
      let xPush;
      if (Math.abs(dirX) > 0.3) {
        // Use direction but ensure minimum magnitude
        xPush = Math.sign(dirX) * Math.max(Math.abs(dirX), 1.5);
      } else {
        // Ghost is nearly centered - randomly push left or right with strong force
        xPush = (Math.random() > 0.5 ? 1 : -1) * 1.5;
      }
      
      // Apply impulse - compensate for current velocity to ensure strong impact
      otherRigidBody.applyImpulse({
        x: xPush * bounceForce - currentVel.x,
        y: 10 - currentVel.y, // Upward force to launch
        z: bounceForce - currentVel.z, // Small forward momentum
      }, true);
    }
  };

  useFrame((_, delta) => {
    if (isMoving && rigidBodyRef.current) {
      // Update position along +z axis
      posRef.current.z += speed * delta;
      
      // Use setNextKinematicTranslation to properly move kinematic body and push other objects
      rigidBodyRef.current.setNextKinematicTranslation(posRef.current);
      
      setEmission(0.4);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders="hull"
      position={position}
      restitution={1.2}
      friction={0.1}
      onCollisionEnter={handleCollision}
      {...rest}
    >
      <BlahajShark
        opacity={opacity}
        isMoving={isMoving}
        emissivity={emission}
      />
    </RigidBody>
  );
}
