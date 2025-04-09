/**
 * animations.js
 * Contains animation classes for the Combo Meal game
 * Last Updated: March 26, 2025 (13:00 EDT) by APlasker
 */

const createAnimationsModule = (p) => {
  
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
  
  // Animation class for dramatic verb reveals
  class VerbAnimation {
    constructor(verb, x, y, vesselRef, playAreaX, playAreaY, playAreaWidth, playAreaHeight) {
      this.verb = verb;
      this.startX = x; // Starting position (over vessel)
      this.startY = y;
      
      // Calculate halfway point between vessel and center
      const centerX = playAreaX + playAreaWidth/2;
      const centerY = playAreaY + playAreaHeight/2;
      this.targetX = p.lerp(this.startX, centerX, 0.5); // Go halfway to center
      this.targetY = p.lerp(this.startY, centerY, 0.5); // Go halfway to center
      
      this.x = this.startX; // Current position
      this.y = this.startY;
      this.progress = 0;
      this.duration = 120; // 2 seconds at 60fps
      this.maxSize = playAreaWidth * 0.9; // 90% of play area width
      this.active = true;
      this.opacity = 255; // Track opacity separately
      this.cloudPoints = [];
      
      // Generate cloud points
      const cloudPointCount = 12;
      for (let i = 0; i < cloudPointCount; i++) {
        const angle = (i / cloudPointCount) * p.TWO_PI;
        const radius = 50 + p.random(-10, 10);
        this.cloudPoints.push({
          x: p.cos(angle) * radius,
          y: p.sin(angle) * radius
        });
      }
    }
    
    update() {
      if (!this.active) return true;
      
      this.progress += 1 / this.duration;
      
      if (this.progress < 0.5) {
        // First half: move to target position and grow
        const t = this.progress * 2; // Scale to 0-1 for first half
        const easedT = p.pow(t, 2); // Ease in
        
        this.x = p.lerp(this.startX, this.targetX, easedT);
        this.y = p.lerp(this.startY, this.targetY, easedT);
      } else if (this.progress >= 0.8) {
        // Last 20%: fade out
        const t = (this.progress - 0.8) * 5; // Scale to 0-1 for last 20%
        this.opacity = p.lerp(255, 0, t);
        
        if (this.progress >= 1) {
          this.active = false;
          return true; // Animation complete
        }
      }
      
      return false;
    }
    
    draw() {
      if (!this.active) return;
      
      p.push();
      
      // Determine size based on progress
      let size = 20; // Start small
      if (this.progress < 0.5) {
        // Grow during first half
        size = p.map(this.progress, 0, 0.5, 20, this.maxSize);
      } else {
        // Stay at max size for second half
        size = this.maxSize;
      }
      
      // Draw cloud shape
      p.noStroke();
      p.fill(255, this.opacity);
      
      p.push();
      p.translate(this.x, this.y);
      
      // Calculate scale based on progress
      let scale = p.map(this.progress, 0, 0.5, 0.2, 1);
      if (this.progress > 0.5) scale = 1;
      
      p.scale(scale);
      
      // Draw cloud
      p.beginShape();
      for (let point of this.cloudPoints) {
        p.curveVertex(point.x, point.y);
      }
      // Add the first points again to close the shape smoothly
      for (let i = 0; i < 3; i++) {
        p.curveVertex(this.cloudPoints[i].x, this.cloudPoints[i].y);
      }
      p.endShape();
      
      // Draw action verb
      p.fill(0, this.opacity);
      p.textSize(50);
      p.textStyle(p.BOLD);
      p.text(this.verb.toUpperCase(), 0, 0);
      
      p.pop();
      p.pop();
    }
  }
  
  // Animation class for the final verb animation
  class FinalVerbAnimation extends VerbAnimation {
    constructor(verb, vessel, playAreaX, playAreaY, playAreaWidth, playAreaHeight) {
      super(verb, vessel.x, vessel.y, vessel, playAreaX, playAreaY, playAreaWidth, playAreaHeight);
      this.vessel = vessel;
      
      // Override some properties for the final animation
      this.duration = 240; // 4 seconds at 60fps
      this.targetX = playAreaX + playAreaWidth/2; // Center of play area
      this.targetY = playAreaY + playAreaHeight/2;
      this.stars = [];
      
      // Create stars for the final animation
      for (let i = 0; i < 20; i++) {
        this.stars.push({
          x: p.random(-100, 100),
          y: p.random(-100, 100),
          size: p.random(5, 15),
          angle: p.random(p.TWO_PI),
          rotSpeed: p.random(0.01, 0.05),
          distance: p.random(50, 150)
        });
      }
    }
    
    update() {
      if (!this.active) return true;
      
      this.progress += 1 / this.duration;
      
      if (this.progress < 0.3) {
        // First 30%: move to center
        const t = this.progress / 0.3;
        const easedT = p.pow(t, 2);
        
        this.x = p.lerp(this.startX, this.targetX, easedT);
        this.y = p.lerp(this.startY, this.targetY, easedT);
      } else if (this.progress >= 0.8) {
        // Last 20%: fade out
        const t = (this.progress - 0.8) / 0.2;
        this.opacity = p.lerp(255, 0, t);
      }
      
      // Update stars
      for (let star of this.stars) {
        star.angle += star.rotSpeed;
      }
      
      if (this.progress >= 1) {
        this.active = false;
        return true;
      }
      
      return false;
    }
    
    draw() {
      if (!this.active) return;
      
      p.push();
      
      // Determine size based on progress
      let size;
      if (this.progress < 0.3) {
        // Grow during first 30%
        size = p.map(this.progress, 0, 0.3, 20, this.maxSize);
      } else {
        // Stay at max size after that
        size = this.maxSize;
      }
      
      // Draw cloud shape
      p.noStroke();
      
      p.push();
      p.translate(this.x, this.y);
      
      // Calculate scale based on progress
      let scale = p.map(this.progress, 0, 0.3, 0.2, 1.5);
      if (this.progress > 0.3) scale = 1.5;
      
      p.scale(scale);
      
      // Draw stars
      if (this.progress > 0.3) {
        for (let star of this.stars) {
          p.push();
          p.fill(255, 240, 0, this.opacity);
          p.translate(star.x, star.y);
          p.rotate(star.angle);
          p.beginShape();
          for (let i = 0; i < 5; i++) {
            let angle = p.TWO_PI / 5 * i - p.HALF_PI;
            let x = p.cos(angle) * star.size;
            let y = p.sin(angle) * star.size;
            p.vertex(x, y);
            angle += p.TWO_PI / 10;
            x = p.cos(angle) * (star.size / 2);
            y = p.sin(angle) * (star.size / 2);
            p.vertex(x, y);
          }
          p.endShape(p.CLOSE);
          p.pop();
        }
      }
      
      // Draw cloud
      p.fill(255, this.opacity);
      p.beginShape();
      for (let point of this.cloudPoints) {
        p.curveVertex(point.x, point.y);
      }
      // Add the first points again to close the shape smoothly
      for (let i = 0; i < 3; i++) {
        p.curveVertex(this.cloudPoints[i].x, this.cloudPoints[i].y);
      }
      p.endShape();
      
      // Draw action verb with different styling for final
      p.fill(0, this.opacity);
      p.textSize(60);
      p.textStyle(p.BOLD);
      p.text(this.verb.toUpperCase() + "!!!", 0, 0);
      
      p.pop();
      p.pop();
    }
  }
  
  // Class for flower burst animation
  class FlowerBurstAnimation {
    constructor(playAreaX, playAreaY, playAreaWidth, playAreaHeight, COLORS) {
      this.flowers = [];
      this.progress = 0;
      this.duration = 180; // 3 seconds at 60fps
      this.active = true;
      this.playAreaX = playAreaX;
      this.playAreaY = playAreaY;
      this.playAreaWidth = playAreaWidth;
      this.playAreaHeight = playAreaHeight;
      this.COLORS = COLORS;
      
      // Generate flowers
      const flowerCount = 20;
      const colors = [COLORS.primary, COLORS.secondary, COLORS.tertiary, COLORS.accent];
      
      for (let i = 0; i < flowerCount; i++) {
        const x = playAreaX + playAreaWidth/2;
        const y = playAreaY + playAreaHeight/2;
        const targetX = playAreaX + p.random(0, playAreaWidth);
        const targetY = playAreaY + p.random(0, playAreaHeight);
        const size = p.random(20, 40);
        const color = colors[Math.floor(p.random(colors.length))];
        
        this.flowers.push({
          x: x,
          y: y,
          targetX: targetX,
          targetY: targetY,
          size: size,
          color: color,
          rotation: p.random(p.TWO_PI),
          rotSpeed: p.random(-0.05, 0.05)
        });
      }
    }
    
    update() {
      if (!this.active) return true;
      
      this.progress += 1 / this.duration;
      
      if (this.progress >= 1) {
        this.active = false;
        return true;
      }
      
      // Update flowers
      for (let flower of this.flowers) {
        if (this.progress < 0.7) {
          // Move toward target position
          const t = this.progress / 0.7;
          const easedT = t < 0.5 ? 4 * t * t * t : 1 - p.pow(-2 * t + 2, 3) / 2;
          
          flower.x = p.lerp(this.playAreaX + this.playAreaWidth/2, flower.targetX, easedT);
          flower.y = p.lerp(this.playAreaY + this.playAreaHeight/2, flower.targetY, easedT);
        }
        
        // Rotate flower
        flower.rotation += flower.rotSpeed;
      }
      
      return false;
    }
    
    draw() {
      if (!this.active) return;
      
      p.push();
      
      // Draw flowers
      for (let flower of this.flowers) {
        this.drawFlower(flower.x, flower.y, flower.size, flower.color, flower.rotation);
      }
      
      p.pop();
    }
    
    drawFlower(x, y, size, color, rotation) {
      p.push();
      p.translate(x, y);
      p.rotate(rotation);
      
      // Draw petals
      p.noStroke();
      p.fill(color);
      
      for (let i = 0; i < 5; i++) {
        p.push();
        p.rotate(i * p.TWO_PI / 5);
        p.ellipse(0, -size/2, size/2, size);
        p.pop();
      }
      
      // Draw center
      p.fill(255, 240, 180);
      p.ellipse(0, 0, size/2, size/2);
      
      p.pop();
    }
  }
  
  // Helper function to create a combine animation
  function createCombineAnimation(startX, startY, color, targetX, targetY) {
    return new CombineAnimation(startX, startY, color, targetX, targetY);
  }
  
  // Helper function to create a verb animation for a vessel
  function createVerbAnimationForVessel(vessel, verb, playAreaX, playAreaY, playAreaWidth, playAreaHeight) {
    return new VerbAnimation(verb, vessel.x, vessel.y, vessel, playAreaX, playAreaY, playAreaWidth, playAreaHeight);
  }
  
  // Helper function to create a final verb animation
  function createFinalVerbAnimation(verb, vessel, playAreaX, playAreaY, playAreaWidth, playAreaHeight) {
    return new FinalVerbAnimation(verb, vessel, playAreaX, playAreaY, playAreaWidth, playAreaHeight);
  }
  
  // Return the public API
  return {
    CombineAnimation,
    VerbAnimation,
    FinalVerbAnimation,
    FlowerBurstAnimation,
    createCombineAnimation,
    createVerbAnimationForVessel,
    createFinalVerbAnimation
  };
};

// Export the module
export default createAnimationsModule; 