import React, { useState } from 'react';
import Experience from './components/Experience';
import Overlay from './components/Overlay';
import { TreeMorphState } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.TREE_SHAPE);

  const toggleState = () => {
    setTreeState(prev => 
      prev === TreeMorphState.TREE_SHAPE 
        ? TreeMorphState.SCATTERED 
        : TreeMorphState.TREE_SHAPE
    );
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Experience treeState={treeState} />
      </div>

      {/* UI Overlay Layer */}
      <Overlay treeState={treeState} onToggle={toggleState} />
      
      {/* Vignette Overlay for extra depth (CSS fallback if postprocessing fails) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
    </div>
  );
};

export default App;