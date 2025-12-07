import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { camera, renderer } from './scene.js';

// OrbitControls
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 500000;
controls.zoomSpeed = 20.0;
controls.enabled = false; // Disabled for third-person controls

export let raceStarted = false; // Race starts after countdown

// Control mode: 'keyboard' or 'microbit'
export let controlMode = 'keyboard';

export const keys = {
    forward: false,
    rotateLeft: false,
    rotateRight: false
};

// Microbit serial connection
let port = null;
let reader = null;

// Keyboard event listeners
window.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case ' ': keys.forward = true; e.preventDefault(); break;
        case 'arrowleft': keys.rotateLeft = true; break;
        case 'arrowright': keys.rotateRight = true; break;
    }
});

window.addEventListener('keyup', (e) => {
    switch(e.key.toLowerCase()) {
        case ' ': keys.forward = false; e.preventDefault(); break;
        case 'arrowleft': keys.rotateLeft = false; break;
        case 'arrowright': keys.rotateRight = false; break;
    }
});

// Function to set race started state
export function setRaceStarted(value) {
    raceStarted = value;
}

// Function to get race started state
export function getRaceStarted() {
    return raceStarted;
}

// Function to toggle control mode
export function setControlMode(mode) {
    controlMode = mode;
    console.log('Control mode set to:', mode);

    // Reset keys when switching modes
    keys.rotateLeft = false;
    keys.rotateRight = false;

    // In microbit mode, always move forward
    if (mode === 'microbit') {
        keys.forward = true;
    } else {
        keys.forward = false;
    }
}

// Function to get current control mode
export function getControlMode() {
    return controlMode;
}

// Connect to micro:bit via Web Serial API
export async function connectMicrobit() {
    try {
        // Request a port and open a connection
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });

        console.log('Connected to micro:bit!');

        // Switch to microbit mode
        setControlMode('microbit');

        // Start reading from the microbit
        readMicrobitData();

        return true;
    } catch (error) {
        console.error('Error connecting to micro:bit:', error);
        return false;
    }
}

// Disconnect from micro:bit
export async function disconnectMicrobit() {
    try {
        if (reader) {
            await reader.cancel();
            reader = null;
        }
        if (port) {
            await port.close();
            port = null;
        }

        // Switch back to keyboard mode
        setControlMode('keyboard');

        console.log('Disconnected from micro:bit');
        return true;
    } catch (error) {
        console.error('Error disconnecting from micro:bit:', error);
        return false;
    }
}

// Read data from micro:bit
async function readMicrobitData() {
    const textDecoder = new TextDecoderStream();
    port.readable.pipeTo(textDecoder.writable);
    reader = textDecoder.readable.getReader();

    let buffer = '';

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }

            // Accumulate data in buffer
            buffer += value;

            // Process complete lines (ending with newline)
            let lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer

            for (let line of lines) {
                line = line.trim();
                if (line.length > 0) {
                    // Parse rotation value from microbit
                    const rotation = parseFloat(line);
                    if (!isNaN(rotation)) {
                        updateKeysFromMicrobit(rotation);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error reading from micro:bit:', error);
    } finally {
        reader.releaseLock();
    }
}

// Update keys based on microbit rotation
function updateKeysFromMicrobit(rotation) {
    // Only update if in microbit mode
    if (controlMode !== 'microbit') return;

    // Threshold for triggering rotation (adjust as needed)
    const threshold = 0.15;

    // rotation is from -1 (tilt left) to 1 (tilt right)
    if (rotation < -threshold) {
        keys.rotateLeft = true;
        keys.rotateRight = false;
    } else if (rotation > threshold) {
        keys.rotateLeft = false;
        keys.rotateRight = true;
    } else {
        // Neutral position
        keys.rotateLeft = false;
        keys.rotateRight = false;
    }

    // Always move forward in microbit mode
    keys.forward = true;
}
