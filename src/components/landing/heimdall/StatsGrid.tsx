/**
 * StatsGrid - Data and statistics section with animated counters
 * Refactored to use framer-motion instead of gsap
 */
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import './heimdall.css';

interface StatItem {
    value: string;
    suffix?: string;
    prefix?: string;
    label: string;
    description: string;
}

const statsData: StatItem[] = [
    { value: '70', suffix: '%', label: 'Redução de tempo', description: 'Em processos manuais de coleta de dados' },
    { value: '40', suffix: '+', label: 'Indicadores ESG', description: 'Monitorados automaticamente' },
    { value: '99', suffix: '.9%', label: 'Precisão', description: 'Nos cálculos de emissões GEE' },
    { value: '15', label: 'Minutos', description: 'Para configuração inicial' },
    { value: '24', suffix: '/7', label: 'Monitoramento', description: 'Alertas em tempo real' },
    { value: '3', suffix: 'x', label: 'Mais rápido', description: 'Geração de relatórios' },
];

export function StatsGrid() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
    };

    return (
        <section
            ref={sectionRef}
            style={{
                padding: 'var(--heimdall-section-padding) 0',
                background: 'var(--heimdall-bg-secondary)',
            }}
        >
            <div className="heimdall-container">
                <div style={{ marginBottom: '3rem' }}>
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                        className="heimdall-label"
                        style={{ color: 'var(--heimdall-accent)', marginBottom: '1rem', display: 'block' }}
                    >
                        Resultados comprovados
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="heimdall-heading-lg"
                        style={{ color: 'var(--heimdall-text)', maxWidth: '600px' }}
                    >
                        Dados que demonstram nosso impacto
                    </motion.h2>
                </div>

                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                    className="heimdall-divider"
                    style={{ marginBottom: '3rem', transformOrigin: 'left' }}
                />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1px',
                        background: 'var(--heimdall-border)',
                    }}
                    className="stats-grid-container"
                >
                    {statsData.map((stat, index) => (
                        <motion.div key={index} variants={itemVariants}>
                            <StatCard stat={stat} isInView={isInView} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    .stats-grid-container { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 640px) {
                    .stats-grid-container { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </section>
    );
}

function StatCard({ stat, isInView }: { stat: StatItem; isInView: boolean }) {
    const [count, setCount] = useState(0);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (isInView && !hasAnimated.current) {
            hasAnimated.current = true;
            const target = parseInt(stat.value);
            const duration = 1500;
            const startTime = performance.now();

            const update = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                setCount(Math.floor(target * easeOutQuart));
                if (progress < 1) requestAnimationFrame(update);
            };

            requestAnimationFrame(update);
        }
    }, [isInView, stat.value]);

    return (
        <div
            style={{
                background: 'var(--heimdall-bg-secondary)',
                padding: '2.5rem 2rem',
                position: 'relative',
                transition: 'background 0.3s',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '1.5rem',
                    right: '1.5rem',
                    display: 'flex',
                    gap: '4px',
                }}
            >
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: i < 3 ? 'var(--heimdall-accent)' : 'var(--heimdall-border)',
                            animation: `heimdall-pulse ${1 + i * 0.2}s ease-in-out infinite`,
                            animationDelay: `${i * 0.1}s`,
                        }}
                    />
                ))}
            </div>

            <div
                style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 800,
                    color: 'var(--heimdall-text)',
                    lineHeight: 1,
                    marginBottom: '0.5rem',
                }}
            >
                {stat.prefix}{count}{stat.suffix}
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--heimdall-text)', marginBottom: '0.25rem' }}>
                {stat.label}
            </h3>

            <p className="heimdall-body-sm">{stat.description}</p>
        </div>
    );
}

export default StatsGrid;
