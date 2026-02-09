/**
 * Design 2: "Nexus" — Dark Cyberpunk / Terminal
 *
 * Pitch-black background, neon green scanlines, glitch effects,
 * terminal/monospace typography, matrix-like data streams.
 * Focus on AI & data intelligence.
 * Font: JetBrains Mono + Orbitron
 */
import { useEffect, useRef, useState, memo } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Terminal, Database, Cpu, Network, Shield, Zap,
    ArrowRight, Activity, Eye, Lock, BarChart3, Wifi,
} from 'lucide-react';

/* ─── Matrix Rain ─── */
function MatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = 'DATON ESG 0123456789 CO2 GHG GRI SASB TCFD'.split('');
        const fontSize = 12;
        const columns = Math.floor(canvas.width / fontSize);
        const drops: number[] = new Array(columns).fill(1);

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#15c47030';
            ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 50);
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.6 }} />;
}

/* ─── Scanline overlay ─── */
function Scanlines() {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(21, 196, 112, 0.015) 2px, rgba(21, 196, 112, 0.015) 4px)',
        }} />
    );
}

/* ─── Glitch Text ─── */
function GlitchText({ children, style }: { children: string; style?: React.CSSProperties }) {
    const [glitching, setGlitching] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setGlitching(true);
            setTimeout(() => setGlitching(false), 150);
        }, 4000 + Math.random() * 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <span style={{ position: 'relative', display: 'inline-block', ...style }}>
            {children}
            {glitching && (
                <>
                    <span style={{
                        position: 'absolute', top: '-2px', left: '2px',
                        color: '#ff0040', opacity: 0.7,
                        clipPath: 'inset(10% 0 60% 0)',
                    }}>{children}</span>
                    <span style={{
                        position: 'absolute', top: '2px', left: '-2px',
                        color: '#00ffff', opacity: 0.7,
                        clipPath: 'inset(50% 0 10% 0)',
                    }}>{children}</span>
                </>
            )}
        </span>
    );
}

/* ─── Terminal Block ─── */
function TerminalBlock({ lines, delay = 0 }: { lines: string[]; delay?: number }) {
    const [visibleLines, setVisibleLines] = useState<string[]>([]);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        const timer = setTimeout(() => {
            lines.forEach((line, i) => {
                setTimeout(() => {
                    setVisibleLines(prev => [...prev, line]);
                }, i * 200);
            });
        }, delay * 1000);
        return () => clearTimeout(timer);
    }, [isInView, lines, delay]);

    return (
        <div ref={ref} style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(21, 196, 112, 0.2)',
            borderRadius: '8px',
            padding: '1.25rem',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.75rem',
            lineHeight: 1.8,
            overflow: 'hidden',
        }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27ca40' }} />
            </div>
            {visibleLines.map((line, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <span style={{ color: '#15c470' }}>$</span>{' '}
                    <span style={{ color: 'rgba(232, 228, 217, 0.7)' }}>{line}</span>
                </motion.div>
            ))}
            <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ color: '#15c470', display: 'inline-block', marginTop: '0.25rem' }}
            >
                _
            </motion.span>
        </div>
    );
}

/* ─── Status Indicator ─── */
const StatusDot = memo(({ label, status = 'online' }: { label: string; status?: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
                width: 6, height: 6, borderRadius: '50%',
                background: status === 'online' ? '#15c470' : '#ff5f56',
                boxShadow: status === 'online' ? '0 0 10px #15c470' : '0 0 10px #ff5f56',
            }}
        />
        <span style={{ fontFamily: '"JetBrains Mono"', fontSize: '0.7rem', color: 'rgba(232, 228, 217, 0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {label}
        </span>
    </div>
));

/* ─── Reveal ─── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

/* ─── Main ─── */
export default function LandingNexus() {
    const navigate = useNavigate();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const capabilities = [
        { icon: Cpu, label: 'AI ENGINE', title: 'Motor de IA Preditiva', desc: 'Algoritmos de machine learning analisam padrões de emissão e preveem tendências.' },
        { icon: Database, label: 'DATA CORE', title: 'Núcleo de Dados', desc: 'Processamento em tempo real de milhares de pontos de dados ESG simultâneos.' },
        { icon: Network, label: 'MESH NET', title: 'Rede de Integração', desc: 'Conectores com ERPs, sensores IoT e bases regulatórias governamentais.' },
        { icon: Shield, label: 'COMPLIANCE', title: 'Escudo Regulatório', desc: 'Monitoramento contínuo de licenças, condicionantes e obrigações legais.' },
        { icon: Eye, label: 'MONITOR', title: 'Vigilância Ambiental', desc: 'Dashboards de emissões, consumo hídrico e resíduos em tempo real.' },
        { icon: Lock, label: 'SECURITY', title: 'Proteção de Dados', desc: 'Criptografia end-to-end e compliance com LGPD em todas as camadas.' },
    ];

    return (
        <div style={{
            background: '#000000',
            color: '#e8e4d9',
            fontFamily: '"JetBrains Mono", monospace',
            minHeight: '100vh',
            position: 'relative',
        }}>
            <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700;800&family=Orbitron:wght@400;500;700;900&display=swap" rel="stylesheet" />

            <MatrixRain />
            <Scanlines />

            {/* ─── HUD Navbar ─── */}
            <motion.nav
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                    padding: '1rem 2rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid rgba(21, 196, 112, 0.15)',
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Terminal size={18} color="#15c470" />
                        <span style={{ fontFamily: '"Orbitron"', fontWeight: 900, fontSize: '1rem', letterSpacing: '0.15em', color: '#15c470' }}>
                            DATON
                        </span>
                    </div>
                    <div style={{ width: 1, height: 20, background: 'rgba(21, 196, 112, 0.2)' }} />
                    <StatusDot label="All Systems" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(21, 196, 112, 0.5)', letterSpacing: '0.1em' }}>
                        {time.toLocaleTimeString('pt-BR', { hour12: false })}
                    </span>
                    <motion.button
                        whileHover={{ backgroundColor: '#15c470', color: '#000' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/auth')}
                        style={{
                            background: 'transparent',
                            border: '1px solid #15c470',
                            color: '#15c470',
                            padding: '0.5rem 1.25rem',
                            fontFamily: '"Orbitron"',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                        }}
                    >
                        ACCESS
                    </motion.button>
                </div>
            </motion.nav>

            {/* ─── Hero ─── */}
            <section style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                padding: '0 4vw',
                position: 'relative',
                zIndex: 10,
            }}>
                <div style={{ maxWidth: '900px' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}
                    >
                        <StatusDot label="Neural Engine" />
                        <StatusDot label="Data Pipeline" />
                        <StatusDot label="Compliance" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                    >
                        <div style={{ marginBottom: '0.5rem' }}>
                            <span style={{
                                fontFamily: '"Orbitron"', fontSize: '0.7rem',
                                letterSpacing: '0.3em', color: 'rgba(21, 196, 112, 0.5)',
                            }}>
                                // DATON ESG PLATFORM v3.0
                            </span>
                        </div>

                        <h1 style={{
                            fontFamily: '"Orbitron", sans-serif',
                            fontSize: 'clamp(2.5rem, 7vw, 6rem)',
                            fontWeight: 900,
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                            marginBottom: '1.5rem',
                        }}>
                            <GlitchText>INTELIGÊNCIA</GlitchText>
                            <br />
                            <span style={{ color: '#15c470' }}>
                                <GlitchText>ESG TOTAL</GlitchText>
                            </span>
                        </h1>

                        <p style={{
                            fontSize: '0.9rem',
                            color: 'rgba(232, 228, 217, 0.5)',
                            maxWidth: '500px',
                            lineHeight: 1.8,
                            marginBottom: '2.5rem',
                        }}>
                            Sistema neural para gestão ambiental, social e de governança.
                            Processamento em tempo real. Compliance automatizado. IA preditiva.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}
                    >
                        <motion.button
                            whileHover={{ boxShadow: '0 0 30px rgba(21, 196, 112, 0.5)', scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/funcionalidades')}
                            style={{
                                background: '#15c470', color: '#000',
                                border: 'none', padding: '0.8rem 2rem',
                                fontFamily: '"Orbitron"', fontSize: '0.75rem',
                                fontWeight: 700, letterSpacing: '0.15em',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                            }}
                        >
                            INICIALIZAR
                            <Zap size={14} />
                        </motion.button>
                        <motion.button
                            whileHover={{ borderColor: '#15c470', color: '#15c470' }}
                            style={{
                                background: 'transparent', color: 'rgba(232, 228, 217, 0.6)',
                                border: '1px solid rgba(232, 228, 217, 0.2)',
                                padding: '0.8rem 2rem',
                                fontFamily: '"Orbitron"', fontSize: '0.75rem',
                                fontWeight: 500, letterSpacing: '0.1em',
                                cursor: 'pointer', transition: 'all 0.3s',
                            }}
                        >
                            DOCUMENTAÇÃO
                        </motion.button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                    >
                        <TerminalBlock
                            lines={[
                                'daton init --modules=esg,sgq,compliance',
                                'Connecting to data pipeline...',
                                'Neural engine initialized ✓',
                                'ESG indicators loaded: 47 active',
                                'System ready. All sensors online.',
                            ]}
                        />
                    </motion.div>
                </div>

                {/* HUD side panel */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    style={{
                        position: 'absolute', right: '4vw', top: '50%', transform: 'translateY(-50%)',
                        display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    }}
                    className="hidden lg:flex"
                >
                    {[
                        { icon: Activity, label: 'EMISSIONS', value: '2,847t' },
                        { icon: Wifi, label: 'SENSORS', value: '142' },
                        { icon: BarChart3, label: 'INDICATORS', value: '47' },
                        { icon: Shield, label: 'COMPLIANCE', value: '98.7%' },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.8 + i * 0.15 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                border: '1px solid rgba(21, 196, 112, 0.15)',
                                background: 'rgba(0, 0, 0, 0.6)',
                            }}
                        >
                            <item.icon size={14} color="#15c470" />
                            <div>
                                <div style={{ fontSize: '0.6rem', color: 'rgba(21, 196, 112, 0.5)', letterSpacing: '0.15em' }}>{item.label}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15c470' }}>{item.value}</div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ─── Capabilities Grid ─── */}
            <section style={{
                padding: 'clamp(4rem, 10vh, 8rem) 4vw',
                position: 'relative',
                zIndex: 10,
            }}>
                <Reveal>
                    <div style={{ marginBottom: '3rem' }}>
                        <span style={{ fontFamily: '"Orbitron"', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(21, 196, 112, 0.5)' }}>
                            // SYSTEM MODULES
                        </span>
                        <h2 style={{
                            fontFamily: '"Orbitron"', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                            fontWeight: 900, marginTop: '0.75rem', letterSpacing: '-0.01em',
                        }}>
                            ARQUITETURA DO <span style={{ color: '#15c470' }}>SISTEMA</span>
                        </h2>
                    </div>
                </Reveal>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1px',
                    background: 'rgba(21, 196, 112, 0.1)',
                }}>
                    {capabilities.map((cap, i) => (
                        <Reveal key={i} delay={i * 0.06}>
                            <motion.div
                                whileHover={{
                                    borderColor: 'rgba(21, 196, 112, 0.4)',
                                    background: 'rgba(21, 196, 112, 0.03)',
                                }}
                                style={{
                                    background: 'rgba(0, 0, 0, 0.9)',
                                    padding: '2rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    position: 'relative',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <cap.icon size={20} color="#15c470" strokeWidth={1.5} />
                                    <span style={{ fontFamily: '"Orbitron"', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(21, 196, 112, 0.4)' }}>
                                        {cap.label}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', fontFamily: '"Orbitron"', letterSpacing: '0.02em' }}>
                                    {cap.title}
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'rgba(232, 228, 217, 0.4)', lineHeight: 1.6, fontFamily: '"JetBrains Mono"' }}>
                                    {cap.desc}
                                </p>
                            </motion.div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section style={{
                padding: 'clamp(4rem, 10vh, 8rem) 4vw',
                position: 'relative',
                zIndex: 10,
                textAlign: 'center',
            }}>
                <Reveal>
                    <div style={{
                        border: '1px solid rgba(21, 196, 112, 0.2)',
                        padding: 'clamp(3rem, 6vw, 5rem)',
                        maxWidth: '800px',
                        margin: '0 auto',
                        position: 'relative',
                        background: 'rgba(0,0,0,0.8)',
                    }}>
                        <span style={{ fontFamily: '"Orbitron"', fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(21, 196, 112, 0.5)', display: 'block', marginBottom: '1rem' }}>
                            // INITIALIZE CONNECTION
                        </span>
                        <h2 style={{
                            fontFamily: '"Orbitron"', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                            fontWeight: 900, marginBottom: '1rem',
                        }}>
                            PRONTO PARA <span style={{ color: '#15c470' }}>CONECTAR?</span>
                        </h2>
                        <p style={{
                            fontSize: '0.85rem', color: 'rgba(232, 228, 217, 0.4)',
                            maxWidth: '400px', margin: '0 auto 2rem', lineHeight: 1.7,
                        }}>
                            Acesse o sistema neural de gestão ESG mais avançado do Brasil.
                        </p>
                        <motion.button
                            whileHover={{ boxShadow: '0 0 40px rgba(21, 196, 112, 0.5)', scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/contato')}
                            style={{
                                background: '#15c470', color: '#000',
                                border: 'none', padding: '0.8rem 2.5rem',
                                fontFamily: '"Orbitron"', fontSize: '0.75rem',
                                fontWeight: 700, letterSpacing: '0.15em',
                                cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                            }}
                        >
                            INICIAR AGORA
                            <ArrowRight size={14} />
                        </motion.button>
                    </div>
                </Reveal>
            </section>

            {/* ─── Footer ─── */}
            <footer style={{
                padding: '2rem 4vw',
                borderTop: '1px solid rgba(21, 196, 112, 0.1)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '1rem',
                position: 'relative', zIndex: 10,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Terminal size={14} color="#15c470" />
                    <span style={{ fontFamily: '"Orbitron"', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', color: '#15c470' }}>DATON</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'rgba(21, 196, 112, 0.3)', letterSpacing: '0.1em' }}>
                    SYS.VERSION 3.0.1 // &copy; 2026 DATON ESG INSIGHT
                </span>
            </footer>
        </div>
    );
}
