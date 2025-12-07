import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene } from './scene.js';
import { updateLoadingStatus } from './models.js';
import { playerCar } from './playerCar.js';

// AI car object
export let aiCar = null;
let aiCarRotation = 0;
let aiCarLoaded = false;

// Pre-recorded path data - will be provided by user
let preRecordedPath = []; // Array of {x, y, z, rotation} objects
let currentFrame = 0; // Current frame in the replay

// Function to load pre-recorded path
export function loadPreRecordedPath(pathData) {
    preRecordedPath = pathData;
    currentFrame = 0;
}

// Load AI car model
const loader = new GLTFLoader();

export function loadAICar() {
    loader.load(
        'playercar2.glb',
        function (gltf) {
            aiCar = gltf.scene;

            // Scale and position - start slightly offset from player
            aiCar.scale.set(1.5, 1.5, 1.5);
            aiCar.position.set(-47, 10, -120); // Start 10 units to the left of player

            // Enable shadows
            aiCar.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Initial rotation
            aiCarRotation = Math.PI;
            aiCar.rotation.y = aiCarRotation;

            scene.add(aiCar);
            aiCarLoaded = true;

            // Update loading status
            updateLoadingStatus();
        },
        undefined,
        function (error) {
            console.error('Error loading AI car:', error);
        }
    );
}

// AI movement logic - follow pre-recorded path
export function moveAICar(raceStarted) {
    if (!aiCar || !aiCarLoaded || !raceStarted) return;

    // Check if we have a pre-recorded path loaded
    if (preRecordedPath.length === 0) {
        return;
    }

    // Check if we've reached the end of the path
    if (currentFrame >= preRecordedPath.length) {
        // Loop back to start or stay at end
        currentFrame = 0;
    }

    // Get current frame data
    const frameData = preRecordedPath[currentFrame];

    // Set AI car to exact position and rotation from recording
    aiCar.position.x = frameData.x;
    aiCar.position.z = frameData.z;

    // Smoothly interpolate Y position to avoid hopping
    const lerpFactor = 0.15;
    aiCar.position.y += (frameData.y - aiCar.position.y) * lerpFactor;

    aiCar.rotation.y = frameData.rotation;
    aiCarRotation = frameData.rotation;

    // --- Car-to-car collision detection (AI side, optimized) ---
    if (playerCar) {
        // Quick distance check before expensive collision
        if (Math.abs(aiCar.position.x - playerCar.position.x) < 20 &&
            Math.abs(aiCar.position.z - playerCar.position.z) < 20) {

            // Check horizontal distance only (ignore Y to prevent cars going under each other)
            const carDistance = Math.hypot(
                aiCar.position.x - playerCar.position.x,
                aiCar.position.z - playerCar.position.z
            );
            const collisionRadius = 7; // Same threshold as player car

            if (carDistance < collisionRadius) {
                // Cars are colliding, push AI car away from player car
                const pushDirection = new THREE.Vector3();
                pushDirection.subVectors(aiCar.position, playerCar.position);
                pushDirection.y = 0; // Keep horizontal
                pushDirection.normalize();

                // Push the AI car away with much stronger force
                const pushStrength = (collisionRadius - carDistance) * 1.5;
                aiCar.position.add(pushDirection.multiplyScalar(pushStrength));

                // Force cars to same height to prevent going under/over each other
                aiCar.position.y = playerCar.position.y;
            }
        }
    }

    // Move to next frame
    currentFrame++;
}

// Get AI car position (for camera, collision detection, etc.)
export function getAICarPosition() {
    return aiCar ? aiCar.position : null;
}

// Reset AI car to starting position
export function resetAICar() {
    if (aiCar) {
        aiCar.position.set(-47, 10, -120);
        aiCarRotation = Math.PI;
        aiCar.rotation.y = aiCarRotation;
        currentFrame = 0; // Reset replay frame counter
    }
}
