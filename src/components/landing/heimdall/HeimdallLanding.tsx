/**
 * HeimdallLanding - Main Landing Page Container
 * 
 * Features:
 * - Lenis Smooth Scroll with physics (damping: 0.1)
 * - GSAP ScrollTrigger integration
 * - Custom cursor
 * - All sections composed together
 */
import { useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeimdallNavbar } from './HeimdallNavbar';
import { HeroSection } from './HeroSection';
import { NewsTicker } from './NewsTicker';
import { TechStack3D } from './TechStack3D';
import { DroneSection } from './DroneSection';
import { StatsGrid } from './StatsGrid';
import { HeimdallFooter } from './HeimdallFooter';
import { CustomCursor } from './CustomCursor';
import './heimdall.css';

gsap.registerPlugin(ScrollTrigger);

export function HeimdallLanding() {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        // Initialize Lenis with physics-based smooth scrolling
        const lenis = new Lenis({
            duration: 1.2,           // Animation duration
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Ease out expo
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            smoothTouch: false,      // Disable on touch devices
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        // Connect Lenis to GSAP ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);

        // Cleanup
        return () => {
            lenis.destroy();
            gsap.ticker.remove(lenis.raf);
        };
    }, []);

    return (
        <div className="heimdall-page">
            {/* Custom Cursor */}
            <CustomCursor />

            {/* Living Navbar */}
            <HeimdallNavbar />

            {/* Main Content */}
            <main>
                {/* Hero with Video Background */}
                <HeroSection />



                {/* Tech Stack with 3D WebGL Spheres */}
                <TechStack3D />

                {/* Drone/Technology Section */}
                <DroneSection />

                {/* Stats Grid */}
                <StatsGrid />

                {/* News Ticker with Dimming Effect */}
                <NewsTicker />
            </main>

            {/* Massive Footer */}
            <HeimdallFooter />
        </div>
    );
}

export default HeimdallLanding;
