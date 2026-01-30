/**
 * NewsTicker - News List with Hover Dimming Effect
 * Refactored to use framer-motion instead of gsap
 */
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import './heimdall.css';

interface NewsItem {
    date: string;
    title: string;
    category: string;
}

export function NewsTicker() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
    const navigate = useNavigate();

    const newsItems: NewsItem[] = [
        { date: 'Dec 2024', title: 'Plataforma Daton lança módulo de IA para análise preditiva de emissões', category: 'Product' },
        { date: 'Nov 2024', title: 'Parceria estratégica com principais certificadoras ESG do Brasil', category: 'Partnership' },
        { date: 'Oct 2024', title: 'Novo dashboard de monitoramento em tempo real para gestão de resíduos', category: 'Feature' },
        { date: 'Sep 2024', title: 'Integração nativa com sistemas ERP e plataformas de compliance', category: 'Integration' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <section
            ref={sectionRef}
            style={{
                padding: 'var(--heimdall-section-padding) 0',
                background: 'var(--heimdall-bg)',
            }}
        >
            <div className="heimdall-container">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        marginBottom: '3rem',
                    }}
                >
                    <div>
                        <span className="heimdall-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            UPDATES
                        </span>
                        <h2 className="heimdall-heading-lg">Novidades</h2>
                    </div>
                    <button
                        onClick={() => navigate('/faq')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--heimdall-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            transition: 'color 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--heimdall-text)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--heimdall-text-secondary)'}
                    >
                        <span className="heimdall-label">View All</span>
                        <ArrowUpRight size={16} />
                    </button>
                </motion.div>

                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                        height: '1px',
                        background: 'var(--heimdall-border-strong)',
                        marginBottom: '0',
                        transformOrigin: 'left',
                    }}
                />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    className="ticker-list"
                >
                    {newsItems.map((item, index) => (
                        <motion.div key={index} variants={itemVariants}>
                            <NewsItemComponent item={item} onClick={() => navigate('/faq')} />
                        </motion.div>
                    ))}
                </motion.div>

                <div style={{ height: '1px', background: 'var(--heimdall-border-strong)' }} />
            </div>
        </section>
    );
}

function NewsItemComponent({ item, onClick }: { item: NewsItem; onClick: () => void }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            className="news-item ticker-item"
            style={{
                display: 'grid',
                gridTemplateColumns: '120px 100px 1fr auto',
                alignItems: 'center',
                gap: '2rem',
                width: '100%',
                padding: '1.5rem 0',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--heimdall-border)',
                cursor: 'pointer',
                textAlign: 'left',
            }}
        >
            <span className="heimdall-label" style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                {item.date}
            </span>

            <span
                style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(21, 196, 112, 0.15)',
                    color: '#15c470',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderRadius: '4px',
                }}
            >
                {item.category}
            </span>

            <span className="heimdall-heading-sm" style={{ fontWeight: 500, fontSize: '1.125rem' }}>
                {item.title}
            </span>

            <ArrowUpRight
                size={20}
                style={{ color: 'var(--heimdall-text-secondary)', transition: 'transform 0.2s ease, color 0.2s ease' }}
                className="news-arrow"
            />

            <style>{`
                .news-item:hover .news-arrow { transform: translate(4px, -4px); color: var(--heimdall-text); }
                @media (max-width: 1024px) {
                    .news-item { grid-template-columns: 80px 1fr auto !important; }
                    .news-item > span:nth-child(2) { display: none; }
                }
                @media (max-width: 640px) {
                    .news-item { grid-template-columns: 1fr auto !important; gap: 1rem !important; }
                    .news-item > span:first-child { display: none; }
                }
            `}</style>
        </motion.button>
    );
}

export default NewsTicker;
