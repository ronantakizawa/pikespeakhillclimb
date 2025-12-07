import * as THREE from 'three';

// Scene setup
export const scene = new THREE.Scene();

// Load background texture
const textureLoader = new THREE.TextureLoader();
textureLoader.load('background.jpg', (texture) => {
    scene.background = texture;
});

// Camera setup
export const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    2000000
);
// Camera position will be set by the car follow logic

// Renderer setup
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
