import { setRaceStarted } from './controls.js';

let countdownStarted = false;

// Show "Ready" message when all models are loaded
export function showReadyMessage() {
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownText = document.getElementById('countdown-text');

    if (!countdownOverlay || !countdownText) {
        console.error('Countdown elements not found!');
        return;
    }

    // Show "Pikes Peak Derby" message
    countdownOverlay.style.display = 'flex';
    countdownText.textContent = 'Pikes Peak Hill Climb';
    countdownText.style.color = '#fff';
    countdownText.style.fontSize = '100px';
    countdownText.style.animation = 'countdownPulse 0.8s ease-out';

    // Add "(Click space to start race)" message
    const startMessage = document.createElement('div');
    startMessage.textContent = 'Click SPACE to start race';
    startMessage.style.color = '#fff';
    startMessage.style.fontSize = '50px';
    startMessage.style.marginTop = '20px';
    startMessage.style.fontFamily = 'Arial, sans-serif';
    startMessage.style.textAlign = 'center';
    countdownOverlay.appendChild(startMessage);

    // Wait for spacebar press to start countdown
    const spacebarHandler = (e) => {
        if (e.key === ' ' && !countdownStarted) {
            e.preventDefault();
            window.removeEventListener('keydown', spacebarHandler);

            // Remove "(Click space to start race)" message
            startMessage.remove();

            // Trigger the race start
            triggerRaceStart();
        }
    };

    window.addEventListener('keydown', spacebarHandler);
}

// Function to trigger countdown and music (can be called from microbit or spacebar)
export function triggerRaceStart() {
    if (countdownStarted) return; // Already started

    countdownStarted = true;

    // Hide the ready message
    const countdownOverlay = document.getElementById('countdown-overlay');
    const existingMessage = countdownOverlay?.querySelector('div:not(#countdown-text)');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Play mariokart.mp3 (instrumental keeps playing)
    const raceMusic = document.getElementById('race-music');
    const backgroundMusic = document.getElementById('background-music');

    if (raceMusic) {
        raceMusic.volume = 0.5;
        raceMusic.play().catch((error) => {
            console.error('Error playing race music:', error);
        });

        // When mariokart.mp3 ends, play racecar.mp3
        raceMusic.addEventListener('ended', () => {
            if (backgroundMusic) {
                backgroundMusic.volume = 0.5;
                backgroundMusic.play().catch((error) => {
                    console.error('Error playing background music:', error);
                });
            }
        }, { once: true });
    }

    // Start the countdown
    startRaceCountdown();
}

// Race countdown function
export function startRaceCountdown() {
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownText = document.getElementById('countdown-text');

    if (!countdownOverlay || !countdownText) {
        console.error('Countdown elements not found!');
        return;
    }

    // Show countdown overlay
    countdownOverlay.style.display = 'flex';
    countdownText.style.color = '#fff'; // Reset color

    let count = 3;

    function updateCountdown() {
        if (count > 0) {
            countdownText.textContent = count;
            countdownText.style.animation = 'none';
            // Trigger reflow to restart animation
            void countdownText.offsetWidth;
            countdownText.style.animation = 'countdownPulse 0.8s ease-out';
            count--;
            setTimeout(updateCountdown, 1000);
        } else {
            // Show "GO!" when count reaches 0
            countdownText.textContent = 'GO!';
            countdownText.style.animation = 'none';
            void countdownText.offsetWidth;
            countdownText.style.animation = 'countdownPulse 0.8s ease-out';
            countdownText.style.color = '#00ff00'; // Green for GO

            // Start the race
            setRaceStarted(true);

            // Hide countdown after a moment
            setTimeout(() => {
                countdownText.classList.add('countdown-fade');
                setTimeout(() => {
                    countdownOverlay.style.display = 'none';
                }, 300);
            }, 800);
        }
    }

    // Start countdown immediately
    updateCountdown();
}
