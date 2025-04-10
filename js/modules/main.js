/**
 * main.js
 * Main game module for the Combo Meal game
 * Last Updated: April 9, 2025 (15:52 EDT) by APlasker
 * 
 * Note: File structure reorganized on April 9, 2025:
 * - modular-index.html renamed to index.html
 * - Old sketch.js renamed to 4-8-NORTHSTAR-sketch.js
 * - modules-sketch.js renamed to sketch.js
 */

import createAnimationsModule from './animations.js';
import createUIComponentsModule from './ui-components.js';
import createVesselsModule from './vessels.js';
import createUtilsModule from './utils.js';
import createGameMechanicsModule from './game-mechanics.js';

// Create the main game sketch
const createGameSketch = () => {
  return (p) => {
    // Module references
    let animations, ui, vessels, utils, mechanics;
    
    // Define intermediate combinations (will be replaced with data from Supabase)
    let intermediate_combinations = [
      { name: "Fried Chicken Cutlet", required: ["Chicken Cutlet", "Flour", "Eggs", "Panko Bread Crumbs"] },
      { name: "Tomato Sauce", required: ["Garlic", "Red Chile Flakes", "Plum Tomatoes", "Basil"] },
      { name: "Mixed Cheeses", required: ["Parmesan", "Mozzarella"] }
    ];
    
    // Define the final combination (will be replaced with data from Supabase)
    let final_combination = { name: "Chicken Parm", required: ["Fried Chicken Cutlet", "Tomato Sauce", "Mixed Cheeses"] };
    
    // Define easter eggs (will be replaced with data from Supabase)
    let easter_eggs = [];
    
    // Game state variables
    let gameState = "start"; // start, tutorial, playing, win
    let vessels_list = [];
    let columns = []; // All vessels in each column (for checking combinations)
    let draggedVessel = null;
    let offsetX = 0; 
    let offsetY = 0;
    let moveCount = 0;
    let moveHistory = [];
    let displayedVessels = []; // Track all vessels to display
    let usedIngredients = new Set(); // Track ingredients used in combinations
    let combine_animations = [];
    let playingTime = 0;
    let startTime = 0;
    let tutorialStep = 1;
    let tutorialVessels = [];
    let startButton;
    let continueButton;
    let skipTutorialButton;
    let showingHint = false;
    let hintVessel = null;
    let lastHintCombo = null;
    let hintButton;
    let isMobile = false;
    let hintButtonY; // Position of the hint button 
    let initialHintButtonY; // New variable to store the initial hint button position
    let preferredVessel = null;
    let highlightedVessel = null;
    let flowerRotation = 0;
    let eggModals = [];
    let persistentFlowerAnimation = null; // New global variable for persistent flower animation
    let activePartialCombo = null; // Track the currently active partial combination
    let partialCombinations = []; // Track all partial combinations that have been started
    let hintedCombo = null; // Track the combination that is currently being hinted
    
    // Byline state variables - APlasker
    let currentByline = "Drag & drop to combine ingredients!"; // Default byline
    let nextByline = ""; // Store the upcoming byline message
    let bylineTimer = 0; // Timer to track when to revert to default
    let bylineDefaultDuration = 900; // 15 seconds at 60fps
    let bylineHintDuration = 300; // 5 seconds at 60fps for hint message
    let lastAction = 0; // Track the last time the player took an action
    let inactivityThreshold = 900; // 15 seconds of inactivity
    let bylineTransitionState = "stable"; // "stable", "fading-out", "changing", "fading-in"
    let bylineOpacity = 255; // Opacity for fade effect
    let bylineFadeFrames = 15; // Number of frames for fade transition (0.25 seconds)
    let isTransitioning = false; // Flag to prevent interrupting transitions
    let transitionDuration = 0; // Duration to display message after transition
    
    // Store these vessel dimensions globally for consistent calculations
    let basic_w, basic_h, vertical_margin;
    
    // Extract all individual ingredients (will be replaced with data from Supabase)
    let ingredients = [];
    
    // Global variables
    let gameWon = false;
    let turnCounter = 0;
    let animation_list = []; // Array to store active animations
    let titleFont, bodyFont, buttonFont;
    let recipeUrl = "https://www.bonappetit.com/recipe/chicken-parm"; // Will be replaced with data from Supabase
    let isLoadingRecipe = true; // Flag to track if we're still loading recipe data
    let loadingError = false; // Flag to track if there was an error loading recipe data
    let recipeDescription = "A delicious recipe that's sure to please everyone at the table!"; // New variable to store recipe description
    let recipeAuthor = ""; // New variable to store recipe author
    let hintCount = 0; // Track number of hints used
    let isAPlus = false; // Whether the player earned an A+ grade
    let letterGrade; // Player's letter grade (A, B, C, X)
    
    // Global variables for score display and interaction
    let scoreX, scoreY, scoreWidth, scoreHeight;
    let isMouseOverLetterScore = false;
    let recipe_data; // Global variable for recipe data
    
    // Play area constraints
    let maxPlayWidth = 400; // Max width for the play area (phone-sized)
    let playAreaPadding = 20; // Padding around the play area
    let playAreaX, playAreaY, playAreaWidth, playAreaHeight; // Will be calculated in setup
    
    // Color palette
    const COLORS = {
      background: '#F5F1E8',    // Soft cream background
      primary: '#778F5D',       // Avocado green
      secondary: '#D96941',     // Burnt orange
      tertiary: '#E2B33C',      // Mustard yellow
      accent: '#7A9BB5',        // Dusty blue
      text: '#333333',          // Dark gray for text
      vesselBase: '#F9F5EB',    // Cream white for base ingredients
      vesselYellow: '#E2B33C',  // Mustard yellow for partial combinations
      vesselGreen: '#778F5D',   // Avocado green for complete combinations
      vesselHint: '#D96941',    // Burnt orange for hint vessels
      green: '#778F5D'          // Explicit avocado green for all green elements
    };
    
    // Preload assets
    p.preload = function() {
      // Use web-safe fonts instead of trying to load custom fonts
      console.log("Using web-safe fonts for better compatibility");
      titleFont = 'Georgia';
      bodyFont = 'Arial';
      buttonFont = 'Verdana';
      
      // Mark as loading recipe
      isLoadingRecipe = true;
    };
    
    // Setup function
    p.setup = function() {
      p.createCanvas(p.windowWidth, p.windowHeight);
      p.frameRate(60);
      p.textFont(bodyFont);
      
      // Initialize modules
      animations = createAnimationsModule(p);
      ui = createUIComponentsModule(p);
      vessels = createVesselsModule(p);
      utils = createUtilsModule(p);
      mechanics = createGameMechanicsModule(p, animations, vessels, utils);
      
      // Initialize the game
      initializeGame();
      
      // Check if on mobile device
      isMobile = utils.isMobileDevice();
      
      // Create start button
      const buttonWidth = 180;
      const buttonHeight = 50;
      startButton = new ui.Button(
        p.width / 2 - buttonWidth / 2,
        p.height / 2 + 100,
        buttonWidth,
        buttonHeight,
        "START GAME",
        startGame,
        COLORS.primary
      );
      
      // Create hint button
      const hintButtonWidth = 120;
      const hintButtonHeight = 40;
      hintButtonY = p.height - hintButtonHeight - 20;
      initialHintButtonY = hintButtonY;
      
      hintButton = new ui.Button(
        p.width / 2 - hintButtonWidth / 2,
        hintButtonY,
        hintButtonWidth,
        hintButtonHeight,
        "HINT",
        showHint,
        COLORS.secondary
      );
      
      // Load recipe data
      loadRecipeData();
      
      // Extract ingredients from combinations
      updateIngredientsList();
    };
    
    // Draw function
    p.draw = function() {
      try {
        // Clear the background
        p.background(COLORS.background);
        
        try {
          // Update flower rotation
          flowerRotation += 0.002;
          
          // Draw floral elements
          try {
            ui.drawTopBottomFlowers(flowerRotation, COLORS);
          } catch (floralError) {
            console.error("Error drawing floral elements:", floralError);
            // Continue with the rest of the rendering
          }
          
          // Main game state display logic with error handling for each state
          try {
            switch (gameState) {
              case "start":
                try {
                  drawStartScreen();
                } catch (startError) {
                  console.error("Error in start screen:", startError);
                  // Fallback for start screen error
                  p.fill(0);
                  p.textAlign(p.CENTER, p.CENTER);
                  p.text("Loading game...", p.width/2, p.height/2);
                }
                break;
              case "tutorial":
                try {
                  drawTutorialScreen();
                } catch (tutorialError) {
                  console.error("Error in tutorial screen:", tutorialError);
                  // Fallback for tutorial screen
                  p.fill(0);
                  p.text("Tutorial unavailable", p.width/2, p.height/2);
                }
                break;
              case "playing":
                try {
                  drawPlayingScreen();
                } catch (playingError) {
                  console.error("Error in playing screen:", playingError);
                  // Fallback for playing screen
                  p.fill(0);
                  p.text("Game is running", p.width/2, p.height/2);
                }
                break;
              case "win":
                try {
                  drawWinScreen();
                } catch (winError) {
                  console.error("Error in win screen:", winError);
                  // Fallback for win screen
                  p.fill(0);
                  p.text("You won!", p.width/2, p.height/2);
                }
                break;
              default:
                // Unknown game state
                console.warn("Unknown game state:", gameState);
                p.fill(0);
                p.text("Game loading...", p.width/2, p.height/2);
            }
          } catch (stateError) {
            console.error("Critical error in game state handling:", stateError);
            // Emergency fallback
            p.fill(0);
            p.textSize(24);
            p.text("Game is experiencing issues", p.width/2, p.height/2);
          }
          
          // Draw byline if not on win screen
          if (gameState !== "win") {
            try {
              updateAndDrawByline();
            } catch (bylineError) {
              console.error("Error updating byline:", bylineError);
              // We already have error handling in updateAndDrawByline
            }
          }
          
          // Update cursor
          try {
            updateCursor();
          } catch (cursorError) {
            console.error("Error updating cursor:", cursorError);
            // Fallback to default cursor
            p.cursor('default');
          }
        } catch (innerError) {
          console.error("Critical error in draw function:", innerError);
          // Display error message to user
          p.background(245, 245, 245);
          p.fill(200, 0, 0);
          p.textSize(18);
          p.textAlign(p.CENTER, p.CENTER);
          p.text("Game encountered an error. Please refresh.", p.width/2, p.height/2);
        }
      } catch (criticalError) {
        // Last resort error handling - this should never happen
        console.error("Fatal error in draw function:", criticalError);
        try {
          p.background(255);
          p.fill(255, 0, 0);
          p.textSize(16);
          p.text("Fatal error. Please refresh the page.", p.width/2, p.height/2);
        } catch (e) {
          // If we can't even render text, there's not much we can do
          console.error("Cannot recover from error:", e);
        }
      }
    };
    
    // Draw start screen
    function drawStartScreen() {
      // Draw game title
      ui.drawTitle(p.width / 2, p.height / 3, 60, COLORS);
      
      // Draw loading message or error
      p.fill(COLORS.text);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      
      if (isLoadingRecipe) {
        p.text("Loading recipe...", p.width / 2, p.height / 2);
      } else if (loadingError) {
        p.text("Error loading recipe. Please try again later.", p.width / 2, p.height / 2);
      } else {
        // Show recipe info
        p.textSize(24);
        p.textStyle(p.BOLD);
        p.text("Today's Recipe: " + final_combination.name, p.width / 2, p.height / 2 - 40, p.width * 0.8);
        
        p.textSize(16);
        p.textStyle(p.NORMAL);
        const descriptionHeight = 80;
        p.text(recipeDescription, p.width / 2, p.height / 2, p.width * 0.8, descriptionHeight);
        
        // Draw start button
        startButton.draw();
      }
    }
    
    // Draw tutorial screen (placeholder - will be implemented in full version)
    function drawTutorialScreen() {
      p.text("Tutorial - Step " + tutorialStep, p.width / 2, p.height / 2);
      
      // This will be expanded in the full implementation
      if (continueButton) continueButton.draw();
      if (skipTutorialButton) skipTutorialButton.draw();
    }
    
    // Draw playing screen
    function drawPlayingScreen() {
      // Draw play area border
      p.fill(255, 20);
      p.noStroke();
      p.rect(playAreaX, playAreaY, playAreaWidth, playAreaHeight, 10);
      
      // Update and draw all vessels
      for (const vessel of vessels_list) {
        if (vessel === draggedVessel) continue; // Skip dragged vessel
        
        vessel.update();
        vessel.draw();
      }
      
      // Draw hint vessel if active
      if (showingHint && hintVessel) {
        hintVessel.update();
        hintVessel.draw();
      }
      
      // Draw dragged vessel on top
      if (draggedVessel) {
        draggedVessel.update();
        draggedVessel.draw();
      }
      
      // Update and draw animations
      for (let i = animation_list.length - 1; i >= 0; i--) {
        const anim = animation_list[i];
        if (anim.update()) {
          animation_list.splice(i, 1);
        } else {
          anim.draw();
        }
      }
      
      // Draw hint button
      hintButton.draw();
      
      // Draw game counters (moves, time)
      drawGameCounters();
    }
    
    // Draw win screen (placeholder - will be implemented in full version)
    function drawWinScreen() {
      p.text("You won! Final dish: " + final_combination.name, p.width / 2, p.height / 2);
      
      // This will be expanded in the full implementation
    }
    
    // Draw game counters
    function drawGameCounters() {
      p.push();
      
      // Draw move counter
      p.fill(COLORS.text);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(16);
      p.text("Moves: " + moveCount, 20, 20);
      
      // Draw time counter if game is active
      if (gameState === "playing" && startTime > 0) {
        const currentTime = Date.now();
        playingTime = Math.floor((currentTime - startTime) / 1000);
        
        const minutes = Math.floor(playingTime / 60);
        const seconds = playingTime % 60;
        
        p.text(
          "Time: " + minutes + ":" + (seconds < 10 ? "0" : "") + seconds,
          20, 50
        );
      }
      
      p.pop();
    }
    
    // Update and draw byline
    function updateAndDrawByline() {
      try {
        // Check for inactivity to show hint prompt
        if (gameState === "playing" && lastAction > 0) {
          const framesSinceLastAction = p.frameCount - lastAction;
          
          if (framesSinceLastAction > inactivityThreshold && 
              bylineTransitionState === "stable" && 
              currentByline === "Drag & drop to combine ingredients!" &&
              !isTransitioning) {
            updateBylineWithTransition("Try using a HINT if you're stuck!");
          }
        }
        
        // Handle byline timer
        if (bylineTimer > 0) {
          bylineTimer--;
          
          if (bylineTimer === 0 && !isTransitioning) {
            updateBylineWithTransition("Drag & drop to combine ingredients!");
          }
        }
        
        // Handle byline transitions
        if (bylineTransitionState === "fading-out") {
          bylineOpacity -= 255 / bylineFadeFrames;
          
          if (bylineOpacity <= 0) {
            bylineOpacity = 0;
            bylineTransitionState = "changing";
            currentByline = nextByline;
          }
        } else if (bylineTransitionState === "changing") {
          bylineTransitionState = "fading-in";
        } else if (bylineTransitionState === "fading-in") {
          bylineOpacity += 255 / bylineFadeFrames;
          
          if (bylineOpacity >= 255) {
            bylineOpacity = 255;
            bylineTransitionState = "stable";
            isTransitioning = false;
            
            // Set timer if this is a temporary message
            if (transitionDuration > 0) {
              bylineTimer = transitionDuration;
              transitionDuration = 0;
            }
          }
        }
        
        // Draw byline - ensure opacity is a number
        const safeOpacity = typeof bylineOpacity === 'number' ? bylineOpacity : 255;
        
        ui.drawByline(
          currentByline, 
          p.width / 2, 
          p.height - 40, 
          p.width * 0.9, 
          safeOpacity, 
          COLORS
        );
      } catch (err) {
        console.error('Error in updateAndDrawByline:', err);
        // Provide a fallback to prevent game from freezing
        try {
          ui.drawByline(
            "Game in progress...", 
            p.width / 2, 
            p.height - 40, 
            p.width * 0.9, 
            255, 
            { text: '#333333' } // Fallback color object
          );
        } catch (fallbackErr) {
          console.error('Even fallback byline failed:', fallbackErr);
          // At this point, we can't do much more
        }
      }
    }
    
    // Update byline with transition effect
    function updateBylineWithTransition(newMessage, duration = bylineHintDuration) {
      if (isTransitioning) return; // Don't interrupt ongoing transition
      
      isTransitioning = true;
      nextByline = newMessage;
      bylineTransitionState = "fading-out";
      transitionDuration = duration;
    }
    
    // Update cursor based on game state
    function updateCursor() {
      if (draggedVessel) {
        p.cursor('grab');
      } else if (highlightedVessel) {
        p.cursor('pointer');
      } else {
        p.cursor('default');
      }
    }
    
    // Initialize the game
    function initializeGame() {
      // Set up play area dimensions
      playAreaWidth = Math.min(maxPlayWidth, p.width - playAreaPadding * 2);
      playAreaHeight = p.height * 0.7;
      playAreaX = (p.width - playAreaWidth) / 2;
      playAreaY = (p.height - playAreaHeight) / 3;
      
      // Set up vessel dimensions
      basic_w = playAreaWidth / 4 - 10;
      basic_h = 80;
      vertical_margin = 20;
      
      // Clear game state
      gameState = "start";
      moveCount = 0;
      moveHistory = [];
      gameWon = false;
      turnCounter = 0;
      hintCount = 0;
      
      // Update ingredients list
      updateIngredientsList();
      
      // Initialize vessels
      mechanics.initializeGame(ingredients, vessels_list, 
        [...intermediate_combinations, final_combination],
        basic_w, basic_h, COLORS);
      
      // Arrange vessels
      mechanics.arrangeVessels(vessels_list, columns, 
        playAreaX, playAreaY, playAreaWidth, playAreaHeight,
        basic_w, basic_h, vertical_margin);
    }
    
    // Update the ingredients list from combinations
    function updateIngredientsList() {
      ingredients = [...new Set(
        intermediate_combinations.flatMap(c => c.required)
      )];
    }
    
    // Load recipe data
    async function loadRecipeData() {
      isLoadingRecipe = true;
      
      try {
        console.log('Starting recipe data load');
        
        // In the real game, this would fetch from Supabase
        // For now, we'll just simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Setup with hardcoded data for now
        recipe_data = {
          name: "Chicken Parm",
          description: "A classic Italian-American dish with crispy chicken cutlets, tangy tomato sauce, and melty cheese.",
          author: "Bon Appétit Test Kitchen",
          url: "https://www.bonappetit.com/recipe/chicken-parm"
        };
        
        // Update game variables with recipe data
        recipeDescription = recipe_data.description;
        recipeAuthor = recipe_data.author;
        recipeUrl = recipe_data.url;
        
        console.log('Recipe data loaded successfully:', recipe_data.name);
        isLoadingRecipe = false;
      } catch (error) {
        console.error("Error loading recipe data:", error);
        
        // Provide fallback data to ensure game can continue
        recipe_data = {
          name: "Chicken Parm",
          description: "A delicious Italian-American classic.",
          author: "Test Kitchen",
          url: "#"
        };
        
        recipeDescription = recipe_data.description;
        recipeAuthor = recipe_data.author;
        recipeUrl = recipe_data.url;
        
        loadingError = true;
        isLoadingRecipe = false;
        
        // Force transition to game state after error recovery
        setTimeout(() => {
          if (gameState === "start") {
            console.log('Auto-transitioning to game after load error recovery');
            gameState = "playing";
          }
        }, 2000);
      }
    }
    
    // Start the game
    function startGame() {
      gameState = "playing";
      startTime = Date.now();
      lastAction = p.frameCount;
      
      // Reset byline
      currentByline = "Drag & drop to combine ingredients!";
      bylineOpacity = 255;
      bylineTransitionState = "stable";
      isTransitioning = false;
      bylineTimer = 0;
    }
    
    // Show a hint
    function showHint() {
      if (gameState !== "playing" || showingHint) return;
      
      // Find a combination we can hint at
      const availableCombos = [...intermediate_combinations, final_combination];
      let comboToHint = null;
      
      // Prioritize non-hint combos that haven't been made yet
      for (const combo of availableCombos) {
        if (combo === hintedCombo) continue;
        
        // Check if this combo has already been made
        const alreadyMade = vessels_list.some(v => v.name === combo.name);
        
        if (!alreadyMade) {
          comboToHint = combo;
          break;
        }
      }
      
      // If we didn't find a priority combo, just use any unmade combo
      if (!comboToHint) {
        for (const combo of availableCombos) {
          const alreadyMade = vessels_list.some(v => v.name === combo.name);
          
          if (!alreadyMade) {
            comboToHint = combo;
            break;
          }
        }
      }
      
      if (comboToHint) {
        hintedCombo = comboToHint;
        hintCount++;
        
        // Create hint vessel
        hintVessel = mechanics.initializeHintVessel(comboToHint);
        
        // Position hint vessel
        hintVessel.x = playAreaX + (playAreaWidth - hintVessel.w) / 2;
        hintVessel.y = playAreaY + 20;
        
        showingHint = true;
        
        // Update byline
        updateBylineWithTransition("This combination requires these ingredients!");
      } else {
        // No combinations left to hint
        updateBylineWithTransition("No more combinations to hint!");
      }
    }
    
    // Mouse event handlers
    p.mousePressed = function() {
      if (gameState === "start") {
        if (startButton.isInside(p.mouseX, p.mouseY)) {
          startButton.handleClick();
        }
      } else if (gameState === "playing") {
        // Check vessels from top to bottom (reverse order)
        for (let i = vessels_list.length - 1; i >= 0; i--) {
          const vessel = vessels_list[i];
          
          if (vessel.isInside(p.mouseX, p.mouseY)) {
            // Start dragging this vessel
            draggedVessel = vessel;
            draggedVessel.dragging = true;
            
            // Calculate offset from mouse to vessel corner
            offsetX = draggedVessel.x - p.mouseX;
            offsetY = draggedVessel.y - p.mouseY;
            
            // Record activity
            lastAction = p.frameCount;
            
            // Provide haptic feedback
            utils.triggerHapticFeedback('light');
            
            break;
          }
        }
        
        // Check hint button
        if (hintButton.isInside(p.mouseX, p.mouseY)) {
          hintButton.handleClick();
        }
      }
      
      return false; // Prevent default browser handling
    };
    
    p.mouseDragged = function() {
      if (draggedVessel) {
        // Update vessel position
        draggedVessel.x = p.mouseX + offsetX;
        draggedVessel.y = p.mouseY + offsetY;
      }
      
      return false; // Prevent default browser handling
    };
    
    p.mouseReleased = function() {
      if (draggedVessel) {
        // Find any vessel that overlaps with the dragged one
        let targetVessel = null;
        
        for (const vessel of vessels_list) {
          if (vessel !== draggedVessel && vessel.isInside(p.mouseX, p.mouseY)) {
            targetVessel = vessel;
            break;
          }
        }
        
        if (targetVessel) {
          // Combine the vessels
          const { newVessel, matchedCombination } = mechanics.combineVessels(
            draggedVessel, targetVessel, animation_list, moveHistory, 
            turnCounter, COLORS, playAreaX, playAreaY, playAreaWidth, playAreaHeight
          );
          
          // Remove the original vessels
          vessels_list = vessels_list.filter(v => 
            v !== draggedVessel && v !== targetVessel
          );
          
          // Add the new vessel
          vessels_list.push(newVessel);
          
          // Assign row preference based on drop position
          mechanics.assignPreferredRow(newVessel, p.mouseY, columns, p.mouseX);
          
          // Track used ingredients
          draggedVessel.ingredients.forEach(ing => usedIngredients.add(ing));
          targetVessel.ingredients.forEach(ing => usedIngredients.add(ing));
          
          // Increment move count
          moveCount++;
          turnCounter++;
          
          // Handle complete combination
          if (matchedCombination) {
            // If it's the final combination, trigger win
            if (matchedCombination === final_combination) {
              setTimeout(() => {
                gameWon = true;
                gameState = "win";
              }, 1500);
            }
            
            // If we were showing a hint for this combo, hide it
            if (showingHint && hintVessel && hintVessel.combo === matchedCombination) {
              showingHint = false;
              hintVessel = null;
            }
            
            // Update byline
            updateBylineWithTransition(
              matchedCombination === final_combination ? 
              "Amazing! You made " + matchedCombination.name + "!" :
              "Great! You made " + matchedCombination.name + "!"
            );
          }
        } else {
          // No target vessel, snap back
          draggedVessel.snapBack();
        }
        
        // Stop dragging
        draggedVessel.dragging = false;
        draggedVessel = null;
        
        // Rearrange vessels
        mechanics.arrangeVessels(vessels_list, columns, 
          playAreaX, playAreaY, playAreaWidth, playAreaHeight,
          basic_w, basic_h, vertical_margin);
      }
      
      return false; // Prevent default browser handling
    };
    
    // Touch event handlers for mobile devices
    p.touchStarted = function() {
      // Forward to mouse event
      p.mousePressed();
      return false;
    };
    
    p.touchMoved = function() {
      // Forward to mouse event
      p.mouseDragged();
      return false;
    };
    
    p.touchEnded = function() {
      // Forward to mouse event
      p.mouseReleased();
      return false;
    };
    
    // Window resize handler
    p.windowResized = function() {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      
      // Update play area
      playAreaWidth = Math.min(maxPlayWidth, p.width - playAreaPadding * 2);
      playAreaX = (p.width - playAreaWidth) / 2;
      
      // Update button positions
      if (startButton) {
        startButton.x = p.width / 2 - startButton.w / 2;
        startButton.y = p.height / 2 + 100;
      }
      
      if (hintButton) {
        hintButton.x = p.width / 2 - hintButton.w / 2;
        hintButton.y = initialHintButtonY;
      }
      
      // Rearrange vessels
      if (vessels_list.length > 0) {
        mechanics.arrangeVessels(vessels_list, columns, 
          playAreaX, playAreaY, playAreaWidth, playAreaHeight,
          basic_w, basic_h, vertical_margin);
      }
    };
  };
};

// Create and export the game sketch
export default createGameSketch; 