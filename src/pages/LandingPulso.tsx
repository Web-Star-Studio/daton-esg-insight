/**
 * Design 4: "Pulso" — Dynamic Data Visualization
 *
 * Gradient mesh backgrounds, animated chart-like elements,
 * floating metrics, live data feel, bold geometric shapes.
 * Focus on analytics, real-time monitoring.
 * Font: Syne + IBM Plex Mono
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, Activity, TrendingUp, Gauge, ArrowRight,
    Droplets, Flame, Recycle, Zap, LineChart, PieChart,
    ArrowUpRight, Minus,
} from 'lucide-react';

/* ─── Animated Wave SVG ─── */
function DataWave({ color = '#15c470', width = '100%', height = 80, delay = 0 }: {
    color?: string; width?: string; height?: number; delay?: number;
}) {
    return (
        <motion.svg
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 0.3, pathLength: 1 }}
            transition={{ duration: 2, delay }}
            viewBox="0 0 1200 80"
            preserveAspectRatio="none"
            style={{ width, height, display: 'block' }}
        >
            <motion.path
                d="M0,40 C150,10 300,70 450,40 C600,10 750,70 900,40 C1050,10 1200,50 1200,40"
                fill="none"
                stroke={color}
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, delay, ease: 'easeInOut' }}
            />
        </motion.svg>
    );
}

/* ─── Live Metric Card ─── */
function MetricCard({ icon: Icon, label, value, unit, trend, color, delay = 0 }: {
    icon: React.ElementType; label: string; value: number; unit: string;
    trend: string; color: string; delay?: number;
}) {
    const [currentValue, setCurrentValue] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        const duration = 2000;
        const start = performance.now();
        const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrentValue(Math.floor(value * eased));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [isInView, value]);

    // Simulate live fluctuation
    useEffect(() => {
        if (!isInView) return;
        const interval = setInterval(() => {
            setCurrentValue(prev => {
                const delta = Math.floor((Math.random() - 0.5) * value * 0.02);
                return Math.max(0, prev + delta);
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [isInView, value]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay }}
            whileHover={{ y: -6, boxShadow: `0 20px 60px ${color}20` }}
            style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '1.75rem',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                cursor: 'pointer',
                transition: 'box-shadow 0.3s, transform 0.3s',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background gradient glow */}
            <div style={{
                position: 'absolute', top: '-50%', right: '-30%',
                width: '150px', height: '150px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}15, transparent)`,
                filter: 'blur(30px)',
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', position: 'relative' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '12px',
                    background: `${color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={20} color={color} strokeWidth={1.5} />
                </div>
                <span style={{
                    fontSize: '0.7rem', fontWeight: 600,
                    color: trend.startsWith('+') ? '#15c470' : '#ef4444',
                    fontFamily: '"IBM Plex Mono", monospace',
                    display: 'flex', alignItems: 'center', gap: '2px',
                    padding: '4px 8px', borderRadius: '100px',
                    background: trend.startsWith('+') ? 'rgba(21, 196, 112, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                }}>
                    {trend}
                </span>
            </div>
            <div style={{
                fontFamily: '"Syne", sans-serif',
                fontSize: '2.25rem', fontWeight: 800,
                lineHeight: 1, marginBottom: '0.25rem',
                color: '#0f172a',
                position: 'relative',
            }}>
                {currentValue.toLocaleString('pt-BR')}{unit}
            </div>
            <div style={{
                fontSize: '0.8rem', color: '#64748b',
                fontFamily: '"IBM Plex Mono", monospace',
            }}>
                {label}
            </div>

            {/* Mini chart line */}
            <svg viewBox="0 0 100 30" style={{ width: '100%', height: 30, marginTop: '1rem', opacity: 0.5 }}>
                <motion.path
                    d="M0,20 C10,15 20,25 30,18 C40,11 50,22 60,15 C70,8 80,20 90,12 L100,16"
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    initial={{ pathLength: 0 }}
                    animate={isInView ? { pathLength: 1 } : {}}
                    transition={{ duration: 2, delay: delay + 0.5 }}
                />
            </svg>
        </motion.div>
    );
}

/* ─── Reveal ─── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

/* ─── Main Landing ─── */
export default function LandingPulso() {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const bgY = useTransform(scrollYProgress, [0, 1], [0, -200]);

    const metrics = [
        { icon: Flame, label: 'Emissões CO₂e', value: 2847, unit: 't', trend: '-12.3%', color: '#f59e0b' },
        { icon: Droplets, label: 'Consumo Hídrico', value: 14523, unit: 'm³', trend: '-8.7%', color: '#3b82f6' },
        { icon: Recycle, label: 'Resíduos Reciclados', value: 87, unit: '%', trend: '+5.2%', color: '#15c470' },
        { icon: Zap, label: 'Energia Renovável', value: 62, unit: '%', trend: '+15.4%', color: '#8b5cf6' },
        { icon: Gauge, label: 'Score ESG', value: 847, unit: 'pts', trend: '+23pts', color: '#15c470' },
        { icon: TrendingUp, label: 'ROI Sustentável', value: 340, unit: '%', trend: '+67%', color: '#ec4899' },
    ];

    const capabilities = [
        { icon: LineChart, title: 'Dashboards em Tempo Real', desc: 'Painéis dinâmicos com atualização automática e drill-down inteligente.' },
        { icon: PieChart, title: 'Relatórios Automatizados', desc: 'GRI, SASB, TCFD e CDP gerados automaticamente com dados validados.' },
        { icon: Activity, title: 'Alertas Preditivos', desc: 'IA que detecta anomalias e prevê violações antes que aconteçam.' },
        { icon: BarChart3, title: 'Benchmarking Setorial', desc: 'Compare seu desempenho com peers do setor e melhores práticas.' },
    ];

    return (
        <div style={{
            background: '#f8fafc',
            color: '#0f172a',
            fontFamily: '"IBM Plex Mono", monospace',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

            {/* Background gradient mesh */}
            <motion.div style={{ y: bgY, position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', top: '-20%', left: '-10%',
                    width: '60vw', height: '60vw', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(21, 196, 112, 0.08), transparent 60%)',
                    filter: 'blur(80px)',
                }} />
                <div style={{
                    position: 'absolute', top: '40%', right: '-10%',
                    width: '50vw', height: '50vw', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06), transparent 60%)',
                    filter: 'blur(80px)',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-10%', left: '20%',
                    width: '40vw', height: '40vw', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05), transparent 60%)',
                    filter: 'blur(80px)',
                }} />
            </motion.div>

            {/* Grid pattern */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                backgroundSize: '40px 40px',
                backgroundImage: `
                    linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)
                `,
            }} />

            {/* ─── Navbar ─── */}
            <motion.nav
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                    position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 100,
                    padding: '0.75rem 1.5rem',
                    display: 'flex', alignItems: 'center', gap: '2rem',
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '100px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.04)',
                }}
            >
                <span style={{
                    fontFamily: '"Syne", sans-serif',
                    fontSize: '1.2rem', fontWeight: 800,
                    background: 'linear-gradient(135deg, #15c470, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    Daton
                </span>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    {['Produto', 'Dados', 'Sobre'].map(item => (
                        <span key={item} style={{
                            fontSize: '0.8rem', color: '#64748b', fontFamily: '"IBM Plex Mono"',
                            cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: '100px',
                            transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => {
                                (e.target as HTMLElement).style.background = 'rgba(0,0,0,0.04)';
                                (e.target as HTMLElement).style.color = '#0f172a';
                            }}
                            onMouseLeave={e => {
                                (e.target as HTMLElement).style.background = 'transparent';
                                (e.target as HTMLElement).style.color = '#64748b';
                            }}
                        >
                            {item}
                        </span>
                    ))}
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/auth')}
                    style={{
                        background: 'linear-gradient(135deg, #15c470, #0ea560)',
                        color: '#fff', border: 'none',
                        padding: '0.5rem 1.25rem', borderRadius: '100px',
                        fontFamily: '"IBM Plex Mono"', fontSize: '0.75rem',
                        fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    Acessar
                </motion.button>
            </motion.nav>

            {/* ─── Hero ─── */}
            <section style={{
                minHeight: '100vh',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center',
                textAlign: 'center',
                padding: '0 4vw',
                position: 'relative',
                zIndex: 10,
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem', borderRadius: '100px',
                        background: 'rgba(21, 196, 112, 0.08)',
                        border: '1px solid rgba(21, 196, 112, 0.15)',
                        marginBottom: '2rem',
                    }}
                >
                    <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#15c470', boxShadow: '0 0 10px #15c470',
                        }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15c470', letterSpacing: '0.05em' }}>
                        Dados atualizados em tempo real
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        fontFamily: '"Syne", sans-serif',
                        fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
                        fontWeight: 800,
                        lineHeight: 1.05,
                        letterSpacing: '-0.03em',
                        maxWidth: '900px',
                        marginBottom: '1.5rem',
                    }}
                >
                    O pulso da sua{' '}
                    <span style={{
                        background: 'linear-gradient(135deg, #15c470, #3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        sustentabilidade
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    style={{
                        fontSize: 'clamp(0.9rem, 1.2vw, 1.05rem)',
                        color: '#64748b',
                        maxWidth: '550px',
                        lineHeight: 1.7,
                        marginBottom: '2.5rem',
                        fontFamily: '"IBM Plex Mono"',
                    }}
                >
                    Monitore emissões, consumo e compliance com dashboards inteligentes que transformam dados brutos em decisões estratégicas.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}
                >
                    <motion.button
                        whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(21, 196, 112, 0.3)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/funcionalidades')}
                        style={{
                            background: 'linear-gradient(135deg, #15c470, #0ea560)',
                            color: '#fff', border: 'none',
                            padding: '0.9rem 2rem', borderRadius: '14px',
                            fontFamily: '"Syne"', fontSize: '0.95rem',
                            fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}
                    >
                        Ver dashboard
                        <ArrowRight size={16} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.03, background: 'rgba(0,0,0,0.06)' }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            background: 'rgba(0, 0, 0, 0.03)',
                            color: '#0f172a', border: '1px solid rgba(0,0,0,0.08)',
                            padding: '0.9rem 2rem', borderRadius: '14px',
                            fontFamily: '"Syne"', fontSize: '0.95rem',
                            fontWeight: 600, cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                    >
                        Agendar demo
                    </motion.button>
                </motion.div>

                {/* Wave decoration */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    style={{ position: 'absolute', bottom: '5%', left: 0, right: 0 }}
                >
                    <DataWave color="#15c470" />
                    <DataWave color="#3b82f6" delay={0.5} />
                </motion.div>
            </section>

            {/* ─── Live Metrics ─── */}
            <section style={{
                padding: 'clamp(3rem, 8vh, 6rem) 4vw',
                position: 'relative', zIndex: 10,
            }}>
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <span style={{
                            fontSize: '0.7rem', letterSpacing: '0.2em',
                            textTransform: 'uppercase', color: '#15c470',
                            fontWeight: 600, display: 'block', marginBottom: '0.75rem',
                        }}>
                            Métricas em tempo real
                        </span>
                        <h2 style={{
                            fontFamily: '"Syne", sans-serif',
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: 800, letterSpacing: '-0.02em',
                        }}>
                            Cada número conta uma história
                        </h2>
                    </div>
                </Reveal>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1.25rem',
                    maxWidth: '1200px',
                    margin: '0 auto',
                }}>
                    {metrics.map((metric, i) => (
                        <MetricCard key={i} {...metric} delay={i * 0.1} />
                    ))}
                </div>
            </section>

            {/* ─── Capabilities ─── */}
            <section style={{
                padding: 'clamp(3rem, 8vh, 6rem) 4vw',
                position: 'relative', zIndex: 10,
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4rem',
                    alignItems: 'center',
                }}>
                    <Reveal>
                        <div>
                            <span style={{
                                fontSize: '0.7rem', letterSpacing: '0.2em',
                                textTransform: 'uppercase', color: '#15c470',
                                fontWeight: 600, display: 'block', marginBottom: '0.75rem',
                            }}>
                                Capacidades
                            </span>
                            <h2 style={{
                                fontFamily: '"Syne", sans-serif',
                                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                                fontWeight: 800, letterSpacing: '-0.02em',
                                marginBottom: '1.5rem',
                            }}>
                                Inteligência que{' '}
                                <span style={{
                                    background: 'linear-gradient(135deg, #15c470, #3b82f6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>
                                    impulsiona
                                </span>
                            </h2>
                            <p style={{
                                fontSize: '0.95rem', color: '#64748b',
                                lineHeight: 1.7, fontFamily: '"IBM Plex Mono"',
                            }}>
                                Ferramentas analíticas avançadas que transformam dados complexos em insights claros e acionáveis.
                            </p>
                        </div>
                    </Reveal>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {capabilities.map((cap, i) => (
                            <Reveal key={i} delay={i * 0.1}>
                                <motion.div
                                    whileHover={{ x: 8, background: 'rgba(255,255,255,0.9)' }}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '1rem',
                                        padding: '1.25rem',
                                        background: 'rgba(255, 255, 255, 0.6)',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(0,0,0,0.04)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                    }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '10px',
                                        background: 'rgba(21, 196, 112, 0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <cap.icon size={18} color="#15c470" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h4 style={{
                                            fontFamily: '"Syne"', fontSize: '0.95rem',
                                            fontWeight: 700, marginBottom: '0.25rem',
                                        }}>
                                            {cap.title}
                                        </h4>
                                        <p style={{
                                            fontSize: '0.8rem', color: '#64748b',
                                            lineHeight: 1.5, fontFamily: '"IBM Plex Mono"',
                                        }}>
                                            {cap.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section style={{
                padding: 'clamp(4rem, 10vh, 8rem) 4vw',
                position: 'relative', zIndex: 10,
                textAlign: 'center',
            }}>
                <Reveal>
                    <div style={{
                        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                        borderRadius: '24px',
                        padding: 'clamp(3rem, 6vw, 5rem)',
                        maxWidth: '900px',
                        margin: '0 auto',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Gradient orbs */}
                        <div style={{
                            position: 'absolute', top: '-30%', right: '-10%',
                            width: '300px', height: '300px', borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(21, 196, 112, 0.2), transparent)',
                            filter: 'blur(60px)',
                        }} />
                        <div style={{
                            position: 'absolute', bottom: '-30%', left: '-10%',
                            width: '300px', height: '300px', borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent)',
                            filter: 'blur(60px)',
                        }} />

                        <h2 style={{
                            fontFamily: '"Syne"', fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: 800, color: '#fff',
                            marginBottom: '1rem', position: 'relative', zIndex: 1,
                            letterSpacing: '-0.02em',
                        }}>
                            Sinta o pulso dos seus dados
                        </h2>
                        <p style={{
                            fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)',
                            maxWidth: '400px', margin: '0 auto 2rem',
                            lineHeight: 1.7, fontFamily: '"IBM Plex Mono"',
                            position: 'relative', zIndex: 1,
                        }}>
                            Comece a monitorar sua sustentabilidade com inteligência em minutos.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(21, 196, 112, 0.4)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/contato')}
                            style={{
                                background: 'linear-gradient(135deg, #15c470, #0ea560)',
                                color: '#fff', border: 'none',
                                padding: '1rem 2.5rem', borderRadius: '14px',
                                fontFamily: '"Syne"', fontSize: '1rem',
                                fontWeight: 700, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                                position: 'relative', zIndex: 1,
                            }}
                        >
                            Começar agora
                            <ArrowUpRight size={18} />
                        </motion.button>
                    </div>
                </Reveal>
            </section>

            {/* ─── Footer ─── */}
            <footer style={{
                padding: '2rem 4vw',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                position: 'relative', zIndex: 10,
            }}>
                <span style={{
                    fontFamily: '"Syne"', fontSize: '1.1rem', fontWeight: 800,
                    background: 'linear-gradient(135deg, #15c470, #3b82f6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    Daton
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: '"IBM Plex Mono"' }}>
                    &copy; 2026 Daton ESG Insight — O pulso da sustentabilidade.
                </span>
            </footer>
        </div>
    );
}
