/**
 * HeimdallNavbar - Floating Island with Horizontal Collapse/Expand
 * Refactored to use framer-motion instead of gsap
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import datonLogo from '@/assets/daton-logo-header.png';
import {
    Sheet,
    SheetContent,
} from '@/components/ui/sheet';
import './heimdall.css';

export function HeimdallNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navRef = useRef<HTMLElement>(null);
    const navigate = useNavigate();

    const [isScrollingUp, setIsScrollingUp] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const isAtTop = currentScrollY < 50;

            if (currentScrollY < lastScrollY.current) {
                setIsScrollingUp(true);
            } else if (currentScrollY > lastScrollY.current) {
                setIsScrollingUp(false);
            }

            setIsScrolled(!isAtTop);
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavigate = (path: string) => {
        setMobileMenuOpen(false);
        navigate(path);
    };

    const expandedOnlyLinks = [
        { label: 'Soluções', href: '/funcionalidades' },
        { label: 'Tecnologia', href: '/documentacao' },
        { label: 'Recursos', href: '/faq' },
        { label: 'Sobre Nós', href: '/contato' },
    ];

    const persistentLinks = [
        { label: 'Agendar Demo', href: '/contato' },
        { label: 'Entrar', href: '/auth' },
    ];

    const allLinks = [...expandedOnlyLinks, ...persistentLinks];
    const shouldExpand = !isScrolled || isHovered || isScrollingUp;
    const transitionStyle = 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)';

    return (
        <>
            <header
                ref={navRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '20px',
                    gap: '12px',
                    pointerEvents: 'none',
                }}
            >
                <motion.div
                    initial={{ y: -50, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.625rem',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
                        transition: transitionStyle,
                        pointerEvents: 'auto',
                    }}
                    className="hidden md:flex md:items-center"
                >
                    <button
                        onClick={() => handleNavigate('/')}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.375rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '8px',
                            transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <img
                            src={datonLogo}
                            alt="Daton"
                            style={{ height: '24px', transform: 'translateY(-4px)' }}
                        />
                    </button>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.125rem',
                            overflow: 'hidden',
                            maxWidth: shouldExpand ? '600px' : '0px',
                            opacity: shouldExpand ? 1 : 0,
                            transition: transitionStyle,
                        }}
                    >
                        {expandedOnlyLinks.map((link, index) => (
                            <NavLink key={index} label={link.label} onClick={() => handleNavigate(link.href)} />
                        ))}
                    </div>

                    <div
                        style={{
                            width: '1px',
                            height: '20px',
                            background: 'rgba(0, 0, 0, 0.12)',
                            opacity: shouldExpand ? 1 : 0,
                            transition: transitionStyle,
                        }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                        {persistentLinks.map((link, index) => (
                            <NavLink key={index} label={link.label} onClick={() => handleNavigate(link.href)} />
                        ))}
                    </div>
                </motion.div>

                <div
                    className="hidden md:flex"
                    style={{
                        alignItems: 'center',
                        padding: '0.5rem 0.625rem',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
                        pointerEvents: 'auto',
                    }}
                >
                    <button
                        onClick={() => handleNavigate('/contato')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.375rem 0.5rem',
                            borderRadius: '8px',
                            transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <span style={{ color: '#111827', fontSize: '14px', fontWeight: 500, transform: 'translateY(-2px)' }}>
                            Contato
                        </span>
                        <div
                            style={{
                                width: '28px',
                                height: '28px',
                                background: '#15c470',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ArrowRight size={14} color="#ffffff" />
                        </div>
                    </button>
                </div>

                <div
                    className="flex md:hidden"
                    style={{
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.625rem',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        pointerEvents: 'auto',
                    }}
                >
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-menu"
                        aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.375rem 0.5rem',
                            borderRadius: '8px',
                            transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <img src={datonLogo} alt="Daton" style={{ height: '20px' }} />
                        {mobileMenuOpen ? <X size={18} color="#111827" aria-hidden="true" /> : <Menu size={18} color="#111827" aria-hidden="true" />}
                    </button>
                </div>
            </header>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="right" className="w-full sm:w-80 bg-white border-l border-gray-200 p-0" id="mobile-menu">
                    <div className="flex flex-col h-full px-6 py-6">
                        <div className="flex items-center justify-between mb-8">
                            <img src={datonLogo} alt="Daton" className="h-6" />
                        </div>
                        <nav className="flex-1 space-y-1">
                            {allLinks.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleNavigate(link.href)}
                                    className="block w-full text-left text-xl font-medium text-gray-900 py-4 border-b border-gray-100 hover:text-primary transition-colors"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </nav>
                        <div className="pt-6 pb-4">
                            <button
                                onClick={() => handleNavigate('/contato')}
                                className="flex items-center justify-center gap-2 w-full bg-[#15c470] text-white py-4 px-6 rounded-xl font-medium text-lg hover:brightness-110 transition-all"
                            >
                                Contato
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

function NavLink({ label, onClick, hasExternal = false }: { label: string; onClick: () => void; hasExternal?: boolean }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: isHovered ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                border: 'none',
                color: isHovered ? '#111827' : '#4B5563',
                fontSize: '13px',
                fontWeight: 500,
                padding: '0.5rem 0.875rem',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
            }}
        >
            {label}
            {hasExternal && <span style={{ fontSize: '10px', opacity: 0.7 }}>↗</span>}
        </button>
    );
}

export default HeimdallNavbar;
