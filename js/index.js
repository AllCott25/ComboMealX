/**
 * index.js
 * Entry point for the modular version of Combo Meal
 * Last Updated: March 26, 2025 (13:00 EDT) by APlasker
 */

import createGameSketch from './modules/main.js';

// Create the game sketch
const gameSketch = createGameSketch();

// Initialize the p5.js instance with the game sketch
new p5(gameSketch); 