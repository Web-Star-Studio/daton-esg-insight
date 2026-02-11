/**
 * Design 5: "Selva" — Brazilian Tropical
 *
 * Vibrant tropical gradients, warm golden/amber tones mixed with
 * lush greens, bold geometric patterns inspired by indigenous art,
 * human-centered imagery. Focus on social pillar & Brazilian identity.
 * Font: Bricolage Grotesque + Source Serif 4
 */
import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, Sun, Heart, Users, Handshake,
    MapPin, TreePine, Building2, Sparkles,
    CheckCircle2, Globe, Shield, BarChart3,
} from 'lucide-react';

/* ─── Geometric Pattern SVG ─── */
function TribalPattern({ style }: { style?: React.CSSProperties }) {
    return (
        <svg viewBox="0 0 200 200" fill="none" style={{ opacity: 0.06, ...style }}>
            <path d="M100 0L200 100L100 200L0 100Z" stroke="currentColor" strokeWidth="1" />
            <path d="M50 50L150 50L150 150L50 150Z" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1" />
            <path d="M100 20L100 180" stroke="currentColor" strokeWidth="0.5" />
            <path d="M20 100L180 100" stroke="currentColor" strokeWidth="0.5" />
            <path d="M40 40L160 160" stroke="currentColor" strokeWidth="0.5" />
            <path d="M160 40L40 160" stroke="currentColor" strokeWidth="0.5" />
        </svg>
    );
}

/* ─── Animated Number ─── */
function AnimNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        const dur = 2000;
        const start = performance.now();
        const step = (now: number) => {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            setCount(Math.floor(value * eased));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [isInView, value]);

    return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Reveal ─── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

/* ─── Marquee ─── */
function Marquee({ items }: { items: string[] }) {
    const doubled = [...items, ...items];
    return (
        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', padding: '1.5rem 0' }}>
            <motion.div
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-flex', gap: '3rem' }}
            >
                {doubled.map((item, i) => (
                    <span key={i} style={{
                        fontFamily: '"Bricolage Grotesque", sans-serif',
                        fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                        fontWeight: 700,
                        color: 'rgba(42, 37, 32, 0.08)',
                        whiteSpace: 'nowrap',
                    }}>
                        {item}
                        <span style={{ margin: '0 1.5rem', color: '#15c470', opacity: 0.3 }}>&bull;</span>
                    </span>
                ))}
            </motion.div>
        </div>
    );
}

/* ─── Main ─── */
export default function LandingSelva() {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.96]);

    const pillars = [
        {
            icon: TreePine, color: '#15c470',
            title: 'Ambiental',
            desc: 'Monitoramento de emissões, resíduos e biodiversidade com precisão científica.',
            gradient: 'linear-gradient(135deg, #15c470, #0d7a42)',
        },
        {
            icon: Heart, color: '#e85d75',
            title: 'Social',
            desc: 'Gestão de pessoas, segurança do trabalho e impacto nas comunidades.',
            gradient: 'linear-gradient(135deg, #e85d75, #c0425e)',
        },
        {
            icon: Shield, color: '#f5a623',
            title: 'Governança',
            desc: 'Compliance, ética corporativa e transparência em todos os níveis.',
            gradient: 'linear-gradient(135deg, #f5a623, #d48f1a)',
        },
    ];

    const stats = [
        { value: 150, suffix: '+', label: 'Empresas brasileiras', icon: Building2 },
        { value: 50000, suffix: '+', label: 'Vidas impactadas', icon: Users },
        { value: 12, suffix: '', label: 'Estados atendidos', icon: MapPin },
        { value: 98, suffix: '%', label: 'Satisfação', icon: Heart },
    ];

    const modules = [
        { title: 'Inventário GEE', desc: 'Cálculo de emissões por escopo', category: 'Ambiental' },
        { title: 'Gestão de Resíduos', desc: 'PGRS e rastreamento completo', category: 'Ambiental' },
        { title: 'Licenciamento', desc: 'Licenças e condicionantes', category: 'Ambiental' },
        { title: 'Gestão de Pessoas', desc: 'Funcionários e treinamentos', category: 'Social' },
        { title: 'Segurança do Trabalho', desc: 'SST e prevenção de acidentes', category: 'Social' },
        { title: 'Compliance', desc: 'Regulamentações e auditorias', category: 'Governança' },
        { title: 'Gestão de Riscos', desc: 'Identificação e mitigação', category: 'Governança' },
        { title: 'Relatórios ESG', desc: 'GRI, SASB, CDP automáticos', category: 'Inteligência' },
    ];

    const categoryColors: Record<string, string> = {
        'Ambiental': '#15c470',
        'Social': '#e85d75',
        'Governança': '#f5a623',
        'Inteligência': '#8b5cf6',
    };

    return (
        <div style={{
            background: '#fffbf5',
            color: '#2a2520',
            fontFamily: '"Source Serif 4", Georgia, serif',
            minHeight: '100vh',
            position: 'relative',
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&display=swap" rel="stylesheet" />

            {/* Warm ambient glow */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
            }}>
                <div style={{
                    position: 'absolute', top: '-15%', right: '-10%',
                    width: '50vw', height: '50vw', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(245, 166, 35, 0.08), transparent 60%)',
                    filter: 'blur(80px)',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-10%', left: '-5%',
                    width: '40vw', height: '40vw', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(21, 196, 112, 0.06), transparent 60%)',
                    filter: 'blur(80px)',
                }} />
            </div>

            {/* Geometric pattern accents */}
            <div style={{ position: 'fixed', top: '5%', right: '5%', width: '200px', height: '200px', zIndex: 0, pointerEvents: 'none', color: '#2a2520' }}>
                <TribalPattern />
            </div>
            <div style={{ position: 'fixed', bottom: '10%', left: '3%', width: '150px', height: '150px', zIndex: 0, pointerEvents: 'none', color: '#15c470' }}>
                <TribalPattern />
            </div>

            {/* ─── Navbar ─── */}
            <motion.nav
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                    padding: '1.25rem 5vw',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255, 251, 245, 0.9)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(42, 37, 32, 0.06)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sun size={22} color="#f5a623" />
                    <span style={{
                        fontFamily: '"Bricolage Grotesque", sans-serif',
                        fontSize: '1.4rem', fontWeight: 800,
                        letterSpacing: '-0.02em',
                    }}>
                        Daton
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {[
                        { label: 'Soluções', path: '/funcionalidades' },
                        { label: 'Impacto', path: '/funcionalidades' },
                        { label: 'Sobre', path: '/sobre-nos' }
                    ].map(item => (
                        <span key={item.label}
                            onClick={() => navigate(item.path)}
                            style={{
                                fontFamily: '"Bricolage Grotesque"', fontSize: '0.9rem',
                                fontWeight: 500, color: '#8a7d65',
                                cursor: 'pointer', transition: 'color 0.3s',
                            }}
                            onMouseEnter={e => (e.target as HTMLElement).style.color = '#2a2520'}
                            onMouseLeave={e => (e.target as HTMLElement).style.color = '#8a7d65'}
                        >
                            {item.label}
                        </span>
                    ))}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/auth')}
                        style={{
                            background: 'linear-gradient(135deg, #f5a623, #e5961e)',
                            color: '#fff', border: 'none',
                            padding: '0.6rem 1.5rem', borderRadius: '100px',
                            fontFamily: '"Bricolage Grotesque"', fontSize: '0.85rem',
                            fontWeight: 700, cursor: 'pointer',
                        }}
                    >
                        Entrar
                    </motion.button>
                </div>
            </motion.nav>

            {/* ─── Hero ─── */}
            <motion.section style={{ scale: heroScale }}>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '0 5vw',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    {/* Tropical gradient bar */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        style={{
                            width: 'clamp(60px, 8vw, 100px)',
                            height: '6px',
                            borderRadius: '100px',
                            background: 'linear-gradient(90deg, #15c470, #f5a623, #e85d75)',
                            marginBottom: '2rem',
                            transformOrigin: 'left',
                        }}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            marginBottom: '1.5rem',
                        }}
                    >
                        <Sparkles size={14} color="#f5a623" />
                        <span style={{
                            fontFamily: '"Bricolage Grotesque"', fontSize: '0.8rem',
                            fontWeight: 600, color: '#f5a623',
                            letterSpacing: '0.05em', textTransform: 'uppercase',
                        }}>
                            Sustentabilidade brasileira
                        </span>
                    </motion.div>

                    <div style={{ overflow: 'hidden' }}>
                        <motion.h1
                            initial={{ y: 120 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                fontFamily: '"Bricolage Grotesque", sans-serif',
                                fontSize: 'clamp(3rem, 8vw, 7rem)',
                                fontWeight: 800,
                                lineHeight: 1,
                                letterSpacing: '-0.03em',
                                maxWidth: '900px',
                                marginBottom: '1.5rem',
                            }}
                        >
                            Do Brasil,
                            <br />
                            <span style={{
                                background: 'linear-gradient(135deg, #15c470, #f5a623)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                para o mundo.
                            </span>
                        </motion.h1>
                    </div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        style={{
                            fontSize: 'clamp(1rem, 1.4vw, 1.2rem)',
                            color: '#8a7d65',
                            maxWidth: '550px',
                            lineHeight: 1.8,
                            marginBottom: '2.5rem',
                        }}
                    >
                        Plataforma completa de gestão ESG feita no Brasil, para empresas que acreditam que
                        sustentabilidade e prosperidade caminham juntas.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(245, 166, 35, 0.3)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/funcionalidades')}
                            style={{
                                background: 'linear-gradient(135deg, #f5a623, #e5961e)',
                                color: '#fff', border: 'none',
                                padding: '1rem 2.5rem', borderRadius: '100px',
                                fontFamily: '"Bricolage Grotesque"', fontSize: '1rem',
                                fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                            }}
                        >
                            Conhecer a plataforma
                            <ArrowRight size={18} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.04, borderColor: '#f5a623' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                background: 'transparent', color: '#2a2520',
                                border: '2px solid rgba(42, 37, 32, 0.15)',
                                padding: '1rem 2.5rem', borderRadius: '100px',
                                fontFamily: '"Bricolage Grotesque"', fontSize: '1rem',
                                fontWeight: 600, cursor: 'pointer',
                                transition: 'border-color 0.3s',
                            }}
                        >
                            Agendar demo
                        </motion.button>
                    </motion.div>
                </div>
            </motion.section>

            {/* ─── Marquee ─── */}
            <Marquee items={['ESG', 'GHG Protocol', 'GRI', 'SASB', 'TCFD', 'CDP', 'ISO 14001', 'LGPD', 'SDGs', 'Carbono Zero']} />

            {/* ─── Pillars ─── */}
            <section style={{
                padding: 'clamp(4rem, 10vh, 8rem) 5vw',
                position: 'relative', zIndex: 10,
            }}>
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <motion.div
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            style={{
                                width: 60, height: 4, borderRadius: 100,
                                background: 'linear-gradient(90deg, #15c470, #f5a623, #e85d75)',
                                margin: '0 auto 1.5rem', transformOrigin: 'center',
                            }}
                        />
                        <h2 style={{
                            fontFamily: '"Bricolage Grotesque"',
                            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                            fontWeight: 800, letterSpacing: '-0.02em',
                        }}>
                            Três pilares,{' '}
                            <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: '"Source Serif 4"' }}>
                                um propósito
                            </span>
                        </h2>
                    </div>
                </Reveal>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem',
                    maxWidth: '1100px',
                    margin: '0 auto',
                }}>
                    {pillars.map((pillar, i) => (
                        <Reveal key={i} delay={i * 0.15}>
                            <motion.div
                                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}
                                style={{
                                    background: '#fff',
                                    borderRadius: '20px',
                                    padding: '2.5rem',
                                    border: '1px solid rgba(42, 37, 32, 0.06)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Top gradient accent */}
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0,
                                    height: '4px', background: pillar.gradient,
                                }} />
                                <div style={{
                                    width: 48, height: 48, borderRadius: '14px',
                                    background: `${pillar.color}10`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '1.5rem',
                                }}>
                                    <pillar.icon size={24} color={pillar.color} strokeWidth={1.5} />
                                </div>
                                <h3 style={{
                                    fontFamily: '"Bricolage Grotesque"',
                                    fontSize: '1.5rem', fontWeight: 700,
                                    marginBottom: '0.5rem',
                                }}>
                                    {pillar.title}
                                </h3>
                                <p style={{
                                    fontSize: '0.95rem', color: '#8a7d65',
                                    lineHeight: 1.7,
                                }}>
                                    {pillar.desc}
                                </p>
                            </motion.div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ─── Stats ─── */}
            <section style={{
                padding: '4rem 5vw',
                background: 'linear-gradient(135deg, #2a2520, #3d3630)',
                color: '#fffbf5',
                position: 'relative',
                zIndex: 10,
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '2rem',
                    maxWidth: '1000px',
                    margin: '0 auto',
                    textAlign: 'center',
                }}>
                    {stats.map((stat, i) => (
                        <Reveal key={i} delay={i * 0.1}>
                            <div>
                                <stat.icon size={20} color="#f5a623" style={{ marginBottom: '0.75rem' }} />
                                <div style={{
                                    fontFamily: '"Bricolage Grotesque"',
                                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                                    fontWeight: 800, lineHeight: 1,
                                    marginBottom: '0.25rem',
                                    background: 'linear-gradient(135deg, #15c470, #f5a623)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>
                                    <AnimNumber value={stat.value} suffix={stat.suffix} />
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 251, 245, 0.5)' }}>
                                    {stat.label}
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ─── Modules ─── */}
            <section style={{
                padding: 'clamp(4rem, 10vh, 8rem) 5vw',
                position: 'relative', zIndex: 10,
            }}>
                <Reveal>
                    <div style={{ marginBottom: '3rem' }}>
                        <span style={{
                            fontFamily: '"Bricolage Grotesque"', fontSize: '0.75rem',
                            fontWeight: 700, color: '#f5a623',
                            letterSpacing: '0.15em', textTransform: 'uppercase',
                            display: 'block', marginBottom: '0.75rem',
                        }}>
                            Módulos
                        </span>
                        <h2 style={{
                            fontFamily: '"Bricolage Grotesque"',
                            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                            fontWeight: 800, letterSpacing: '-0.02em',
                        }}>
                            Tudo que você precisa
                        </h2>
                    </div>
                </Reveal>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '0.75rem',
                    maxWidth: '1100px',
                }}>
                    {modules.map((mod, i) => (
                        <Reveal key={i} delay={i * 0.06}>
                            <motion.div
                                whileHover={{ x: 4, background: 'rgba(255,255,255,0.8)' }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1.25rem 1.5rem',
                                    background: 'rgba(255, 255, 255, 0.5)',
                                    borderRadius: '14px',
                                    border: '1px solid rgba(42, 37, 32, 0.04)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                }}
                            >
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: categoryColors[mod.category],
                                    flexShrink: 0,
                                }} />
                                <div>
                                    <h4 style={{
                                        fontFamily: '"Bricolage Grotesque"',
                                        fontSize: '0.95rem', fontWeight: 700,
                                        marginBottom: '0.15rem',
                                    }}>
                                        {mod.title}
                                    </h4>
                                    <p style={{ fontSize: '0.8rem', color: '#8a7d65' }}>
                                        {mod.desc}
                                    </p>
                                </div>
                                <span style={{
                                    marginLeft: 'auto', fontSize: '0.6rem',
                                    fontFamily: '"Bricolage Grotesque"',
                                    fontWeight: 600, color: categoryColors[mod.category],
                                    letterSpacing: '0.05em', textTransform: 'uppercase',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {mod.category}
                                </span>
                            </motion.div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section style={{
                padding: 'clamp(4rem, 10vh, 8rem) 5vw',
                position: 'relative', zIndex: 10,
                textAlign: 'center',
            }}>
                <Reveal>
                    <div style={{
                        background: 'linear-gradient(135deg, #fffbf5, #fff5e6)',
                        border: '2px solid rgba(245, 166, 35, 0.15)',
                        borderRadius: '28px',
                        padding: 'clamp(3rem, 6vw, 6rem)',
                        maxWidth: '800px',
                        margin: '0 auto',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Background pattern */}
                        <div style={{ position: 'absolute', top: '10%', right: '5%', width: 120, height: 120, color: '#f5a623', opacity: 0.05 }}>
                            <TribalPattern />
                        </div>

                        <div style={{
                            width: 50, height: 4, borderRadius: 100,
                            background: 'linear-gradient(90deg, #15c470, #f5a623, #e85d75)',
                            margin: '0 auto 2rem',
                        }} />
                        <h2 style={{
                            fontFamily: '"Bricolage Grotesque"',
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: 800, marginBottom: '1rem',
                            letterSpacing: '-0.02em',
                            position: 'relative', zIndex: 1,
                        }}>
                            Vamos construir juntos?
                        </h2>
                        <p style={{
                            fontSize: '1rem', color: '#8a7d65',
                            maxWidth: '450px', margin: '0 auto 2rem',
                            lineHeight: 1.7,
                            position: 'relative', zIndex: 1,
                        }}>
                            Descubra como a Daton pode transformar sua gestão ESG com a energia e inovação brasileira.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(245, 166, 35, 0.3)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/contato')}
                            style={{
                                background: 'linear-gradient(135deg, #f5a623, #e5961e)',
                                color: '#fff', border: 'none',
                                padding: '1rem 3rem', borderRadius: '100px',
                                fontFamily: '"Bricolage Grotesque"', fontSize: '1rem',
                                fontWeight: 700, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                                position: 'relative', zIndex: 1,
                            }}
                        >
                            Fale conosco
                            <Handshake size={18} />
                        </motion.button>
                    </div>
                </Reveal>
            </section>

            {/* ─── Footer ─── */}
            <footer style={{
                padding: '2.5rem 5vw',
                borderTop: '1px solid rgba(42, 37, 32, 0.06)',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                position: 'relative', zIndex: 10,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sun size={16} color="#f5a623" />
                    <span style={{
                        fontFamily: '"Bricolage Grotesque"',
                        fontWeight: 800, fontSize: '1.1rem',
                    }}>
                        Daton
                    </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#8a7d65' }}>
                    &copy; 2026 Daton ESG Insight — Do Brasil, para o mundo.
                </span>
            </footer>
        </div>
    );
}
