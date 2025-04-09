/**
 * utils.js
 * Contains utility functions for the Combo Meal game
 * Last Updated: March 26, 2025 (13:00 EDT) by APlasker
 */

const createUtilsModule = (p) => {
  
  // Shuffle array elements in place
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(p.random(i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Get current EST time as formatted string
  function getCurrentESTTime() {
    const now = new Date();
    
    // Format options
    const options = {
      timeZone: 'America/New_York',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return now.toLocaleString('en-US', options);
  }
  
  // Provide haptic feedback on supported devices
  function triggerHapticFeedback(type = 'medium') {
    // Check if the navigator.vibrate API is available
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate([30, 20, 40]);
          break;
        case 'error':
          navigator.vibrate([20, 40, 20]);
          break;
        case 'success':
          navigator.vibrate([15, 15, 30]);
          break;
        default:
          navigator.vibrate(25);
      }
    }
  }
  
  // Check if the device is mobile or tablet
  function isMobileDevice() {
    // Simple check for touch capability and screen size
    const hasTouchScreen = ('ontouchstart' in window) || 
                          (navigator.maxTouchPoints > 0) || 
                          (navigator.msMaxTouchPoints > 0);
                          
    // Consider devices with width less than 1024px as mobile/tablet
    const isSmallScreen = p.windowWidth < 1024;
    
    return hasTouchScreen && isSmallScreen;
  }
  
  // Handle sharing scores to clipboard
  function clipboardShareFallback(text) {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    let success = false;
    
    try {
      // Execute the copy command
      success = document.execCommand('copy');
    } catch (err) {
      console.error('Error copying text: ', err);
    }
    
    // Clean up
    document.body.removeChild(textArea);
    
    return success;
  }
  
  // Helper function to share score via appropriate method
  async function shareScore(scoreText) {
    // First try the Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Combo Meal Score',
          text: scoreText
        });
        return true;
      } catch (err) {
        console.error('Error sharing: ', err);
      }
    }
    
    // Fallback to clipboard copy
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(scoreText);
        return true;
      } catch (err) {
        console.error('Error copying to clipboard: ', err);
      }
    }
    
    // Final fallback
    return clipboardShareFallback(scoreText);
  }
  
  // Calculate a letter grade based on game performance
  function calculateLetterGrade(moveCount, hintCount, optimalMoveCount) {
    // Base score starts at A
    const perfectGrade = 'A+';
    const aGrade = 'A';
    const bGrade = 'B';
    const cGrade = 'C';
    const failGrade = 'X';
    
    // If optimal move count isn't defined, assume 10 for this puzzle
    optimalMoveCount = optimalMoveCount || 10;
    
    // No hints used and perfect moves gets A+
    if (hintCount === 0 && moveCount <= optimalMoveCount) {
      return { grade: perfectGrade, isAPlus: true };
    }
    
    // Calculate efficiency as ratio of optimal to actual moves
    const efficiency = optimalMoveCount / moveCount;
    
    // Deduct for hints used
    const hintPenalty = hintCount * 0.1;
    
    // Calculate final score
    const finalScore = efficiency - hintPenalty;
    
    if (finalScore >= 0.9) {
      return { grade: aGrade, isAPlus: false };
    } else if (finalScore >= 0.7) {
      return { grade: bGrade, isAPlus: false };
    } else if (finalScore >= 0.5) {
      return { grade: cGrade, isAPlus: false };
    } else {
      return { grade: failGrade, isAPlus: false };
    }
  }
  
  // Check if a point is inside a rectangle
  function pointInRect(x, y, rx, ry, rw, rh) {
    return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
  }
  
  // Ease value with cubic in/out
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  // Return the public API
  return {
    shuffleArray,
    getCurrentESTTime,
    triggerHapticFeedback,
    isMobileDevice,
    clipboardShareFallback,
    shareScore,
    calculateLetterGrade,
    pointInRect,
    easeInOutCubic
  };
};

// Export the module
export default createUtilsModule; 