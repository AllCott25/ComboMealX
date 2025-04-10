/**
 * ui-components.js
 * Contains UI component classes for the Combo Meal game
 * Last Updated: March 26, 2025 (13:00 EDT) by APlasker
 */

const createUIComponentsModule = (p) => {
  
  // Button class for interactive UI elements
  class Button {
    constructor(x, y, w, h, label, action, color = '#778F5D', textColor = 'white', borderColor = null) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.label = label;
      this.action = action;
      this.color = color;
      this.textColor = textColor;
      this.borderColor = borderColor;
      this.isHovered = false;
      this.isActive = true;
      this.cornerRadius = 10;
      this.animations = [];
      this.pulseScale = 1;
      this.pulseDirection = 0.02;
      this.isPulsing = false;
    }
    
    draw() {
      if (!this.isActive) return;
      
      p.push();
      
      // Draw button background
      p.noStroke();
      
      // Apply hover effect
      if (this.isHovered) {
        // Lighten color when hovered
        const c = p.color(this.color);
        p.fill(p.red(c) + 20, p.green(c) + 20, p.blue(c) + 20);
      } else {
        p.fill(this.color);
      }
      
      // Apply pulse animation if active
      let currentScale = 1;
      if (this.isPulsing) {
        this.pulseScale += this.pulseDirection;
        if (this.pulseScale > 1.05) {
          this.pulseDirection = -0.02;
        }
        if (this.pulseScale < 0.95) {
          this.pulseDirection = 0.02;
        }
        currentScale = this.pulseScale;
      }
      
      const scaledW = this.w * currentScale;
      const scaledH = this.h * currentScale;
      const scaledX = this.x - (scaledW - this.w) / 2;
      const scaledY = this.y - (scaledH - this.h) / 2;
      
      // Draw rounded rectangle for button
      p.rect(scaledX, scaledY, scaledW, scaledH, this.cornerRadius);
      
      // Draw border if specified
      if (this.borderColor) {
        p.stroke(this.borderColor);
        p.strokeWeight(2);
        p.noFill();
        p.rect(scaledX, scaledY, scaledW, scaledH, this.cornerRadius);
      }
      
      // Draw text
      p.fill(this.textColor);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text(this.label, scaledX + scaledW/2, scaledY + scaledH/2);
      
      p.pop();
    }
    
    isInside(x, y) {
      if (!this.isActive) return false;
      return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
    }
    
    checkHover(x, y) {
      this.isHovered = this.isInside(x, y);
    }
    
    handleClick() {
      if (this.isActive && this.action) {
        this.action();
      }
    }
    
    startPulsing() {
      this.isPulsing = true;
      this.pulseScale = 1;
      this.pulseDirection = 0.02;
    }
    
    stopPulsing() {
      this.isPulsing = false;
      this.pulseScale = 1;
    }
  }
  
  // Draw the game title
  function drawTitle(x, y, size, COLORS) {
    p.push();
    p.translate(x, y);
    
    // "Combo Meal" text
    p.fill(COLORS.primary);
    p.textSize(size);
    p.textStyle(p.BOLD);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("COMBO", 0, -size/3);
    p.fill(COLORS.secondary);
    p.text("MEAL", 0, size/3);
    
    // Set text style back to normal
    p.textStyle(p.NORMAL);
    
    p.pop();
  }
  
  // Draw the byline text
  function drawByline(message, x, y, width, opacity, COLORS) {
    try {
      p.push();
      
      // Create a proper color object with opacity
      let textColor;
      try {
        // Ensure opacity is a number between 0-255
        const alpha = typeof opacity === 'number' ? p.constrain(opacity, 0, 255) : 255;
        
        // Use p5's color function to create a proper color with alpha
        if (COLORS && COLORS.text) {
          textColor = p.color(COLORS.text);
          textColor.setAlpha(alpha);
        } else {
          // Fallback to black if color object is invalid
          console.warn('Invalid COLORS object in drawByline, using fallback');
          textColor = p.color(0, 0, 0, alpha);
        }
        
        p.fill(textColor);
      } catch (colorErr) {
        // If color creation fails, use a safe fallback
        console.error('Error creating color in drawByline:', colorErr);
        p.fill(0, 0, 0, 255); // Black as fallback
      }
      
      p.textSize(16);
      p.textAlign(p.CENTER, p.CENTER);
      
      // Safe text drawing
      if (typeof message === 'string') {
        p.text(message, x, y, width);
      } else {
        // Fallback for non-string messages
        p.text('Game message', x, y, width);
      }
      
      p.pop();
    } catch (err) {
      // Recover from any errors in the function
      console.error('Error in drawByline:', err);
      // Don't let the error propagate and crash the game
    }
  }
  
  // Draw a tutorial equation
  function drawTutorialEquation(
    equationNum, 
    leftName, leftColor, 
    rightName, rightColor, 
    resultName, resultColor, 
    description, 
    yPosition, 
    showStarburst = false, 
    descriptionSize = 16,
    COLORS
  ) {
    const centerX = p.width / 2;
    const vesselSize = 70;
    const spacing = 50;
    
    // Draw equation number
    p.push();
    p.fill(COLORS.text);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(24);
    p.text(equationNum + ".", centerX - 200, yPosition);
    p.pop();
    
    // Draw left vessel
    drawTutorialVessel(centerX - spacing - vesselSize, yPosition, leftName, leftColor, vesselSize, vesselSize);
    
    // Draw "+" sign
    p.push();
    p.fill(COLORS.text);
    p.textSize(30);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("+", centerX, yPosition);
    p.pop();
    
    // Draw right vessel
    drawTutorialVessel(centerX + spacing, yPosition, rightName, rightColor, vesselSize, vesselSize);
    
    // Draw "=" sign
    p.push();
    p.fill(COLORS.text);
    p.textSize(30);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("=", centerX + spacing + vesselSize + 30, yPosition);
    p.pop();
    
    // Draw result vessel with optional starburst
    const resultX = centerX + spacing + vesselSize + 60 + vesselSize/2;
    
    if (showStarburst) {
      drawStarburst(resultX, yPosition, COLORS);
    }
    
    drawTutorialVessel(resultX, yPosition, resultName, resultColor, vesselSize, vesselSize);
    
    // Draw description
    p.push();
    p.fill(COLORS.text);
    p.textSize(descriptionSize);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(description, centerX, yPosition + vesselSize/2 + 30);
    p.pop();
  }
  
  // Draw a tutorial vessel
  function drawTutorialVessel(x, y, name, color, vesselWidth, vesselHeight) {
    p.push();
    
    // Draw vessel body
    p.fill(color);
    p.noStroke();
    p.rect(x - vesselWidth/2, y - vesselHeight/2, vesselWidth, vesselHeight, 10);
    
    // Draw vessel name
    p.fill('white');
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(vesselWidth / 8);
    
    // Handle line breaks for long names
    const words = name.split(' ');
    if (words.length > 2) {
      // Multi-line text for longer names
      const topLine = words.slice(0, Math.ceil(words.length / 2)).join(' ');
      const bottomLine = words.slice(Math.ceil(words.length / 2)).join(' ');
      p.text(topLine, x, y - 10);
      p.text(bottomLine, x, y + 10);
    } else {
      // Single line for shorter names
      p.text(name, x, y);
    }
    
    p.pop();
  }
  
  // Draw a starburst shape
  function drawStarburst(x, y, COLORS) {
    p.push();
    p.translate(x, y);
    
    // Draw starburst
    p.fill(COLORS.tertiary);
    p.noStroke();
    
    const outerRadius = 50;
    const innerRadius = 30;
    const points = 16;
    
    p.beginShape();
    for (let i = 0; i < points * 2; i++) {
      const angle = p.map(i, 0, points * 2, 0, p.TWO_PI);
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = p.cos(angle) * radius;
      const py = p.sin(angle) * radius;
      p.vertex(px, py);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }
  
  // Draw win screen star
  function drawStar(x, y, radius1, radius2, npoints) {
    p.push();
    p.translate(x, y);
    
    let angle = p.TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    
    p.beginShape();
    for (let a = -p.HALF_PI; a < p.TWO_PI - p.HALF_PI; a += angle) {
      let sx = p.cos(a) * radius2;
      let sy = p.sin(a) * radius2;
      p.vertex(sx, sy);
      sx = p.cos(a + halfAngle) * radius1;
      sy = p.sin(a + halfAngle) * radius1;
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }
  
  // Draw a star with rounded points
  function starWithRoundedPoints(x, y, radius1, radius2, npoints, roundness) {
    p.push();
    p.translate(x, y);
    
    const angle = p.TWO_PI / npoints;
    const halfAngle = angle / 2.0;
    
    p.beginShape();
    for (let a = -p.HALF_PI; a < p.TWO_PI - p.HALF_PI; a += angle) {
      // Outer point
      const outerX = p.cos(a) * radius2;
      const outerY = p.sin(a) * radius2;
      
      // Inner point
      const innerX = p.cos(a + halfAngle) * radius1;
      const innerY = p.sin(a + halfAngle) * radius1;
      
      // Previous inner point
      const prevInnerX = p.cos(a - halfAngle) * radius1;
      const prevInnerY = p.sin(a - halfAngle) * radius1;
      
      // Control points for the outer point curve
      const ctrl1X = p.lerp(prevInnerX, outerX, 1 - roundness/2);
      const ctrl1Y = p.lerp(prevInnerY, outerY, 1 - roundness/2);
      const ctrl2X = p.lerp(innerX, outerX, 1 - roundness/2);
      const ctrl2Y = p.lerp(innerY, outerY, 1 - roundness/2);
      
      // Add the curved outer point
      p.vertex(prevInnerX, prevInnerY);
      p.bezierVertex(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, innerX, innerY);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }
  
  // Draw a flower shape
  function drawFlower(x, y, petalSize, color) {
    p.push();
    p.translate(x, y);
    
    // Draw petals
    p.fill(color);
    p.noStroke();
    
    for (let i = 0; i < 5; i++) {
      p.push();
      p.rotate(i * p.TWO_PI / 5);
      p.ellipse(0, -petalSize/2, petalSize/2, petalSize);
      p.pop();
    }
    
    // Draw center
    p.fill(255, 240, 180);
    p.ellipse(0, 0, petalSize/2, petalSize/2);
    
    p.pop();
  }
  
  // Draw floral border
  function drawFloralBorder(COLORS) {
    p.push();
    
    // Vibrant color palette for flowers
    const flowerColors = [
      COLORS.primary,
      COLORS.secondary,
      COLORS.tertiary,
      COLORS.accent
    ];
    
    // Create a vertical gradient for the border
    const borderHeight = 30;
    const topY = 0;
    const bottomY = p.height - borderHeight;
    
    // Draw top border
    for (let x = 0; x < p.width; x += 30) {
      // Alternate flower colors
      const colorIndex = Math.floor(x / 30) % flowerColors.length;
      drawFlower(x, topY + borderHeight/2, 25, flowerColors[colorIndex]);
    }
    
    // Draw bottom border
    for (let x = 15; x < p.width; x += 30) {
      // Alternate flower colors (offset from top)
      const colorIndex = (Math.floor(x / 30) + 2) % flowerColors.length;
      drawFlower(x, bottomY + borderHeight/2, 25, flowerColors[colorIndex]);
    }
    
    p.pop();
  }
  
  // Draw top and bottom flowers
  function drawTopBottomFlowers(flowerRotation, COLORS) {
    p.push();
    
    // Vibrant color palette for flowers
    const flowerColors = [
      COLORS.primary,
      COLORS.secondary,
      COLORS.tertiary,
      COLORS.accent
    ];
    
    // Draw flowers along top edge
    for (let x = 0; x < p.width; x += 60) {
      p.push();
      p.translate(x, 15);
      p.rotate(flowerRotation + x * 0.01);
      
      const colorIndex = Math.floor(x / 60) % flowerColors.length;
      
      // Draw flower petals
      p.fill(flowerColors[colorIndex]);
      for (let i = 0; i < 5; i++) {
        p.push();
        p.rotate(i * p.TWO_PI / 5);
        p.ellipse(0, -10, 10, 20);
        p.pop();
      }
      
      // Draw flower center
      p.fill(255, 240, 180);
      p.ellipse(0, 0, 10, 10);
      
      p.pop();
    }
    
    // Draw flowers along bottom edge
    for (let x = 30; x < p.width; x += 60) {
      p.push();
      p.translate(x, p.height - 15);
      p.rotate(-flowerRotation + x * 0.01);
      
      const colorIndex = (Math.floor(x / 60) + 2) % flowerColors.length;
      
      // Draw flower petals
      p.fill(flowerColors[colorIndex]);
      for (let i = 0; i < 5; i++) {
        p.push();
        p.rotate(i * p.TWO_PI / 5);
        p.ellipse(0, -10, 10, 20);
        p.pop();
      }
      
      // Draw flower center
      p.fill(255, 240, 180);
      p.ellipse(0, 0, 10, 10);
      
      p.pop();
    }
    
    p.pop();
  }
  
  // Helper function to show a modal dialog
  function showShareModal(text, COLORS) {
    p.push();
    
    // Background overlay
    p.fill(0, 150);
    p.rect(0, 0, p.width, p.height);
    
    // Modal dialog
    const modalWidth = p.min(400, p.width - 40);
    const modalHeight = 300;
    const modalX = p.width/2 - modalWidth/2;
    const modalY = p.height/2 - modalHeight/2;
    
    // Modal background
    p.fill(255);
    p.rect(modalX, modalY, modalWidth, modalHeight, 15);
    
    // Modal title
    p.fill(COLORS.primary);
    p.textSize(24);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Share Your Score", p.width/2, modalY + 20);
    
    // Score text
    p.fill(COLORS.text);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(text, p.width/2, modalY + 100, modalWidth - 40, 100);
    
    // Copy button
    p.fill(COLORS.secondary);
    p.rect(modalX + modalWidth/2 - 100, modalY + modalHeight - 60, 200, 40, 10);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Copy to Clipboard", modalX + modalWidth/2, modalY + modalHeight - 40);
    
    p.pop();
  }
  
  // Return the public API
  return {
    Button,
    drawTitle,
    drawByline,
    drawTutorialEquation,
    drawTutorialVessel,
    drawStarburst,
    drawStar,
    starWithRoundedPoints,
    drawFlower,
    drawFloralBorder,
    drawTopBottomFlowers,
    showShareModal
  };
};

// Export the module
export default createUIComponentsModule; 