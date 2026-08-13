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
let birdSpriteLoading = false;

const loadBirdSprite = () => {
    if (birdSprite || birdSpriteLoading) return;
    birdSpriteLoading = true;
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
    img.onerror = () => {
        birdSpriteLoading = false;
    };
    img.src = import.meta.env.BASE_URL + 'favicon.png';
};

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

    update(isMobile: boolean, speedScale = 1, timeScale = 1) {
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;
        this.z += this.vz * timeScale;

        // Speed limits
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);
        const maxSpeed = (isMobile ? 0.8 : 1.8) * speedScale;
        const minSpeed = (isMobile ? 0.3 : 0.8) * speedScale;

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

    draw(ctx: CanvasRenderingContext2D, scrollY: number, _width: number, _height: number, vh: number, parallaxScale = 1) {
        // 3D projection — deeper = smaller
        const perspective = 300 / (300 + this.z);

        // Parallax on Y: closer birds move faster with scroll
        const parallaxY = scrollY * (0.1 + (this.z + 100) / 400) * parallaxScale;
        const projectedY = this.y - parallaxY;

        // Vertical wrap — use a static world height to avoid mobile address-bar jumps
        const WORLD_HEIGHT = 4000;
        let wrappedY = ((projectedY % WORLD_HEIGHT) + WORLD_HEIGHT) % WORLD_HEIGHT;
        if (wrappedY > WORLD_HEIGHT - vh) wrappedY -= WORLD_HEIGHT;

        // Horizontal wrap
        const WORLD_WIDTH = 3000;
        let wrappedX = ((this.x % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH;
        if (wrappedX > WORLD_WIDTH - 200) wrappedX -= WORLD_WIDTH;

        // Most of the simulated world sits outside the phone viewport. Avoid
        // canvas state changes and sprite rasterization for invisible birds.
        const cullMargin = 56;
        if (
            wrappedX < -cullMargin || wrappedX > _width + cullMargin ||
            wrappedY < -cullMargin || wrappedY > _height + cullMargin
        ) return;

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

type StarlingFlockProps = {
    variant?: 'landing' | 'quiet';
};

export const StarlingFlock: React.FC<StarlingFlockProps> = ({ variant = 'landing' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollYRef = useRef(0);
    const targetScrollYRef = useRef(0);
    const pausedRef = useRef(false);
    const focusedInputRef = useRef(false);
    const visibleFocusZonesRef = useRef(new Set<Element>());
    const fastScrollUntilRef = useRef(0);
    const lastScrollSampleRef = useRef({ y: 0, time: 0 });

    useEffect(() => {
        scrollYRef.current = window.scrollY;
        targetScrollYRef.current = window.scrollY;
        lastScrollSampleRef.current = { y: window.scrollY, time: performance.now() };
        const handleScroll = () => {
            const nextY = window.scrollY;
            const now = performance.now();
            const previous = lastScrollSampleRef.current;
            if (previous.time > 0) {
                const velocity = Math.abs(nextY - previous.y) / Math.max(1, now - previous.time);
                if (velocity > 0.85) fastScrollUntilRef.current = now + 180;
            }
            lastScrollSampleRef.current = { y: nextY, time: now };
            targetScrollYRef.current = nextY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fade out and stop work while a form is in view or a visitor is typing.
    // The brand moment stays available without competing with focused reading.
    useEffect(() => {
        const focusTargets = Array.from(document.querySelectorAll('form, [data-focus-zone]'));
        const syncPauseState = () => {
            pausedRef.current = focusedInputRef.current || visibleFocusZonesRef.current.size > 0;
            if (canvasRef.current) canvasRef.current.style.opacity = pausedRef.current ? '0' : '';
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.18) {
                    visibleFocusZonesRef.current.add(entry.target);
                } else {
                    visibleFocusZonesRef.current.delete(entry.target);
                }
            });
            syncPauseState();
        }, { threshold: [0, 0.18] });
        focusTargets.forEach(target => observer.observe(target));

        const handleFocus = (event: FocusEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target?.matches('input, textarea, select, [contenteditable="true"]')) return;
            focusedInputRef.current = true;
            syncPauseState();
        };
        const handleBlur = () => {
            focusedInputRef.current = false;
            syncPauseState();
        };
        document.addEventListener('focusin', handleFocus);
        document.addEventListener('focusout', handleBlur);
        return () => {
            observer.disconnect();
            document.removeEventListener('focusin', handleFocus);
            document.removeEventListener('focusout', handleBlur);
        };
    }, []);

    useEffect(() => {
        loadBirdSprite();
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
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            ctx.clearRect(0, 0, width, height);
            return () => window.removeEventListener('resize', handleResize);
        }
        // Resource browsing gets a smaller, calmer flock than the landing page.
        // This keeps the brand's sense of movement without competing with titles,
        // filters, or resource descriptions.
        const isQuiet = variant === 'quiet';
        const numBoids = isQuiet
            ? (isMobile ? 3 : 8)
            : (isMobile ? 14 : 48);
        const boids: Boid[] = Array.from({ length: numBoids }, () => new Boid(width, height * 2));

        let animationFrameId: number;
        let lastFrame = 0;
        // The reduced quiet-mode flock is inexpensive; the former 30fps cap was the
        // visible judder on phones. Time scaling below preserves motion speed.
        // A small tolerance avoids 16.66ms rAF timestamps accidentally missing
        // a 16.67ms threshold and collapsing back to 30fps.
        const minimumFrameGap = isMobile ? (1000 / 60) - 1 : 1000 / (isQuiet ? 40 : 50);

        const visualRange = 100;
        const separationDistance = 20;

        const animate = (now: number) => {
            animationFrameId = requestAnimationFrame(animate);
            if (document.hidden || pausedRef.current || now - lastFrame < minimumFrameGap) return;
            const elapsed = lastFrame > 0 ? now - lastFrame : 1000 / 30;
            const timeScale = Math.min(elapsed / (1000 / 30), 1.5);
            lastFrame = now;
            const isFastScrolling = now < fastScrollUntilRef.current;
            const baseScrollCatchup = isFastScrolling ? 0.34 : 0.10;
            const scrollCatchup = 1 - Math.pow(1 - baseScrollCatchup, timeScale);
            scrollYRef.current += (targetScrollYRef.current - scrollYRef.current) * scrollCatchup;
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

                boid.vx += sepVX * 0.05 * timeScale;
                boid.vy += sepVY * 0.05 * timeScale;
                boid.vz += sepVZ * 0.05 * timeScale;

                // Gentle wander
                const wander = isQuiet ? 0.022 : 0.15;
                boid.vx += (Math.random() - 0.5) * wander * timeScale;
                boid.vy += (Math.random() - 0.5) * wander * timeScale;
                boid.vz += (Math.random() - 0.5) * wander * timeScale;

                const turnFactor = 0.2;
                if (boid.z < -150) boid.vz += turnFactor;
                if (boid.z > 150) boid.vz -= turnFactor;

                boid.update(isMobile, isQuiet ? 0.28 : 1, timeScale);
            }

            // Depth-sort: farther birds drawn first (behind)
            boids.sort((a, b) => b.z - a.z);
            for (const boid of boids) {
                boid.draw(ctx, scrollYRef.current, width, height, window.innerHeight, isQuiet ? 0.35 : 1);
            }

        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [variant]);

    return (
        <canvas
            ref={canvasRef}
            className="starling-flock-canvas fixed inset-0 z-0 h-full w-full pointer-events-none mix-blend-multiply transition-opacity duration-300"
            style={{ position: 'fixed', top: 0, left: 0, opacity: variant === 'quiet' ? 0.12 : 0.25 }}
            aria-hidden="true"
        />
    );
};
