/**
 * DroneSection - Scroll-triggered drone/tech reveal section
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './heimdall.css';

gsap.registerPlugin(ScrollTrigger);

export function DroneSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);
    const textBlocksRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Parallax effect on the drone image
            gsap.to(imageRef.current, {
                yPercent: -20,
                ease: 'none',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1,
                },
            });

            // Animate text blocks
            textBlocksRef.current.forEach((block) => {
                if (!block) return;

                gsap.fromTo(block,
                    {
                        opacity: 0,
                        y: 50,
                        clipPath: 'inset(0 100% 0 0)',
                    },
                    {
                        opacity: 1,
                        y: 0,
                        clipPath: 'inset(0 0% 0 0)',
                        duration: 1,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: block,
                            start: 'top 80%',
                        },
                    }
                );
            });

            // Animate scan line effect on title
            gsap.to('.scan-line', {
                left: '100%',
                duration: 2,
                ease: 'power2.inOut',
                repeat: -1,
                repeatDelay: 3,
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const textBlocks = [
        {
            title: 'Automação',
            description: 'Coleta de dados automatizada e processamento em tempo real para decisões mais rápidas e precisas.',
        },
        {
            title: 'Precisão',
            description: 'Algoritmos calibrados com padrões internacionais GHG Protocol, GRI e SASB.',
        },
        {
            title: 'Escalabilidade',
            description: 'Infraestrutura cloud-native que cresce com sua operação, de startups a multinacionais.',
        },
    ];

    return (
        <section
            ref={sectionRef}
            style={{
                position: 'relative',
                minHeight: '100vh',
                background: 'var(--heimdall-bg)',
                overflow: 'hidden',
            }}
        >
            {/* Background Image with Parallax */}
            <div
                ref={imageRef}
                style={{
                    position: 'absolute',
                    inset: '-20%',
                    zIndex: 1,
                }}
            >
                <img
                    src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80"
                    alt="Technology background"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.3,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, var(--heimdall-bg) 0%, transparent 30%, transparent 70%, var(--heimdall-bg) 100%)',
                    }}
                />
            </div>

            {/* Content */}
            <div
                className="heimdall-container"
                style={{
                    position: 'relative',
                    zIndex: 10,
                    padding: 'var(--heimdall-section-padding) 2rem',
                }}
            >
                {/* Section Title with Scan Effect */}
                <div
                    style={{
                        position: 'relative',
                        marginBottom: '4rem',
                        overflow: 'hidden',
                    }}
                >
                    <h2
                        className="heimdall-heading-xl"
                        style={{
                            color: 'var(--heimdall-text)',
                            position: 'relative',
                        }}
                    >
                        Tecnologia
                        <br />
                        de Ponta
                    </h2>
                    {/* Scan line effect */}
                    <div
                        className="scan-line"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(21, 196, 112, 0.3), transparent)',
                            pointerEvents: 'none',
                        }}
                    />
                </div>

                {/* Text Blocks Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '2rem',
                        maxWidth: '1000px',
                    }}
                    className="drone-grid"
                >
                    {textBlocks.map((block, index) => (
                        <div
                            key={index}
                            ref={(el) => (textBlocksRef.current[index] = el)}
                            style={{
                                background: 'rgba(0, 0, 0, 0.05)',
                                backdropFilter: 'blur(10px)',
                                padding: '2rem',
                                borderRadius: '8px',
                                border: '1px solid var(--heimdall-border)',
                            }}
                        >
                            <span
                                className="heimdall-label"
                                style={{
                                    color: 'var(--heimdall-accent)',
                                    marginBottom: '1rem',
                                    display: 'block',
                                }}
                            >
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <h3
                                className="heimdall-heading-md"
                                style={{
                                    color: 'var(--heimdall-text)',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                {block.title}
                            </h3>
                            <p className="heimdall-body-sm">
                                {block.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Tech Specs */}
                <div
                    style={{
                        marginTop: '4rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '1rem',
                        padding: '2rem',
                        background: 'var(--heimdall-bg-secondary)',
                        borderRadius: '8px',
                    }}
                    className="tech-specs"
                >
                    <TechSpec value="99.9%" label="Uptime garantido" />
                    <TechSpec value="<100ms" label="Latência média" />
                    <TechSpec value="SOC2" label="Certificação" />
                    <TechSpec value="256-bit" label="Criptografia" />
                </div>
            </div>

            <style>{`
        @media (max-width: 1024px) {
          .drone-grid {
            grid-template-columns: 1fr !important;
          }
          .tech-specs {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .tech-specs {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </section>
    );
}

function TechSpec({ value, label }: { value: string; label: string }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div
                style={{
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                    fontWeight: 700,
                    color: 'var(--heimdall-text)',
                    marginBottom: '0.25rem',
                }}
            >
                {value}
            </div>
            <div className="heimdall-label">
                {label}
            </div>
        </div>
    );
}

export default DroneSection;
