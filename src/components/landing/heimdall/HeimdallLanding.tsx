/**
 * HeimdallLanding - Main Landing Page Container
 *
 * Landing behavior:
 * - Hero-only public entry page
 * - Custom cursor
 * - Navbar + hero experience
 */
import { HeimdallNavbar } from './HeimdallNavbar';
import { HeroSection } from './HeroSection';
import { PublicFooter } from './PublicFooter';
import './heimdall.css';

export function HeimdallLanding() {
    return (
        <div className="heimdall-page">
            {/* Living Navbar */}
            <HeimdallNavbar />

            {/* Main Content */}
            <main>
                {/* Hero-only experience */}
                <HeroSection />
            </main>

            <PublicFooter />
        </div>
    );
}

export default HeimdallLanding;
