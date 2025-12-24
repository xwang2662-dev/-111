import React from 'react';
import { TreeMorphState } from '../types';

interface OverlayProps {
  treeState: TreeMorphState;
  onToggle: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ treeState, onToggle }) => {
  const isTree = treeState === TreeMorphState.TREE_SHAPE;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-12 z-10">
      
      {/* Header */}
      <header className="flex flex-col items-start gap-2 animate-fade-in-down">
        <div className="border-l-4 border-yellow-500 pl-4">
          <h1 className="text-4xl md:text-6xl font-serif text-white tracking-widest uppercase">
            Merry <span className="text-gold-gradient font-bold">Christmas</span>
          </h1>
          <h2 className="text-xl md:text-2xl text-emerald-200/80 font-light tracking-[0.3em] mt-2">
            Feifei Baobao
          </h2>
        </div>
      </header>

      {/* Controls */}
      <div className="flex justify-end items-end pointer-events-auto">
        <button
          onClick={onToggle}
          className="group relative px-10 py-4 bg-emerald-950/80 backdrop-blur-md border border-yellow-500/30 hover:border-yellow-400 transition-all duration-500 overflow-hidden"
        >
          {/* Button Shine Effect */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          
          <span className="relative z-10 font-serif text-xl tracking-widest text-gold-gradient group-hover:text-yellow-200 transition-colors">
            {isTree ? "RELEASE MEMORY" : "RESTORE ORDER"}
          </span>
          
          {/* Decor corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-500"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-500"></div>
        </button>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 left-12 text-xs text-white/20 tracking-widest font-mono">
        EST. 2024 // REACT THREE FIBER // LUXURY EDITION
      </div>
    </div>
  );
};

export default Overlay;