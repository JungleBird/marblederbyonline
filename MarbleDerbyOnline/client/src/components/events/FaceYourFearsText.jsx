import React, { useRef, useState, useEffect } from 'react'
import { Text3D, Center } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../../stores/gameStore'
import * as THREE from 'three'

export function FaceYourFearsText({animationDuration = 3, staticDuration=1, delay=1}) {
  const sensorStates = useGameStore((state) => state.sensorStates)
  const triggeredEvents = useGameStore((state) => state.triggeredEvents)
  const setEventTriggered = useGameStore((state) => state.setEventTriggered)
  
  const isTriggered = !!sensorStates["D"]
  const hasPlayed = !!triggeredEvents["FaceYourFears"]
  
  // Track isTriggered in a ref for access inside async/frame loops
  const isTriggeredRef = useRef(isTriggered)
  useEffect(() => { isTriggeredRef.current = isTriggered }, [isTriggered])

  // If it has already played (on mount), we don't want to render it at all.
  const [isFinished, setIsFinished] = useState(hasPlayed)
  const sequenceStarted = useRef(false)

  const groupRef = useRef()
  const materialRef = useRef()
  
  const startY = 20
  const targetY = 2 
  
  const currentY = useRef(startY)
  const currentOpacity = useRef(0)
  
  // The active phase object containing the update logic for the current frame
  const activePhase = useRef(null)

  // --- PHASES ---
  
  const delayPhase = () => new Promise((resolve, reject) => {
    let elapsed = 0
    activePhase.current = {
      update: (delta) => {
        if (!isTriggeredRef.current) { reject('reset'); return }
        elapsed += delta
        if (elapsed > delay) resolve()
      }
    }
  })

  const dropPhase = () => new Promise((resolve, reject) => {
    let elapsed = 0
    activePhase.current = {
      update: (delta) => {
        if (!isTriggeredRef.current) { reject('abort'); return }
        elapsed += delta
        const progress = Math.min(elapsed / animationDuration, 1)
        const ease = 1 - Math.pow(1 - progress, 3)
        currentY.current = THREE.MathUtils.lerp(startY, targetY, ease)
        currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, 1, delta * 3)
        if (elapsed >= animationDuration) resolve()
      }
    }
  })

  const staticPhase = () => new Promise((resolve, reject) => {
    let elapsed = 0
    activePhase.current = {
      update: (delta) => {
        if (!isTriggeredRef.current) { reject('abort'); return }
        elapsed += delta
        currentY.current = targetY
        currentOpacity.current = 1
        if (elapsed >= staticDuration) resolve()
      }
    }
  })

  const fadePhase = () => new Promise((resolve) => {
    let elapsed = 0
    const duration = 1.0
    const startOpacity = currentOpacity.current

    activePhase.current = {
      update: (delta) => {
        elapsed += delta
        const progress = elapsed / duration
        currentY.current = targetY
        currentOpacity.current = THREE.MathUtils.lerp(startOpacity, 0, Math.min(progress, 1))
        if (progress >= 1) resolve()
      }
    }
  })

  const runSequence = async () => {
    try {
      await delayPhase()
      setEventTriggered("FaceYourFears")
      await dropPhase()
      await staticPhase()
      await fadePhase()
      setIsFinished(true)
    } catch (error) {
      if (error === 'reset') {
        sequenceStarted.current = false
        activePhase.current = null
      } else {
        // Aborted during drop or static
        await fadePhase()
        setIsFinished(true)
      }
    } finally {
        //Emulate the character controls and tap the "S" or "down arrow" key to move backward after the text finishes
        const eventDown = new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true });
        window.dispatchEvent(eventDown);
        
        setTimeout(() => {
          const eventUp = new KeyboardEvent('keyup', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true });
          window.dispatchEvent(eventUp);
        }, 100);
    }
  }

  useEffect(() => {
    if (isTriggered && !hasPlayed && !sequenceStarted.current) {
      sequenceStarted.current = true
      runSequence()
    }
  }, [isTriggered, hasPlayed])

  useFrame((state, delta) => {
    if (isFinished) return
    
    if (activePhase.current) {
      activePhase.current.update(delta)
    }
    
    if (groupRef.current) {
      groupRef.current.position.y = currentY.current
    }
    
    if (materialRef.current) {
      materialRef.current.opacity = currentOpacity.current
    }
  })

  if (isFinished) return null

  return (
    <group position={[0, 0, -48]}>
      <group ref={groupRef} position={[0, startY, 0]}>
        <Center>
          <Text3D 
            font="https://threejs.org/examples/fonts/helvetiker_bold.typeface.json"
            size={1.2}
            height={0.2}
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.02}
            bevelSize={0.02}
            bevelOffset={0}
            bevelSegments={5}
          >
            Face your Fears
            <meshStandardMaterial 
              ref={materialRef}
              color="#ffffffff" 
              roughness={0.2} 
              metalness={0.8} 
              transparent
              opacity={0}
            />
          </Text3D>
        </Center>
      </group>
    </group>
  )
}