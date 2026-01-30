/**
 * HeimdallLanding - Main Landing Page Container
 * 
 * Features:
 * - Lenis Smooth Scroll with physics (damping: 0.1)
 * - GSAP ScrollTrigger integration
 * - Custom cursor
 * - All sections composed together
 */
import { HeimdallNavbar } from './HeimdallNavbar';
import { HeroSection } from './HeroSection';
import { NewsTicker } from './NewsTicker';
import { TechStack3D } from './TechStack3D';
import { StatsGrid } from './StatsGrid';
import { HeimdallFooter } from './HeimdallFooter';
import { CustomCursor } from './CustomCursor';
import './heimdall.css';

export function HeimdallLanding() {
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
