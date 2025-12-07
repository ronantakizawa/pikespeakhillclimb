import { loadPreRecordedPath } from './aiCar.js';

// Automatically load the pre-recorded path from data.txt
export async function loadPathData() {
    try {
        const response = await fetch('data.txt');
        if (!response.ok) {
            throw new Error('Failed to load data.txt: ' + response.statusText);
        }

        const text = await response.text();
        const pathData = JSON.parse(text);

        loadPreRecordedPath(pathData);
    } catch (error) {
        console.error('Error loading path data:', error);
    }
}
