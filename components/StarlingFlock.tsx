import React, { useEffect, useRef } from 'react';

/**
 * Performant Canvas-based Boids (Murmuration) simulation.
 * Creates a "3D" flocking effect of Starlings that reacts to scroll.
 */

// Load the bird image once globally
const birdImg = new Image();
birdImg.src = '/favicon.png';

// Boid logic
class Boid {
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    size: number;
    color: string;

    constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * 200 - 100; // -100 to 100 depth

        // Initial velocity
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * 1;
        this.vy = Math.sin(angle) * 1;
        this.vz = (Math.random() - 0.5) * 0.5;

        // Visuals
        this.size = 2 + Math.random() * 2;
        this.color = '#1e3a34'; // Starling dark green/black
    }

    update(isMobile: boolean) {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        // Speed limits
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);
        const maxSpeed = isMobile ? 0.8 : 1.8;
        const minSpeed = isMobile ? 0.3 : 0.8;

        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
            this.vz = (this.vz / speed) * maxSpeed;
        } else if (speed < minSpeed) {
            this.vx = (this.vx / speed) * minSpeed;
            this.vy = (this.vy / speed) * minSpeed;
            this.vz = (this.vz / speed) * minSpeed;
        }
    }

    draw(ctx: CanvasRenderingContext2D, scrollY: number, width: number, height: number, vh: number) {
        // Calculate 3D projection
        // The deeper it is, the smaller it is.
        const perspective = 300 / (300 + this.z);
        const projectedX = this.x;
        // Parallax effect on Y based on depth
        // closer birds move faster with scroll
        const parallaxY = scrollY * (0.1 + (this.z + 100) / 400);
        const projectedY = this.y - parallaxY;

        // If off-screen vertically due to scroll, wrap around smoothly
        // We use an absolute static world height to prevent mobile address bar resizes from 
        // dynamically altering the modulo math and causing aggressive vertical jumps!
        const WORLD_HEIGHT = 4000;
        let wrappedY = ((projectedY % WORLD_HEIGHT) + WORLD_HEIGHT) % WORLD_HEIGHT;

        // Shift it slightly so birds can naturally fly out of frame before popping back in
        if (wrappedY > WORLD_HEIGHT - vh) {
            wrappedY -= WORLD_HEIGHT;
        }

        // horizontal wrap
        const WORLD_WIDTH = 3000;
        let wrappedX = ((this.x % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH;
        if (wrappedX > WORLD_WIDTH - 200) {
            wrappedX -= WORLD_WIDTH;
        }

        const renderedSize = this.size * perspective;
        if (renderedSize < 0.2) return; // Too far

        // Calculate rotation based on 2D velocity mapping
        const angle = Math.atan2(this.vy, this.vx);

        ctx.save();
        ctx.translate(wrappedX, wrappedY);
        ctx.scale(perspective, perspective);
        // Add a 90 degree offset (pi/2) because the image might not be facing perfectly "right" like the math expects.
        // We will assume the bird image flies "up" or "right" natively; user can let us know if the rotation is off.
        // Adjusting angle so it flies forward correctly. We test with standard angle first.
        ctx.rotate(angle);

        // Opacity drops as it goes deeper
        ctx.globalAlpha = Math.max(0.1, 1 - (this.z + 100) / 300);

        if (birdImg.complete && birdImg.naturalWidth > 0) {
            // Draw custom starling image
            const imgW = this.size * 10; // Making it a bit larger so the details show 
            const imgH = this.size * 10;
            ctx.drawImage(birdImg, -imgW / 2, -imgH / 2, imgW, imgH);
        } else {
            // Fallback triangle shape
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.moveTo(this.size * 2, 0); // Beak
            ctx.lineTo(-this.size, this.size); // Bottom wing
            ctx.lineTo(-this.size / 2, 0); // Tail center
            ctx.lineTo(-this.size, -this.size); // Top wing
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

export const StarlingFlock: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollYRef = useRef(0);
    const targetScrollYRef = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            targetScrollYRef.current = window.scrollY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', handleResize);

        // Configuration
        const isMobile = width <= 768;
        const numBoids = isMobile ? 25 : 100; // Significantly fewer on mobile for subtlety
        const boids: Boid[] = Array.from({ length: numBoids }, () => new Boid(width, height * 2));

        let animationFrameId: number;

        // Boid parameters
        const visualRange = 100;
        const separationDistance = 20;

        const animate = () => {
            // Smooth scroll interpolation
            scrollYRef.current += (targetScrollYRef.current - scrollYRef.current) * 0.05;

            ctx.clearRect(0, 0, width, height);

            // Boid Algorithm
            for (let i = 0; i < boids.length; i++) {
                const boid = boids[i];
                let centerX = 0, centerY = 0, centerZ = 0;
                let avgVX = 0, avgVY = 0, avgVZ = 0;
                let numNeighbors = 0;

                let sepVX = 0, sepVY = 0, sepVZ = 0;

                for (let j = 0; j < boids.length; j++) {
                    if (i === j) continue;
                    const other = boids[j];

                    const dx = boid.x - other.x;
                    const dy = boid.y - other.y;
                    const dz = boid.z - other.z;
                    const distSq = dx * dx + dy * dy + dz * dz;

                    if (distSq < visualRange * visualRange) {
                        centerX += other.x;
                        centerY += other.y;
                        centerZ += other.z;
                        avgVX += other.vx;
                        avgVY += other.vy;
                        avgVZ += other.vz;
                        numNeighbors++;

                        if (distSq < separationDistance * separationDistance) {
                            // Separation
                            sepVX += dx;
                            sepVY += dy;
                            sepVZ += dz;
                        }
                    }
                }

                if (numNeighbors > 0) {
                    // Removed Cohesion and Alignment so they fly independently instead of grouping up
                }

                // Separation applying (so they don't visually overlap perfectly)
                boid.vx += sepVX * 0.05;
                boid.vy += sepVY * 0.05;
                boid.vz += sepVZ * 0.05;

                // Independent gentle wander (Perlin-ish fake noise) so they casually swoop and curve
                boid.vx += (Math.random() - 0.5) * 0.15;
                boid.vy += (Math.random() - 0.5) * 0.15;
                boid.vz += (Math.random() - 0.5) * 0.15;

                // Border limits
                const turnFactor = 0.2;

                // Removed vertical Y bouncing so birds don't violently turn around in the middle of 
                // the screen when user scrolls down. They simply fly forever and wrap seamlessly!

                // Keep z bounded
                if (boid.z < -150) boid.vz += turnFactor;
                if (boid.z > 150) boid.vz -= turnFactor;

                // Introduce a slight global "wind" or "scroll pull"
                // Turned off to prevent aggressive velocity injections during iOS overscroll rubber-banding
                // const scrollVelocity = (targetScrollYRef.current - scrollYRef.current);
                // if (Math.abs(scrollVelocity) > 5) {
                //     boid.vy += (scrollVelocity > 0 ? 0.05 : -0.05);
                // }

                boid.update(isMobile);
            }

            // Depth sorting for rendering
            const sortedBoids = [...boids].sort((a, b) => b.z - a.z);
            for (const boid of sortedBoids) {
                boid.draw(ctx, scrollYRef.current, width, height, window.innerHeight);
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-0 mix-blend-multiply opacity-50"
            style={{ position: 'fixed', top: 0, left: 0 }}
        />
    );
};
