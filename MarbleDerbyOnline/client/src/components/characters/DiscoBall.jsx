import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'

// A simple disco ball roughly the same size as the existing Ball model (~radius 0.6)
export function DiscoBallMesh(props) {
  const instanced = useRef()
  const {
    matrices,
    count,
    material,
    tileScale,
  } = useMemo(() => {
    const radius = 0.8
    const tilesLon = 20
    const tilesLat = 14
    const gap = 0.9 // scale tiles to leave grout gaps

    const count = (tilesLat - 2) * tilesLon // skip poles
    const matrices = new Array(count)

    // Approximate tile dimensions by arc lengths
    const tileW = (2 * Math.PI * radius) / tilesLon * gap
    const tileH = (Math.PI * radius) / tilesLat * gap
    const tileScale = new THREE.Vector3(tileW, tileH, 1)

    const worldUp = new THREE.Vector3(0, 1, 0)
    const worldForward = new THREE.Vector3(0, 0, 1)
    const q = new THREE.Quaternion()
    const m = new THREE.Matrix4()
    const rotMat = new THREE.Matrix4()
    let idx = 0

    for (let i = 1; i < tilesLat - 1; i++) {
      const theta = (i / (tilesLat - 1)) * Math.PI // 0..π
      const sinT = Math.sin(theta)
      const cosT = Math.cos(theta)
      for (let j = 0; j < tilesLon; j++) {
        const phi = (j / tilesLon) * 2 * Math.PI // 0..2π
        const cosP = Math.cos(phi)
        const sinP = Math.sin(phi)

        const nx = sinT * cosP
        const ny = cosT
        const nz = sinT * sinP
        const normal = new THREE.Vector3(nx, ny, nz)

        const pos = normal.clone().multiplyScalar(radius + 0.002)
        // Build a stable orientation: X axis = tangent, Y axis = binormal, Z axis = normal.
        let tangent = new THREE.Vector3().crossVectors(worldUp, normal)
        if (tangent.length() < 1e-5) {
          tangent.crossVectors(worldForward, normal)
        }
        tangent.normalize()
        const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize()

        rotMat.makeBasis(tangent, binormal, normal)
        q.setFromRotationMatrix(rotMat)
        m.compose(pos, q, tileScale)
        matrices[idx++] = m.clone()
      }
    }

    const material = new THREE.MeshPhysicalMaterial({
      color: '#cfd6ff',
      roughness: 0.2,
      metalness: 0.95,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.3,
      side: THREE.DoubleSide,
    })

    return { matrices, count, material, tileScale }
  }, [])

  // Apply instance transforms once
  React.useLayoutEffect(() => {
    if (!instanced.current) return
    for (let i = 0; i < matrices.length; i++) {
      instanced.current.setMatrixAt(i, matrices[i])
    }
    instanced.current.instanceMatrix.needsUpdate = true
  }, [matrices])

  return (
    <instancedMesh ref={instanced} args={[null, null, count]} castShadow receiveShadow {...props}>
      <planeGeometry args={[1, 1]} />
      <primitive attach="material" object={material} />
    </instancedMesh>
  )
}

export function AnimatedDiscoBallMesh({ position = [0, 0, 0] }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    ref.current.rotation.y = t * 0.6
    ref.current.rotation.x = Math.sin(t * 0.2) * 0.05
  })

  return (
    <group ref={ref} position={position}>
      <DiscoBallMesh />
      {/* Accent lights for mirror sparkle */}
      <pointLight position={[1.2, 0.4, 0]} intensity={8} distance={4} color="#ff66aa" />
      <pointLight position={[-1.0, 0.0, 0.8]} intensity={8} distance={4} color="#66ffd1" />
      <pointLight position={[0.0, 0.6, -1.0]} intensity={8} distance={4} color="#ffd966" />
    </group>
  )
}

export function CardDisplay({ width = "100%", height = "300px" }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        style={{ background: 'transparent' }}
        shadows
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <spotLight position={[0, 3, 0]} angle={0.5} penumbra={1} intensity={0.6} color="#8A4DFF" />

        <group position={[0, -0.3, 0]}>
          <AnimatedDiscoBallMesh />
        </group>

        <Environment preset="night" />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={2}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  )
}
