import { scene, camera, renderer } from './scene.js';
import { keys, getRaceStarted, getControlMode } from './controls.js';
import { racetrack, terrain } from './models.js';
import { movePlayerCar, updateCameraFollowCar, playerCar } from './playerCar.js';
import { moveAICar, aiCar } from './aiCar.js';
import { checkFinish, checkAIFinish } from './finish.js';

// Animation loop
export function animate() {
    requestAnimationFrame(animate);

    // Always update camera to follow the car
    updateCameraFollowCar();

    // Handle car movement (only if race has started)
    if (getRaceStarted()) {
        // Move the player car based on input, passing control mode for rotation speed
        movePlayerCar(keys, racetrack, terrain, getControlMode());

        // Move AI car (follows pre-recorded path)
        moveAICar(getRaceStarted());

        // Check if player car has crossed the finish line
        if (playerCar) {
            checkFinish(playerCar.position);
        }

        // Check if AI car has crossed the finish line
        if (aiCar) {
            checkAIFinish(aiCar.position);
        }
    }

    renderer.render(scene, camera);
}
