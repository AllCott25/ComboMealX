/*
 * Culinary Logic Puzzle v0.0409.03
 * Created by Ben Alpert
 * Last Updated: April 9, 2025 (16:39 EDT) by APlasker
 * Modularized: March 26, 2025 (13:00 EDT) by APlasker
 * 
 * File renamed from modules-sketch.js to sketch.js on April 9, 2025
 * Font loading updated to use web-safe fonts on April 9, 2025
 * Bug fixes for color handling and text rendering on April 9, 2025
 *
 * A daily culinary logic puzzle game where players combine ingredients
 * according to recipe logic to create a final dish.
 */

// Create an instance of p5
const sketch = (p) => {
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
  let vessels = [];
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
  let animations = []; // Array to store active animations
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

  // Animation class for combining ingredients
  class CombineAnimation {
    constructor(x, y, color, targetX, targetY) {
      this.x = x;
      this.y = y;
      this.targetX = targetX;
      this.targetY = targetY;
      this.color = color;
      this.size = 30;
      this.alpha = 255;
      this.progress = 0;
      this.duration = 30; // frames
      this.sparkles = [];
      
      // Create sparkles
      for (let i = 0; i < 15; i++) {
        this.sparkles.push({
          x: p.random(-20, 20),
          y: p.random(-20, 20),
          size: p.random(3, 8),
          speed: p.random(0.5, 2),
          angle: p.random(p.TWO_PI)
        });
      }
    }
    
    update() {
      this.progress += 1 / this.duration;
      if (this.progress >= 1) {
        return true; // Animation complete
      }
      
      // Update sparkles
      for (let sparkle of this.sparkles) {
        sparkle.x += p.cos(sparkle.angle) * sparkle.speed;
        sparkle.y += p.sin(sparkle.angle) * sparkle.speed;
        sparkle.size *= 0.95;
      }
      
      return false;
    }
    
    draw() {
      // Easing function for smooth animation
      let t = this.progress;
      let easedT = t < 0.5 ? 4 * t * t * t : 1 - p.pow(-2 * t + 2, 3) / 2;
      
      // Calculate current position
      let currentX = p.lerp(this.x, this.targetX, easedT);
      let currentY = p.lerp(this.y, this.targetY, easedT);
      
      // Draw main particle
      p.noStroke();
      p.fill(this.color);
      p.ellipse(currentX, currentY, this.size * (1 - this.progress * 0.5));
      
      // Draw sparkles
      for (let sparkle of this.sparkles) {
        p.fill(this.color);
        p.ellipse(currentX + sparkle.x, currentY + sparkle.y, sparkle.size);
      }
    }
  }

  // Convert p5.js lifecycle methods to use the instance
  p.preload = function() {
    // Will implement this in a future step
    console.log("P5.js preload function called");
  };

  p.setup = function() {
    // Create canvas and initialize the game
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.frameRate(60);
    
    // Initialize ingredients from combinations
    ingredients = [...new Set(intermediate_combinations.flatMap(c => c.required))];
    
    console.log("P5.js setup function called");
  };

  p.draw = function() {
    // Main draw loop
    p.background(COLORS.background);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Draw game state based on current state
    switch (gameState) {
      case "start":
        // Will implement this in a future step
        p.text("Combo Meal - Start Screen", p.width/2, p.height/2);
        break;
      case "tutorial":
        // Will implement this in a future step
        p.text("Combo Meal - Tutorial", p.width/2, p.height/2);
        break;
      case "playing":
        // Will implement this in a future step  
        p.text("Combo Meal - Playing", p.width/2, p.height/2);
        break;
      case "win":
        // Will implement this in a future step
        p.text("Combo Meal - Win Screen", p.width/2, p.height/2);
        break;
    }
    
    console.log("P5.js draw function called");
  };

  // Mouse event handlers
  p.mousePressed = function() {
    console.log("Mouse pressed at", p.mouseX, p.mouseY);
    return false; // Prevent default
  };

  p.mouseDragged = function() {
    console.log("Mouse dragged at", p.mouseX, p.mouseY);
    return false; // Prevent default
  };

  p.mouseReleased = function() {
    console.log("Mouse released at", p.mouseX, p.mouseY);
    return false; // Prevent default
  };

  // Touch event handlers for mobile
  p.touchStarted = function() {
    console.log("Touch started at", p.touches[0]?.x, p.touches[0]?.y);
    return false; // Prevent default
  };

  p.touchMoved = function() {
    console.log("Touch moved at", p.touches[0]?.x, p.touches[0]?.y);
    return false; // Prevent default
  };

  p.touchEnded = function() {
    console.log("Touch ended");
    return false; // Prevent default
  };

  // Window resize handler
  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

// Create and start the p5 instance
new p5(sketch); 