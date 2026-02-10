import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import './heimdall.css';

export function HeroSection() {
    const navigate = useNavigate();

    return (
        <section
            style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'grid',
                placeItems: 'center',
                background: 'var(--lumine-bg)',
                overflow: 'hidden',
                padding: '120px 2rem 80px',
            }}
        >
            {/* Top Right Paragraph */}
            <div style={{
                position: 'absolute',
                top: '160px',
                right: 'max(4vw, 2rem)',
                maxWidth: '320px',
                textAlign: 'left',
                zIndex: 10,
            }}>
                <motion.p
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    style={{
                        fontSize: '1.25rem',
                        lineHeight: '1.4',
                        color: 'var(--lumine-text)',
                        fontFamily: 'Inter, sans-serif'
                    }}
                >
                    Monitoramento de emissões, compliance ambiental e relatórios em tempo real.
                    <span style={{ display: 'block', marginTop: '1rem', color: 'var(--lumine-text-muted)', fontSize: '0.9rem' }}>
                        Transforme dados brutos em inteligência sustentável.
                    </span>
                </motion.p>
            </div>


            {/* Bottom Left Title */}
            <div style={{
                position: 'absolute',
                bottom: '10vh',
                left: 'max(4vw, 2rem)',
                zIndex: 10,
            }}>
                <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="font-serif"
                    style={{
                        fontSize: 'clamp(3rem, 7vw, 9rem)',
                        color: 'var(--lumine-text)',
                        lineHeight: '0.9',
                        textTransform: 'uppercase',
                        margin: 0,
                        letterSpacing: '-0.02em'
                    }}
                >
                    GESTÃO <br /> ESG
                </motion.h1>
            </div>

            {/* Bottom Right Button */}
            <div style={{
                position: 'absolute',
                bottom: '10vh',
                right: 'max(4vw, 2rem)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '2rem'
            }}>
                <button
                    onClick={() => navigate('/documentacao')}
                    className="heimdall-btn-ghost"
                    style={{ fontFamily: 'Space Mono', fontSize: '13px', letterSpacing: '0.1em' }}
                >
                    DOCUMENTAÇÃO
                </button>
                <motion.button
                    onClick={() => navigate('/funcionalidades')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="lumine-btn-primary"
                >
                    INICIAR AGORA
                    <ArrowRight size={18} />
                </motion.button>
            </div>

            {/* Mobile adjustments */}
            <style>{`
                @media (max-width: 1024px) {
                    section { place-items: center; padding-top: 200px; display: flex; flexDirection: column; justify-content: space-between; }
                    div[style*="top: 160px"] { position: relative; top: 0; right: 0; width: 100%; max-width: 100%; padding: 0 1rem; }
                    div[style*="bottom: 10vh"] { position: relative; bottom: 0; left: 0; right: 0; padding: 2rem 1rem; text-align: center; }
                    div[style*="width: 500px"] { transform: scale(0.6); }
                    h1 { text-align: center; }
                }
            `}</style>
        </section>
    );
}

export default HeroSection;

