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
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { label: 'Soluções', href: '/funcionalidades' },
        { label: 'Tecnologia', href: '/documentacao' },
        { label: 'Recursos', href: '/faq' },
        { label: 'Sobre Nós', href: '/contato' },
    ];

    const handleNavigate = (path: string) => {
        setMobileMenuOpen(false);
        navigate(path);
    };

    return (
        <>
            <header
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    padding: '2rem max(4vw, 2rem)',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    background: 'transparent',
                }}
            >
                {/* Left: Logo */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <img
                            src={datonLogo}
                            alt="Daton"
                            style={{ height: '32px' }}
                        />
                    </button>
                </div>

                {/* Center: Empty */}
                <div />

                {/* Right: Nav Links */}
                <nav
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '2.5rem',
                        alignItems: 'center'
                    }}
                    className="hidden md:flex"
                >
                    {navLinks.map((link, index) => (
                        <button
                            key={index}
                            onClick={() => handleNavigate(link.href)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--lumine-text)',
                                fontSize: '12px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                padding: 0,
                                fontFamily: 'Sora, sans-serif',
                                letterSpacing: '0.05em'
                            }}
                        >
                            {link.label}
                        </button>
                    ))}
                    <button
                        onClick={() => handleNavigate('/contato')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--lumine-text)',
                            fontSize: '12px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            padding: '0 0 2px 0',
                            fontFamily: 'Sora, sans-serif',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid var(--lumine-text)'
                        }}
                    >
                        CONTATO
                    </button>
                </nav>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden justify-end">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <Menu size={24} color="var(--lumine-text)" />
                    </button>
                </div>
            </header>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="right" className="w-full sm:w-80 bg-[#f5f9f3] border-l border-gray-200 p-0">
                    <div className="flex flex-col h-full px-6 py-6">
                        <div className="flex items-center justify-between mb-8">
                            <img src={datonLogo} alt="Daton" className="h-6" />
                        </div>
                        <nav className="flex-1 space-y-1">
                            {[...navLinks, { label: 'Agendar Demo', href: '/contato' }, { label: 'Entrar', href: '/auth' }].map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleNavigate(link.href)}
                                    className="block w-full text-left text-xl font-medium text-gray-900 py-4 border-b border-gray-100"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </nav>
                        <div className="pt-6 pb-4">
                            <button
                                onClick={() => handleNavigate('/contato')}
                                className="flex items-center justify-center gap-2 w-full bg-[#c4fca1] text-[#1a2421] py-4 px-6 rounded-xl font-medium text-lg"
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

export default HeimdallNavbar;
