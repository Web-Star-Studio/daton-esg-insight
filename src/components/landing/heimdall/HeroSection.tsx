import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu } from 'lucide-react';
import { ESG_AREAS } from './esgAreas';
import './heimdall.css';

export function HeroSection() {
    const navigate = useNavigate();
    const [quickMenuOpen, setQuickMenuOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const actionBarRef = useRef<HTMLDivElement>(null);
    const heroSlides = ESG_AREAS;
    const slideDurationMs = 5000;
    const quickMenuLinks = [
        { label: 'Soluções', href: '/funcionalidades' },
        
        { label: 'Central de Ajuda', href: '/documentacao' },
        { label: 'Sobre Nós', href: '/sobre-nos' },
        { label: 'Contato', href: '/contato' },
    ];

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
            className="hero-section-root"
            style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                backgroundColor: 'var(--lumine-bg)',
                overflow: 'hidden',
                padding: 'clamp(100px, 15vw, 120px) clamp(1rem, 4vw, 2rem) clamp(6rem, 12vh, 80px)',
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

            {/* Bottom Content - Stacks on mobile */}
            <div className="relative z-10 flex flex-col gap-8 md:gap-6 md:flex-row md:items-end md:justify-between mt-auto">
                {/* Title */}
                <div className="hero-content-wrapper max-w-[700px] pb-4 md:pb-0">
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
                        <h1
                            style={{
                                fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)',
                                lineHeight: '1.1',
                                letterSpacing: '-0.025em',
                                fontWeight: 800,
                                margin: 0,
                                textAlign: 'left',
                            }}
                        >
                            {heroSlides[currentSlide].headline}
                        </h1>
                        <p
                            style={{
                                display: 'block',
                                marginTop: '1rem',
                                marginBottom: 0,
                                color: 'rgba(255, 255, 255, 0.85)',
                                fontSize: 'clamp(0.95rem, 1.3vw, 1.15rem)',
                                fontWeight: 400,
                                lineHeight: 1.55,
                                maxWidth: '600px',
                            }}
                        >
                            {heroSlides[currentSlide].subheadline}
                        </p>
                    </motion.div>
                </div>

                {/* Action Bar */}
                <div
                    ref={actionBarRef}
                    className="hero-action-bar self-end shrink-0 md:w-fit"
                    style={{
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
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
                        onClick={() => navigate('/auth')}
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
            </div>
        </section>
    );
}

export default HeroSection;
