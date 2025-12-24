import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import { TreeMorphState } from '../types';
import { MEMORY_IMAGES, MEMORY_COUNT, TREE_HEIGHT, TREE_RADIUS_BOTTOM, SCATTER_RADIUS } from '../constants';

interface MemoriesProps {
  treeState: TreeMorphState;
}

interface MemoryItemProps {
  url: string;
  treePos: THREE.Vector3;
  scatterPos: THREE.Vector3;
  treeState: TreeMorphState;
  index: number;
}

const MemoryItem: React.FC<MemoryItemProps> = ({ url, treePos, scatterPos, treeState, index }) => {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Random offset for float animation so they don't move in sync
  const randomOffset = useMemo(() => Math.random() * 100, []);
  
  // Random aspect ratio jitter to make them look like loose photos
  const aspect = useMemo(() => 0.8 + Math.random() * 0.4, []);

  // Random rotation offset for a "tossed" look
  const initialRotation = useMemo(() => (Math.random() - 0.5) * 0.5, []);

  useFrame((state, delta) => {
    if (!ref.current) return;

    const isScattered = treeState === TreeMorphState.SCATTERED;
    const targetPos = isScattered ? scatterPos : treePos;
    
    // 1. Position Interpolation
    const lerpSpeed = 2.0 * delta;
    ref.current.position.lerp(targetPos, lerpSpeed);

    // 2. Floating Animation
    const t = state.clock.elapsedTime + randomOffset;
    
    if (isScattered) {
        // SCATTERED: Large float, face camera
        ref.current.position.y += Math.sin(t * 0.5) * 0.01;
        
        // Smoothly look at camera
        const quaternion = new THREE.Quaternion();
        quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(ref.current.position, state.camera.position, new THREE.Vector3(0, 1, 0)));
        ref.current.quaternion.slerp(quaternion, 0.1);
        
    } else {
        // TREE: Small breathe, face outwards
        ref.current.position.y += Math.sin(t * 1.0) * 0.005;
        
        // Look away from center (0, y, 0)
        const lookTarget = new THREE.Vector3(treePos.x * 2, treePos.y, treePos.z * 2);
        ref.current.lookAt(lookTarget);
        
        // Face outward but with the random "tossed" rotation applied
        ref.current.rotateZ(initialRotation * 0.1); 
    }

    // 3. Scale Logic
    // Adjusted sizes for density:
    // Tree: 2.5 (Slightly smaller than before to accommodate count)
    // Scatter: 4.5
    const baseScale = isScattered ? 4.5 : 2.5;
    const hoverScale = (hovered) ? 1.2 : 1.0;
    const finalScale = baseScale * hoverScale;
    
    // Animate scale
    ref.current.scale.lerp(new THREE.Vector3(finalScale, finalScale * aspect, 1), lerpSpeed);
    
    // 4. Opacity Logic
    const material = ref.current.material as THREE.Material;
    if(material) {
        material.transparent = true;
        material.opacity = THREE.MathUtils.lerp(material.opacity, 1.0, lerpSpeed);
    }
  });

  return (
    <Image 
      ref={ref}
      url={url}
      transparent
      side={THREE.DoubleSide}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => setHovered(false)}
      // Disable tone mapping so images appear bright and distinct against the dark environment
      toneMapped={false} 
    />
  );
};

const Memories: React.FC<MemoriesProps> = ({ treeState }) => {
  const items = useMemo(() => {
    // Generate MEMORY_COUNT items by cycling through the URL list
    return Array.from({ length: MEMORY_COUNT }).map((_, i) => {
      const url = MEMORY_IMAGES[i % MEMORY_IMAGES.length];
      
      // 1. Tree Position: SURFACE
      // Height: Use bias to put more photos near the bottom (like ornaments)
      // Bias 2.5 creates a nice pyramid distribution
      const bias = 2.5;
      const t = Math.pow(Math.random(), bias); 
      const y = - (TREE_HEIGHT / 2) + t * TREE_HEIGHT;
      
      // Calculate radius at this height
      const maxR = ((TREE_HEIGHT / 2 - y) / TREE_HEIGHT) * TREE_RADIUS_BOTTOM;
      
      // Place them on the surface, intermingled with ornaments
      // Ornaments are at maxR + (0 to 0.5)
      // We place photos at maxR + (0.7 to 1.1) to sit "on top" of ornaments but still connected
      const r = maxR + 0.7 + Math.random() * 0.4; 
      
      const angle = Math.random() * Math.PI * 2;

      const treePos = new THREE.Vector3(
        Math.cos(angle) * r,
        y,
        Math.sin(angle) * r
      );

      // 2. Scatter Position
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const sr = SCATTER_RADIUS + 5 + Math.random() * 10;
      
      const scatterPos = new THREE.Vector3(
        sr * Math.sin(phi) * Math.cos(theta),
        sr * Math.sin(phi) * Math.sin(theta),
        sr * Math.cos(phi)
      );

      return { url, treePos, scatterPos, index: i };
    });
  }, []);

  return (
    <group>
      {items.map((item, i) => (
        <MemoryItem key={i} {...item} treeState={treeState} />
      ))}
    </group>
  );
};

export default Memories;