import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float, PerspectiveCamera, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import Star from './Star';
import Spiral from './Spiral';
import Memories from './Memories';
import { TreeMorphState } from '../types';
import { COLORS } from '../constants';

interface ExperienceProps {
  treeState: TreeMorphState;
}

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Simple Error Boundary to catch texture loading failures without crashing the app
class ImageErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() { return { hasError: true }; }
  
  render() { return this.state.hasError ? null : this.props.children; }
}

const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
  const isScattered = treeState === TreeMorphState.SCATTERED;

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ 
        antialias: false, 
        toneMapping: 3, // CineonToneMapping
        toneMappingExposure: 1.2 // Reduced from 1.5 for better contrast
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 2, 20]} fov={50} />
      
      {/* Cinematic Lighting */}
      <ambientLight intensity={0.2} color={COLORS.EMERALD_DARK} />
      <spotLight 
        position={[10, 10, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        color="#fffae0" 
        castShadow 
      />
      <pointLight position={[-10, -5, -10]} intensity={1} color={COLORS.GOLD_METALLIC} />
      
      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Floating Sparkles for extra "Flash" (Gold) */}
      <Sparkles 
        count={500} 
        scale={20} 
        size={4} 
        speed={0.4} 
        opacity={0.5} 
        color={COLORS.GOLD_PALE} 
      />

      {/* NEW: Dense Snow Atmosphere (White) */}
      <Sparkles 
        count={3000} 
        scale={35} 
        size={6} 
        speed={0.2} 
        opacity={0.8} 
        noise={0.2}
        color="#ffffff" 
      />

      {/* The Tree System */}
      <group position={[0, -2, 0]}>
          <Float 
            speed={2} 
            rotationIntensity={isScattered ? 0.5 : 0.05} 
            floatIntensity={isScattered ? 1 : 0.1}
          >
            <Foliage treeState={treeState} />
            <Ornaments treeState={treeState} />
            <Spiral treeState={treeState} />
            
            {/* Wrap Memories in Suspense & ErrorBoundary to prevent crashes on image load failure */}
            <Suspense fallback={null}>
              <ImageErrorBoundary>
                <Memories treeState={treeState} />
              </ImageErrorBoundary>
            </Suspense>

            <Star treeState={treeState} />
          </Float>
      </group>

      {/* Orbit Controls (constrained in tree mode, free in scatter mode) */}
      <OrbitControls 
        enablePan={isScattered} // Allow panning only when scattered
        minPolarAngle={isScattered ? 0 : Math.PI / 4} 
        maxPolarAngle={isScattered ? Math.PI : Math.PI / 1.8}
        minDistance={isScattered ? 2 : 10} // Allow getting very close to photos
        maxDistance={isScattered ? 60 : 35}
      />

      {/* Post Processing for the "Glamour" look */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.6} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};

export default Experience;