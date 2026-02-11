import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu } from 'lucide-react';
import { ESG_AREAS, ESG_AREA_LINKS } from './esgAreas';
import './heimdall.css';

export function HeroSection() {
    const navigate = useNavigate();
    const [quickMenuOpen, setQuickMenuOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const actionBarRef = useRef<HTMLDivElement>(null);
    const heroSlides = ESG_AREAS;
    const slideDurationMs = 5000;
    const legacyQuickMenuLinks = [
        { label: 'Soluções', href: '/funcionalidades' },
        { label: 'Tecnologia', href: '/documentacao' },
        { label: 'Recursos', href: '/faq' },
        { label: 'Contato', href: '/contato' },
    ];
    const quickMenuLinks = [...legacyQuickMenuLinks, ...ESG_AREA_LINKS];

    const handleQuickNavigate = (path: string) => {
        setQuickMenuOpen(false);
        navigate(path);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (!quickMenuOpen) return;
            const target = event.target as Node;
            if (actionBarRef.current && !actionBarRef.current.contains(target)) {
                setQuickMenuOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setQuickMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [quickMenuOpen]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, slideDurationMs);

        return () => window.clearInterval(intervalId);
    }, [heroSlides.length, slideDurationMs]);

    return (
        <section
            style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'grid',
                placeItems: 'center',
                backgroundColor: 'var(--lumine-bg)',
                overflow: 'hidden',
                padding: '120px 2rem 80px',
            }}
        >
            <AnimatePresence mode="sync">
                <motion.img
                    key={heroSlides[currentSlide].image}
                    src={heroSlides[currentSlide].image}
                    alt=""
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 1.1, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 0,
                    }}
                />
            </AnimatePresence>

            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    background:
                        'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0.4) 100%)',
                }}
            />

            {/* Top Right Step Bar */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: '2.35rem',
                    right: 'max(4vw, 2rem)',
                    zIndex: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    width: 'min(280px, 42vw)',
                }}
            >
                {heroSlides.map((_, index) => (
                    <div
                        key={index}
                        style={{
                            position: 'relative',
                            flex: 1,
                            height: '4px',
                            borderRadius: '999px',
                            background: 'rgba(255, 255, 255, 0.28)',
                            overflow: 'hidden',
                        }}
                    >
                        {index < currentSlide && (
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    background: '#ffffff',
                                }}
                            />
                        )}

                        {index === currentSlide && (
                            <motion.div
                                key={currentSlide}
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{
                                    duration: slideDurationMs / 1000,
                                    ease: 'linear',
                                }}
                                style={{
                                    height: '100%',
                                    background: '#ffffff',
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Bottom Left Title */}
            <div style={{
                position: 'absolute',
                bottom: '10vh',
                left: 'max(4vw, 2rem)',
                maxWidth: '700px',
                zIndex: 10,
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    style={{
                        color: '#ffffff',
                        margin: 0,
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                        textShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
                    }}
                >
                    <p
                        style={{
                            fontSize: 'clamp(1.4rem, 2.8vw, 2.4rem)',
                            lineHeight: '1.35',
                            letterSpacing: '-0.01em',
                            fontWeight: 600,
                            margin: 0,
                            textAlign: 'left',
                        }}
                    >
                        {heroSlides[currentSlide].headline}
                    </p>
                    <p
                        style={{
                            display: 'block',
                            marginTop: '0.75rem',
                            marginBottom: 0,
                            color: 'rgba(255, 255, 255, 0.88)',
                            fontSize: 'clamp(0.82rem, 1.05vw, 0.95rem)',
                            fontWeight: 400,
                            lineHeight: 1.4,
                        }}
                    >
                        {heroSlides[currentSlide].subheadline}
                    </p>
                </motion.div>
            </div>

            {/* Bottom Right Action Bar */}
            <div
                ref={actionBarRef}
                style={{
                    position: 'absolute',
                    bottom: '10vh',
                    right: 'max(4vw, 2rem)',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    width: 'fit-content',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    background: 'rgba(0, 0, 0, 0.32)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden',
                }}
            >
                <AnimatePresence>
                    {quickMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            style={{
                                width: '100%',
                                overflow: 'hidden',
                            }}
                        >
                            <nav
                                style={{
                                    display: 'grid',
                                    gap: '0.15rem',
                                    padding: '0.35rem 0.35rem 0.2rem',
                                }}
                            >
                                {quickMenuLinks.map((link, index) => (
                                    <motion.button
                                        key={index}
                                        onClick={() => handleQuickNavigate(link.href)}
                                        whileHover={{
                                            scale: 1.03,
                                            backgroundColor: '#c4fca1',
                                            color: '#000000',
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ duration: 0.16, ease: 'easeOut' }}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            border: 'none',
                                            borderRadius: '9px',
                                            color: '#ffffff',
                                            fontSize: '0.92rem',
                                            fontWeight: 500,
                                            padding: '0.68rem 0.85rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {link.label}
                                    </motion.button>
                                ))}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    style={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.35rem',
                    }}
                >
                    <button
                        onClick={() => setQuickMenuOpen((prev) => !prev)}
                        aria-label="Abrir menu"
                        aria-expanded={quickMenuOpen}
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.45)',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <Menu size={18} />
                    </button>

                    <div
                        aria-hidden="true"
                        style={{
                            width: '1px',
                            height: '28px',
                            background: 'rgba(255, 255, 255, 0.28)',
                        }}
                    />

                    <motion.button
                        onClick={() => navigate('/ambiental')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="lumine-btn-primary"
                        style={{ color: '#000000' }}
                    >
                        INICIAR AGORA
                        <ArrowRight size={18} />
                    </motion.button>
                </motion.div>
            </div>

            {/* Mobile adjustments */}
            <style>{`
                @media (max-width: 1024px) {
                    section { place-items: center; padding-top: 200px; display: flex; flexDirection: column; justify-content: space-between; }
                    div[style*="top: 160px"] { position: relative; top: 0; right: 0; width: 100%; max-width: 100%; padding: 0 1rem; }
                    div[style*="bottom: 10vh"] { position: relative; bottom: 0; left: 0; right: 0; padding: 2rem 1rem; text-align: center; }
                    div[style*="width: 500px"] { transform: scale(0.6); }
                    h1 { text-align: center; }
                }
            `}</style>
        </section>
    );
}

export default HeroSection;
