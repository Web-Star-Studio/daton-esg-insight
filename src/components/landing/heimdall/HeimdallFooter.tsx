/**
 * HeimdallFooter - Massive footer with newsletter and navigation
 * Refactored to use framer-motion instead of gsap
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Mail } from 'lucide-react';
import { toast } from 'sonner';
import datonLogo from '@/assets/daton-logo-header.png';
import './heimdall.css';

export function HeimdallFooter() {
    const footerRef = useRef<HTMLElement>(null);
    const isInView = useInView(footerRef, { once: true, margin: '-100px' });
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Simula envio (ou integrar com backend)
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Inscrito com sucesso!', {
                description: 'Você receberá nossas novidades em breve.'
            });
            setEmail('');
        } catch (error) {
            toast.error('Erro ao inscrever', {
                description: 'Tente novamente mais tarde.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const footerLinks = [
        {
            title: 'Plataforma',
            links: [
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Monitoramento', href: '/monitoramento-esg' },
                { label: 'Relatórios', href: '/relatorios-integrados' },
                { label: 'Compliance', href: '/compliance' },
            ],
        },
        {
            title: 'Recursos',
            links: [
                { label: 'Documentação', href: '/documentacao' },
                { label: 'FAQ', href: '/faq' },
                { label: 'API', href: '/documentacao' },
                { label: 'Status', href: '/status' },
            ],
        },
        {
            title: 'Empresa',
            links: [
                { label: 'Sobre nós', href: '/sobre-nos' },
                { label: 'Contato', href: '/contato' },
                { label: 'Carreiras', href: '/contato' },
                { label: 'Blog', href: '/faq' },
            ],
        },
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
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
    };

    return (
        <footer
            ref={footerRef}
            style={{
                background: 'var(--heimdall-bg)',
                borderTop: '1px solid var(--heimdall-border)',
                padding: 'var(--heimdall-section-padding) 0 2rem',
            }}
        >
            <div className="heimdall-container">
                <motion.h2
                    initial={{ opacity: 0, y: 80 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="heimdall-heading-xl"
                    style={{ color: 'var(--heimdall-text)', marginBottom: '3rem', lineHeight: 0.9 }}
                >
                    Planejamento
                    <br />
                    de longo prazo
                    <br />
                    <span style={{ color: 'var(--heimdall-text-secondary)' }}>começa aqui.</span>
                </motion.h2>

                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: 'flex',
                        maxWidth: '500px',
                        marginBottom: '4rem',
                        borderBottom: '1px solid var(--heimdall-text)',
                    }}
                >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Mail size={20} style={{ color: 'var(--heimdall-text-secondary)' }} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Seu email"
                            required
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                padding: '1rem 0',
                                fontSize: '1rem',
                                color: 'var(--heimdall-text)',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.3s',
                        }}
                    >
                        <ArrowRight
                            size={24}
                            style={{
                                color: 'var(--heimdall-text)',
                                transform: isSubmitting ? 'translateX(8px)' : 'none',
                                transition: 'transform 0.3s',
                            }}
                        />
                    </button>
                </form>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    className="footer-columns"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '2rem',
                        marginBottom: '4rem',
                    }}
                >
                    <motion.div variants={itemVariants}>
                        <img src={datonLogo} alt="Daton" style={{ height: '28px', marginBottom: '1.5rem' }} />
                        <p className="heimdall-body-sm" style={{ marginBottom: '1.5rem' }}>
                            Plataforma ESG inteligente para empresas que buscam sustentabilidade e compliance.
                        </p>
                        <button
                            onClick={() => navigate('/contato')}
                            className="heimdall-btn heimdall-btn-primary"
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '16px' }}
                        >
                            Entre em contato
                        </button>
                    </motion.div>

                    {footerLinks.map((col, index) => (
                        <motion.div key={index} variants={itemVariants}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--heimdall-text)', marginBottom: '1.5rem' }}>
                                {col.title}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {col.links.map((link, linkIndex) => (
                                    <li key={linkIndex} style={{ marginBottom: '0.75rem' }}>
                                        <FooterLink label={link.label} onClick={() => navigate(link.href)} />
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </motion.div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '2rem',
                        borderTop: '1px solid var(--heimdall-border)',
                        flexWrap: 'wrap',
                        gap: '1rem',
                    }}
                >
                    <p className="heimdall-body-sm">© {new Date().getFullYear()} Daton. Todos os direitos reservados.</p>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <FooterLink label="Privacidade" onClick={() => navigate('/privacidade')} />
                        <FooterLink label="Termos" onClick={() => navigate('/termos')} />
                        <FooterLink label="Segurança" onClick={() => navigate('/seguranca')} />
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 1024px) { .footer-columns { grid-template-columns: repeat(2, 1fr) !important; } }
                @media (max-width: 640px) { .footer-columns { grid-template-columns: 1fr !important; } }
            `}</style>
        </footer>
    );
}

function FooterLink({ label, onClick }: { label: string; onClick: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={`Navegar para ${label}`}
            style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: isHovered ? 'var(--heimdall-text)' : 'var(--heimdall-text-secondary)',
                fontSize: '0.875rem',
                transition: 'color 0.3s',
            }}
        >
            {label}
            <ArrowUpRight
                size={14}
                aria-hidden="true"
                style={{
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translate(2px, -2px)' : 'none',
                    transition: 'all 0.3s',
                }}
            />
        </button>
    );
}

export default HeimdallFooter;
