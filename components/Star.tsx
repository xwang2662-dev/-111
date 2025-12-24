import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { TreeMorphState } from '../types';
import { TREE_HEIGHT, COLORS } from '../constants';

interface StarProps {
  treeState: TreeMorphState;
}

const Star: React.FC<StarProps> = ({ treeState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const spikesRef = useRef<THREE.Group>(null);
  
  // Position Logic
  const treeY = TREE_HEIGHT / 2 + 0.5;
  const scatterY = TREE_HEIGHT + 8; // Start higher up in scatter mode for dramatic effect

  useFrame((state, delta) => {
    if (!groupRef.current || !ringRef.current || !coreRef.current || !spikesRef.current) return;

    // 1. Position Interpolation (Tree vs Scatter)
    const targetY = treeState === TreeMorphState.TREE_SHAPE ? treeY : scatterY;
    
    // Smooth dampening for position
    groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y, 
        targetY, 
        delta * 2
    );

    // 2. Idle Animation
    const t = state.clock.elapsedTime;
    
    // Bobbing motion
    groupRef.current.position.y += Math.sin(t * 1.5) * 0.005;

    // Ring Rotation (Gyroscope feel)
    ringRef.current.rotation.x = Math.sin(t * 0.5) * 0.5;
    ringRef.current.rotation.y += delta * 0.5;

    // Spikes Rotation (Slow elegant spin)
    spikesRef.current.rotation.y -= delta * 0.2;

    // Core Pulse
    const scale = 1 + Math.sin(t * 3) * 0.1; 
    coreRef.current.scale.setScalar(scale);
    
    // Material Emission Pulse on Spikes
    // We access the children to animate their material
    spikesRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            // Pulse emissive intensity
            mat.emissiveIntensity = 1.0 + Math.sin(t * 2 + i) * 0.5;
        }
    });
  });

  return (
    <group ref={groupRef} position={[0, treeY, 0]}>
      
      {/* Real Light Source for the top of the tree */}
      <pointLight 
        intensity={3} 
        distance={15} 
        decay={2} 
        color={COLORS.GOLD_PALE} 
      />

      {/* --- THE GEOMETRY --- */}
      
      {/* 1. The Core Gem */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial 
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={4.0}
            toneMapped={false}
        />
      </mesh>

      {/* 2. The Spikes (Star Shape) */}
      <group ref={spikesRef}>
          {/* Vertical/Horizontal Spikes (Long) */}
          <mesh scale={[0.2, 2.5, 0.2]}>
             <octahedronGeometry args={[1, 0]} />
             <meshStandardMaterial 
                color={COLORS.GOLD_METALLIC}
                emissive={COLORS.GOLD_METALLIC}
                emissiveIntensity={0.5}
                metalness={1.0}
                roughness={0.1}
             />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} scale={[0.2, 2.5, 0.2]}>
             <octahedronGeometry args={[1, 0]} />
             <meshStandardMaterial 
                color={COLORS.GOLD_METALLIC}
                emissive={COLORS.GOLD_METALLIC}
                emissiveIntensity={0.5}
                metalness={1.0}
                roughness={0.1}
             />
          </mesh>

          {/* Diagonal Spikes (Shorter/Thicker) */}
          <mesh rotation={[0, 0, Math.PI / 4]} scale={[0.25, 1.4, 0.25]}>
             <octahedronGeometry args={[1, 0]} />
             <meshStandardMaterial 
                color={COLORS.GOLD_PALE}
                emissive={COLORS.GOLD_PALE}
                emissiveIntensity={0.2}
                metalness={1.0}
                roughness={0.1}
             />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]} scale={[0.25, 1.4, 0.25]}>
             <octahedronGeometry args={[1, 0]} />
             <meshStandardMaterial 
                color={COLORS.GOLD_PALE}
                emissive={COLORS.GOLD_PALE}
                emissiveIntensity={0.2}
                metalness={1.0}
                roughness={0.1}
             />
          </mesh>
      </group>

      {/* 3. The Halo Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.02, 16, 100]} />
        <meshStandardMaterial 
            color="#ffffff"
            emissive={COLORS.GOLD_PALE}
            emissiveIntensity={2.0}
            toneMapped={false}
        />
      </mesh>

      {/* 4. The Glow Sphere (Atmosphere) */}
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial 
            color={COLORS.GOLD_PALE} 
            transparent 
            opacity={0.15} 
            side={THREE.BackSide}
            depthWrite={false}
        />
      </mesh>

      {/* 5. Local Sparkles for the Star */}
      <Sparkles 
        count={40} 
        scale={3} 
        size={4} 
        speed={0.4} 
        opacity={1} 
        color="#ffffff" 
      />
    </group>
  );
};

export default Star;