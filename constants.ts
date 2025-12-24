import * as THREE from 'three';

// Colors
export const COLORS = {
  EMERALD_DARK: new THREE.Color('#012e16'),
  EMERALD_LIGHT: new THREE.Color('#005c2e'),
  GOLD_METALLIC: new THREE.Color('#FFD700'),
  GOLD_PALE: new THREE.Color('#FCEabb'),
  RED_VELVET: new THREE.Color('#680C0C'),
  PINK_LUX: new THREE.Color('#FF94B2'), // Soft luxury pink
  BG_DARK: '#020402',
};

// Tree Dimensions
export const TREE_HEIGHT = 12;
export const TREE_RADIUS_BOTTOM = 5;
export const SCATTER_RADIUS = 25;

// Particle Counts
export const FOLIAGE_COUNT = 15000;
export const ORNAMENT_SPHERE_COUNT = 600; 
export const ORNAMENT_BOX_COUNT = 1200; 
export const SPIRAL_PARTICLE_COUNT = 800; 
export const MEMORY_COUNT = 50; // Total number of photo cards generated (will cycle through the images below)

// Animation
export const ANIMATION_SPEED = 2.5; // Speed of interpolation

// Memories (User Images)
// IMPORTANT: Web browsers BLOCK 'file:///' paths for security reasons. 
// You cannot load images directly from your hard drive like "file:///Users/...".
// 
// TO USE YOUR OWN PHOTOS:
// 1. Move your image files into the 'public' folder of your project (the same folder as index.html).
// 2. Reference them by filename with a forward slash, e.g., "/IMG_3300.JPG".
export const MEMORY_IMAGES = [
  // --- Your Photos (Example: move to public folder first) ---
  // "/IMG_3300.JPG",
  // "/IMG_3388.JPG",

  // --- Default Atmospheric Images (Restored for visibility) ---
  // 1. Warm Sunset & Silhouettes
  "https://images.unsplash.com/photo-1516091278147-3d9c2d765b2d?q=80&w=800&auto=format&fit=crop",

  // 2. Clouds/Dreamy
  "https://images.unsplash.com/photo-1505322022379-7c3353ee6291?q=80&w=800&auto=format&fit=crop",

  // 3. Friendship/Swing
  "https://images.unsplash.com/photo-1533228876829-65c94e7b5025?q=80&w=800&auto=format&fit=crop",

  // 4. Piano/Concert
  "https://images.unsplash.com/photo-1552422535-c45813c61732?q=80&w=800&auto=format&fit=crop",

  // 5. Light Effects
  "https://images.unsplash.com/photo-1516575334481-f85287c2c81d?q=80&w=800&auto=format&fit=crop",

  // 6. Art Vibe
  "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=800&auto=format&fit=crop",

  // 7. Winter Sparkle
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop",
  
  // 8. Candlelight
  "https://images.unsplash.com/photo-1544275825-9988716b377a?q=80&w=800&auto=format&fit=crop",
];