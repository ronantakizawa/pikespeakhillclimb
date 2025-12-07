import { connectMicrobit, disconnectMicrobit, setControlMode } from './controls.js';
import { triggerRaceStart } from './countdown.js';

// Setup microbit UI button handlers
export function setupMicrobitUI() {
    const connectBtn = document.getElementById('connect-microbit');
    const disconnectBtn = document.getElementById('disconnect-microbit');
    const switchKeyboardBtn = document.getElementById('switch-keyboard');
    const switchMicrobitBtn = document.getElementById('switch-microbit');
    const keyboardControls = document.getElementById('keyboard-controls');
    const microbitControls = document.getElementById('microbit-controls');

    // Connect to micro:bit
    connectBtn.addEventListener('click', async () => {
        const success = await connectMicrobit();
        if (success) {
            // Update UI
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'inline-block';
            switchKeyboardBtn.style.display = 'inline-block';
            keyboardControls.style.display = 'none';
            microbitControls.style.display = 'block';

            // Immediately trigger the race start countdown
            triggerRaceStart();
        }
    });

    // Disconnect from micro:bit
    disconnectBtn.addEventListener('click', async () => {
        const success = await disconnectMicrobit();
        if (success) {
            // Update UI
            connectBtn.style.display = 'inline-block';
            disconnectBtn.style.display = 'none';
            switchKeyboardBtn.style.display = 'none';
            keyboardControls.style.display = 'block';
            microbitControls.style.display = 'none';
        }
    });

    // Switch back to keyboard controls (without disconnecting)
    switchKeyboardBtn.addEventListener('click', () => {
        setControlMode('keyboard');
        keyboardControls.style.display = 'block';
        microbitControls.style.display = 'none';
        switchKeyboardBtn.style.display = 'none';
        switchMicrobitBtn.style.display = 'inline-block';
    });

    // Switch back to micro:bit controls
    switchMicrobitBtn.addEventListener('click', () => {
        setControlMode('microbit');
        keyboardControls.style.display = 'none';
        microbitControls.style.display = 'block';
        switchMicrobitBtn.style.display = 'none';
        switchKeyboardBtn.style.display = 'inline-block';
    });
}
