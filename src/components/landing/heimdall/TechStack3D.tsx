/**
 * TechStack3D - Refactored to use CSS animations instead of WebGL/Three.js
 * Replaced 3D spheres with animated CSS orbs
 */
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import './heimdall.css';

export function TechStack3D() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
    const navigate = useNavigate();

    const sphereData = [
        {
            title: 'Virtual Intelligence',
            subtitle: 'AI Engine',
            description: 'Análise preditiva e recomendações inteligentes com machine learning avançado.',
            color: '#15c470',
            type: 'wireframe'
        },
        {
            title: 'Data Core',
            subtitle: 'Processing Hub',
            description: 'Processamento em tempo real de milhares de pontos de dados ESG.',
            color: '#C0C0C0',
            type: 'metallic'
        },
        {
            title: 'Cloud Platform',
            subtitle: 'Daton Platform',
            description: 'Infraestrutura escalável e segura para gestão ESG empresarial.',
            color: '#15c470',
            type: 'particle'
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
    };

    return (
        <section
            ref={sectionRef}
            style={{
                position: 'relative',
                minHeight: '100vh',
                padding: 'var(--heimdall-section-padding) 0',
                background: 'var(--heimdall-bg)',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1,
                    pointerEvents: 'none',
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                <h2
                    className="heimdall-heading-xl"
                    style={{ color: 'rgba(0, 0, 0, 0.03)', whiteSpace: 'nowrap' }}
                >
                    OUR TECH STACK
                </h2>
            </div>

            <div className="heimdall-container" style={{ position: 'relative', zIndex: 5, textAlign: 'center', marginBottom: '4rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(21, 196, 112, 0.1)',
                        borderRadius: '100px'
                    }}
                >
                    <div style={{ width: 6, height: 6, background: 'var(--heimdall-accent)', borderRadius: '50%' }} />
                    <span className="heimdall-label-accent" style={{
                        fontFamily: 'Space Mono, monospace',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                        marginBottom: 0
                    }}>
                        TECNOLOGIA // CORE
                    </span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="heimdall-heading-lg"
                    style={{
                        marginBottom: '1.5rem',
                        fontFamily: 'Sora, sans-serif',
                        fontWeight: 800,
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        letterSpacing: '-0.03em',
                        textTransform: 'uppercase'
                    }}
                >
                    Nossa <span style={{ color: 'var(--heimdall-text-secondary)', fontWeight: 400, fontStyle: 'italic' }}>Tecnologia</span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="heimdall-body"
                    style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.125rem', lineHeight: 1.6 }}
                >
                    Três pilares de inteligência trabalhando em harmonia para transformar dados brutos em{' '}
                    <span style={{ borderBottom: '2px solid var(--heimdall-accent)', color: 'var(--heimdall-text)', fontWeight: 600 }}>
                        insights acionáveis.
                    </span>
                </motion.p>
            </div>

            {/* Animated CSS Orbs */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    height: 'clamp(300px, 40vh, 500px)',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '4rem',
                    flexWrap: 'wrap',
                    padding: '0 2rem',
                }}
            >
                {sphereData.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.3 + index * 0.15, ease: 'easeOut' }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <CSSOrb type={item.type} color={item.color} />
                    </motion.div>
                ))}
            </div>

            {/* Labels Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                className="heimdall-container"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '2rem',
                    marginTop: '3rem',
                }}
            >
                {sphereData.map((item, index) => (
                    <motion.div
                        key={index}
                        variants={itemVariants}
                        style={{ textAlign: 'center', padding: '1.5rem' }}
                    >
                        <div
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: item.color,
                                margin: '0 auto 1rem',
                                boxShadow: `0 0 20px ${item.color}40`,
                            }}
                        />
                        <h3 className="heimdall-heading-sm" style={{ marginBottom: '0.25rem' }}>
                            {item.title}
                        </h3>
                        <span className="heimdall-label-accent" style={{ display: 'block', marginBottom: '0.75rem' }}>
                            {item.subtitle}
                        </span>
                        <p className="heimdall-body-sm">{item.description}</p>
                    </motion.div>
                ))}
            </motion.div>

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <button
                    onClick={() => navigate('/funcionalidades')}
                    className="heimdall-btn heimdall-btn-secondary"
                    style={{ borderRadius: '16px' }}
                >
                    Explore nossa tecnologia
                </button>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .heimdall-container > div[style*="grid-template-columns"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </section>
    );
}

function CSSOrb({ type, color }: { type: string; color: string }) {
    const baseStyle: React.CSSProperties = {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    if (type === 'wireframe') {
        return (
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{
                    ...baseStyle,
                    border: `2px solid ${color}`,
                    boxShadow: `0 0 30px ${color}40, inset 0 0 30px ${color}20`,
                }}
            >
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        border: `1px solid ${color}80`,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: color,
                        opacity: 0.6,
                        boxShadow: `0 0 20px ${color}`,
                    }}
                />
            </motion.div>
        );
    }

    if (type === 'metallic') {
        return (
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                style={{
                    ...baseStyle,
                    background: `radial-gradient(circle at 30% 30%, #ffffff 0%, ${color} 30%, #333 100%)`,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                }}
            />
        );
    }

    // Particle type
    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            style={{ ...baseStyle, position: 'relative' }}
        >
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                    }}
                    style={{
                        position: 'absolute',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: color,
                        top: `${50 + (Math.random() - 0.5) * 80}%`,
                        left: `${50 + (Math.random() - 0.5) * 80}%`,
                        boxShadow: `0 0 6px ${color}`,
                    }}
                />
            ))}
        </motion.div>
    );
}

export default TechStack3D;
