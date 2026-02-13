/**
 * HeimdallNavbar - Floating Island with Horizontal Collapse/Expand
 * Refactored to use framer-motion instead of gsap
 */
import { useNavigate } from 'react-router-dom';
import datonLogo from '@/assets/daton-logo-header.png';
import './heimdall.css';

export function HeimdallNavbar() {
    const navigate = useNavigate();

    return (
        <header
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                padding: 'clamp(1rem, 3vw, 2rem) max(4vw, 1rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
            }}
        >
            <button
                onClick={() => navigate('/')}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                }}
            >
                <img
                    src={datonLogo}
                    alt="Daton"
                    style={{
                        height: 'clamp(36px, 8vw, 52px)',
                        filter: 'brightness(0) invert(1)',
                    }}
                />
            </button>

        </header>
    );
}

export default HeimdallNavbar;
