import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DoubleSide, Vector3 } from "three";

export function GroundCrosshair({
  targetRef,
  size = 1.25,
  thickness = 0.1,
  height = 0.1,
  color = "silver",
  opacity = 0.35,
  metalness = 0.8,
}) {
  const crosshairRef = useRef();
  const circleRadius = 0.5;
  const ringWidth = thickness;

  useFrame(() => {
    if (!crosshairRef.current || !targetRef?.current) return;
    const targetPos = targetRef.current.translation();
    crosshairRef.current.position.set(targetPos.x, height, targetPos.z);
  });

  return (
    <group ref={crosshairRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, thickness]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={true}
          depthTest={true}
          metalness={metalness}
          transmission={0.8}
          ior={1.5}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[thickness, size]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={true}
          depthTest={true}
          metalness={metalness}
          transmission={0.8}
          ior={1.5}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[Math.max(circleRadius - ringWidth, 0), circleRadius, 64]}
        />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={true}
          depthTest={true}
          metalness={metalness}
          transmission={0.8}
          ior={1.5}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* experimental trajectory line - currently not used */
export function GroundTrajectory({ targetRef }) {
  const groupRef = useRef();
  const lineRef = useRef();

  useFrame(() => {
    if(!groupRef.current || !targetRef?.current) return;

    const targetPos = targetRef.current.translation();
    groupRef.current.position.set(targetPos.x, 0, targetPos.z);
  })

  // Initialize geometry once
  useMemo(() => {
    if(!lineRef.current) return;
    const startPoint = new Vector3(0, 0.05, 0);
    const endPoint = new Vector3(0, 0.05, 15);
    lineRef.current.geometry.setFromPoints([startPoint, endPoint]);
    lineRef.current.computeLineDistances();
  }, [])

  return (
    <group ref={groupRef}>
      <line ref={lineRef}>
        <bufferGeometry />
        <lineDashedMaterial 
          color="orange" 
          transparent 
          opacity={0.6}
          dashSize={0.3}
          gapSize={0.2}
        />
      </line>
    </group>
  );
}