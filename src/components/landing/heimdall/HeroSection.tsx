/**
 * HeroSection - Optimized for LCP/FCP performance
 * - Poster image for immediate LCP
 * - Lazy video loading
 * - Reduced motion for performance
 */
import { useEffect, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, Activity, Zap } from 'lucide-react';
import './heimdall.css';

// Memoized status item for performance
const StatusItem = memo(function StatusItem({ 
    icon: Icon, 
    label, 
    value, 
    color 
}: { 
    icon: React.ElementType; 
    label: string; 
    value: string; 
    color: string 
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icon size={14} color={color} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span style={{ fontSize: '0.6rem', fontFamily: 'Space Mono', color: 'var(--heimdall-text-muted)' }}>{label}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'Sora', color }}>{value}</span>
            </div>
        </div>
    );
});

export function HeroSection() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    
    const cursorX = useMotionValue(0);
    const cursorY = useMotionValue(0);
    const springX = useSpring(cursorX, { stiffness: 500, damping: 50 });
    const springY = useSpring(cursorY, { stiffness: 500, damping: 50 });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Defer video loading for better LCP
    useEffect(() => {
        const timer = setTimeout(() => setShowVideo(true), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isMobile) return; // Disable custom cursor on mobile
        const handleMouseMove = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [cursorX, cursorY, isMobile]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.3 }
        }
    };

    const itemVariants = {
        hidden: { y: 40, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
    };

    const charVariants = {
        hidden: { y: 120, opacity: 0, rotateX: -90 },
        visible: (i: number) => ({
            y: 0,
            opacity: 1,
            rotateX: 0,
            transition: { delay: i * 0.02, duration: 0.8, type: 'spring' as const, bounce: 0.4 }
        })
    };

    return (
        <section
            className="precision-grid hero-section"
            style={{
                position: 'relative',
                minHeight: isMobile ? 'auto' : '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'hidden',
                background: 'var(--heimdall-bg)',
                isolation: 'isolate',
                paddingTop: isMobile ? '100px' : undefined,
                paddingBottom: isMobile ? '80px' : undefined,
            }}
        >
            {/* Custom cursor - only on desktop */}
            {!isMobile && (
                <motion.div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '32px',
                        height: '32px',
                        border: '1px solid var(--heimdall-accent)',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                        zIndex: 9999,
                        x: springX,
                        y: springY,
                        translateX: '-50%',
                        translateY: '-50%',
                    }}
                />
            )}

            <div className="technical-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 0.2 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ position: 'absolute', top: '15%', left: 0, width: '100%', height: '1px', background: 'var(--heimdall-text-secondary)', transformOrigin: 'left' }}
                />
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 0.2 }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                    style={{ position: 'absolute', top: '85%', left: 0, width: '100%', height: '1px', background: 'var(--heimdall-text-secondary)', transformOrigin: 'left' }}
                />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    style={{ position: 'absolute', top: '12%', right: '5%', fontFamily: 'Space Mono', fontSize: '10px', color: 'var(--heimdall-text-muted)' }}
                >
                    SYS // ONLINE
                </motion.div>
            </div>

            {/* Video container with poster optimization for LCP */}
            <motion.div
                initial={{ clipPath: 'inset(0 100% 0 0)', filter: 'grayscale(100%)' }}
                animate={{ clipPath: 'inset(0 0% 0 0)', filter: 'grayscale(0%)' }}
                transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '55vw',
                    height: '100%',
                    zIndex: 0,
                }}
            >
                {/* Poster placeholder for LCP - shown until video loads */}
                <div 
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, #f0f9f4 0%, #e8f5ec 50%, #d5ede0 100%)',
                        opacity: videoLoaded ? 0 : 1,
                        transition: 'opacity 0.5s ease-out',
                    }}
                    aria-hidden="true"
                />
                
                {/* Video loads after initial render for better LCP */}
                {/* Video is purely decorative - hidden from assistive technologies (WCAG 1.2.1) */}
                {showVideo && (
                    <video
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        onLoadedData={() => setVideoLoaded(true)}
                        aria-hidden="true"
                        role="presentation"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            maskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)',
                            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)',
                            opacity: videoLoaded ? 1 : 0,
                            transition: 'opacity 0.5s ease-out',
                        }}
                    >
                        <source src="https://player.vimeo.com/external/477862351.sd.mp4?s=e01deef2bfaf5c833e3e4c907721c13f5b9edc4e&profile_id=164&oauth2_token_id=57447761" type="video/mp4" />
                    </video>
                )}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(21, 196, 112, 0.05)',
                    mixBlendMode: 'overlay',
                    pointerEvents: 'none'
                }} />
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{
                    position: 'relative',
                    zIndex: 10,
                    paddingLeft: 'max(8vw, 2rem)',
                    paddingRight: '2rem',
                    maxWidth: '1400px',
                    width: '100%',
                }}
            >
                <motion.div variants={itemVariants} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    fontFamily: 'Space Mono',
                    fontSize: '0.75rem',
                    color: 'var(--heimdall-accent)',
                    border: '1px solid var(--heimdall-border)',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.5)'
                }}>
                    <div style={{ width: 6, height: 6, background: 'var(--heimdall-accent)', borderRadius: '50%', boxShadow: '0 0 8px var(--heimdall-accent)' }} />
                    DASHBOARD ESG INTELIGENTE
                </motion.div>

                <h1 style={{
                    fontFamily: 'Sora, sans-serif',
                    fontSize: 'clamp(2.2rem, 8vw, 7.5rem)',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: 'var(--heimdall-text)',
                    marginTop: '0',
                    marginBottom: isMobile ? '1rem' : '2rem',
                    textTransform: 'uppercase',
                    position: 'relative'
                }}>
                    <div style={{ overflow: 'hidden', display: 'flex', paddingTop: '0.2em', marginTop: '-0.2em' }}>
                        {"GESTÃO".split("").map((char, i) => (
                            <motion.span
                                key={i}
                                custom={i}
                                variants={charVariants}
                                initial="hidden"
                                animate="visible"
                                style={{ display: 'inline-block' }}
                            >
                                {char}
                            </motion.span>
                        ))}
                        <span style={{ width: '0.4em' }}></span>
                        {"ESG".split("").map((char, i) => (
                            <motion.span
                                key={i + 10}
                                custom={i + 6}
                                variants={charVariants}
                                initial="hidden"
                                animate="visible"
                                style={{ display: 'inline-block' }}
                            >
                                {char}
                            </motion.span>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', overflow: 'hidden' }}>
                        <motion.span
                            variants={charVariants}
                            custom={10}
                            initial="hidden"
                            animate="visible"
                            style={{
                                fontFamily: 'Space Mono, monospace',
                                color: 'var(--heimdall-text)',
                                fontWeight: 400,
                                fontSize: '0.4em',
                                letterSpacing: '-0.02em',
                                display: 'flex',
                                alignItems: 'center',
                                background: 'linear-gradient(90deg, transparent, rgba(21, 196, 112, 0.1))',
                                padding: '0 1rem',
                                borderLeft: '4px solid var(--heimdall-accent)'
                            }}
                        >
                            // aprimorada
                            <Activity size={16} style={{ marginLeft: '1rem', opacity: 0.5 }} />
                        </motion.span>
                    </div>
                </h1>

                <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <motion.p variants={itemVariants} style={{
                        fontSize: '1.25rem',
                        color: 'var(--heimdall-text-secondary)',
                        maxWidth: '500px',
                        lineHeight: 1.5,
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        Monitoramento de emissões, compliance ambiental e relatórios em tempo real.
                        <b style={{ color: 'var(--heimdall-text)', display: 'block', marginTop: '0.5rem' }}>Transforme dados brutos em inteligência sustentável.</b>
                    </motion.p>
                </div>

                <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', marginTop: isMobile ? '1.5rem' : '3rem' }}>
                    <motion.button
                        onClick={() => navigate('/funcionalidades')}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        aria-label="Iniciar agora - acessar funcionalidades"
                        style={{
                            background: 'var(--heimdall-accent)',
                            color: '#FFFFFF',
                            padding: '1rem 2.5rem',
                            border: 'none',
                            borderRadius: '4px',
                            fontFamily: 'Space Mono, monospace',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            boxShadow: '0 10px 20px rgba(21, 196, 112, 0.2)'
                        }}
                    >
                        {isMobile ? 'INICIAR' : 'INICIAR AGORA'}
                        <ArrowRight size={18} aria-hidden="true" />
                    </motion.button>

                    <button 
                        className="heimdall-btn-ghost" 
                        style={{ fontFamily: 'Space Mono', fontSize: '0.9rem' }}
                        aria-label="Acessar documentação"
                    >
                        DOCUMENTAÇÃO
                    </button>
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '60px',
                    borderTop: '1px solid var(--heimdall-border)',
                    background: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 2rem',
                    justifyContent: 'space-between',
                    zIndex: 20
                }}
            >
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <StatusItem icon={Zap} label="SYSTEM STATUS" value="OPTIMAL" color="var(--heimdall-accent)" />
                </div>
                <div style={{ fontFamily: 'Space Mono', fontSize: '0.75rem', color: 'var(--heimdall-text-muted)', letterSpacing: '0.1em' }}>
                    DATON PLATFORM v2.4.0
                </div>
            </motion.div>

            <style>{`
                @media (max-width: 1024px) {
                    .technical-overlay { opacity: 0.3; }
                    h1 { font-size: 2.2rem !important; }
                    video { opacity: 0.2; }
                    div[style*="top: 0"][style*="right: 0"] { width: 100% !important; }
                }
            `}</style>
        </section>
    );
}

export default HeroSection;
