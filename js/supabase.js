// Supabase Integration for Culinary Logic Puzzle
// This file handles fetching recipe data from Supabase

// Initialize Supabase client
const SUPABASE_URL = 'https://ovrvtfjejmhrflybslwi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cnZ0Zmplam1ocmZseWJzbHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNDkxMDgsImV4cCI6MjA1NjYyNTEwOH0.V5_pJUQN9Xhd-Ot4NABXzxSVHGtNYNFuLMWE1JDyjAk';

// Create a single supabase client for interacting with your database
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to get the current date in EST/EDT timezone
function getCurrentDateEST() {
  // Get current date and time
  const now = new Date();
  
  // Create a date string in ISO format with EST timezone specified
  // Format: YYYY-MM-DDT00:00:00-05:00 (for EST)
  const dateString = now.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Parse the date string to get MM/DD/YYYY format
  const [month, day, year] = dateString.split('/');
  
  // Format as YYYY-MM-DD for database query
  const formattedDate = `${year}-${month}-${day}`;
  
  console.log("Current date in EST/EDT timezone:", formattedDate);
  return formattedDate;
}

// Function to fetch recipe for the current day
async function fetchTodayRecipe() {
  try {
    const today = getCurrentDateEST();
    console.log(`Fetching recipe for today: ${today}`);
    
    // Fetch recipe for today's date
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('date', today)
      .limit(1);
    
    if (error) {
      console.error("Error fetching today's recipe:", error);
      return null;
    }
    
    if (!recipes || recipes.length === 0) {
      console.error(`No recipe found for today: ${today}`);
      return null;
    }
    
    const recipe = recipes[0];
    console.log("Found today's recipe:", recipe);
    
    // Now fetch combinations, ingredients, and easter eggs
    return await fetchRecipeDetails(recipe);
  } catch (error) {
    console.error("Error in fetchTodayRecipe:", error);
    return null;
  }
}

// Fetch Recipe Details (combinations, ingredients, easter eggs)
async function fetchRecipeDetails(recipe) {
  try {
    // Fetch combinations for this recipe
    const { data: combinations, error: combosError } = await supabase
      .from('combinations')
      .select('*')
      .eq('rec_id', recipe.rec_id);
    
    if (combosError) {
      console.error("Error fetching combinations:", combosError);
      return null;
    }
    
    // Fetch ingredients for all combinations
    const comboIds = combinations.map(c => c.combo_id);
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('*')
      .in('combo_id', comboIds);
    
    if (ingredientsError) {
      console.error("Error fetching ingredients:", ingredientsError);
      return null;
    }
    
    // Fetch easter eggs for this recipe
    const easterEggs = await fetchEasterEggs(recipe.rec_id);
    
    // Process the data
    return processRecipeData(recipe, combinations, ingredients, easterEggs);
  } catch (error) {
    console.error("Error in fetchRecipeDetails:", error);
    return null;
  }
}

// Function to fetch easter eggs for a specific recipe
async function fetchEasterEggs(recipeId) {
  try {
    console.log("Fetching easter eggs for recipe ID:", recipeId);
    
    // Query the eastereggs table for this recipe
    const { data: easterEggs, error } = await supabase
      .from('eastereggs')
      .select('*')
      .eq('rec_id', recipeId);
    
    if (error) {
      console.error("Easter eggs error:", error);
      return [];
    }
    
    console.log("Easter eggs data:", easterEggs);
    
    // We need to get the ingredient names for ing_id_1 and ing_id_2
    if (easterEggs && easterEggs.length > 0) {
      // Collect all ingredient IDs
      const ingredientIds = [];
      easterEggs.forEach(egg => {
        if (egg.ing_id_1) ingredientIds.push(egg.ing_id_1);
        if (egg.ing_id_2) ingredientIds.push(egg.ing_id_2);
      });
      
      // Fetch the ingredient names for these IDs
      if (ingredientIds.length > 0) {
        const { data: ingredientData, error: ingredientError } = await supabase
          .from('ingredients')
          .select('ing_id, name')
          .in('ing_id', ingredientIds);
        
        if (ingredientError) {
          console.error("Error fetching ingredient names:", ingredientError);
        } else {
          console.log("Ingredient data for easter eggs:", ingredientData);
          
          // Create a map of ing_id to name
          const ingredientMap = {};
          ingredientData.forEach(ing => {
            ingredientMap[ing.ing_id] = ing.name;
          });
          
          // Format the easter eggs data with ingredient names
          const formattedEasterEggs = easterEggs.map(egg => {
            const required = [];
            if (egg.ing_id_1 && ingredientMap[egg.ing_id_1]) {
              required.push(ingredientMap[egg.ing_id_1]);
            }
            if (egg.ing_id_2 && ingredientMap[egg.ing_id_2]) {
              required.push(ingredientMap[egg.ing_id_2]);
            }
            
            return {
              id: egg.egg_id,
              name: egg.name || "Secret Combination",
              required: required
            };
          });
          
          console.log("Formatted easter eggs:", formattedEasterEggs);
          return formattedEasterEggs;
        }
      }
    }
    
    // If we couldn't get ingredient names, return a simplified version
    const simpleEasterEggs = easterEggs.map(egg => {
      return {
        id: egg.egg_id,
        name: egg.name || "Secret Combination",
        required: [] // Empty array since we couldn't get the ingredient names
      };
    });
    
    console.log("Simplified easter eggs:", simpleEasterEggs);
    return simpleEasterEggs;
  } catch (error) {
    console.error('Error fetching easter eggs:', error);
    return [];
  }
}

// Process the database data into the format expected by the game
function processRecipeData(recipe, combinations, ingredients, easterEggs = []) {
  console.log("Processing recipe data:", { recipe, combinations, ingredients, easterEggs });
  
  // Find the final combination
  const finalCombo = combinations.find(combo => combo.is_final === true);
  console.log("Final combination:", finalCombo);
  
  if (!finalCombo) {
    console.error("No final combination found!");
    return null;
  }
  
  // Find all intermediate combinations (not final)
  const intermediateCombos = combinations.filter(combo => combo.is_final === false);
  console.log("Intermediate combinations:", intermediateCombos);
  
  // Get all base ingredients
  const baseIngredients = ingredients
    .filter(ing => ing.is_base === true)
    .map(ing => ing.name);
  console.log("All base ingredients:", baseIngredients);
  
  // Create maps for easier lookups
  const comboIdToName = {};
  const comboNameToId = {};
  combinations.forEach(combo => {
    comboIdToName[combo.combo_id] = combo.name;
    comboNameToId[combo.name] = combo.combo_id;
  });
  
  // Group ingredients by combination
  const ingredientsByCombo = {};
  ingredients.forEach(ing => {
    if (!ingredientsByCombo[ing.combo_id]) {
      ingredientsByCombo[ing.combo_id] = [];
    }
    
    // Add all ingredients (both base and non-base)
    ingredientsByCombo[ing.combo_id].push({
      name: ing.name,
      isBase: ing.is_base
    });
  });
  console.log("Ingredients by combo:", ingredientsByCombo);
  
  // Format intermediate combinations
  const intermediateCombinations = intermediateCombos.map(combo => {
    // Get all ingredients for this combo
    const comboIngredients = ingredientsByCombo[combo.combo_id] || [];
    
    // Separate base ingredients and combination ingredients
    const baseIngs = comboIngredients
      .filter(ing => ing.isBase)
      .map(ing => ing.name);
      
    const comboIngs = comboIngredients
      .filter(ing => !ing.isBase)
      .map(ing => ing.name);
    
    // For display purposes, we want to show all required ingredients
    const allRequired = [...baseIngs, ...comboIngs];
    
    return {
      name: combo.name,
      required: allRequired,
      verb: combo.verb || "mix", // Include the verb from the combinations table, with a default fallback
      combo_id: combo.combo_id,
      parent_combo: combo.parent_combo // Include the parent_combo information
    };
  });
  console.log("Formatted intermediate combinations:", intermediateCombinations);
  
  // For the final combination, we need to find which combinations are directly required
  // Get all ingredients for the final combination
  const finalComboIngredients = ingredientsByCombo[finalCombo.combo_id] || [];
  
  // Separate base ingredients and combination ingredients
  const finalBaseIngs = finalComboIngredients
    .filter(ing => ing.isBase)
    .map(ing => ing.name);
    
  const finalComboIngs = finalComboIngredients
    .filter(ing => !ing.isBase)
    .map(ing => ing.name);
  
  console.log("Final combination ingredients:", {
    base: finalBaseIngs,
    combinations: finalComboIngs
  });
  
  // Find combinations that have this final combo as their parent
  const childCombos = combinations
    .filter(combo => combo.parent_combo === finalCombo.combo_id)
    .map(combo => combo.name);
  
  console.log("Child combinations of final:", childCombos);
  
  // The required combinations for the final recipe are the direct children of the final combo
  let finalRequired = childCombos.length > 0 ? childCombos : finalComboIngs;
  
  // If we still don't have any required combinations, fall back to previous methods
  if (finalRequired.length === 0) {
    // Method 1: Check if intermediate combo names are in the final base ingredients
    const requiredCombos = [];
    for (const combo of intermediateCombos) {
      if (finalBaseIngs.includes(combo.name)) {
        requiredCombos.push(combo.name);
      }
    }
    
    // Method 2: If method 1 didn't work, check if any ingredients from the final combo
    // match the names of intermediate combinations
    if (requiredCombos.length === 0) {
      // Get all intermediate combo names
      const intermediateNames = intermediateCombos.map(combo => combo.name);
      
      // Check if any of the final combo ingredients match intermediate combo names
      for (const ing of finalBaseIngs) {
        if (intermediateNames.includes(ing)) {
          requiredCombos.push(ing);
        }
      }
    }
    
    // If we found any required combos, use them
    if (requiredCombos.length > 0) {
      finalRequired = requiredCombos;
    } else {
      // Last resort: use all intermediate combinations as a fallback
      finalRequired = intermediateCombos.map(combo => combo.name);
    }
  }
  
  console.log("Final required combinations:", finalRequired);
  
  // Format final combination
  const finalCombination = {
    name: finalCombo.name,
    required: finalRequired,
    verb: finalCombo.verb || "prepare", // Include the verb from the combinations table, with a default fallback
    combo_id: finalCombo.combo_id,
    parent_combo: finalCombo.parent_combo // Include the parent_combo information
  };
  
  const result = {
    recipeName: recipe.name,
    recipeUrl: recipe.recipe_url || "https://www.example.com/recipe",
    imgUrl: recipe.img_url || null,
    day_number: recipe.day_number || "###",
    date: recipe.date || "###",
    intermediateCombinations,
    finalCombination,
    baseIngredients: [...new Set(baseIngredients)],
    easterEggs: easterEggs || [],
    description: recipe.description,
    author: recipe.author
  };
  
  console.log("Processed result:", result);
  return result;
}

// Fetch Recipe by Specific Date (for playtesting)
async function fetchRecipeByDate(dateString) {
  try {
    console.log(`Fetching recipe for date: ${dateString}`);
    
    // Fetch recipe for the specified date
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('date', dateString)
      .limit(1);
    
    if (error) {
      console.error("Error fetching recipe by date:", error);
      return null;
    }
    
    if (!recipes || recipes.length === 0) {
      console.error(`No recipe found for date: ${dateString}`);
      return null;
    }
    
    const recipe = recipes[0];
    console.log("Found recipe:", recipe);
    
    // Now fetch combinations, ingredients, and easter eggs
    return await fetchRecipeDetails(recipe);
  } catch (error) {
    console.error("Error in fetchRecipeByDate:", error);
    return null;
  }
}

// Function to fetch a random recipe
async function fetchRandomRecipe() {
  try {
    console.log("Fetching random recipe data...");
    
    // Get all recipes from the database
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*');
    
    if (error) {
      console.error("Error fetching recipes:", error);
      return null;
    }
    
    if (!recipes || recipes.length === 0) {
      console.error("No recipes found in database");
      return null;
    }
    
    // Get the current recipe date in EST
    const currentDate = getCurrentDateEST();
    
    // Filter out the current recipe (the one for today)
    const filteredRecipes = recipes.filter(recipe => recipe.date !== currentDate);
    
    if (filteredRecipes.length === 0) {
      console.error("No other recipes available besides today's recipe");
      return null;
    }
    
    // Select a random recipe from the filtered list
    const randomIndex = Math.floor(Math.random() * filteredRecipes.length);
    const recipe = filteredRecipes[randomIndex];
    
    console.log("Found random recipe:", recipe);
    
    // Get full recipe details
    return await fetchRecipeDetails(recipe);
  } catch (error) {
    console.error("Error in fetchRandomRecipe:", error);
    return null;
  }
}

// =============================================================================
// GAME ANALYTICS FUNCTIONS - APlasker
// =============================================================================

// Global variables for session tracking
let currentSessionId = null;
let gameStartTime = null;
let totalMistakes = 0;
let totalHintsUsed = 0;
let totalEasterEggsFound = 0;

// Generate a simple user identifier (hash of IP-like data)
function generateUserIdentifier() {
  // Create a simple hash based on screen resolution, timezone, and user agent
  const screenInfo = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userAgent = navigator.userAgent.substring(0, 50); // First 50 chars
  const combined = `${screenInfo}-${timezone}-${userAgent}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Start a new game session
async function startGameSession(recipeId) {
  try {
    console.log("Starting game session analytics for recipe ID:", recipeId);
    
    const sessionData = {
      rec_id: recipeId,
      user_id: generateUserIdentifier(),
      started_at: new Date().toISOString(),
      mistakes_total: 0,
      hints_used: 0,
      easter_eggs_found: 0
    };
    
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([sessionData])
      .select()
      .single();
      
    if (error) {
      console.error("Error starting game session:", error);
      return null;
    }
    
    if (data) {
      currentSessionId = data.session_id;
      gameStartTime = new Date();
      totalMistakes = 0;
      totalHintsUsed = 0;
      totalEasterEggsFound = 0;
      console.log("Game session started with ID:", currentSessionId);
      return data.session_id;
    }
  } catch (error) {
    console.error("Error in startGameSession:", error);
    return null;
  }
}

// Track a mistake/failed combination attempt
async function trackMistake() {
  if (!currentSessionId) return;
  
  try {
    totalMistakes++;
    console.log("Tracking mistake, total mistakes:", totalMistakes);
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ mistakes_total: totalMistakes })
      .eq('session_id', currentSessionId);
      
    if (error) {
      console.error("Error tracking mistake:", error);
    }
  } catch (error) {
    console.error("Error in trackMistake:", error);
  }
}

// Track hint usage
async function trackHintUsed() {
  if (!currentSessionId) return;
  
  try {
    totalHintsUsed++;
    console.log("Tracking hint used, total hints:", totalHintsUsed);
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ hints_used: totalHintsUsed })
      .eq('session_id', currentSessionId);
      
    if (error) {
      console.error("Error tracking hint:", error);
    }
  } catch (error) {
    console.error("Error in trackHintUsed:", error);
  }
}

// Track Easter egg discovery
async function trackEasterEggFound() {
  if (!currentSessionId) return;
  
  try {
    totalEasterEggsFound++;
    console.log("Tracking Easter egg found, total found:", totalEasterEggsFound);
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ easter_eggs_found: totalEasterEggsFound })
      .eq('session_id', currentSessionId);
      
    if (error) {
      console.error("Error tracking Easter egg:", error);
    }
  } catch (error) {
    console.error("Error in trackEasterEggFound:", error);
  }
}

// Complete the game session
async function completeGameSession(winCondition) {
  if (!currentSessionId) return;
  
  try {
    const endTime = new Date();
    const totalTimeSeconds = gameStartTime ? Math.floor((endTime - gameStartTime) / 1000) : 0;
    
    console.log(`Completing game session with condition: ${winCondition}, time: ${totalTimeSeconds}s`);
    
    const updateData = {
      completed_at: endTime.toISOString(),
      total_time_seconds: totalTimeSeconds,
      mistakes_total: totalMistakes,
      hints_used: totalHintsUsed,
      easter_eggs_found: totalEasterEggsFound,
      win_condition: winCondition
    };
    
    const { error } = await supabase
      .from('game_sessions')
      .update(updateData)
      .eq('session_id', currentSessionId);
      
    if (error) {
      console.error("Error completing game session:", error);
    } else {
      console.log("Game session completed successfully");
    }
    
    // Reset session tracking
    currentSessionId = null;
    gameStartTime = null;
    totalMistakes = 0;
    totalHintsUsed = 0;
    totalEasterEggsFound = 0;
    
  } catch (error) {
    console.error("Error in completeGameSession:", error);
  }
}

// Get current session stats (for debugging or display)
function getCurrentSessionStats() {
  return {
    sessionId: currentSessionId,
    startTime: gameStartTime,
    mistakes: totalMistakes,
    hints: totalHintsUsed,
    easterEggs: totalEasterEggsFound,
    timeElapsed: gameStartTime ? Math.floor((new Date() - gameStartTime) / 1000) : 0
  };
}

// APlasker - Track page unload to detect game abandonment
window.addEventListener('beforeunload', function() {
  // Only track abandonment if there's an active session and game hasn't been won
  if (currentSessionId && typeof gameWon !== 'undefined' && !gameWon) {
    console.log("Tracking game abandonment on page unload");
    // Use sendBeacon for reliable delivery during page unload
    const abandonmentData = {
      completed_at: new Date().toISOString(),
      total_time_seconds: gameStartTime ? Math.floor((new Date() - gameStartTime) / 1000) : 0,
      mistakes_total: totalMistakes,
      hints_used: totalHintsUsed,
      easter_eggs_found: totalEasterEggsFound,
      win_condition: 'abandoned'
    };
    
    // Try to send abandonment data using fetch with keepalive
    try {
      fetch(`${SUPABASE_URL}/rest/v1/game_sessions?session_id=eq.${currentSessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify(abandonmentData),
        keepalive: true // This helps ensure the request completes even if the page is closing
      });
    } catch (error) {
      console.error("Error tracking abandonment:", error);
    }
  }
}); 