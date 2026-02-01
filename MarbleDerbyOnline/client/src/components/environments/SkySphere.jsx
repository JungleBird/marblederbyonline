import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SkySphere = () => {
  const meshRef = useRef();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorTop: { value: new THREE.Color("black") },
      uColorMiddle: { value: new THREE.Color("#030577") },
      uColorBottom: { value: new THREE.Color("black") },
    }),
    []
  );

  useFrame((state) => {
    const { clock } = state;
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  const vertexShader = `
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColorTop;
    uniform vec3 uColorMiddle;
    uniform vec3 uColorBottom;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }

    vec2 hash22(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx+p3.yz)*p3.zy);
    }

    void main() {
      vec3 direction = normalize(vWorldPosition);
      
      float gradientFactor = (direction.y + 1.0) * 0.5;
      vec3 skyColor;
      if (gradientFactor < 0.5) {
        skyColor = mix(uColorBottom, uColorMiddle, gradientFactor * 2.0);
      } else {
        skyColor = mix(uColorMiddle, uColorTop, (gradientFactor - 0.5) * 2.0);
      }

      float altitudeFactor = smoothstep(0.0, 0.4, direction.y);
      
      if (altitudeFactor <= 0.0) {
          gl_FragColor = vec4(skyColor, 1.0);
          return;
      }

      float scale = 300.0; 
      vec2 uv = vUv * scale;
      
      vec2 ipos = floor(uv);
      vec2 fpos = fract(uv) - 0.5;

      vec3 starLayer = vec3(0.0);

      for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
              vec2 neighbor = vec2(float(x), float(y));
              vec2 cellId = ipos + neighbor;
              
              float rnd = hash21(cellId);
              
              float starChance = 0.005 * altitudeFactor;
              
              if (rnd > (1.0 - starChance)) {
                  vec2 jitter = (hash22(cellId) - 0.5) * 0.6;
                  vec2 toStar = neighbor + jitter - fpos;
                  float dist = length(toStar);
                  
                  // Determine type/interval first to affect size/opacity
                  float rnd2 = fract(rnd * 123.45); 
                  float blinkPeriod = 6.0;
                  float sizeScalar = 0.2;
                  float opacityScalar = 0.2;
                  
                  if (rnd2 < 0.33) {
                      blinkPeriod = 3.0;
                      sizeScalar = 0.3;
                      opacityScalar = 0.3;
                  } else if (rnd2 < 0.66) {
                      blinkPeriod = 5.0;
                      sizeScalar = 0.5;
                      opacityScalar = 0.5;
                  }

                  // 1. Core Dot
                  float radius = (0.1 + (rnd * 0.1)) * sizeScalar; 
                  float core = smoothstep(radius, radius * 0.5, dist);
                  
                  // 2. Flare (4-pointed star)
                  float thinness = 0.02 * sizeScalar;
                  float flare = thinness / (abs(toStar.x * toStar.y) + 0.005);
                  flare *= smoothstep(0.4, 0.1, dist);

                  float brightness = core + flare;
                  
                  // Sparkle
                  float speed = 6.28318 / blinkPeriod; 
                  float sparkle = 0.5 + 0.5 * sin(uTime * speed + rnd * 100.0);
                  
                  starLayer += vec3(brightness * sparkle * opacityScalar);
              }
          }
      }

      gl_FragColor = vec4(skyColor + starLayer, 1.0);
    }
  `;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[100, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

export default SkySphere;
