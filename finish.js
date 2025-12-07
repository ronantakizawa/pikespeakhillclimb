import { setRaceStarted } from './controls.js';

let raceFinished = false;
let playerStartedOnce = false; // Track if player has moved away from start
let aiStartedOnce = false; // Track if AI has moved away from start

// Finish line coordinates (same as player's starting position)
const finishLineX = -50;
const finishLineZ = -140;
const finishTolerance = 10; // Tolerance in units for finish detection

// Check if the player car has crossed the finish line
export function checkFinish(carPosition) {
    if (raceFinished) return false;

    // Check distance to the finish line
    const distanceFromFinish = Math.hypot(
        carPosition.x - finishLineX,
        carPosition.z - finishLineZ
    );

    // Car needs to move at least 50 units away from finish line before we start checking
    if (!playerStartedOnce && distanceFromFinish > 50) {
        playerStartedOnce = true;
    }

    // Only check for finish if car has moved far away and is now back at finish
    if (playerStartedOnce && distanceFromFinish <= finishTolerance) {
        triggerFinish('player');
        return true;
    }

    return false;
}

// Check if the AI car has crossed the finish line
export function checkAIFinish(carPosition) {
    if (raceFinished) return false;

    // Check distance to the finish line
    const distanceFromFinish = Math.hypot(
        carPosition.x - finishLineX,
        carPosition.z - finishLineZ
    );

    // AI needs to move at least 50 units away from finish line before we start checking
    if (!aiStartedOnce && distanceFromFinish > 50) {
        aiStartedOnce = true;
    }

    // Only check for finish if AI has moved far away and is now back at finish
    if (aiStartedOnce && distanceFromFinish <= finishTolerance) {
        triggerFinish('ai');
        return true;
    }

    return false;
}

// Trigger the finish animation and audio
function triggerFinish(whoWon) {
    raceFinished = true;

    // Stop the race
    setRaceStarted(false);

    // Stop background music
    const backgroundMusic = document.getElementById('background-music');
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }

    // Play finish music
    const finishMusic = document.getElementById('finish-music');
    if (finishMusic) {
        finishMusic.volume = 0.5;
        finishMusic.play().catch((error) => {
            console.error('Error playing finish music:', error);
        });
    }

    // Show finish overlay
    showFinishMessage(whoWon);
}

// Show finish message with winner
function showFinishMessage(whoWon) {
    const finishOverlay = document.getElementById('finish-overlay');
    const finishText = document.getElementById('finish-text');

    if (!finishOverlay || !finishText) {
        console.error('Finish overlay elements not found!');
        return;
    }

    // Show finish overlay with winner message
    finishOverlay.style.display = 'flex';

    if (whoWon === 'player') {
        finishText.textContent = 'YOU WIN!';
        finishText.style.color = '#FFD700'; // Gold for winner
    } else {
        finishText.textContent = 'AI WINS!';
        finishText.style.color = '#FF4444'; // Red for loss
    }

    finishText.style.animation = 'none';

    // Trigger reflow to restart animation
    void finishText.offsetWidth;
    finishText.style.animation = 'countdownPulse 0.8s ease-out';

    // Keep the finish message visible (don't auto-hide)
}

// Reset the race finish state (for restarting the race)
export function resetFinish() {
    raceFinished = false;
    playerStartedOnce = false;
    aiStartedOnce = false;

    const finishOverlay = document.getElementById('finish-overlay');
    if (finishOverlay) {
        finishOverlay.style.display = 'none';
    }
}

// Get race finished state
export function isRaceFinished() {
    return raceFinished;
}
