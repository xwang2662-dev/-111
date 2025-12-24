import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three-stdlib';
import * as THREE from 'three';
import { TreeMorphState, OrnamentData } from '../types';
import { ORNAMENT_BOX_COUNT, ORNAMENT_SPHERE_COUNT, TREE_HEIGHT, TREE_RADIUS_BOTTOM, SCATTER_RADIUS, COLORS } from '../constants';

const tempObject = new THREE.Object3D();

interface OrnamentsProps {
  treeState: TreeMorphState;
}

const Ornaments: React.FC<OrnamentsProps> = ({ treeState }) => {
  const boxMeshRef = useRef<THREE.InstancedMesh>(null);
  const sphereMeshRef = useRef<THREE.InstancedMesh>(null);

  // Use useMemo to create the geometry instead of the declarative JSX element
  const boxGeometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.1), []);

  // Transition state tracking (0 to 1)
  const progressRef = useRef(0);

  // --- Data Generation Helper ---
  const generateData = (count: number, type: 'box' | 'sphere'): { data: OrnamentData[], colors: Float32Array } => {
    const data: OrnamentData[] = [];
    const colorArray = new Float32Array(count * 3);
    const tempCol = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Tree Position (On surface of cone)
      // Box: 7.0 (Almost all boxes are on the floor/bottom 20%)
      // Sphere: 3.5 (Strong pyramid taper, very few at top)
      const bias = type === 'box' ? 7.0 : 3.5; 
      const t = Math.pow(Math.random(), bias);

      const y = - (TREE_HEIGHT / 2) + t * TREE_HEIGHT;
      const maxR = ((TREE_HEIGHT / 2 - y) / TREE_HEIGHT) * TREE_RADIUS_BOTTOM;
      const r = maxR + (Math.random() * 0.5); // Variable depth/outside
      const angle = Math.random() * Math.PI * 2;
      
      const treePos = {
        x: Math.cos(angle) * r,
        y: y,
        z: Math.sin(angle) * r
      };

      // Scatter Position (Random Sphere)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const sr = SCATTER_RADIUS * 0.8 * Math.cbrt(Math.random());
      
      const scatterPos = {
        x: sr * Math.sin(phi) * Math.cos(theta),
        y: sr * Math.sin(phi) * Math.sin(theta),
        z: sr * Math.cos(phi)
      };

      // Rotation randomness
      const rot = { 
        x: Math.random() * Math.PI, 
        y: Math.random() * Math.PI, 
        z: Math.random() * Math.PI 
      };

      // Colors Selection
      let col = COLORS.GOLD_METALLIC;
      const rand = Math.random();
      
      if (type === 'box') {
        // Boxes: ~35% Pink, Mixed Gold/Red
        if (rand > 0.65) col = COLORS.PINK_LUX;
        else if (rand > 0.35) col = COLORS.GOLD_METALLIC;
        else if (rand > 0.15) col = COLORS.GOLD_PALE;
        else col = COLORS.RED_VELVET;
      } else {
        // Spheres: ~45% Pink, ~35% Red, ~20% Pale Gold
        if (rand > 0.55) col = COLORS.PINK_LUX;
        else if (rand > 0.20) col = COLORS.RED_VELVET;
        else col = COLORS.GOLD_PALE;
      }

      data.push({
        id: i,
        scale: type === 'box' ? 0.1 + Math.random() * 0.45 : 0.25 + Math.random() * 0.3,
        color: '#' + col.getHexString(),
        scatterPos,
        scatterRot: rot,
        treePos,
        treeRot: { x: 0, y: angle, z: 0 }
      });

      // Fill Color Array
      tempCol.set(col);
      colorArray[i * 3] = tempCol.r;
      colorArray[i * 3 + 1] = tempCol.g;
      colorArray[i * 3 + 2] = tempCol.b;
    }
    return { data, colors: colorArray };
  };

  const { data: boxData, colors: boxColors } = useMemo(() => generateData(ORNAMENT_BOX_COUNT, 'box'), []);
  const { data: sphereData, colors: sphereColors } = useMemo(() => generateData(ORNAMENT_SPHERE_COUNT, 'sphere'), []);

  useFrame((state, delta) => {
    // 1. Calculate Progress
    const target = treeState === TreeMorphState.TREE_SHAPE ? 1 : 0;
    const speed = 1.5 * delta;
    
    if (progressRef.current < target) {
        progressRef.current = Math.min(progressRef.current + speed, 1);
    } else if (progressRef.current > target) {
        progressRef.current = Math.max(progressRef.current - speed, 0);
    }

    const t = progressRef.current;
    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const time = state.clock.elapsedTime;

    // 2. Update Boxes
    if (boxMeshRef.current) {
      boxData.forEach((data, i) => {
        const { scatterPos, treePos, scatterRot, treeRot, scale } = data;
        
        tempObject.position.set(
          THREE.MathUtils.lerp(scatterPos.x, treePos.x, easedT),
          THREE.MathUtils.lerp(scatterPos.y, treePos.y, easedT),
          THREE.MathUtils.lerp(scatterPos.z, treePos.z, easedT)
        );

        if (t < 0.9) {
            const floatScale = (1 - t) * 0.5;
            tempObject.position.y += Math.sin(time + data.id) * floatScale;
            tempObject.rotation.x = scatterRot.x + time * 0.2 * (1 - t);
            tempObject.rotation.y = scatterRot.y + time * 0.1 * (1 - t);
        } else {
             tempObject.rotation.set(
                 THREE.MathUtils.lerp(scatterRot.x, treeRot.x, easedT) + time * 0.1,
                 THREE.MathUtils.lerp(scatterRot.y, treeRot.y, easedT) + time * 0.1,
                 THREE.MathUtils.lerp(scatterRot.z, treeRot.z, easedT)
             );
        }

        tempObject.scale.setScalar(scale);
        tempObject.updateMatrix();
        boxMeshRef.current!.setMatrixAt(i, tempObject.matrix);
      });
      boxMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Update Spheres
    if (sphereMeshRef.current) {
      sphereData.forEach((data, i) => {
         const { scatterPos, treePos, scatterRot, scale } = data;

        tempObject.position.set(
          THREE.MathUtils.lerp(scatterPos.x, treePos.x, easedT),
          THREE.MathUtils.lerp(scatterPos.y, treePos.y, easedT),
          THREE.MathUtils.lerp(scatterPos.z, treePos.z, easedT)
        );

        tempObject.rotation.set(
            scatterRot.x + time * 0.5,
            scatterRot.y + time * 0.5,
            0
        );
        
        tempObject.scale.setScalar(scale);
        tempObject.updateMatrix();
        sphereMeshRef.current!.setMatrixAt(i, tempObject.matrix);
      });
      sphereMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Cubes / Gift Boxes */}
      <instancedMesh ref={boxMeshRef} args={[undefined, undefined, ORNAMENT_BOX_COUNT]} geometry={boxGeometry}>
        <instancedBufferAttribute attach="instanceColor" args={[boxColors, 3]} />
        <meshStandardMaterial 
            roughness={0.15} 
            metalness={0.95}
            envMapIntensity={2.0}
        />
      </instancedMesh>

      {/* Baubles */}
      <instancedMesh ref={sphereMeshRef} args={[undefined, undefined, ORNAMENT_SPHERE_COUNT]}>
        <sphereGeometry args={[1, 32, 32]} />
        <instancedBufferAttribute attach="instanceColor" args={[sphereColors, 3]} />
        <meshStandardMaterial 
            roughness={0.1} 
            metalness={1.0} 
            envMapIntensity={1.5}
        />
      </instancedMesh>
    </group>
  );
};

export default Ornaments;