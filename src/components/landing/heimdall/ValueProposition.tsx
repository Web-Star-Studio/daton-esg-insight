/**
 * ValueProposition - Interactive two-column value proposition section
 */
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Zap,
    ShieldCheck,
    BarChart3,
    Leaf,
    FileCheck,
    TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './heimdall.css';

gsap.registerPlugin(ScrollTrigger);

interface ValueItem {
    icon: React.ElementType;
    title: string;
    description: string;
    image: string;
}

const valueItems: ValueItem[] = [
    {
        icon: Zap,
        title: 'Desbloqueie capacidade oculta',
        description: 'Identifique oportunidades de otimização em seus processos ESG com análise de dados em tempo real.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    },
    {
        icon: ShieldCheck,
        title: 'Mitigue riscos de compliance',
        description: 'Sistema de alertas proativos e gestão automatizada de licenças para evitar não-conformidades.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    },
    {
        icon: BarChart3,
        title: 'Relatórios automatizados',
        description: 'Geração instantânea de relatórios GRI, SASB e TCFD com dados validados e auditáveis.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    },
    {
        icon: Leaf,
        title: 'Gestão de emissões GEE',
        description: 'Cálculo automático de emissões conforme GHG Protocol com fatores de emissão atualizados.',
        image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
    },
    {
        icon: FileCheck,
        title: 'Documentação centralizada',
        description: 'Todos os seus documentos ESG em um só lugar com controle de versão e rastreabilidade.',
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
    },
    {
        icon: TrendingUp,
        title: 'Insights com IA',
        description: 'Algoritmos de machine learning para previsões e recomendações acionáveis.',
        image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
    },
];

export function ValueProposition() {
    const sectionRef = useRef<HTMLElement>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate heading
            gsap.fromTo(headingRef.current,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: headingRef.current,
                        start: 'top 80%',
                    },
                }
            );

            // Animate list items
            gsap.fromTo('.value-item',
                { opacity: 0, x: -30 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.value-list',
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
                background: 'var(--heimdall-bg)',
            }}
        >
            <div className="heimdall-container">
                {/* Section Heading */}
                <h2
                    ref={headingRef}
                    className="heimdall-heading-lg"
                    style={{
                        color: 'var(--heimdall-text)',
                        maxWidth: '800px',
                        marginBottom: '4rem',
                        lineHeight: 1.2,
                    }}
                >
                    Uma gestão ESG otimizada não é mais um diferencial:{' '}
                    <span style={{ color: 'var(--heimdall-text-secondary)' }}>
                        É o pré-requisito para o progresso sustentável.
                    </span>
                </h2>

                {/* Two Column Layout */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '4rem',
                        alignItems: 'start',
                    }}
                    className="value-grid"
                >
                    {/* Left Column - Interactive List */}
                    <div className="value-list">
                        {valueItems.map((item, index) => (
                            <ValueListItem
                                key={index}
                                item={item}
                                isActive={activeIndex === index}
                                onClick={() => setActiveIndex(index)}
                            />
                        ))}

                        {/* CTA */}
                        <button
                            onClick={() => navigate('/funcionalidades')}
                            className="heimdall-btn heimdall-btn-secondary"
                            style={{ marginTop: '2rem' }}
                        >
                            Começar agora
                        </button>
                    </div>

                    {/* Right Column - Sticky Visual */}
                    <div
                        style={{
                            position: 'sticky',
                            top: '120px',
                            height: 'fit-content',
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                                aspectRatio: '4/3',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                background: 'var(--heimdall-bg-tertiary)',
                            }}
                        >
                            {valueItems.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: activeIndex === index ? 1 : 0,
                                        transition: 'opacity 0.5s ease-in-out',
                                    }}
                                >
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'linear-gradient(45deg, rgba(10,10,10,0.8) 0%, transparent 60%)',
                                        }}
                                    />
                                </div>
                            ))}

                            {/* Active item title overlay */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '2rem',
                                    left: '2rem',
                                    right: '2rem',
                                }}
                            >
                                <span
                                    className="heimdall-label"
                                    style={{
                                        color: 'var(--heimdall-accent)',
                                        marginBottom: '0.5rem',
                                        display: 'block',
                                    }}
                                >
                                    {String(activeIndex + 1).padStart(2, '0')}
                                </span>
                                <h3
                                    className="heimdall-heading-md"
                                    style={{ color: '#ffffff' }}
                                >
                                    {valueItems[activeIndex].title}
                                </h3>
                            </div>
                        </div>

                        {/* Navigation Dots */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginTop: '1rem',
                                justifyContent: 'center',
                            }}
                        >
                            {valueItems.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveIndex(index)}
                                    style={{
                                        width: activeIndex === index ? '24px' : '8px',
                                        height: '8px',
                                        borderRadius: '4px',
                                        background: activeIndex === index
                                            ? 'var(--heimdall-accent)'
                                            : 'var(--heimdall-border)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                    }}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 1024px) {
          .value-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </section>
    );
}

function ValueListItem({
    item,
    isActive,
    onClick,
}: {
    item: ValueItem;
    isActive: boolean;
    onClick: () => void;
}) {
    const Icon = item.icon;

    return (
        <button
            className="value-item"
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1.5rem',
                width: '100%',
                textAlign: 'left',
                background: isActive ? 'var(--heimdall-bg-secondary)' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${isActive ? 'var(--heimdall-accent)' : 'var(--heimdall-border)'}`,
                cursor: 'pointer',
                transition: 'all 0.3s',
            }}
        >
            <div
                style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? 'var(--heimdall-accent)' : 'var(--heimdall-bg-tertiary)',
                    borderRadius: '8px',
                    flexShrink: 0,
                    transition: 'background 0.3s',
                }}
            >
                <Icon
                    size={20}
                    style={{
                        color: 'var(--heimdall-text)',
                    }}
                />
            </div>
            <div>
                <h4
                    style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--heimdall-text)',
                        marginBottom: '0.25rem',
                    }}
                >
                    {item.title}
                </h4>
                <p
                    style={{
                        fontSize: '0.875rem',
                        color: 'var(--heimdall-text-secondary)',
                        lineHeight: 1.5,
                        opacity: isActive ? 1 : 0.7,
                        maxHeight: isActive ? '100px' : '0',
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                    }}
                >
                    {item.description}
                </p>
            </div>
        </button>
    );
}

export default ValueProposition;
