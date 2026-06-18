import React, { useEffect, useRef } from 'react';

/**
 * Performant Canvas-based Boids (Murmuration) simulation.
 * Creates a "3D" flocking effect of Starlings that reacts to scroll.
 *
 * The sprite is the Starlings favicon icon with its solid-black background
 * stripped out at load time via pixel manipulation, so only the teal logo
 * mark flies — no rectangular box artifacts.
 */

// Pre-process the favicon: load it, remove the near-black background pixels,
// cache the result as an HTMLCanvasElement for use in drawImage.
let birdSprite: HTMLCanvasElement | null = null;

(function loadBirdSprite() {
    const img = new Image();
    img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const oc = document.createElement('canvas');
        oc.width = w;
        oc.height = h;
        const octx = oc.getContext('2d', { willReadFrequently: true });
        if (!octx) return;

        octx.drawImage(img, 0, 0);
        const imageData = octx.getImageData(0, 0, w, h);
        const d = imageData.data;

        // The favicon has a solid-black (#000000) background at full opacity.
        // The actual Starlings icon is teal (r≈40-70, g≈98-125, b≈97-105).
        // Removing near-black pixels strips the background while leaving the
        // teal icon completely intact.
        for (let i = 0; i < d.length; i += 4) {
            if (d[i] < 40 && d[i + 1] < 40 && d[i + 2] < 40) {
                d[i + 3] = 0; // fully transparent
            }
        }

        octx.putImageData(imageData, 0, 0);
        birdSprite = oc;
    };
    img.src = import.meta.env.BASE_URL + 'favicon.png';
})();

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
        this.color = '#1e3a34'; // Starling dark teal
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

    draw(ctx: CanvasRenderingContext2D, scrollY: number, _width: number, _height: number, vh: number) {
        // 3D projection — deeper = smaller
        const perspective = 300 / (300 + this.z);

        // Parallax on Y: closer birds move faster with scroll
        const parallaxY = scrollY * (0.1 + (this.z + 100) / 400);
        const projectedY = this.y - parallaxY;

        // Vertical wrap — use a static world height to avoid mobile address-bar jumps
        const WORLD_HEIGHT = 4000;
        let wrappedY = ((projectedY % WORLD_HEIGHT) + WORLD_HEIGHT) % WORLD_HEIGHT;
        if (wrappedY > WORLD_HEIGHT - vh) wrappedY -= WORLD_HEIGHT;

        // Horizontal wrap
        const WORLD_WIDTH = 3000;
        let wrappedX = ((this.x % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH;
        if (wrappedX > WORLD_WIDTH - 200) wrappedX -= WORLD_WIDTH;

        const renderedSize = this.size * perspective;
        if (renderedSize < 0.2) return; // Too far away

        // Rotate to face direction of travel
        const angle = Math.atan2(this.vy, this.vx);

        ctx.save();
        ctx.translate(wrappedX, wrappedY);
        ctx.scale(perspective, perspective);
        ctx.rotate(angle);

        // Opacity drops as depth increases
        ctx.globalAlpha = Math.max(0.1, 1 - (this.z + 100) / 300);

        if (birdSprite) {
            // Draw the processed Starlings icon (background stripped, only teal mark remains)
            const imgSize = this.size * 11;
            ctx.drawImage(birdSprite, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
        } else {
            // Fallback: simple "M" wing silhouette while sprite loads
            const s = this.size;
            ctx.beginPath();
            ctx.moveTo(-s * 2.2, s * 0.4);
            ctx.quadraticCurveTo(-s * 1.1, -s * 1.0, 0, 0);
            ctx.quadraticCurveTo(s * 1.1, -s * 1.0, s * 2.2, s * 0.4);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = Math.max(0.4, s * 0.45);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
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

        const isMobile = width <= 768;
        const numBoids = isMobile ? 25 : 100;
        const boids: Boid[] = Array.from({ length: numBoids }, () => new Boid(width, height * 2));

        let animationFrameId: number;

        const visualRange = 100;
        const separationDistance = 20;

        const animate = () => {
            scrollYRef.current += (targetScrollYRef.current - scrollYRef.current) * 0.05;
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < boids.length; i++) {
                const boid = boids[i];
                let sepVX = 0, sepVY = 0, sepVZ = 0;

                for (let j = 0; j < boids.length; j++) {
                    if (i === j) continue;
                    const other = boids[j];
                    const dx = boid.x - other.x;
                    const dy = boid.y - other.y;
                    const dz = boid.z - other.z;
                    const distSq = dx * dx + dy * dy + dz * dz;

                    if (distSq < visualRange * visualRange) {
                        if (distSq < separationDistance * separationDistance) {
                            sepVX += dx;
                            sepVY += dy;
                            sepVZ += dz;
                        }
                    }
                }

                boid.vx += sepVX * 0.05;
                boid.vy += sepVY * 0.05;
                boid.vz += sepVZ * 0.05;

                // Gentle wander
                boid.vx += (Math.random() - 0.5) * 0.15;
                boid.vy += (Math.random() - 0.5) * 0.15;
                boid.vz += (Math.random() - 0.5) * 0.15;

                const turnFactor = 0.2;
                if (boid.z < -150) boid.vz += turnFactor;
                if (boid.z > 150) boid.vz -= turnFactor;

                boid.update(isMobile);
            }

            // Depth-sort: farther birds drawn first (behind)
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
