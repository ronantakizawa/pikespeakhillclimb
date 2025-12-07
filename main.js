// Main entry point - coordinates all modules
import './scene.js';
import './controls.js';
import './lighting.js';
import { loadTerrain, loadRacetrack } from './models.js';
import { loadPlayerCar, exportMovementLog, clearMovementLog, setLogging } from './playerCar.js';
import { loadAICar, loadPreRecordedPath } from './aiCar.js';
import { animate } from './animation.js';
import { setupMicrobitUI } from './microbitUI.js';
import { loadPathData } from './dataLoader.js';

// Play instrumental music on page load
const instrumentalMusic = document.getElementById('instrumental-music');
if (instrumentalMusic) {
    instrumentalMusic.volume = 0.5;
    instrumentalMusic.loop = true; // Ensure loop is set

    // Add ended event listener to restart if loop fails
    instrumentalMusic.addEventListener('ended', () => {
        instrumentalMusic.currentTime = 0;
        instrumentalMusic.play().catch(() => {});
    });

    instrumentalMusic.play().catch(() => {
        // If autoplay is blocked, play on first user interaction
        const playOnInteraction = () => {
            instrumentalMusic.play().catch(() => {});
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('keydown', playOnInteraction);
        };
        document.addEventListener('click', playOnInteraction);
        document.addEventListener('keydown', playOnInteraction);
    });
}

// Setup microbit UI controls
setupMicrobitUI();

// Start loading models
loadTerrain();
loadRacetrack();
loadPlayerCar();
loadAICar();

// Load pre-recorded path data from data.txt
loadPathData();

// Start animation loop
animate();

// Expose logging functions to window for console access
window.exportMovementLog = exportMovementLog;
window.clearMovementLog = clearMovementLog;
window.setLogging = setLogging;
window.loadPreRecordedPath = loadPreRecordedPath;
