import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPIRAL_PARTICLE_COUNT, TREE_HEIGHT, TREE_RADIUS_BOTTOM, SCATTER_RADIUS } from '../constants';
import { TreeMorphState } from '../types';

// Vertex Shader: Morphs position and passes 'vLineProgress' for the flow effect
const vertexShader = `
  uniform float uTime;
  uniform float uProgress; // 0 = Scatter, 1 = Tree
  uniform float uPixelRatio;

  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  attribute float aLineProgress; // 0 to 1 along the spiral

  varying float vAlpha;
  varying float vLineProgress;

  void main() {
    // 1. Morph Position
    vec3 pos = mix(aScatterPos, aTreePos, uProgress);

    // 2. Add subtle float/wiggle to make it feel alive
    float noise = sin(uTime * 3.0 + pos.y * 2.0) * 0.05;
    pos.x += noise;
    pos.z += noise;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // 3. Size Logic
    // Particles are larger when in tree mode to form a solid ribbon look
    // We pulse the size based on position to make it sparkle
    float pulse = sin(uTime * 5.0 + aLineProgress * 20.0);
    float baseSize = 60.0 + pulse * 20.0;
    
    gl_PointSize = baseSize * (1.0 / -mvPosition.z) * uPixelRatio;

    // 4. Pass varying
    vLineProgress = aLineProgress;
    
    // Fade out slightly in scatter mode, full opacity in tree mode
    vAlpha = 0.3 + 0.7 * uProgress;
  }
`;

// Fragment Shader: Creates a flowing light effect along the ribbon
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;

  varying float vAlpha;
  varying float vLineProgress;

  void main() {
    // Circular particle
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    // Soft glow edge
    float glow = 1.0 - (dist * 2.0);
    glow = pow(glow, 3.0);

    // --- FLOW EFFECT ---
    // Create a moving wave along the spiral
    // The negative uTime makes it flow upwards
    float flow = sin(vLineProgress * 25.0 - uTime * 3.0); 
    
    // Sharpen the wave to make distinct "pulses" of light (Energy segments)
    float brightness = smoothstep(0.4, 0.9, flow);
    
    // Base brightness + Flow burst
    // When brightness is high, we mix towards white for a "hot" look
    vec3 finalColor = mix(uColor, vec3(1.0, 1.0, 0.9), brightness * 0.8);

    // Intensity boost for Bloom
    finalColor *= (1.0 + brightness * 3.0);

    gl_FragColor = vec4(finalColor, vAlpha * glow);
  }
`;

interface SpiralProps {
  treeState: TreeMorphState;
}

const Spiral: React.FC<SpiralProps> = ({ treeState }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const currentProgress = useRef(0);

  const { treePositions, scatterPositions, lineProgress } = useMemo(() => {
    const tPos = new Float32Array(SPIRAL_PARTICLE_COUNT * 3);
    const sPos = new Float32Array(SPIRAL_PARTICLE_COUNT * 3);
    const progress = new Float32Array(SPIRAL_PARTICLE_COUNT);

    const turns = 6.0; // How many times it wraps around
    const heightOffset = 1.0; // Start slightly off the ground

    for (let i = 0; i < SPIRAL_PARTICLE_COUNT; i++) {
      const p = i / SPIRAL_PARTICLE_COUNT; // 0 to 1
      
      // --- Tree Position (Helix) ---
      // Height from bottom to top
      const y = - (TREE_HEIGHT / 2) + p * TREE_HEIGHT + heightOffset;
      
      // Radius tapers as we go up (Cone shape)
      // Added +0.8 to float slightly outside the foliage
      // We clamp math to avoid negative radius at the very tip
      const rawRadius = ((TREE_HEIGHT / 2 - (y - heightOffset)) / TREE_HEIGHT) * TREE_RADIUS_BOTTOM;
      const r = Math.max(0.1, rawRadius + 0.6); 

      const angle = p * Math.PI * 2 * turns;

      tPos[i * 3] = Math.cos(angle) * r;
      tPos[i * 3 + 1] = y;
      tPos[i * 3 + 2] = Math.sin(angle) * r;

      // --- Scatter Position ---
      // Randomly distributed in the scatter sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const sr = SCATTER_RADIUS * 1.1 * Math.cbrt(Math.random()); // Slightly wider scatter

      sPos[i * 3] = sr * Math.sin(phi) * Math.cos(theta);
      sPos[i * 3 + 1] = sr * Math.sin(phi) * Math.sin(theta);
      sPos[i * 3 + 2] = sr * Math.cos(phi);

      // --- Attribute ---
      progress[i] = p;
    }

    return {
      treePositions: tPos,
      scatterPositions: sPos,
      lineProgress: progress
    };
  }, []);

  useFrame((state, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      shaderRef.current.uniforms.uPixelRatio.value = state.viewport.dpr;

      // Morph Transition
      const target = treeState === TreeMorphState.TREE_SHAPE ? 1.0 : 0.0;
      const speed = 2.0 * delta;

      if (currentProgress.current < target) {
        currentProgress.current = Math.min(currentProgress.current + speed, 1.0);
      } else if (currentProgress.current > target) {
        currentProgress.current = Math.max(currentProgress.current - speed, 0.0);
      }
      shaderRef.current.uniforms.uProgress.value = currentProgress.current;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uPixelRatio: { value: 1 },
    uColor: { value: new THREE.Color('#FFD700') }, // Gold
  }), []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={SPIRAL_PARTICLE_COUNT}
          array={treePositions} // Default to tree positions for bounding box
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={SPIRAL_PARTICLE_COUNT}
          array={treePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={SPIRAL_PARTICLE_COUNT}
          array={scatterPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aLineProgress"
          count={SPIRAL_PARTICLE_COUNT}
          array={lineProgress}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        depthWrite={false}
        transparent
        blending={THREE.AdditiveBlending}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </points>
  );
};

export default Spiral;