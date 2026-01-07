/**
 * HeroSection - "Precision Maximalist" Redesign
 * 
 * Aesthetic: High-Density Dashboard / Eco-Futurism.
 * Fills empty space with technical HUD elements, grid lines, and active data streams.
 * Maintains the bold Typography the user liked.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Play, Globe, BarChart3, ShieldCheck, Zap, Activity, Cpu } from 'lucide-react';
import './heimdall.css';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
    const heroRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLDivElement>(null);
    const cursorFollowerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Parallax calculation
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            setMousePos({ x, y });

            // Cursor follower
            if (cursorFollowerRef.current) {
                gsap.to(cursorFollowerRef.current, {
                    x: e.clientX,
                    y: e.clientY,
                    duration: 0.1, // Faster response
                    ease: 'none'
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            // 1. Grid & Lines Expand
            tl.fromTo('.tech-line',
                { scaleX: 0, opacity: 0 },
                { scaleX: 1, opacity: 0.2, stagger: 0.1, duration: 1.2, ease: 'power3.out' }
            );

            // 2. Video Reveal
            tl.fromTo(videoRef.current,
                { clipPath: 'inset(0 100% 0 0)', filter: 'grayscale(100%)' },
                { clipPath: 'inset(0 0% 0 0)', filter: 'grayscale(0%)', duration: 1.5, ease: 'power4.inOut' },
                "-=1.0"
            );

            // 3. Text Reveal (Explosive)
            tl.fromTo('.hero-char',
                { y: 120, opacity: 0, rotationX: -90 },
                { y: 0, opacity: 1, rotationX: 0, stagger: 0.02, duration: 0.8, ease: 'back.out(1.2)' },
                "-=0.8"
            );

            // 4. UI Elements Fade In
            tl.fromTo('.ui-element',
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.05, duration: 0.6 },
                "-=0.5"
            );

        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={heroRef}
            className="precision-grid"
            style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'hidden',
                background: 'var(--heimdall-bg)',
                isolation: 'isolate',
            }}
        >
            {/* Custom Mouse Follower (Updated to Green Ring only) */}
            <div
                ref={cursorFollowerRef}
                style={{
                    position: 'fixed',
                    top: 0, left: 0,
                    width: '32px', height: '32px',
                    border: '1px solid var(--heimdall-accent)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    transform: 'translate(-50%, -50%)',
                }}
            />

            {/* TECHNICAL OVERLAY - Fills the empty space with purpose */}
            <div className="technical-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>

                {/* Horizontal Lines */}
                <div className="tech-line" style={{ position: 'absolute', top: '15%', left: 0, width: '100%', height: '1px', background: 'var(--heimdall-text-secondary)', opacity: 0.1 }} />
                <div className="tech-line" style={{ position: 'absolute', top: '85%', left: 0, width: '100%', height: '1px', background: 'var(--heimdall-text-secondary)', opacity: 0.1 }} />

                {/* Vertical Rulers */}
                <div className="tech-line" style={{ position: 'absolute', top: 0, left: '5%', bottom: 0, width: '1px', background: 'var(--heimdall-text-secondary)', opacity: 0.1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 0' }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} style={{ width: '6px', height: '1px', background: 'var(--heimdall-text)' }} />
                    ))}
                </div>

                {/* Crosshairs */}
                <div className="ui-element" style={{ position: 'absolute', top: '15%', left: '5%', transform: 'translate(-50%, -50%)' }}>
                    <CrosshairIcon />
                </div>
                <div className="ui-element" style={{ position: 'absolute', top: '85%', right: '35%', transform: 'translate(50%, -50%)' }}>
                    <CrosshairIcon />
                </div>

                {/* Metadata Labels scattered to density layout */}
                <div className="ui-element" style={{ position: 'absolute', top: '12%', right: '5%', fontFamily: 'Space Mono', fontSize: '10px', color: 'var(--heimdall-text-muted)' }}>
                    SYS // ONLINE
                </div>

            </div>

            {/* Background Video Container */}
            <div
                ref={videoRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '55vw',
                    height: '100%',
                    zIndex: 0,
                    opacity: 1,
                }}
            >
                <video
                    autoPlay muted loop playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        // Softer mask that blends better
                        maskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)'
                    }}
                >
                    <source src="https://player.vimeo.com/external/477862351.sd.mp4?s=e01deef2bfaf5c833e3e4c907721c13f5b9edc4e&profile_id=164&oauth2_token_id=57447761" type="video/mp4" />
                </video>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(21, 196, 112, 0.05)', // Very subtle green tint
                    mixBlendMode: 'overlay',
                    pointerEvents: 'none'
                }} />
            </div>

            {/* Main Content Area */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    paddingLeft: 'max(8vw, 2rem)',
                    paddingRight: '2rem',
                    maxWidth: '1400px',
                    width: '100%',
                }}
            >
                {/* Top Badge */}
                <div className="ui-element" style={{
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
                </div>

                {/* THE TYPOGRAPHY - BOLD & STYLIZED */}
                <h1 style={{
                    fontFamily: 'Sora, sans-serif',
                    fontSize: 'clamp(2.2rem, 8vw, 7.5rem)',
                    fontWeight: 800,
                    lineHeight: 1.1, // Increased from 0.9 to prevent clipping
                    color: 'var(--heimdall-text)',
                    marginTop: '0',
                    marginBottom: '2rem',
                    textTransform: 'uppercase',
                    position: 'relative'
                }}>
                    <div style={{ overflow: 'hidden', display: 'flex', paddingTop: '0.2em', marginTop: '-0.2em' }}>
                        {"GESTÃO".split("").map((char, i) => (
                            <span key={i} className="hero-char" style={{ display: 'inline-block' }}>{char}</span>
                        ))}
                        {/* Spacer */}
                        <span style={{ width: '0.4em' }}></span>
                        {"ESG".split("").map((char, i) => (
                            <span key={i + 10} className="hero-char" style={{ display: 'inline-block' }}>{char}</span>
                        ))}
                    </div>

                    {/* The "Simplificada" part with stylized tech look */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginTop: '0.5rem',
                        overflow: 'hidden'
                    }}>
                        <span className="hero-char" style={{
                            fontFamily: 'Space Mono, monospace',
                            color: 'var(--heimdall-text)', // Keep readable
                            fontWeight: 400,
                            fontSize: '0.4em', // Technical contrast size
                            letterSpacing: '-0.02em',
                            display: 'flex',
                            alignItems: 'center',
                            background: 'linear-gradient(90deg, transparent, rgba(21, 196, 112, 0.1))',
                            padding: '0 1rem',
                            borderLeft: '4px solid var(--heimdall-accent)'
                        }}>
                            // aprimorada
                            <Activity size={16} style={{ marginLeft: '1rem', opacity: 0.5 }} />
                        </span>
                    </div>
                </h1>

                <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {/* Subtitle */}
                    <p className="ui-element" style={{
                        fontSize: '1.25rem',
                        color: 'var(--heimdall-text-secondary)',
                        maxWidth: '500px',
                        lineHeight: 1.5,
                        fontFamily: 'Inter, sans-serif' // Clean body font
                    }}>
                        Monitoramento de emissões, compliance ambiental e relatórios em tempo real.
                        <b style={{ color: 'var(--heimdall-text)', display: 'block', marginTop: '0.5rem' }}>Transforme dados brutos em inteligência sustentável.</b>
                    </p>

                </div>

                {/* Actions */}
                <div className="ui-element" style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                    <button
                        onClick={() => navigate('/funcionalidades')}
                        style={{
                            background: 'var(--heimdall-accent)', // GREEN
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
                        onMouseEnter={(e) => gsap.to(e.currentTarget, { y: -4, duration: 0.2 })}
                        onMouseLeave={(e) => gsap.to(e.currentTarget, { y: 0, duration: 0.2 })}
                    >
                        {isMobile ? 'INICIAR' : 'INICIAR AGORA'}
                        <ArrowRight size={18} />
                    </button>

                    <button
                        className="heimdall-btn-ghost"
                        style={{ fontFamily: 'Space Mono', fontSize: '0.9rem' }}
                    >
                        DOCUMENTAÇÃO
                    </button>
                </div>
            </div>

            {/* BOTTOM STATUS BAR - Anchors the design */}
            <div className="ui-element" style={{
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
            }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <StatusItem icon={Zap} label="SYSTEM STATUS" value="OPTIMAL" color="var(--heimdall-accent)" />

                </div>
                <div style={{ fontFamily: 'Space Mono', fontSize: '0.75rem', color: 'var(--heimdall-text-muted)', letterSpacing: '0.1em' }}>
                    DATON PLATFORM v2.4.0
                </div>
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    .technical-overlay { opacity: 0.3; }
                    /* Stack layout on mobile */
                    h1 { font-size: 2.2rem !important; }
                    video { opacity: 0.2; }
                    div[style*="top: 0"][style*="right: 0"] {
                         width: 100% !important;
                    }
                }
            `}</style>
        </section>
    );
}

// Micro-Component for technical status items
function StatusItem({ icon: Icon, label, value, color }: any) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icon size={14} color={color} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span style={{ fontSize: '0.6rem', fontFamily: 'Space Mono', color: 'var(--heimdall-text-muted)' }}>{label}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'Sora', color: color }}>{value}</span>
            </div>
        </div>
    );
}

// Micro-Component for Crosshair
function CrosshairIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="12" y1="0" x2="12" y2="24" stroke="var(--heimdall-border)" strokeWidth="1" />
            <line x1="0" y1="12" x2="24" y2="12" stroke="var(--heimdall-border)" strokeWidth="1" />
        </svg>
    );
}

export default HeroSection;
