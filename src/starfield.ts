// Cosmic Starfield Animation
// Creates an immersive space environment background

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

interface Constellation {
  stars: { x: number; y: number }[];
  opacity: number;
}

export class StarfieldRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private constellations: Constellation[] = [];
  private animationId: number = 0;
  private isAnimating: boolean = false;
  
  // Animation parameters
  private readonly NUM_STARS = 200;
  private readonly NUM_CONSTELLATIONS = 3;
  private readonly STAR_SPEED_MIN = 0.1;
  private readonly STAR_SPEED_MAX = 0.5;
  private readonly TWINKLE_SPEED = 0.02;
  private readonly Z_DISTANCE = 1000;
  
  // Color palette for stars
  private readonly STAR_COLORS = [
    '#FFFFFF',
    '#00A3FF',
    '#FFA500',
    '#CCCCCC',
    '#00FF88'
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.initializeCanvas();
    this.generateStars();
    this.generateConstellations();
    this.bindEvents();
  }

  private initializeCanvas(): void {
    this.resizeCanvas();
    
    // Set canvas properties for crisp rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  private generateStars(): void {
    this.stars = [];
    
    for (let i = 0; i < this.NUM_STARS; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.clientWidth,
        y: Math.random() * this.canvas.clientHeight,
        z: Math.random() * this.Z_DISTANCE,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * (this.STAR_SPEED_MAX - this.STAR_SPEED_MIN) + this.STAR_SPEED_MIN,
        opacity: Math.random() * 0.8 + 0.2,
        color: this.STAR_COLORS[Math.floor(Math.random() * this.STAR_COLORS.length)]
      });
    }
  }

  private generateConstellations(): void {
    this.constellations = [];
    
    for (let i = 0; i < this.NUM_CONSTELLATIONS; i++) {
      const numStars = Math.floor(Math.random() * 5) + 3;
      const centerX = Math.random() * this.canvas.clientWidth;
      const centerY = Math.random() * this.canvas.clientHeight;
      const radius = Math.random() * 100 + 50;
      
      const stars: { x: number; y: number }[] = [];
      
      for (let j = 0; j < numStars; j++) {
        const angle = (j / numStars) * Math.PI * 2 + Math.random() * 0.5;
        const distance = Math.random() * radius;
        
        stars.push({
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance
        });
      }
      
      this.constellations.push({
        stars,
        opacity: Math.random() * 0.3 + 0.1
      });
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.generateStars();
      this.generateConstellations();
    });
    
    // Performance optimization: pause animation when page is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  private updateStars(): void {
    const time = Date.now() * 0.001;
    
    this.stars.forEach(star => {
      // Move stars towards viewer (parallax effect)
      star.z -= star.speed;
      
      // Reset star when it gets too close
      if (star.z <= 0) {
        star.z = this.Z_DISTANCE;
        star.x = Math.random() * this.canvas.clientWidth;
        star.y = Math.random() * this.canvas.clientHeight;
      }
      
      // Twinkle effect
      star.opacity = 0.5 + 0.5 * Math.sin(time * this.TWINKLE_SPEED + star.x * 0.01);
    });
    
    // Update constellation opacity
    this.constellations.forEach(constellation => {
      constellation.opacity = 0.2 + 0.1 * Math.sin(time * 0.5);
    });
  }

  private renderStars(): void {
    this.stars.forEach(star => {
      // Calculate star position based on z-depth
      const scale = (this.Z_DISTANCE - star.z) / this.Z_DISTANCE;
      const x = star.x;
      const y = star.y;
      const size = star.size * scale;
      const opacity = star.opacity * scale;
      
      if (size < 0.1 || opacity < 0.01) return;
      
      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      this.ctx.fillStyle = star.color;
      
      // Add glow effect for larger stars
      if (size > 1) {
        this.ctx.shadowColor = star.color;
        this.ctx.shadowBlur = size * 2;
      }
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
  }

  private renderConstellations(): void {
    this.constellations.forEach(constellation => {
      if (constellation.stars.length < 2) return;
      
      this.ctx.save();
      this.ctx.globalAlpha = constellation.opacity;
      this.ctx.strokeStyle = '#00A3FF';
      this.ctx.lineWidth = 0.5;
      
      this.ctx.beginPath();
      this.ctx.moveTo(constellation.stars[0].x, constellation.stars[0].y);
      
      for (let i = 1; i < constellation.stars.length; i++) {
        this.ctx.lineTo(constellation.stars[i].x, constellation.stars[i].y);
      }
      
      this.ctx.stroke();
      this.ctx.restore();
    });
  }

  private render(): void {
    // Clear canvas with fade effect for trails
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    
    // Render constellations first (background)
    this.renderConstellations();
    
    // Render stars
    this.renderStars();
  }

  private animate = (): void => {
    if (!this.isAnimating) return;
    
    this.updateStars();
    this.render();
    
    this.animationId = requestAnimationFrame(this.animate);
  };

  public start(): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.animate();
  }

  public pause(): void {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  public resume(): void {
    if (!this.isAnimating) {
      this.start();
    }
  }

  public destroy(): void {
    this.pause();
    window.removeEventListener('resize', this.resizeCanvas);
    document.removeEventListener('visibilitychange', () => {});
  }

  // Public methods for dynamic control
  public setStarCount(count: number): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.clientWidth,
        y: Math.random() * this.canvas.clientHeight,
        z: Math.random() * this.Z_DISTANCE,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * (this.STAR_SPEED_MAX - this.STAR_SPEED_MIN) + this.STAR_SPEED_MIN,
        opacity: Math.random() * 0.8 + 0.2,
        color: this.STAR_COLORS[Math.floor(Math.random() * this.STAR_COLORS.length)]
      });
    }
  }

  public setAnimationSpeed(multiplier: number): void {
    this.stars.forEach(star => {
      star.speed *= multiplier;
    });
  }
}

// Initialize starfield when DOM is ready
export function initializeStarfield(): StarfieldRenderer | null {
  const canvas = document.getElementById('starfield') as HTMLCanvasElement;
  
  if (!canvas) {
    console.warn('Starfield canvas not found');
    return null;
  }
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    canvas.style.display = 'none';
    return null;
  }
  
  const starfield = new StarfieldRenderer(canvas);
  starfield.start();
  
  return starfield;
}