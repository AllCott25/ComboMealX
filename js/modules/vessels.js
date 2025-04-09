/**
 * vessels.js
 * Contains vessel classes for the Combo Meal game
 * Last Updated: March 26, 2025 (13:00 EDT) by APlasker
 */

const createVesselsModule = (p) => {
  
  // Vessel class for game ingredients
  class Vessel {
    constructor(ingredients, complete_combinations, name, color, x, y, w, h) {
      this.ingredients = ingredients; // Array of ingredients contained in this vessel
      this.complete_combinations = complete_combinations; // Reference to all possible combinations
      this.name = name; // Display name
      this.color = color; // Background color
      this.x = x; // Current x position
      this.y = y; // Current y position
      this.targetX = x; // Target x position (for animations)
      this.targetY = y; // Target y position (for animations)
      this.w = w; // Width
      this.h = h; // Height
      this.cornerRadius = 10; // Rounded corner radius
      this.dragging = false; // Whether vessel is being dragged
      this.shouldDisplay = true; // Whether to display the vessel
      this.isOverPartialSlot = false; // Whether vessel is over a partial combination slot
      this.partialSlotIndex = -1; // Index of partial slot vessel is over
      this.preferredRow = -1; // Preferred row for this vessel
      this.preferredColumn = -1; // Preferred column for this vessel
      this.isSnappingBack = false; // Whether vessel is snapping back after being dropped
      this.snapProgress = 0; // Progress of snapping animation (0-1)
      this.snapDuration = 10; // Duration of snapping animation in frames
      this.isShaking = false; // Whether vessel is shaking
      this.shakeProgress = 0; // Progress of shaking animation (0-1)
      this.shakeDuration = 15; // Duration of shaking animation in frames
      this.shakeAmount = 10; // Maximum amount to shake in pixels
      this.isPulsing = false; // Whether vessel is pulsing
      this.pulseProgress = 0; // Progress of pulse animation (0-1)
      this.pulseDuration = 15; // Duration of pulse animation in frames
      this.origScale = 1; // Original scale before pulse animation
      this.lastPulseTime = 0; // Time when last pulse occurred
      this.pulseSize = 1.2; // Size multiplier for pulse
      this.displayVerb = ""; // Verb to display above vessel
      this.verbTimer = 0; // Timer for how long to display verb
      this.verbDuration = 90; // Duration to display verb in frames
      this.verbOpacity = 255; // Opacity of verb text
      this.textLines = []; // Cached text lines for display
      this.textDirty = true; // Whether text needs to be recalculated
      this.animatingRowChange = false; // Whether vessel is animating to a new row
      this.rowChangeProgress = 0; // Progress of row change animation (0-1)
      this.rowChangeStart = { x: 0, y: 0 }; // Starting position for row change animation
      this.rowChangeEnd = { x: 0, y: 0 }; // Ending position for row change animation
      this.rowChangeDuration = 20; // Duration of row change animation in frames
    }
    
    getDisplayText() {
      // If text needs to be recalculated
      if (this.textDirty || this.textLines.length === 0) {
        if (this.name) {
          // Use vessel name if available
          this.textLines = splitTextIntoLines(this.name, this.w - 10);
        } else {
          // Otherwise use list of ingredients
          this.textLines = splitTextIntoLines(this.ingredients.join(" + "), this.w - 10);
        }
        this.textDirty = false;
      }
      
      return this.textLines;
    }
    
    isInside(x, y) {
      return x >= this.x && x <= this.x + this.w && 
             y >= this.y && y <= this.y + this.h;
    }
    
    snapBack() {
      this.isSnappingBack = true;
      this.snapProgress = 0;
      // Store current position as start of animation
      this.snapStartX = this.x;
      this.snapStartY = this.y;
    }
    
    shake() {
      this.isShaking = true;
      this.shakeProgress = 0;
    }
    
    update() {
      // Handle snapping back animation
      if (this.isSnappingBack) {
        this.snapProgress += 1 / this.snapDuration;
        
        if (this.snapProgress >= 1) {
          this.snapProgress = 1;
          this.isSnappingBack = false;
          this.x = this.targetX;
          this.y = this.targetY;
        } else {
          // Ease back to target position
          const t = this.snapProgress;
          const easedT = t < 0.5 ? 4 * t * t * t : 1 - p.pow(-2 * t + 2, 3) / 2;
          
          this.x = p.lerp(this.snapStartX, this.targetX, easedT);
          this.y = p.lerp(this.snapStartY, this.targetY, easedT);
        }
      }
      
      // Handle shaking animation
      if (this.isShaking) {
        this.shakeProgress += 1 / this.shakeDuration;
        
        if (this.shakeProgress >= 1) {
          this.shakeProgress = 0;
          this.isShaking = false;
        }
      }
      
      // Handle pulsing animation
      if (this.isPulsing) {
        this.pulseProgress += 1 / this.pulseDuration;
        
        if (this.pulseProgress >= 1) {
          this.pulseProgress = 0;
          this.isPulsing = false;
        }
      }
      
      // Handle verb display timer
      if (this.verbTimer > 0) {
        this.verbTimer--;
        
        if (this.verbTimer <= 15) { // Fade out in last 15 frames
          this.verbOpacity = p.map(this.verbTimer, 15, 0, 255, 0);
        }
        
        if (this.verbTimer === 0) {
          this.displayVerb = "";
        }
      }
      
      // Handle row change animation
      if (this.animatingRowChange) {
        this.rowChangeProgress += 1 / this.rowChangeDuration;
        
        if (this.rowChangeProgress >= 1) {
          this.rowChangeProgress = 1;
          this.animatingRowChange = false;
          this.x = this.rowChangeEnd.x;
          this.y = this.rowChangeEnd.y;
          this.targetX = this.x;
          this.targetY = this.y;
        } else {
          // Ease to new position
          const t = this.rowChangeProgress;
          const easedT = t < 0.5 ? 4 * t * t * t : 1 - p.pow(-2 * t + 2, 3) / 2;
          
          this.x = p.lerp(this.rowChangeStart.x, this.rowChangeEnd.x, easedT);
          this.y = p.lerp(this.rowChangeStart.y, this.rowChangeEnd.y, easedT);
        }
      }
    }
    
    draw() {
      if (!this.shouldDisplay) return;
      
      p.push();
      
      // Apply shake effect if active
      let drawX = this.x;
      let drawY = this.y;
      let scale = 1;
      
      if (this.isShaking) {
        // Calculate shake offset using sine wave
        const shakeOffset = p.sin(this.shakeProgress * p.PI * 6) * this.shakeAmount * (1 - this.shakeProgress);
        drawX += shakeOffset;
      }
      
      // Apply pulse effect if active
      if (this.isPulsing) {
        // Calculate scale based on pulse animation
        const pulseT = this.pulseProgress;
        // Ease out back effect
        scale = 1 + (this.pulseSize - 1) * (1 - pulseT * pulseT);
      }
      
      // Apply scale transformation
      if (scale !== 1) {
        p.translate(drawX + this.w/2, drawY + this.h/2);
        p.scale(scale);
        p.translate(-(drawX + this.w/2), -(drawY + this.h/2));
      }
      
      // Draw vessel background
      p.fill(this.color);
      p.noStroke();
      p.rect(drawX, drawY, this.w, this.h, this.cornerRadius);
      
      // Draw text
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      
      const lines = this.getDisplayText();
      const textX = drawX + this.w/2;
      const lineHeight = 20;
      
      // Position text in center of vessel
      const totalTextHeight = lines.length * lineHeight;
      let textY = drawY + this.h/2 - totalTextHeight/2 + lineHeight/2;
      
      for (const line of lines) {
        p.text(line, textX, textY);
        textY += lineHeight;
      }
      
      // Draw verb display if active
      if (this.displayVerb && this.verbTimer > 0) {
        const verbX = drawX + this.w/2;
        const verbY = drawY - 30;
        
        p.fill(0, this.verbOpacity);
        p.textSize(24);
        p.textStyle(p.BOLD);
        p.text(this.displayVerb.toUpperCase(), verbX, verbY);
        p.textStyle(p.NORMAL);
      }
      
      p.pop();
    }
    
    pulse(duration = 300) {
      this.isPulsing = true;
      this.pulseProgress = 0;
      this.pulseDuration = duration / 60; // Convert to frames (assuming 60fps)
      this.lastPulseTime = Date.now();
    }
    
    displayVerb(verb, duration = 1500) {
      this.displayVerb = verb;
      this.verbTimer = duration / (1000 / 60); // Convert to frames (assuming 60fps)
      this.verbOpacity = 255;
    }
  }
  
  // HintVessel class for showing hint vessels
  class HintVessel {
    constructor(combo) {
      this.combo = combo; // The combination this hint represents
      this.x = 0;
      this.y = 0;
      this.w = 140;
      this.h = 100;
      this.cornerRadius = 10;
      this.alpha = 0; // Start with transparent
      this.fadeDirection = 1; // 1 = fading in, -1 = fading out
      this.fadeSpeed = 10; // Alpha change per frame
      this.ingredients = [];
      this.complete = false;
      this.pulsing = false;
      this.pulseProgress = 0;
      this.pulseDuration = 15; // frames
      this.textLines = [];
    }
    
    update() {
      // Handle fading in/out
      this.alpha += this.fadeDirection * this.fadeSpeed;
      this.alpha = p.constrain(this.alpha, 0, 200); // Cap at semi-transparent
      
      // Handle pulsing animation
      if (this.pulsing) {
        this.pulseProgress += 1 / this.pulseDuration;
        
        if (this.pulseProgress >= 1) {
          this.pulseProgress = 0;
          this.pulsing = false;
        }
      }
    }
    
    draw() {
      if (this.alpha <= 0) return;
      
      p.push();
      
      // Apply pulse effect if active
      let scale = 1;
      if (this.pulsing) {
        // Pulse effect: grow and shrink
        const pulseAmount = p.sin(this.pulseProgress * p.PI) * 0.1;
        scale = 1 + pulseAmount;
        
        // Apply scale transformation from center
        p.translate(this.x + this.w/2, this.y + this.h/2);
        p.scale(scale);
        p.translate(-(this.x + this.w/2), -(this.y + this.h/2));
      }
      
      // Draw background with semi-transparency
      p.fill(p.color('#D96941'), this.alpha); // Hint vessel color
      p.noStroke();
      p.rect(this.x, this.y, this.w, this.h, this.cornerRadius);
      
      // Draw hint text
      p.fill(255, this.alpha);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      
      // Draw ingredients or combo name
      if (this.complete) {
        p.text(this.combo.name, this.x + this.w/2, this.y + this.h/2);
      } else {
        const needed = [...this.combo.required];
        // Filter out already added ingredients
        const missing = needed.filter(ing => !this.ingredients.includes(ing));
        
        // Split text into lines if needed
        if (this.textLines.length === 0) {
          this.textLines = splitTextIntoLines(missing.join(' + '), this.w - 20);
        }
        
        const lineHeight = 22;
        let textY = this.y + this.h/2 - ((this.textLines.length - 1) * lineHeight) / 2;
        
        for (const line of this.textLines) {
          p.text(line, this.x + this.w/2, textY);
          textY += lineHeight;
        }
      }
      
      p.pop();
    }
    
    isInside(x, y) {
      return x >= this.x && x <= this.x + this.w && 
             y >= this.y && y <= this.y + this.h;
    }
    
    addIngredient(ingredient) {
      if (!this.ingredients.includes(ingredient)) {
        this.ingredients.push(ingredient);
      }
      
      // Check if all required ingredients are added
      const allAdded = this.combo.required.every(ing => this.ingredients.includes(ing));
      if (allAdded) {
        this.complete = true;
      }
    }
    
    isComplete() {
      return this.complete;
    }
    
    pulse(duration = 300) {
      this.pulsing = true;
      this.pulseProgress = 0;
      this.pulseDuration = duration / 60; // Convert to frames (assuming 60fps)
    }
    
    toVessel() {
      // Convert this hint vessel to a regular vessel
      const vessel = new Vessel(
        [...this.ingredients],
        [], // complete_combinations reference will be set by caller
        this.combo.name,
        '#778F5D', // Green color for completed vessels
        this.x,
        this.y,
        this.w,
        this.h
      );
      
      return vessel;
    }
  }
  
  // Helper function to split text into lines that fit within a width
  function splitTextIntoLines(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    p.textSize(16); // Set text size for measurement
    
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = p.textWidth(currentLine + ' ' + word);
      
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    lines.push(currentLine);
    return lines;
  }
  
  // Return the public API
  return {
    Vessel,
    HintVessel,
    splitTextIntoLines
  };
};

// Export the module
export default createVesselsModule; 