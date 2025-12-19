/**
 * TechStack3D - Three WebGL Interactive Spheres
 * 
 * Esfera 1 (Virtual/Data): Icosahedron wireframe verde neon
 * Esfera 2 (Physical/Hardware): Sphere metálica cromada
 * Esfera 3 (Platform/Cloud): Nuvem de partículas
 * 
 * Interatividade: Drag-to-rotate, cursor grab/grabbing
 */
import { useEffect, useRef, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import './heimdall.css';

gsap.registerPlugin(ScrollTrigger);

export function TechStack3D() {
    const sectionRef = useRef<HTMLElement>(null);
    const labelsRef = useRef<(HTMLDivElement | null)[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate labels on scroll
            labelsRef.current.forEach((label, index) => {
                if (label) {
                    gsap.fromTo(label,
                        { opacity: 0, y: 40 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.8,
                            ease: 'power3.out',
                            scrollTrigger: {
                                trigger: sectionRef.current,
                                start: 'top 60%',
                            },
                            delay: index * 0.15,
                        }
                    );
                }
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const sphereData = [
        {
            title: 'Virtual Intelligence',
            subtitle: 'AI Engine',
            description: 'Análise preditiva e recomendações inteligentes com machine learning avançado.',
            color: '#15c470',
        },
        {
            title: 'Data Core',
            subtitle: 'Processing Hub',
            description: 'Processamento em tempo real de milhares de pontos de dados ESG.',
            color: '#C0C0C0',
        },
        {
            title: 'Cloud Platform',
            subtitle: 'Daton Platform',
            description: 'Infraestrutura escalável e segura para gestão ESG empresarial.',
            color: '#15c470',
        },
    ];

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
            {/* Background Title */}
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
                    style={{
                        color: 'rgba(0, 0, 0, 0.03)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    OUR TECH STACK
                </h2>
            </div>

            {/* Section Title - Precision Typography */}
            <div className="heimdall-container" style={{ position: 'relative', zIndex: 5, textAlign: 'center', marginBottom: '4rem' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(21, 196, 112, 0.1)',
                    borderRadius: '100px'
                }}>
                    <div style={{ width: 6, height: 6, background: 'var(--heimdall-accent)', borderRadius: '50%' }} />
                    <span className="heimdall-label-accent" style={{
                        fontFamily: 'Space Mono, monospace',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                        marginBottom: 0
                    }}>
                        TECNOLOGIA // CORE
                    </span>
                </div>

                <h2 className="heimdall-heading-lg" style={{
                    marginBottom: '1.5rem',
                    fontFamily: 'Sora, sans-serif',
                    fontWeight: 800,
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    letterSpacing: '-0.03em',
                    textTransform: 'uppercase'
                }}>
                    Nossa <span style={{ color: 'var(--heimdall-text-secondary)', fontWeight: 400, fontStyle: 'italic', fontFamily: 'Sora, sans-serif' }}>Tecnologia</span>
                </h2>

                <p className="heimdall-body" style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    fontSize: '1.125rem',
                    lineHeight: 1.6
                }}>
                    Três pilares de inteligência trabalhando em harmonia para transformar dados brutos em <span style={{ borderBottom: '2px solid var(--heimdall-accent)', color: 'var(--heimdall-text)', fontWeight: 600 }}>insights acionáveis.</span>
                </p>
            </div>

            {/* 3D Canvas */}
            <div
                className="canvas-container"
                style={{
                    position: 'relative',
                    zIndex: 10,
                    height: 'clamp(400px, 50vh, 600px)',
                    width: '100%',
                }}
            >
                <Canvas
                    camera={{ position: [0, 0, 8], fov: 50 }}
                    gl={{ antialias: true, alpha: true }}
                    style={{ background: 'transparent' }}
                >
                    <Suspense fallback={null}>
                        <Scene />
                    </Suspense>
                </Canvas>
            </div>

            {/* Labels Grid */}
            <div
                className="heimdall-container"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '2rem',
                    marginTop: '3rem',
                }}
            >
                {sphereData.map((item, index) => (
                    <div
                        key={index}
                        ref={(el) => (labelsRef.current[index] = el)}
                        style={{
                            textAlign: 'center',
                            padding: '1.5rem',
                            opacity: 0,
                        }}
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
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <button
                    onClick={() => navigate('/funcionalidades')}
                    className="heimdall-btn heimdall-btn-secondary"
                    style={{ borderRadius: '16px' }}
                >
                    Explore nossa tecnologia
                </button>
            </div>

            {/* Responsive styles */}
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

// 3D Scene Component
function Scene() {
    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.2} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <pointLight position={[-5, -5, -5]} intensity={0.5} color="#15c470" />

            {/* Environment for reflections */}
            <Environment preset="studio" />

            {/* Orbit Controls - Drag to rotate */}
            <OrbitControls
                enableZoom={false}
                enablePan={false}
                rotateSpeed={0.5}
                autoRotate
                autoRotateSpeed={0.5}
            />

            {/* Three Spheres */}
            <group>
                {/* Sphere 1: Wireframe Icosahedron - Virtual/Data (Left) */}
                <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                    <WireframeSphere position={[-3.5, 0, 0]} />
                </Float>

                {/* Sphere 2: Metallic Chrome - Physical/Hardware (Center) */}
                <Float speed={1} rotationIntensity={0.3} floatIntensity={0.3}>
                    <MetallicSphere position={[0, 0, 0]} />
                </Float>

                {/* Sphere 3: Particle Cloud - Platform/Cloud (Right) */}
                <Float speed={2} rotationIntensity={0.4} floatIntensity={0.4}>
                    <ParticleSphere position={[3.5, 0, 0]} />
                </Float>
            </group>
        </>
    );
}

// Sphere 1: Wireframe Icosahedron (Green Neon)
function WireframeSphere({ position }: { position: [number, number, number] }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const innerRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.008;
            meshRef.current.rotation.x += 0.002;
        }
        if (innerRef.current) {
            innerRef.current.rotation.y -= 0.005;
        }
    });

    return (
        <group position={position}>
            {/* Outer wireframe */}
            <mesh ref={meshRef}>
                <icosahedronGeometry args={[1.2, 1]} />
                <meshBasicMaterial
                    color="#00FF00"
                    wireframe
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Inner glow sphere */}
            <mesh ref={innerRef}>
                <icosahedronGeometry args={[0.6, 1]} />
                <meshBasicMaterial
                    color="#15c470"
                    wireframe
                    transparent
                    opacity={0.4}
                />
            </mesh>

            {/* Core glow */}
            <mesh>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial color="#15c470" transparent opacity={0.6} />
            </mesh>
        </group>
    );
}

// Sphere 2: Metallic Chrome Sphere
function MetallicSphere({ position }: { position: [number, number, number] }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.003;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[1.3, 64, 64]} />
            <meshStandardMaterial
                color="#C0C0C0"
                metalness={0.95}
                roughness={0.05}
                envMapIntensity={1.5}
            />
        </mesh>
    );
}

// Sphere 3: Particle Cloud
function ParticleSphere({ position }: { position: [number, number, number] }) {
    const pointsRef = useRef<THREE.Points>(null);
    const [positions] = useState(() => {
        const count = 1500;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const radius = 1.2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            // Add some randomness to create cloud effect
            const r = radius * (0.8 + Math.random() * 0.4);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }

        return positions;
    });

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y += 0.004;
            pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
        }
    });

    return (
        <points ref={pointsRef} position={position}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#15c470"
                size={0.025}
                transparent
                opacity={0.8}
                sizeAttenuation
            />
        </points>
    );
}

export default TechStack3D;
