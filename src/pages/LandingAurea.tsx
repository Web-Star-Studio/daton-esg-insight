/**
 * Design 3: "Aurea" — Luxury Editorial / Magazine
 *
 * High-fashion editorial aesthetic with sophisticated serif typography,
 * warm cream + charcoal palette with gold/green accents,
 * generous whitespace, asymmetric grid, dramatic reveals.
 * Focus on governance & corporate excellence.
 * Font: Cormorant Garamond + Outfit
 */
import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, ArrowUpRight, Shield, Award, TrendingUp,
    FileText, Users, Globe, CheckCircle2, Star,
} from 'lucide-react';

/* ─── Reveal ─── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

/* ─── Horizontal Rule with Label ─── */
function LabeledDivider({ label }: { label: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '4rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#d4c5a9' }} />
            <span style={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: '0.7rem', letterSpacing: '0.25em',
                textTransform: 'uppercase', color: '#8a7d65',
            }}>
                {label}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#d4c5a9' }} />
        </div>
    );
}

/* ─── Main Landing ─── */
export default function LandingAurea() {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const heroParallax = useTransform(scrollYProgress, [0, 0.3], [0, -80]);

    const pillars = [
        {
            letter: 'E',
            title: 'Ambiental',
            subtitle: 'Environmental',
            items: ['Inventário de emissões GEE', 'Gestão hídrica e resíduos', 'Licenciamento ambiental', 'Monitoramento em tempo real'],
            icon: Globe,
        },
        {
            letter: 'S',
            title: 'Social',
            subtitle: 'Social',
            items: ['Gestão de funcionários', 'Segurança do trabalho', 'Desenvolvimento de carreira', 'Ouvidoria e comunicação'],
            icon: Users,
        },
        {
            letter: 'G',
            title: 'Governança',
            subtitle: 'Governance',
            items: ['Compliance regulatório', 'Gestão de riscos', 'Auditoria e controle', 'Ética e transparência'],
            icon: Shield,
        },
    ];

    const testimonials = [
        { quote: 'A Daton transformou completamente nossa gestão ambiental. Reduzimos o tempo de relatórios em 70%.', author: 'Maria Santos', role: 'Diretora de Sustentabilidade', company: 'Votorantim Cimentos' },
        { quote: 'Compliance que antes levava semanas agora é monitorado em tempo real. Excepcional.', author: 'Ricardo Almeida', role: 'Head de Governança', company: 'Natura &Co' },
    ];

    const features = [
        { icon: FileText, label: 'Relatórios GRI & SASB', desc: 'Geração automatizada de relatórios nos principais frameworks globais.' },
        { icon: TrendingUp, label: 'Analytics Preditivo', desc: 'IA que antecipa tendências e sugere ações corretivas.' },
        { icon: Award, label: 'Certificações', desc: 'Suporte a ISO 14001, ISO 9001 e demais certificações.' },
        { icon: Shield, label: 'LGPD Compliant', desc: 'Proteção total de dados com conformidade à legislação brasileira.' },
    ];

    return (
        <div style={{
            background: '#faf7f2',
            color: '#2a2520',
            fontFamily: '"Outfit", sans-serif',
            minHeight: '100vh',
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700&family=Outfit:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />

            {/* Grain texture overlay */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                opacity: 0.03,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            }} />

            {/* ─── Navbar ─── */}
            <motion.nav
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                    padding: '1.5rem 4vw',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(250, 247, 242, 0.9)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid #e8e0d0',
                }}
            >
                <span style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '1.8rem', fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#2a2520',
                }}>
                    Daton
                </span>
                <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                    {['Soluções', 'Impacto', 'Sobre', 'Contato'].map(item => (
                        <span key={item} style={{
                            fontSize: '0.85rem', fontWeight: 400, color: '#8a7d65',
                            cursor: 'pointer', letterSpacing: '0.05em',
                            transition: 'color 0.3s',
                        }}
                            onMouseEnter={e => (e.target as HTMLElement).style.color = '#2a2520'}
                            onMouseLeave={e => (e.target as HTMLElement).style.color = '#8a7d65'}
                        >
                            {item}
                        </span>
                    ))}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/auth')}
                        style={{
                            background: '#2a2520', color: '#faf7f2',
                            border: 'none', padding: '0.65rem 1.75rem',
                            borderRadius: '100px',
                            fontFamily: '"Outfit"', fontSize: '0.85rem',
                            fontWeight: 500, cursor: 'pointer',
                            letterSpacing: '0.03em',
                        }}
                    >
                        Acessar
                    </motion.button>
                </div>
            </motion.nav>

            {/* ─── Hero ─── */}
            <motion.section style={{ y: heroParallax }}>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '0 8vw',
                    position: 'relative',
                }}>
                    {/* Editorial issue number */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        style={{
                            position: 'absolute', top: '15%', right: '8vw',
                            fontFamily: '"Cormorant Garamond", serif',
                            fontSize: 'clamp(6rem, 15vw, 16rem)',
                            fontWeight: 300, color: 'rgba(42, 37, 32, 0.04)',
                            lineHeight: 1, userSelect: 'none',
                        }}
                    >
                        ESG
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            marginBottom: '2rem',
                        }}
                    >
                        <div style={{ width: 40, height: 1, background: '#15c470' }} />
                        <span style={{
                            fontSize: '0.7rem', letterSpacing: '0.3em',
                            textTransform: 'uppercase', color: '#15c470', fontWeight: 500,
                        }}>
                            Excelência em Sustentabilidade
                        </span>
                    </motion.div>

                    <div style={{ overflow: 'hidden' }}>
                        <motion.h1
                            initial={{ y: 150 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                fontFamily: '"Cormorant Garamond", serif',
                                fontSize: 'clamp(3rem, 8vw, 8rem)',
                                fontWeight: 300,
                                lineHeight: 1,
                                letterSpacing: '-0.03em',
                                marginBottom: '2rem',
                                maxWidth: '900px',
                            }}
                        >
                            A arte de{' '}
                            <em style={{ fontWeight: 600 }}>governar</em>{' '}
                            com{' '}
                            <span style={{ color: '#15c470', fontWeight: 600 }}>propósito</span>
                        </motion.h1>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: '4rem',
                            maxWidth: '800px',
                            alignItems: 'end',
                        }}
                    >
                        <p style={{
                            fontSize: 'clamp(1rem, 1.3vw, 1.15rem)',
                            color: '#8a7d65',
                            lineHeight: 1.8,
                        }}>
                            Plataforma de gestão ESG que combina rigor analítico com elegância operacional.
                            Para empresas que entendem que sustentabilidade é, antes de tudo, excelência.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/funcionalidades')}
                            style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: '#15c470', border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', flexShrink: 0,
                            }}
                        >
                            <ArrowUpRight size={22} color="#faf7f2" />
                        </motion.button>
                    </motion.div>
                </div>
            </motion.section>

            {/* ─── Pillar strip ─── */}
            <section style={{
                padding: '0 8vw',
                borderTop: '1px solid #e8e0d0',
                position: 'relative',
                zIndex: 10,
            }}>
                <LabeledDivider label="Os Três Pilares" />

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0',
                    maxWidth: '1200px',
                    margin: '0 auto',
                }}>
                    {pillars.map((pillar, i) => (
                        <Reveal key={i} delay={i * 0.15}>
                            <motion.div
                                whileHover={{ backgroundColor: 'rgba(21, 196, 112, 0.03)' }}
                                style={{
                                    padding: '3rem 2.5rem',
                                    borderLeft: i > 0 ? '1px solid #e8e0d0' : 'none',
                                    cursor: 'pointer',
                                    transition: 'background 0.4s',
                                }}
                            >
                                <div style={{
                                    fontFamily: '"Cormorant Garamond", serif',
                                    fontSize: '5rem', fontWeight: 300,
                                    color: 'rgba(21, 196, 112, 0.2)',
                                    lineHeight: 1, marginBottom: '0.5rem',
                                }}>
                                    {pillar.letter}
                                </div>
                                <h3 style={{
                                    fontFamily: '"Cormorant Garamond", serif',
                                    fontSize: '1.8rem', fontWeight: 600,
                                    marginBottom: '0.25rem',
                                }}>
                                    {pillar.title}
                                </h3>
                                <span style={{
                                    fontSize: '0.7rem', letterSpacing: '0.15em',
                                    textTransform: 'uppercase', color: '#8a7d65',
                                    display: 'block', marginBottom: '1.5rem',
                                }}>
                                    {pillar.subtitle}
                                </span>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {pillar.items.map((item, j) => (
                                        <li key={j} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            padding: '0.6rem 0',
                                            borderBottom: '1px solid rgba(232, 224, 208, 0.5)',
                                            fontSize: '0.9rem', color: '#5a5248',
                                        }}>
                                            <CheckCircle2 size={14} color="#15c470" strokeWidth={1.5} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ─── Features ─── */}
            <section style={{ padding: 'clamp(4rem, 8vh, 6rem) 8vw' }}>
                <LabeledDivider label="Capacidades" />

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '2rem',
                    maxWidth: '1200px',
                    margin: '0 auto',
                }}>
                    {features.map((feat, i) => (
                        <Reveal key={i} delay={i * 0.1}>
                            <motion.div
                                whileHover={{ y: -4 }}
                                style={{
                                    padding: '2rem',
                                    background: 'rgba(255, 255, 255, 0.6)',
                                    border: '1px solid #e8e0d0',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'box-shadow 0.3s',
                                }}
                            >
                                <feat.icon size={24} color="#15c470" strokeWidth={1.5} style={{ marginBottom: '1rem' }} />
                                <h4 style={{
                                    fontFamily: '"Cormorant Garamond", serif',
                                    fontSize: '1.3rem', fontWeight: 600,
                                    marginBottom: '0.5rem',
                                }}>
                                    {feat.label}
                                </h4>
                                <p style={{ fontSize: '0.85rem', color: '#8a7d65', lineHeight: 1.6 }}>
                                    {feat.desc}
                                </p>
                            </motion.div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ─── Testimonials ─── */}
            <section style={{
                padding: 'clamp(4rem, 8vh, 6rem) 8vw',
                background: '#2a2520',
                color: '#faf7f2',
            }}>
                <LabeledDivider label="Vozes da Excelência" />

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '3rem',
                    maxWidth: '1000px',
                    margin: '0 auto',
                }}>
                    {testimonials.map((test, i) => (
                        <Reveal key={i} delay={i * 0.15}>
                            <div>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem' }}>
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} size={14} fill="#15c470" color="#15c470" />
                                    ))}
                                </div>
                                <blockquote style={{
                                    fontFamily: '"Cormorant Garamond", serif',
                                    fontSize: '1.4rem', fontWeight: 400,
                                    fontStyle: 'italic', lineHeight: 1.6,
                                    marginBottom: '1.5rem',
                                    color: 'rgba(250, 247, 242, 0.85)',
                                }}>
                                    "{test.quote}"
                                </blockquote>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #15c470, #0d7a42)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: '"Cormorant Garamond"', fontWeight: 700, fontSize: '1rem',
                                    }}>
                                        {test.author.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{test.author}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(250, 247, 242, 0.5)' }}>
                                            {test.role}, {test.company}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section style={{
                padding: 'clamp(5rem, 12vh, 10rem) 8vw',
                textAlign: 'center',
            }}>
                <Reveal>
                    <span style={{
                        fontSize: '0.7rem', letterSpacing: '0.3em',
                        textTransform: 'uppercase', color: '#15c470',
                        display: 'block', marginBottom: '1.5rem',
                    }}>
                        Comece sua jornada
                    </span>
                    <h2 style={{
                        fontFamily: '"Cormorant Garamond", serif',
                        fontSize: 'clamp(2.5rem, 5vw, 5rem)',
                        fontWeight: 300,
                        lineHeight: 1.1,
                        maxWidth: '700px',
                        margin: '0 auto 2rem',
                    }}>
                        Sustentabilidade com{' '}
                        <em style={{ fontWeight: 600, color: '#15c470' }}>sofisticação</em>
                    </h2>
                    <p style={{
                        fontSize: '1rem', color: '#8a7d65',
                        maxWidth: '450px', margin: '0 auto 2.5rem', lineHeight: 1.7,
                    }}>
                        Agende uma conversa e descubra como a Daton eleva o padrão da gestão ESG.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/contato')}
                            style={{
                                background: '#2a2520', color: '#faf7f2',
                                border: 'none', padding: '1rem 2.5rem',
                                borderRadius: '100px',
                                fontFamily: '"Outfit"', fontSize: '0.95rem',
                                fontWeight: 500, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                            }}
                        >
                            Agendar conversa
                            <ArrowRight size={18} />
                        </motion.button>
                    </div>
                </Reveal>
            </section>

            {/* ─── Footer ─── */}
            <footer style={{
                padding: '2.5rem 8vw',
                borderTop: '1px solid #e8e0d0',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
            }}>
                <span style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '1.3rem', fontWeight: 600,
                }}>
                    Daton
                </span>
                <span style={{ fontSize: '0.8rem', color: '#8a7d65' }}>
                    &copy; 2026 Daton ESG Insight — Excelência em sustentabilidade.
                </span>
            </footer>
        </div>
    );
}
