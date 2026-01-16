/**
 * TimeUtils.js
 * Utilities for time-based calculations and displays
 */

// A simple function to get the current time in a specific format
export function getCurrentTimestamp() {
    const now = new Date();
    return now.toUTCString();
}

// Example of another utility function
export function secondsToHMS(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}