import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FOLIAGE_COUNT, TREE_HEIGHT, TREE_RADIUS_BOTTOM, SCATTER_RADIUS, COLORS } from '../constants';
import { TreeMorphState } from '../types';

// Vertex Shader: Handles the interpolation between two positions (morphing)
const vertexShader = `
  uniform float uTime;
  uniform float uProgress; // 0.0 = Scattered, 1.0 = Tree
  uniform float uPixelRatio;

  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  attribute float aRandom;

  varying float vAlpha;
  varying float vGoldMix;

  // Simple noise function
  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    // Interpolate position
    vec3 currentPos = mix(aScatterPos, aTreePos, uProgress);

    // Add some "breathing" / wind noise based on time
    float noise = sin(uTime * 2.0 + aRandom * 10.0) * 0.1;
    currentPos.x += noise * (1.0 - uProgress); // More noise when scattered
    currentPos.y += noise * 0.5;

    // Breathing effect when in tree mode
    if (uProgress > 0.8) {
      float breathe = sin(uTime * 1.5 + currentPos.y) * 0.05;
      currentPos.x += normalize(currentPos.x) * breathe;
      currentPos.z += normalize(currentPos.z) * breathe;
    }

    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation
    gl_PointSize = (40.0 * aRandom + 20.0) * (1.0 / -mvPosition.z) * uPixelRatio;

    // Varyings for fragment shader
    // Fade out slightly when scattered to reduce visual clutter
    vAlpha = 0.6 + 0.4 * uProgress; 
    
    // Enhanced Gold shimmer logic
    // Increased frequency (5.0) and lowered threshold (0.9) for more sparkles
    float shimmer = sin(uTime * 5.0 + aRandom * 30.0);
    vGoldMix = step(0.9, shimmer); // More frequent sparkles
  }
`;

// Fragment Shader: High-end emerald look with gold sparkles
const fragmentShader = `
  uniform vec3 uColorBase;
  uniform vec3 uColorGold;

  varying float vAlpha;
  varying float vGoldMix;

  void main() {
    // Soft particle circle
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    // Soft edge glow
    float glow = 1.0 - (dist * 2.0);
    glow = pow(glow, 2.0);

    // Boost brightness when gold (sparkle)
    vec3 sparkleBoost = vGoldMix > 0.5 ? vec3(0.5) : vec3(0.0);
    vec3 finalColor = mix(uColorBase, uColorGold + sparkleBoost, vGoldMix);
    
    // Add extra brightness at the center
    finalColor += vec3(0.2) * glow;

    gl_FragColor = vec4(finalColor, vAlpha * glow);
  }
`;

interface FoliageProps {
  treeState: TreeMorphState;
}

const Foliage: React.FC<FoliageProps> = ({ treeState }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  // Target progress value for smooth transition
  const targetProgress = useRef(0);
  const currentProgress = useRef(0);

  // Generate Geometry Data Once
  const { positions, scatterPositions, randoms } = useMemo(() => {
    const pos = new Float32Array(FOLIAGE_COUNT * 3); // Tree positions
    const sca = new Float32Array(FOLIAGE_COUNT * 3); // Scatter positions
    const rnd = new Float32Array(FOLIAGE_COUNT);

    for (let i = 0; i < FOLIAGE_COUNT; i++) {
      // 1. Generate Tree Cone Shape (Spiral distribution)
      const t = i / FOLIAGE_COUNT;
      const angle = t * Math.PI * 2 * 30; // 30 winds
      const y = - (TREE_HEIGHT / 2) + t * TREE_HEIGHT;
      // Radius decreases as we go up
      const radiusAtHeight = ((TREE_HEIGHT / 2 - y) / TREE_HEIGHT) * TREE_RADIUS_BOTTOM;
      
      // Add randomness to thickness of the foliage layer
      const r = radiusAtHeight + (Math.random() - 0.5) * 1.5; 
      
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // 2. Generate Scattered Sphere Shape
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const sr = SCATTER_RADIUS * Math.cbrt(Math.random()); // Even volume distribution
      
      sca[i * 3] = sr * Math.sin(phi) * Math.cos(theta);
      sca[i * 3 + 1] = sr * Math.sin(phi) * Math.sin(theta);
      sca[i * 3 + 2] = sr * Math.cos(phi);

      // 3. Random attributes
      rnd[i] = Math.random();
    }

    return {
      positions: pos,
      scatterPositions: sca,
      randoms: rnd
    };
  }, []);

  useFrame((state, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      shaderRef.current.uniforms.uPixelRatio.value = state.viewport.dpr;

      // Handle Smooth Transition Logic
      targetProgress.current = treeState === TreeMorphState.TREE_SHAPE ? 1.0 : 0.0;
      
      // Simple lerp for transition
      const speed = 2.0 * delta;
      if (currentProgress.current < targetProgress.current) {
        currentProgress.current = Math.min(currentProgress.current + speed, 1.0);
      } else if (currentProgress.current > targetProgress.current) {
        currentProgress.current = Math.max(currentProgress.current - speed, 0.0);
      }

      shaderRef.current.uniforms.uProgress.value = currentProgress.current;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uPixelRatio: { value: 1 },
    uColorBase: { value: COLORS.EMERALD_LIGHT },
    uColorGold: { value: COLORS.GOLD_METALLIC },
  }), []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position" // This serves as 'aTreePos' conceptually, but Three uses 'position'
          count={FOLIAGE_COUNT}
          array={positions} // These are the Tree positions, we map them to attribute aTreePos in shader
          itemSize={3}
        />
        {/* We alias the standard position to aTreePos in the shader code by just passing it as a uniform, 
            OR we explicitly add attributes. Let's add explicit attributes to be safe. */}
        <bufferAttribute
          attach="attributes-aTreePos"
          count={FOLIAGE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={FOLIAGE_COUNT}
          array={scatterPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={FOLIAGE_COUNT}
          array={randoms}
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

export default Foliage;