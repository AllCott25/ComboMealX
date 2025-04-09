/**
 * game-mechanics.js
 * Contains game logic functions for the Combo Meal game
 * Last Updated: March 26, 2025 (13:00 EDT) by APlasker
 */

const createGameMechanicsModule = (p, animationsModule, vesselsModule, utils) => {
  // Extract needed classes and functions from their modules
  const { CombineAnimation, createCombineAnimation, createVerbAnimationForVessel } = animationsModule;
  const { Vessel, HintVessel } = vesselsModule;
  const { shuffleArray, triggerHapticFeedback } = utils;
  
  // Arrange vessels in the game area
  function arrangeVessels(vessels, columns, playAreaX, playAreaY, playAreaWidth, playAreaHeight, 
                          basic_w, basic_h, vertical_margin, partialCombinations = []) {
    // Reset all columns
    columns.length = 0;
    
    // Create standard row of vessels
    const createStandardRow = () => {
      const row = [];
      // Use a lower maximum to leave space for partial combinations
      const maxVesselsPerRow = playAreaWidth < 500 ? 3 : 4;
      // Calculate horizontal spacing
      const horizontal_space = playAreaWidth / maxVesselsPerRow;
      
      for (let i = 0; i < maxVesselsPerRow; i++) {
        row.push({
          x: playAreaX + horizontal_space * i + (horizontal_space - basic_w) / 2,
          y: null, // Will be set later
          vessel: null // Will be filled with a vessel
        });
      }
      
      return row;
    };
    
    // Create rows for standard vessels
    let allRows = [];
    
    // Determine number of standard rows needed (minimum 3)
    const countNonPartialVessels = vessels.filter(v => v.shouldDisplay).length;
    const placesPerRow = playAreaWidth < 500 ? 3 : 4;
    let standardRowsNeeded = Math.max(3, Math.ceil(countNonPartialVessels / placesPerRow));
    
    // If there are partial combinations, we'll need space for them
    if (partialCombinations.length > 0) {
      standardRowsNeeded = Math.max(standardRowsNeeded, partialCombinations.length + 2);
    }
    
    // Create the determined number of rows
    for (let i = 0; i < standardRowsNeeded; i++) {
      allRows.push(createStandardRow());
    }
    
    // Set Y position for each row
    const totalRows = allRows.length;
    const totalHeight = totalRows * (basic_h + vertical_margin) - vertical_margin;
    const startY = playAreaY + (playAreaHeight - totalHeight) / 2;
    
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      const rowY = startY + i * (basic_h + vertical_margin);
      
      for (let slot of row) {
        slot.y = rowY;
      }
    }
    
    // Place vessels in rows
    const visibleVessels = vessels.filter(v => v.shouldDisplay);
    
    // Organize vessels by their preferred row if set
    const vesselsByPreferredRow = Array(allRows.length).fill().map(() => []);
    const vesselsWithoutPreference = [];
    
    for (const vessel of visibleVessels) {
      if (vessel.preferredRow >= 0 && vessel.preferredRow < allRows.length) {
        vesselsByPreferredRow[vessel.preferredRow].push(vessel);
      } else {
        vesselsWithoutPreference.push(vessel);
      }
    }
    
    // Fill rows with vessels that have preferred rows
    for (let rowIndex = 0; rowIndex < allRows.length; rowIndex++) {
      const row = allRows[rowIndex];
      const vesselsForThisRow = vesselsByPreferredRow[rowIndex];
      
      // Sort vessels by preferred column if set
      vesselsForThisRow.sort((a, b) => {
        if (a.preferredColumn >= 0 && b.preferredColumn >= 0) {
          return a.preferredColumn - b.preferredColumn;
        }
        if (a.preferredColumn >= 0) return -1;
        if (b.preferredColumn >= 0) return 1;
        return 0;
      });
      
      // Place vessels in their preferred row/column
      for (let i = 0; i < Math.min(vesselsForThisRow.length, row.length); i++) {
        const vessel = vesselsForThisRow[i];
        
        // If vessel has a preferred column, try to place it there
        if (vessel.preferredColumn >= 0 && vessel.preferredColumn < row.length && 
            !row[vessel.preferredColumn].vessel) {
          // Place in preferred column
          row[vessel.preferredColumn].vessel = vessel;
        } else {
          // Find first available slot
          const emptySlot = row.find(slot => !slot.vessel);
          if (emptySlot) {
            emptySlot.vessel = vessel;
          }
        }
      }
    }
    
    // Fill remaining slots with vessels without preference
    for (const vessel of vesselsWithoutPreference) {
      let placed = false;
      
      // Try to find an empty slot in any row
      for (const row of allRows) {
        const emptySlot = row.find(slot => !slot.vessel);
        if (emptySlot) {
          emptySlot.vessel = vessel;
          placed = true;
          break;
        }
      }
      
      // If no slot found, expand the grid
      if (!placed) {
        const newRow = createStandardRow();
        const rowY = startY + allRows.length * (basic_h + vertical_margin);
        
        for (let slot of newRow) {
          slot.y = rowY;
        }
        
        newRow[0].vessel = vessel;
        allRows.push(newRow);
      }
    }
    
    // Update vessels' target positions
    for (const row of allRows) {
      for (const slot of row) {
        if (slot.vessel) {
          slot.vessel.targetX = slot.x;
          slot.vessel.targetY = slot.y;
          
          // If vessel isn't being dragged, update position immediately
          if (!slot.vessel.dragging) {
            // If vessel is already at a position, set up animation
            if (slot.vessel.x !== 0 && slot.vessel.y !== 0 && 
                (Math.abs(slot.vessel.x - slot.x) > 5 || Math.abs(slot.vessel.y - slot.y) > 5)) {
              
              slot.vessel.animatingRowChange = true;
              slot.vessel.rowChangeProgress = 0;
              slot.vessel.rowChangeStart = { x: slot.vessel.x, y: slot.vessel.y };
              slot.vessel.rowChangeEnd = { x: slot.x, y: slot.y };
            } else {
              // Just set position directly for new vessels
              slot.vessel.x = slot.x;
              slot.vessel.y = slot.y;
            }
          }
        }
      }
    }
    
    // Update columns for combination checking
    // Each column contains all vessels in a row
    columns.length = 0;
    for (const row of allRows) {
      const vesselRow = row
        .filter(slot => slot.vessel)
        .map(slot => slot.vessel);
      
      if (vesselRow.length > 0) {
        columns.push(vesselRow);
      }
    }
    
    return columns;
  }
  
  // Assign a preferred row to a vessel (usually after dropping)
  function assignPreferredRow(newVessel, dropY, columns, dropX = p.mouseX) {
    // Find the row closest to drop position
    let closestRow = -1;
    let minDistance = Number.MAX_VALUE;
    
    for (let i = 0; i < columns.length; i++) {
      const row = columns[i];
      if (row.length === 0) continue; // Skip empty rows
      
      // Get y position of this row
      const rowY = row[0].y;
      const distance = Math.abs(dropY - rowY);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestRow = i;
      }
    }
    
    if (closestRow >= 0) {
      // Find the best column in this row
      const row = columns[closestRow];
      
      // Find all empty slots in this row
      const emptySlots = [];
      const rowX = row[0].x;
      const rowY = row[0].y;
      
      // Calculate horizontal spacing based on first vessel
      const firstVessel = row[0];
      const horizontal_space = firstVessel.w + (firstVessel.w * 0.2); // Add 20% spacing
      
      // Determine the max vessels per row based on play area width
      const maxVesselsPerRow = p.width < 500 ? 3 : 4;
      
      // Create array of potential slots
      for (let i = 0; i < maxVesselsPerRow; i++) {
        const slotX = rowX + i * horizontal_space;
        
        // Check if this slot is empty
        const isOccupied = row.some(v => Math.abs(v.x - slotX) < 10);
        
        if (!isOccupied) {
          emptySlots.push({
            x: slotX,
            distance: Math.abs(dropX - slotX)
          });
        }
      }
      
      // Find the empty slot closest to drop X position
      let preferredColumn = -1;
      if (emptySlots.length > 0) {
        // Sort by distance to drop position
        emptySlots.sort((a, b) => a.distance - b.distance);
        
        // Calculate column index from X position
        const slotX = emptySlots[0].x;
        preferredColumn = Math.round((slotX - rowX) / horizontal_space);
      }
      
      // Assign row and possibly column preference
      newVessel.preferredRow = closestRow;
      newVessel.preferredColumn = preferredColumn;
    }
    
    return newVessel;
  }
  
  // Combine two vessels
  function combineVessels(v1, v2, animations, moveHistory, turnCounter, COLORS, playAreaX, playAreaY, playAreaWidth, playAreaHeight) {
    // Create a new vessel with combined ingredients
    const allIngredients = [...new Set([...v1.ingredients, ...v2.ingredients])];
    
    // Get vessel size and position
    const newW = v1.w;
    const newH = v1.h;
    const newX = v1.x;
    const newY = v1.y;
    
    // Add two vessels moving toward each other
    createCombinationAnimation(v1, v2, animations, COLORS, playAreaX, playAreaY, playAreaWidth, playAreaHeight);
    
    // Check if this combination is complete
    let matchedCombination = v1.complete_combinations.find(combo => {
      // Check if all required ingredients are in the combined set
      return combo.required.every(ing => allIngredients.includes(ing)) &&
             // Check if combined set doesn't have extra ingredients
             allIngredients.length === combo.required.length;
    });
    
    // Record the move in history
    moveHistory.push({
      turn: turnCounter,
      v1: { name: v1.name || v1.ingredients.join(' + '), color: v1.color },
      v2: { name: v2.name || v2.ingredients.join(' + '), color: v2.color },
      result: matchedCombination ? { name: matchedCombination.name, color: COLORS.vesselGreen } : 
                                  { name: allIngredients.join(' + '), color: COLORS.vesselYellow }
    });
    
    // Create the new vessel
    const newVessel = new Vessel(
      allIngredients, 
      v1.complete_combinations,
      matchedCombination ? matchedCombination.name : '', // Named if it matches a combination
      matchedCombination ? COLORS.vesselGreen : COLORS.vesselYellow, // Green for complete, yellow for partial
      newX, newY, newW, newH
    );
    
    // If it's a complete combination, show a verb animation
    if (matchedCombination) {
      const verb = getRandomVerb();
      animations.push(
        createVerbAnimationForVessel(newVessel, verb, playAreaX, playAreaY, playAreaWidth, playAreaHeight)
      );
      
      // Also display verb on the vessel
      newVessel.displayVerb(verb);
      
      // Provide success feedback
      triggerHapticFeedback('success');
    } else {
      // Provide feedback for partial combination
      triggerHapticFeedback('medium');
    }
    
    return { newVessel, matchedCombination };
  }
  
  // Create combination animation when two vessels combine
  function createCombinationAnimation(v1, v2, animations, COLORS, playAreaX, playAreaY, playAreaWidth, playAreaHeight) {
    // Calculate center points of vessels
    const v1Center = { x: v1.x + v1.w/2, y: v1.y + v1.h/2 };
    const v2Center = { x: v2.x + v2.w/2, y: v2.y + v2.h/2 };
    
    // Calculate midpoint between vessels
    const midX = (v1Center.x + v2Center.x) / 2;
    const midY = (v1Center.y + v2Center.y) / 2;
    
    // Create particles from each vessel to midpoint
    const particleCount = 10;
    
    // Particles from vessel 1
    for (let i = 0; i < particleCount; i++) {
      const startX = v1Center.x + p.random(-v1.w/4, v1.w/4);
      const startY = v1Center.y + p.random(-v1.h/4, v1.h/4);
      
      animations.push(
        new CombineAnimation(startX, startY, v1.color, midX, midY)
      );
    }
    
    // Particles from vessel 2
    for (let i = 0; i < particleCount; i++) {
      const startX = v2Center.x + p.random(-v2.w/4, v2.w/4);
      const startY = v2Center.y + p.random(-v2.h/4, v2.h/4);
      
      animations.push(
        new CombineAnimation(startX, startY, v2.color, midX, midY)
      );
    }
  }
  
  // Check for matching vessels that can be combined
  function checkForMatchingVessels(columns, usedIngredients, intermediate_combinations, final_combination, vessels) {
    // Iterate through each row of vessels
    for (let i = 0; i < columns.length; i++) {
      const row = columns[i];
      
      // Check each vessel against others in the same row
      for (let j = 0; j < row.length; j++) {
        for (let k = j + 1; k < row.length; k++) {
          const v1 = row[j];
          const v2 = row[k];
          
          // Skip if either vessel is being dragged
          if (v1.dragging || v2.dragging) continue;
          
          // Get combined ingredients
          const allIngredients = [...new Set([...v1.ingredients, ...v2.ingredients])];
          
          // Check against intermediate combinations
          const matchIntermediate = intermediate_combinations.find(combo => {
            return combo.required.every(ing => allIngredients.includes(ing)) &&
                   allIngredients.length === combo.required.length;
          });
          
          // Check against final combination
          const matchFinal = allIngredients.length === final_combination.required.length &&
                            final_combination.required.every(ing => allIngredients.includes(ing));
          
          if (matchIntermediate || matchFinal) {
            return { v1, v2, match: matchIntermediate || final_combination };
          }
        }
      }
    }
    
    return null;
  }
  
  // Generate a random verb for combination animations
  function getRandomVerb() {
    const verbs = [
      "MIX", "BLEND", "COMBINE", "FOLD", "STIR", "WHISK",
      "MELT", "SIMMER", "SAUTÉ", "BAKE", "GRILL", "ROAST",
      "STEAM", "BOIL", "FRY", "TOAST", "MASH", "CHOP"
    ];
    
    return verbs[Math.floor(p.random(verbs.length))];
  }
  
  // Create all initial vessels for the game
  function createInitialVessels(ingredients, complete_combinations, basic_w, basic_h, COLORS) {
    // Shuffle ingredients for variety
    const shuffledIngredients = shuffleArray([...ingredients]);
    
    // Create vessels for each ingredient
    const vessels = shuffledIngredients.map(ingredient => {
      return new Vessel(
        [ingredient], 
        complete_combinations,
        '', // No name for basic ingredients
        COLORS.vesselBase, // Base color for ingredients
        0, 0, basic_w, basic_h // Position will be set by arrangement
      );
    });
    
    return vessels;
  }
  
  // Initialize game state
  function initializeGame(ingredients, vessels, complete_combinations, basic_w, basic_h, COLORS) {
    // Clear vessels
    vessels.length = 0;
    
    // Create vessels for each ingredient
    const initialVessels = createInitialVessels(ingredients, complete_combinations, basic_w, basic_h, COLORS);
    
    // Add vessels to game state
    vessels.push(...initialVessels);
    
    return vessels;
  }
  
  // Initialize hint vessel
  function initializeHintVessel(combo) {
    return new HintVessel(combo);
  }
  
  // Check if the final combination is the only one remaining
  function isOnlyFinalComboRemaining(vessels, final_combination) {
    // If there are no vessels, then the final combo isn't remaining
    if (vessels.length === 0) return false;
    
    // Count complete vessels (green vessels)
    const completeVessels = vessels.filter(v => 
      v.name && v.color === '#778F5D' && v.name !== final_combination.name
    );
    
    // Count vessels with the final combo name
    const finalVessels = vessels.filter(v => 
      v.name === final_combination.name
    );
    
    // Count unused ingredients (base vessels)
    const unusedIngredients = vessels.filter(v => 
      v.ingredients.length === 1 && v.color === '#F9F5EB'
    );
    
    // Only final combo remaining if:
    // 1. No unused ingredients
    // 2. All intermediate combos are used
    // 3. No final vessel yet
    return unusedIngredients.length === 0 && 
           completeVessels.length === 0 && 
           finalVessels.length === 0;
  }
  
  // Return the public API
  return {
    arrangeVessels,
    assignPreferredRow,
    combineVessels,
    createCombinationAnimation,
    checkForMatchingVessels,
    getRandomVerb,
    createInitialVessels,
    initializeGame,
    initializeHintVessel,
    isOnlyFinalComboRemaining
  };
};

// Export the module
export default createGameMechanicsModule; 