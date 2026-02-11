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
                padding: '2rem max(4vw, 2rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
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
                        height: '52px',
                        filter: 'brightness(0) invert(1)',
                    }}
                />
            </button>
        </header>
    );
}

export default HeimdallNavbar;
