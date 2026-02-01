import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'

export default function RevolveCameraOnce({
  targetRef,
  controlsRef,
  radius = 6,
  height = 2,
  duration = 4,
  zoomOutDistance = 10,
  zoomOutDuration = 1.5,
  onAnimationComplete,
}) {
  const { camera, scene } = useThree()
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current || !targetRef.current) return
    hasRunRef.current = true

    // Pre-compile shaders by traversing scene and forcing material program creation
    // This triggers WebGL shader compilation before animation starts
    scene.traverse((object) => {
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((material) => {
          // Force the material to initialize its WebGL program
          if (material.needsUpdate !== undefined) {
            material.needsUpdate = true
          }
        })
      }
    })

    // Cache target position to avoid repeated property access
    const targetPos = targetRef.current.position
    const targetX = targetPos.x
    const targetY = targetPos.y
    const targetZ = targetPos.z
    
    const startAngle = -Math.PI / 2
    const endAngle = Math.PI / 2
    const startPos = { angle: startAngle }

    // Pre-allocate reusable objects to reduce garbage collection
    const cameraPos = { x: 0, y: 0, z: 0 }
    const targetVector = { x: targetX, y: targetY, z: targetZ }

    // Disable OrbitControls during animation to prevent conflicts
    if (controlsRef?.current) {
      controlsRef.current.enabled = false
    }

    // Revolve animation with delay to allow shader compilation
    gsap.to(startPos, {
      angle: endAngle,
      duration,
      ease: 'power1.inOut',
      onUpdate: () => {
        const angle = startPos.angle
        cameraPos.x = targetX + Math.cos(angle) * radius
        cameraPos.z = targetZ + Math.sin(angle) * radius
        cameraPos.y = targetY + height

        camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
        camera.lookAt(targetX, targetY, targetZ)
      },
      onComplete: () => {
        // Final zoom out animation
        const finalAngle = endAngle
        const finalX = targetX + Math.cos(finalAngle) * zoomOutDistance
        const finalZ = targetZ + Math.sin(finalAngle) * zoomOutDistance
        const finalY = targetY + height

        gsap.to(camera.position, {
          x: finalX,
          z: finalZ,
          y: finalY,
          duration: zoomOutDuration,
          ease: 'power1.out',
          onComplete: () => {
            // Defer OrbitControls update to next frame to prevent blocking
            requestAnimationFrame(() => {
              // Re-enable OrbitControls and set final state
              if (controlsRef?.current) {
                controlsRef.current.target.set(targetX, targetY, targetZ)
                controlsRef.current.enabled = true
                controlsRef.current.update()
              }
              
              // Defer completion callback one more frame to let render settle
              // This spreads out work and prevents frame drop from simultaneous updates
              requestAnimationFrame(() => {
                if (onAnimationComplete) {
                  onAnimationComplete()
                }
              })
            })
          },
        })
      },
    })
  }, [])

  return null
}
