import * as THREE from 'three';
import { scene } from './scene.js';

// Lighting - Much stronger
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(50000, 100000, 30000);
scene.add(directionalLight);

// Additional directional light from another angle
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight2.position.set(-50000, 80000, -30000);
scene.add(directionalLight2);

// Hemisphere light for better outdoor lighting
const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0xd4a574, 1.0);
scene.add(hemisphereLight);
