import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene } from './scene.js';
import { showReadyMessage } from './countdown.js';
import { positionCarOnTrack } from './playerCar.js';

// GLTF Loader
const loader = new GLTFLoader();
export let terrain, racetrack;
let modelsLoaded = 0;
const totalModels = 4; // terrain, racetrack, playerCar, aiCar

export function updateLoadingStatus() {
    modelsLoaded++;

    if (modelsLoaded === totalModels) {
        // Hide loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        // Show info panel
        const infoPanel = document.getElementById('info');
        if (infoPanel) {
            infoPanel.style.display = 'block';
        }

        // Position car on track surface
        positionCarOnTrack(racetrack);

        // Show ready message and wait for spacebar
        showReadyMessage();
    }
}

// Load rocky desert terrain
export function loadTerrain() {
    loader.load(
        'rocky_desert_-_terrain.glb',
        function (gltf) {
            terrain = gltf.scene;

            // Enable shadows for terrain
            terrain.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Scale and position terrain
            terrain.scale.set(1000, 1000, 1000);
            terrain.position.set(0, 0, 0);
            scene.add(terrain);

            updateLoadingStatus();

        },
        undefined,
        function (error) {
            console.error('Error loading terrain:', error);
        }
    );
}

// Load lowpoly racetrack
export function loadRacetrack() {
    loader.load(
        'lowpoly_racetrack.glb',
        function (gltf) {
            racetrack = gltf.scene;

            // Enable shadows for racetrack and make it white
            racetrack.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material = child.material.clone();
                    child.material.color.setHex(0xFFFFFF);
                }
            });

            // Scale and position racetrack
            racetrack.scale.set(3, 3, 3);
            racetrack.position.set(-50, 15, -150);
            racetrack.rotation.y = Math.PI;
            scene.add(racetrack);

            updateLoadingStatus();

        },
        undefined,
        function (error) {
            console.error('Error loading racetrack:', error);
        }
    );
}
