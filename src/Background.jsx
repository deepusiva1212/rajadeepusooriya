import { useEffect, useRef } from "react";

export default function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    // Set canvas to full window size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    // Corporate Colors with low opacity for the glowing effect
    const colors = [
      "rgba(200, 16, 46, 0.15)",   // Corp Red
      "rgba(212, 160, 23, 0.15)",  // Corp Gold
      "rgba(15, 41, 64, 0.4)",     // Mid Blue
      "rgba(59, 130, 246, 0.1)"    // Light Blue accent
    ];

    // Antigravity Particle Class
    class Orb {
      constructor() {
        this.radius = Math.random() * 150 + 50; // Random size between 50 and 200
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        // Random drift speed (Zero Gravity effect)
        this.vx = (Math.random() - 0.5) * 1.5; 
        this.vy = (Math.random() - 0.5) * 1.5;
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls smoothly (Antigravity boundaries)
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
          this.vx *= -1;
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
          this.vy *= -1;
        }
      }

      draw() {
        ctx.beginPath();
        // Create a glowing gradient
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, "transparent");
        
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create 15 floating orbs
    const orbs = [];
    for (let i = 0; i < 15; i++) {
      orbs.push(new Orb());
    }

    // Animation Loop
    const render = () => {
      // Clear the canvas with the deep corporate blue
      ctx.fillStyle = "#051324"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < canvas.width; i += 60) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 60) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // Update and draw floating orbs
      orbs.forEach(orb => {
        orb.update();
        orb.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}
