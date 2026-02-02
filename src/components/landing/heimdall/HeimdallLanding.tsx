/**
 * HeimdallLanding - Main Landing Page Container
 * 
 * Features:
 * - Lenis Smooth Scroll with physics (damping: 0.1)
 * - GSAP ScrollTrigger integration
 * - Custom cursor
 * - All sections composed together
 * - Lazy loading for below-the-fold sections
 */
import { lazy, Suspense } from 'react';
import { HeimdallNavbar } from './HeimdallNavbar';
import { HeroSection } from './HeroSection';
import { CustomCursor } from './CustomCursor';
import './heimdall.css';

// Lazy load below-the-fold sections for better LCP
const NewsTicker = lazy(() => import('./NewsTicker').then(m => ({ default: m.NewsTicker })));
const TechStack3D = lazy(() => import('./TechStack3D').then(m => ({ default: m.TechStack3D })));
const StatsGrid = lazy(() => import('./StatsGrid').then(m => ({ default: m.StatsGrid })));
const HeimdallFooter = lazy(() => import('./HeimdallFooter').then(m => ({ default: m.HeimdallFooter })));

// Loading skeleton component
const SectionSkeleton = ({ height = 'h-96' }: { height?: string }) => (
    <div className={`loading-skeleton ${height} w-full`} aria-hidden="true" />
);

export function HeimdallLanding() {
    return (
        <div className="heimdall-page">
            {/* Custom Cursor */}
            <CustomCursor />

            {/* Living Navbar */}
            <HeimdallNavbar />

            {/* Main Content */}
            <main>
                {/* Hero with Video Background - Critical, loads immediately */}
                <HeroSection />

                {/* Below-the-fold sections - Lazy loaded */}
                <Suspense fallback={<SectionSkeleton height="h-[600px]" />}>
                    <TechStack3D />
                </Suspense>

                <Suspense fallback={<SectionSkeleton height="h-64" />}>
                    <StatsGrid />
                </Suspense>

                <Suspense fallback={<SectionSkeleton height="h-48" />}>
                    <NewsTicker />
                </Suspense>
            </main>

            {/* Massive Footer - Lazy loaded */}
            <Suspense fallback={<SectionSkeleton height="h-96" />}>
                <HeimdallFooter />
            </Suspense>
        </div>
    );
}

export default HeimdallLanding;
