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
                        height: '52px',
                        filter: 'brightness(0) invert(1)',
                    }}
                />
            </button>

            <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                {[
                    { label: 'Soluções', path: '/funcionalidades' },
                    { label: 'Tecnologia', path: '/tecnologia' },
                    { label: 'Documentação', path: '/documentacao' },
                    { label: 'Sobre Nós', path: '/sobre-nos' },
                    { label: 'Contato', path: '/contato' },
                ].map((link) => (
                    <button
                        key={link.label}
                        onClick={() => navigate(link.path)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            transition: 'color 0.2s',
                            fontFamily: 'Inter, system-ui, sans-serif',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)')}
                    >
                        {link.label}
                    </button>
                ))}
            </nav>
        </header>
    );
}

export default HeimdallNavbar;
