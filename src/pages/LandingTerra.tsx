/**
 * Design 1: "Terra" — Organic Earth
 *
 * Deep dark soil tones, organic blob shapes, particle rain,
 * nature-inspired flowing typography. Environmental pillar of ESG.
 * Font: Playfair Display + DM Sans
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Leaf, Droplets, Wind, TreePine, ArrowRight, BarChart3, Shield, Users, ChevronDown } from 'lucide-react';

/* ─── Particle Rain Canvas ─── */
function ParticleRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: { x: number; y: number; speed: number; opacity: number; size: number }[] = [];
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speed: 0.3 + Math.random() * 1.2,
                opacity: 0.1 + Math.random() * 0.3,
                size: 1 + Math.random() * 2,
            });
        }

        let animId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(21, 196, 112, ${p.opacity})`;
                ctx.fill();
                p.y += p.speed;
                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                }
            });
            animId = requestAnimationFrame(animate);
        };
        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
        />
    );
}

/* ─── Organic Blob SVG ─── */
function OrganicBlob({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 }}
            transition={{ duration: 2, delay, ease: 'easeOut' }}
            style={{ position: 'absolute', top, left, width: size, height: size, zIndex: 0 }}
        >
            <motion.svg
                viewBox="0 0 200 200"
                animate={{ rotate: 360 }}
                transition={{ duration: 60 + delay * 10, repeat: Infinity, ease: 'linear' }}
                style={{ width: '100%', height: '100%' }}
            >
                <path
                    d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.1,73.1,41.8C64.8,54.5,53.8,65.3,40.8,72.2C27.8,79.1,12.9,82.1,-1.4,84.5C-15.7,86.9,-31.4,88.7,-44.4,82.1C-57.4,75.5,-67.7,60.5,-75.2,44.9C-82.7,29.3,-87.4,13.1,-85.5,1.1C-83.6,-10.9,-75.1,-21.8,-66.8,-33.1C-58.5,-44.4,-50.4,-56.1,-39.2,-65C-28,-73.9,-14,-80,0.7,-81.2C15.4,-82.4,30.7,-83.7,44.7,-76.4Z"
                    transform="translate(100 100)"
                    fill={color}
                />
            </motion.svg>
        </motion.div>
    );
}

/* ─── Animated Counter ─── */
function AnimCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        const duration = 2000;
        const start = performance.now();
        const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(value * eased));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [isInView, value]);

    return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Section Reveal Wrapper ─── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 60 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

/* ─── Main Landing ─── */
export default function LandingTerra() {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

    const modules = [
        { icon: Leaf, title: 'Inventário GEE', desc: 'Cálculo automatizado de emissões por escopo com fatores atualizados do GHG Protocol.' },
        { icon: Droplets, title: 'Gestão Hídrica', desc: 'Monitoramento de consumo, reúso e qualidade da água em tempo real.' },
        { icon: Wind, title: 'Qualidade do Ar', desc: 'Rastreamento de poluentes atmosféricos e conformidade com padrões CONAMA.' },
        { icon: TreePine, title: 'Biodiversidade', desc: 'Gestão de áreas protegidas, compensação ambiental e créditos de carbono.' },
        { icon: BarChart3, title: 'Relatórios ESG', desc: 'Geração automática de relatórios GRI, SASB e TCFD com dados validados.' },
        { icon: Shield, title: 'Compliance', desc: 'Monitoramento de licenças, condicionantes e obrigações regulatórias.' },
    ];

    const stats = [
        { value: 2400, suffix: '+', label: 'Toneladas CO₂e monitoradas' },
        { value: 98, suffix: '%', label: 'Precisão nos cálculos' },
        { value: 150, suffix: '+', label: 'Empresas atendidas' },
        { value: 40, suffix: '+', label: 'Indicadores rastreados' },
    ];

    return (
        <div style={{
            background: '#0a0f0a',
            color: '#e8e4d9',
            fontFamily: '"DM Sans", sans-serif',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet" />

            <ParticleRain />

            {/* Organic Blobs */}
            <OrganicBlob color="#15c470" size={600} top="-10%" left="-10%" delay={0} />
            <OrganicBlob color="#0d7a42" size={400} top="30%" left="70%" delay={0.5} />
            <OrganicBlob color="#15c470" size={500} top="60%" left="-5%" delay={1} />

            {/* ─── Navbar ─── */}
            <motion.nav
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    padding: '1.25rem 3rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(10, 15, 10, 0.6)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(21, 196, 112, 0.1)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #15c470, #0d7a42)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Leaf size={16} color="#0a0f0a" />
                    </div>
                    <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                        Daton
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {['Soluções', 'Impacto', 'Sobre'].map(item => (
                        <span key={item} style={{
                            fontSize: '0.85rem', color: 'rgba(232, 228, 217, 0.6)',
                            cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase',
                            transition: 'color 0.3s',
                        }}
                            onMouseEnter={e => (e.target as HTMLElement).style.color = '#15c470'}
                            onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(232, 228, 217, 0.6)'}
                        >
                            {item}
                        </span>
                    ))}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/auth')}
                        style={{
                            background: '#15c470', color: '#0a0f0a',
                            border: 'none', padding: '0.6rem 1.5rem', borderRadius: '100px',
                            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                            letterSpacing: '0.03em',
                        }}
                    >
                        Entrar
                    </motion.button>
                </div>
            </motion.nav>

            {/* ─── Hero ─── */}
            <motion.section
                style={{ opacity: heroOpacity, scale: heroScale }}
            >
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '0 6vw',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    <motion.div
                        initial={{ opacity: 0, x: -60 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            marginBottom: '2rem', padding: '0.4rem 1rem',
                            border: '1px solid rgba(21, 196, 112, 0.3)',
                            borderRadius: '100px', width: 'fit-content',
                        }}
                    >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#15c470', boxShadow: '0 0 12px #15c470' }} />
                        <span style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#15c470' }}>
                            Plataforma ESG Inteligente
                        </span>
                    </motion.div>

                    <div style={{ overflow: 'hidden' }}>
                        <motion.h1
                            initial={{ y: 120 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                fontFamily: '"Playfair Display", serif',
                                fontSize: 'clamp(3rem, 8vw, 8rem)',
                                fontWeight: 900,
                                lineHeight: 0.95,
                                letterSpacing: '-0.03em',
                                marginBottom: '0.5em',
                            }}
                        >
                            Da terra,
                            <br />
                            <span style={{ color: '#15c470', fontStyle: 'italic', fontWeight: 400 }}>
                                para o futuro.
                            </span>
                        </motion.h1>
                    </div>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                        style={{
                            fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
                            color: 'rgba(232, 228, 217, 0.6)',
                            maxWidth: '550px',
                            lineHeight: 1.7,
                            marginBottom: '2.5rem',
                        }}
                    >
                        Transforme dados ambientais brutos em inteligência sustentável.
                        Monitore emissões, gerencie compliance e gere relatórios ESG — tudo em uma plataforma unificada.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.1 }}
                        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(21, 196, 112, 0.4)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/funcionalidades')}
                            style={{
                                background: '#15c470', color: '#0a0f0a',
                                border: 'none', padding: '1rem 2.5rem', borderRadius: '100px',
                                fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                fontFamily: '"DM Sans", sans-serif',
                            }}
                        >
                            Comece agora
                            <ArrowRight size={18} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.03, borderColor: '#15c470' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                background: 'transparent', color: '#e8e4d9',
                                border: '1px solid rgba(232, 228, 217, 0.2)', padding: '1rem 2.5rem',
                                borderRadius: '100px', fontWeight: 500, fontSize: '1rem',
                                cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
                                transition: 'border-color 0.3s',
                            }}
                        >
                            Ver demonstração
                        </motion.button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        style={{
                            position: 'absolute', bottom: '3rem', left: '50%',
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <ChevronDown size={24} color="rgba(232, 228, 217, 0.3)" />
                        </motion.div>
                    </motion.div>
                </div>
            </motion.section>

            {/* ─── Stats Ribbon ─── */}
            <section style={{
                padding: '5rem 6vw',
                background: 'rgba(21, 196, 112, 0.03)',
                borderTop: '1px solid rgba(21, 196, 112, 0.1)',
                borderBottom: '1px solid rgba(21, 196, 112, 0.1)',
                position: 'relative',
                zIndex: 10,
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '3rem',
                    maxWidth: '1200px',
                    margin: '0 auto',
                }}>
                    {stats.map((stat, i) => (
                        <Reveal key={i} delay={i * 0.1}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontFamily: '"Playfair Display", serif',
                                    fontSize: 'clamp(2.5rem, 4vw, 4rem)',
                                    fontWeight: 900,
                                    color: '#15c470',
                                    lineHeight: 1,
                                    marginBottom: '0.5rem',
                                }}>
                                    <AnimCounter value={stat.value} suffix={stat.suffix} />
                                </div>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: 'rgba(232, 228, 217, 0.5)',
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                }}>
                                    {stat.label}
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ─── Modules Grid ─── */}
            <section style={{
                padding: 'clamp(4rem, 10vh, 8rem) 6vw',
                position: 'relative',
                zIndex: 10,
            }}>
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <span style={{
                            fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase',
                            color: '#15c470', display: 'block', marginBottom: '1rem',
                        }}>
                            Ecossistema Completo
                        </span>
                        <h2 style={{
                            fontFamily: '"Playfair Display", serif',
                            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                            fontWeight: 700,
                            lineHeight: 1.1,
                            maxWidth: '700px',
                            margin: '0 auto',
                        }}>
                            Cada módulo, um{' '}
                            <span style={{ color: '#15c470', fontStyle: 'italic' }}>bioma</span>{' '}
                            de inteligência
                        </h2>
                    </div>
                </Reveal>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1px',
                    background: 'rgba(21, 196, 112, 0.1)',
                    maxWidth: '1200px',
                    margin: '0 auto',
                }}>
                    {modules.map((mod, i) => (
                        <Reveal key={i} delay={i * 0.08}>
                            <motion.div
                                whileHover={{
                                    backgroundColor: 'rgba(21, 196, 112, 0.06)',
                                    transition: { duration: 0.3 },
                                }}
                                style={{
                                    background: '#0a0f0a',
                                    padding: '2.5rem',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                <mod.icon size={28} color="#15c470" strokeWidth={1.5} style={{ marginBottom: '1.5rem' }} />
                                <h3 style={{
                                    fontFamily: '"Playfair Display", serif',
                                    fontSize: '1.4rem', fontWeight: 700,
                                    marginBottom: '0.75rem',
                                }}>
                                    {mod.title}
                                </h3>
                                <p style={{
                                    fontSize: '0.9rem', color: 'rgba(232, 228, 217, 0.5)',
                                    lineHeight: 1.6,
                                }}>
                                    {mod.desc}
                                </p>
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileHover={{ width: '100%' }}
                                    style={{
                                        position: 'absolute', bottom: 0, left: 0,
                                        height: '2px', background: '#15c470',
                                    }}
                                />
                            </motion.div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ─── CTA Section ─── */}
            <section style={{
                padding: 'clamp(4rem, 10vh, 8rem) 6vw',
                position: 'relative',
                zIndex: 10,
                textAlign: 'center',
            }}>
                <Reveal>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(21, 196, 112, 0.08), rgba(13, 122, 66, 0.08))',
                        border: '1px solid rgba(21, 196, 112, 0.15)',
                        borderRadius: '24px',
                        padding: 'clamp(3rem, 6vw, 6rem)',
                        maxWidth: '900px',
                        margin: '0 auto',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <OrganicBlob color="#15c470" size={300} top="-20%" left="70%" delay={0} />
                        <h2 style={{
                            fontFamily: '"Playfair Display", serif',
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: 700,
                            marginBottom: '1.5rem',
                            position: 'relative',
                            zIndex: 1,
                        }}>
                            Pronto para cultivar{' '}
                            <span style={{ color: '#15c470', fontStyle: 'italic' }}>
                                resultados sustentáveis?
                            </span>
                        </h2>
                        <p style={{
                            color: 'rgba(232, 228, 217, 0.6)',
                            maxWidth: '500px', margin: '0 auto 2rem',
                            lineHeight: 1.7,
                            position: 'relative', zIndex: 1,
                        }}>
                            Agende uma demonstração e descubra como a Daton pode transformar sua gestão ambiental.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(21, 196, 112, 0.3)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/contato')}
                            style={{
                                background: '#15c470', color: '#0a0f0a',
                                border: 'none', padding: '1rem 3rem', borderRadius: '100px',
                                fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                                fontFamily: '"DM Sans", sans-serif',
                                position: 'relative', zIndex: 1,
                            }}
                        >
                            Agendar demo
                            <ArrowRight size={18} />
                        </motion.button>
                    </div>
                </Reveal>
            </section>

            {/* ─── Footer ─── */}
            <footer style={{
                padding: '3rem 6vw',
                borderTop: '1px solid rgba(21, 196, 112, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                position: 'relative',
                zIndex: 10,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Leaf size={16} color="#15c470" />
                    <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '1.1rem' }}>
                        Daton
                    </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'rgba(232, 228, 217, 0.3)' }}>
                    &copy; 2026 Daton ESG Insight. Da terra, para o futuro.
                </span>
            </footer>
        </div>
    );
}
