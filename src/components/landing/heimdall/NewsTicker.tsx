/**
 * NewsTicker - News List with Hover Dimming Effect
 * 
 * Interaction "Dimming":
 * - Default: All items opacity 1
 * - Hover on item: Focused item stays opacity 1 + scale 1.02
 * - All siblings drop to opacity 0.3
 * 
 * Typography: Date in mono left, Title large right
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import './heimdall.css';

gsap.registerPlugin(ScrollTrigger);

interface NewsItem {
    date: string;
    title: string;
    category: string;
    link?: string;
}

export function NewsTicker() {
    const sectionRef = useRef<HTMLElement>(null);
    const headingRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate section heading
            gsap.fromTo(headingRef.current,
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 70%',
                    },
                }
            );

            // Animate news items with stagger
            gsap.fromTo('.news-item',
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: listRef.current,
                        start: 'top 75%',
                    },
                }
            );

            // Animate divider line
            gsap.fromTo('.news-divider',
                { scaleX: 0 },
                {
                    scaleX: 1,
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 70%',
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const newsItems: NewsItem[] = [
        {
            date: 'Dec 2024',
            title: 'Plataforma Daton lança módulo de IA para análise preditiva de emissões',
            category: 'Product',
        },
        {
            date: 'Nov 2024',
            title: 'Parceria estratégica com principais certificadoras ESG do Brasil',
            category: 'Partnership',
        },
        {
            date: 'Oct 2024',
            title: 'Novo dashboard de monitoramento em tempo real para gestão de resíduos',
            category: 'Feature',
        },
        {
            date: 'Sep 2024',
            title: 'Integração nativa com sistemas ERP e plataformas de compliance',
            category: 'Integration',
        },
    ];

    return (
        <section
            ref={sectionRef}
            style={{
                padding: 'var(--heimdall-section-padding) 0',
                background: 'var(--heimdall-bg)',
            }}
        >
            <div className="heimdall-container">
                {/* Section Header */}
                <div
                    ref={headingRef}
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        marginBottom: '3rem',
                        opacity: 0,
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
                </div>

                {/* Divider Line */}
                <div
                    className="news-divider"
                    style={{
                        height: '1px',
                        background: 'var(--heimdall-border-strong)',
                        marginBottom: '0',
                        transformOrigin: 'left',
                    }}
                />

                {/* News List with Dimming Effect */}
                <div
                    ref={listRef}
                    className="ticker-list"
                >
                    {newsItems.map((item, index) => (
                        <NewsItemComponent
                            key={index}
                            item={item}
                            onClick={() => navigate('/faq')}
                        />
                    ))}
                </div>

                {/* Bottom Divider */}
                <div
                    style={{
                        height: '1px',
                        background: 'var(--heimdall-border-strong)',
                    }}
                />
            </div>
        </section>
    );
}

// News Item Component
function NewsItemComponent({
    item,
    onClick,
}: {
    item: NewsItem;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
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
                opacity: 0,
            }}
        >
            {/* Date */}
            <span
                className="heimdall-label"
                style={{
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                }}
            >
                {item.date}
            </span>

            {/* Category Tag */}
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

            {/* Title */}
            <span
                className="heimdall-heading-sm"
                style={{
                    fontWeight: 500,
                    fontSize: '1.125rem',
                }}
            >
                {item.title}
            </span>

            {/* Arrow */}
            <ArrowUpRight
                size={20}
                style={{
                    color: 'var(--heimdall-text-secondary)',
                    transition: 'transform 0.2s ease, color 0.2s ease',
                }}
                className="news-arrow"
            />

            <style>{`
        .news-item:hover .news-arrow {
          transform: translate(4px, -4px);
          color: var(--heimdall-text);
        }
        
        @media (max-width: 1024px) {
          .news-item {
            grid-template-columns: 80px 1fr auto !important;
          }
          .news-item > span:nth-child(2) {
            display: none;
          }
        }
        
        @media (max-width: 640px) {
          .news-item {
            grid-template-columns: 1fr auto !important;
            gap: 1rem !important;
          }
          .news-item > span:first-child {
            display: none;
          }
        }
      `}</style>
        </button>
    );
}

export default NewsTicker;
