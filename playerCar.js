import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene, camera } from './scene.js';
import { updateLoadingStatus } from './models.js';
import { aiCar } from './aiCar.js';

// Player car object
export let playerCar = null;
export let carRotation = 0; // Track car's Y rotation separately

// Car physics
export const carSpeed = 1.0; // moveSpeed
export const carRotateSpeed = 0.02; // rotateSpeed
export const microbitRotateSpeed = 0.02; // Higher rotation speed for microbit control (3x faster)

// Movement logging for AI replay
let movementLog = [];
let isLogging = false; // Set to true to record movements

// Performance optimization
let frameCounter = 0;
let cachedTerrainHeight = 0;

// Function to export movement log
export function exportMovementLog() {
    return movementLog;
}

// Function to clear movement log
export function clearMovementLog() {
    movementLog = [];
}

// Function to enable/disable logging
export function setLogging(enabled) {
    isLogging = enabled;
    if (enabled) {
        movementLog = [];
    }
}

// Camera offset (behind and above the car)
const cameraOffset = new THREE.Vector3(0, 8, -15); // x, y, z offset from car (negative z for behind)

// Load player car model
const loader = new GLTFLoader();
let carLoaded = false;
let cameraInitialized = false;

export function loadPlayerCar() {
    loader.load(
        'playercar.glb',
        function (gltf) {
            playerCar = gltf.scene;

            // Scale and position from your code
            playerCar.scale.set(300, 300, 300);
            playerCar.position.set(-50, 20, -140); // start on track

            // Enable shadows for the car
            playerCar.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Initial rotation (facing forward) - rotate 180 degrees to face correct direction
            carRotation = Math.PI;
            playerCar.rotation.y = carRotation;

            scene.add(playerCar);
            carLoaded = true;

            // Update loading status
            updateLoadingStatus();
        },
        undefined,
        function (error) {
            console.error('Error loading player car:', error);
        }
    );
}

// Update camera to follow the car
export function updateCameraFollowCar() {
    if (!playerCar) return;

    // Calculate camera position based on car position and rotation
    const offset = cameraOffset.clone();
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotation);

    const targetPosition = new THREE.Vector3();
    targetPosition.copy(playerCar.position).add(offset);

    // Set camera position directly on first frame, then lerp smoothly
    if (!cameraInitialized) {
        camera.position.copy(targetPosition);
        cameraInitialized = true;
    } else {
        // Smoothly move camera to target position
        camera.position.lerp(targetPosition, 0.1);
    }

    // Make camera look at the car
    const lookAtTarget = playerCar.position.clone();
    lookAtTarget.y += 3; // Look at a point slightly above the car
    camera.lookAt(lookAtTarget);
}

// Move the car based on input
let currentSpeed = 0; // Current speed of the car

export function movePlayerCar(keys, racetrack, terrain, controlMode = 'keyboard') {
    if (!playerCar || !carLoaded || !racetrack) return;

    // Choose rotation speed based on control mode
    const rotateSpeed = controlMode === 'microbit' ? microbitRotateSpeed : carRotateSpeed;

    // Rotation on Y-axis (left/right)
    if (keys.rotateLeft) carRotation += rotateSpeed;
    if (keys.rotateRight) carRotation -= rotateSpeed;

    // Update car rotation
    playerCar.rotation.y = carRotation;

    // Adjust current speed based on user input
    if (keys.forward) {
        // Accelerate towards max speed
        currentSpeed += 0.05; // Acceleration rate
        if (currentSpeed > carSpeed) currentSpeed = carSpeed; // Cap at max speed
    } else {
        // Decelerate towards zero
        currentSpeed -= 0.02; // Deceleration rate
        if (currentSpeed < 0) currentSpeed = 0; // Don't go below zero
    }

    // Update the speedometer
    updateSpeedometer(currentSpeed);

    // Movement direction based on car rotation
    const direction = new THREE.Vector3();
    direction.z += currentSpeed; // Use current speed for movement
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotation);

    // Move car
    playerCar.position.add(direction);

    // --- Slide-along-edge logic ---
    const sensorOffsets = [
        new THREE.Vector3(1.5, 0, 2),   // front-right
        new THREE.Vector3(-1.5, 0, 2),  // front-left
        new THREE.Vector3(1.5, 0, -2),  // back-right
        new THREE.Vector3(-1.5, 0, -2)  // back-left
    ];

    const correctionVector = new THREE.Vector3();

    sensorOffsets.forEach(offset => {
        const worldOffset = offset.clone().applyAxisAngle(new THREE.Vector3(0,1,0), carRotation);
        const sensorPos = playerCar.position.clone().add(worldOffset).add(new THREE.Vector3(0,50,0));

        const raycaster = new THREE.Raycaster(sensorPos, new THREE.Vector3(0,-1,0));
        raycaster.far = 100; // Limit raycast distance for performance
        const intersects = raycaster.intersectObject(racetrack, true);

        if (intersects.length === 0) {
            // Point is off track, push car back along the vector from sensor to car center
            const pushBack = playerCar.position.clone().sub(sensorPos).setY(0);
            correctionVector.add(pushBack);
        }
    });

    // Apply correction
    playerCar.position.add(correctionVector.multiplyScalar(0.5));

    // --- Car-to-car collision detection (optimized) ---
    if (aiCar) {
        // Quick distance check before expensive collision
        if (Math.abs(playerCar.position.x - aiCar.position.x) < 20 &&
            Math.abs(playerCar.position.z - aiCar.position.z) < 20) {

            // Check horizontal distance only (ignore Y to prevent cars going under each other)
            const carDistance = Math.hypot(
                playerCar.position.x - aiCar.position.x,
                playerCar.position.z - aiCar.position.z
            );
            const collisionRadius = 7; // Distance threshold for collision

            if (carDistance < collisionRadius) {
                // Cars are colliding, push player car away from AI car
                const pushDirection = new THREE.Vector3();
                pushDirection.subVectors(playerCar.position, aiCar.position);
                pushDirection.y = 0; // Keep horizontal
                pushDirection.normalize();

                // Push the player car away with much stronger force
                const pushStrength = (collisionRadius - carDistance) * 2.0;
                playerCar.position.add(pushDirection.multiplyScalar(pushStrength));

                // Force cars to same height to prevent going under/over each other
                playerCar.position.y = aiCar.position.y;

                // Reduce speed significantly on collision
                currentSpeed *= 0.5;
            }
        }
    }

    // --- Adjust Y to terrain/track (optimized - every 2 frames) ---
    frameCounter++;

    if (frameCounter % 2 === 0) {
        const downRay = new THREE.Raycaster(playerCar.position.clone().add(new THREE.Vector3(0,50,0)), new THREE.Vector3(0,-1,0));
        downRay.far = 100; // Limit raycast distance for performance

        const trackIntersects = downRay.intersectObject(racetrack, true);
        let targetY = playerCar.position.y;

        if (trackIntersects.length > 0) targetY = trackIntersects[0].point.y + 1.0;

        if (terrain) {
            const terrainIntersects = downRay.intersectObject(terrain, true);
            if (terrainIntersects.length > 0) targetY = Math.max(targetY, terrainIntersects[0].point.y + 1.0);
        }

        cachedTerrainHeight = targetY;
    }

    // Smoothly interpolate to target height instead of instant snap
    const lerpFactor = 0.3; // Higher = more responsive to prevent sinking into terrain
    playerCar.position.y += (cachedTerrainHeight - playerCar.position.y) * lerpFactor;
}

// Function to update the speedometer
function updateSpeedometer(speed) {
    const speedometer = document.getElementById('speedometer');
    const speedValue = document.getElementById('speed-value');

    if (speedometer && speedValue) {
        // Scale the speed for realistic MPH values
        const speedScalingFactor = 20; // Adjust this factor to simulate real-world speeds
        const scaledSpeed = speed * speedScalingFactor;

        // Convert scaled speed to MPH
        const speedInMPH = Math.round(scaledSpeed * 5.237); // 1 m/s = 2.237 mph
        speedValue.textContent = speedInMPH;
    }

    // Log movement data for AI replay
    if (isLogging) {
        movementLog.push({
            x: playerCar.position.x,
            y: playerCar.position.y,
            z: playerCar.position.z,
            rotation: carRotation
        });
    }
}

// Position car on track surface (called after models load)
export function positionCarOnTrack(racetrack) {
    if (!playerCar || !racetrack) return;

    const raycaster = new THREE.Raycaster();
    const downVector = new THREE.Vector3(0, -1, 0);

    // Start raycast from above the car's current position
    const startPosition = playerCar.position.clone();
    startPosition.y += 100; // Start 100 units above

    raycaster.set(startPosition, downVector);
    const intersects = raycaster.intersectObject(racetrack, true);

    if (intersects.length > 0) {
        // Position car slightly above the track surface
        playerCar.position.y = intersects[0].point.y + 0.5;
    }
}
