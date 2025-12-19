/**
 * StatsGrid - Data and statistics section with animated counters
 */
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './heimdall.css';

gsap.registerPlugin(ScrollTrigger);

interface StatItem {
    value: string;
    suffix?: string;
    prefix?: string;
    label: string;
    description: string;
}

const statsData: StatItem[] = [
    {
        value: '70',
        suffix: '%',
        label: 'Redução de tempo',
        description: 'Em processos manuais de coleta de dados',
    },
    {
        value: '40',
        suffix: '+',
        label: 'Indicadores ESG',
        description: 'Monitorados automaticamente',
    },
    {
        value: '99',
        suffix: '.9%',
        label: 'Precisão',
        description: 'Nos cálculos de emissões GEE',
    },
    {
        value: '15',
        label: 'Minutos',
        description: 'Para configuração inicial',
    },
    {
        value: '24',
        suffix: '/7',
        label: 'Monitoramento',
        description: 'Alertas em tempo real',
    },
    {
        value: '3',
        suffix: 'x',
        label: 'Mais rápido',
        description: 'Geração de relatórios',
    },
];

export function StatsGrid() {
    const sectionRef = useRef<HTMLElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate grid lines
            gsap.fromTo('.stats-divider',
                { scaleX: 0 },
                {
                    scaleX: 1,
                    duration: 1,
                    stagger: 0.1,
                    ease: 'power3.inOut',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 70%',
                    },
                }
            );

            // Animate stat items
            gsap.fromTo('.stat-item',
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: statsRef.current,
                        start: 'top 70%',
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            style={{
                padding: 'var(--heimdall-section-padding) 0',
                background: 'var(--heimdall-bg-secondary)',
            }}
        >
            <div className="heimdall-container">
                {/* Section Header */}
                <div style={{ marginBottom: '3rem' }}>
                    <span className="heimdall-label" style={{ color: 'var(--heimdall-accent)', marginBottom: '1rem', display: 'block' }}>
                        Resultados comprovados
                    </span>
                    <h2 className="heimdall-heading-lg" style={{ color: 'var(--heimdall-text)', maxWidth: '600px' }}>
                        Dados que demonstram nosso impacto
                    </h2>
                </div>

                {/* Divider */}
                <div className="stats-divider heimdall-divider" style={{ marginBottom: '3rem' }} />

                {/* Stats Grid */}
                <div
                    ref={statsRef}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1px',
                        background: 'var(--heimdall-border)',
                    }}
                    className="stats-grid-container"
                >
                    {statsData.map((stat, index) => (
                        <StatCard key={index} stat={stat} index={index} />
                    ))}
                </div>
            </div>

            <style>{`
        @media (max-width: 1024px) {
          .stats-grid-container {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .stats-grid-container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </section>
    );
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
    const [count, setCount] = useState(0);
    const cardRef = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated.current) {
                        hasAnimated.current = true;
                        animateValue(0, parseInt(stat.value), 1500);
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [stat.value]);

    const animateValue = (start: number, end: number, duration: number) => {
        const startTime = performance.now();

        const update = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            const current = Math.floor(start + (end - start) * easeOutQuart);
            setCount(current);

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    };

    return (
        <div
            ref={cardRef}
            className="stat-item"
            style={{
                background: 'var(--heimdall-bg-secondary)',
                padding: '2.5rem 2rem',
                position: 'relative',
                transition: 'background 0.3s',
            }}
        >
            {/* Animated Dot Graph */}
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

            {/* Value */}
            <div
                style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 800,
                    color: 'var(--heimdall-text)',
                    lineHeight: 1,
                    marginBottom: '0.5rem',
                }}
            >
                {stat.prefix}
                {count}
                {stat.suffix}
            </div>

            {/* Label */}
            <h3
                style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'var(--heimdall-text)',
                    marginBottom: '0.25rem',
                }}
            >
                {stat.label}
            </h3>

            {/* Description */}
            <p className="heimdall-body-sm">
                {stat.description}
            </p>
        </div>
    );
}

export default StatsGrid;
