# Combo Meal - Modular Structure

Last Updated: March 26, 2025 by APlasker

## Overview

This is the modular version of the Combo Meal game, which has been refactored from a single large sketch.js file into separate modules following p5.js best practices. The modular structure makes the code more maintainable, easier to extend, and simpler to debug.

## Project Structure

- `modular-index.html` - Entry point HTML file for the modular version
- `js/index.js` - Main JavaScript entry point that loads the modules
- `js/modules/` - Directory containing all game modules:
  - `main.js` - Core game logic and p5.js lifecycle methods
  - `animations.js` - Animation classes and functions
  - `ui-components.js` - UI components and drawing utilities
  - `vessels.js` - Vessel classes for game ingredients and combinations
  - `utils.js` - Utility functions and helpers
  - `game-mechanics.js` - Game mechanics and logic

## Key Changes

1. **Converted to Instance Mode**: The game now uses p5.js instance mode instead of global mode, which prevents polluting the global namespace.

2. **Modular Architecture**: Game components are organized into logical modules with clear responsibilities.

3. **ES6 Modules**: Using native JavaScript modules for better code organization and dependency management.

4. **Improved Encapsulation**: Each module exposes only what's necessary through a clean API.

5. **Centralized State Management**: Game state is managed in the main module and passed to other modules as needed.

## Running the Game

To run the modular version of the game, open `modular-index.html` in a modern browser that supports ES6 modules. Note that because ES6 modules require a server to function properly, you may need to run a local development server rather than opening the file directly.

For local development, you can use:

```
npx http-server .
```

Then navigate to `http://localhost:8080/modular-index.html`.

## Extending the Game

To add new features:

1. Identify the appropriate module for your feature
2. Add your functionality to that module
3. Export your new functions/classes through the module's public API
4. Import and use your feature in the main game module

## Technical Notes

- The game is designed to work on both desktop and mobile devices
- ES6 module imports require a web server - they won't work with file:// URLs
- All p5.js functions are accessed through the instance (p) rather than globally

## Credits

- Original Development: Ben Alpert
- Modularization: APlasker
- Framework: p5.js 