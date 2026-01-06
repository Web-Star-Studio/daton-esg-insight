/**
 * HeimdallNavbar - Floating Island with Horizontal Collapse/Expand
 * 
 * Behavior:
 * - EXPANDED (Initial/Top): Shows ALL links
 *   [Logo | Solutions | Technology | Resources | About Us | Careers | Log In | Contact]
 * 
 * - RETRACTED (On Scroll): Hides middle links, shows only essential
 *   [Logo | Careers | Log In | Contact]
 * 
 * - Expands again when:
 *   1. User scrolls back to top (scrollY < 50)
 *   2. User hovers over the navbar while it's retracted
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ArrowRight, Menu, X } from 'lucide-react';
import datonLogo from '@/assets/daton-logo-header.png';
import {
    Sheet,
    SheetContent,
    SheetClose,
} from '@/components/ui/sheet';
import './heimdall.css';

export function HeimdallNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const navRef = useRef<HTMLElement>(null);
    const pillRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Scroll detection with direction awareness
    const [isScrollingUp, setIsScrollingUp] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const isAtTop = currentScrollY < 50;

            // Detect scroll direction
            if (currentScrollY < lastScrollY.current) {
                // Scrolling UP
                setIsScrollingUp(true);
            } else if (currentScrollY > lastScrollY.current) {
                // Scrolling DOWN
                setIsScrollingUp(false);
            }

            setIsScrolled(!isAtTop);
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Initial animation
    useEffect(() => {
        gsap.fromTo(pillRef.current,
            { y: -50, opacity: 0, scale: 0.9 },
            { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out', delay: 0.3 }
        );
    }, []);

    const handleNavigate = (path: string) => {
        setMobileMenuOpen(false);
        setActiveDropdown(null);
        navigate(path);
    };

    // Links that show in EXPANDED state only (hidden when collapsed)
    const expandedOnlyLinks = [
        { label: 'Soluções', href: '/funcionalidades' },
        { label: 'Tecnologia', href: '/documentacao' },
        { label: 'Recursos', href: '/faq' },
        { label: 'Sobre Nós', href: '/contato' },
    ];

    // Links that ALWAYS show (both expanded and collapsed)
    const persistentLinks = [
        {
            label: 'Agendar Demo',
            href: '/contato',
            hasExternal: false,
        },
        {
            label: 'Entrar',
            href: '/auth',
            hasExternal: false,
        },
    ];

    // All links for mobile menu
    const allLinks = [...expandedOnlyLinks, ...persistentLinks];

    // Determine if navbar should be expanded
    // Expanded when: at top OR hovering OR scrolling up
    const shouldExpand = !isScrolled || isHovered || isScrollingUp;

    // Transition curve - slower and smoother (0.8s instead of 0.5s)
    const transitionStyle = 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)';

    return (
        <>
            {/* Fixed container for centering */}
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
                    gap: '12px', /* Gap between the two pills */
                    pointerEvents: 'none',
                }}
            >
                {/* Floating Pill Container */}
                <div
                    ref={pillRef}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => {
                        setIsHovered(false);
                        setActiveDropdown(null);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.625rem',
                        // Light glassmorphism background
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
                        transition: transitionStyle,
                        pointerEvents: 'auto',
                    }}
                    className="hidden md:flex"
                >
                    {/* Logo */}
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
                            style={{
                                height: '24px',
                                transform: 'translateY(-4px)', // Optical alignment correction
                                // No filter needed for light theme if logo is dark/colored
                                // filter: 'brightness(0) invert(1)', 
                            }}
                        />
                    </button>

                    {/* EXPANDED ONLY LINKS - Hidden when collapsed */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.125rem',
                            overflow: 'hidden',
                            // Animate width and opacity
                            maxWidth: shouldExpand ? '600px' : '0px',
                            opacity: shouldExpand ? 1 : 0,
                            transition: transitionStyle,
                        }}
                    >
                        {expandedOnlyLinks.map((link, index) => (
                            <NavLink
                                key={index}
                                label={link.label}
                                onClick={() => handleNavigate(link.href)}
                            />
                        ))}
                    </div>

                    {/* Divider - only visible when expanded */}
                    <div
                        style={{
                            width: '1px',
                            height: '20px',
                            background: 'rgba(0, 0, 0, 0.12)',
                            opacity: shouldExpand ? 1 : 0,
                            transition: transitionStyle,
                        }}
                    />

                    {/* PERSISTENT LINKS - Always visible */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.125rem',
                        }}
                    >
                        {persistentLinks.map((link, index) => (
                            <NavLink
                                key={index}
                                label={link.label}
                                hasExternal={link.hasExternal}
                                onClick={() => handleNavigate(link.href)}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Pill - Contact (DESKTOP ONLY) */}
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
                        {/* Contact Text + Arrow Button */}
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
                            <span
                                style={{
                                    color: '#111827',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    transform: 'translateY(-2px)', // Visual alignment with logo/links
                                }}
                            >
                                Contato
                            </span>
                            {/* Red Arrow Button */}
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

                {/* Mobile Pill - Logo + Hamburger (MOBILE ONLY) */}
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
                            <img
                                src={datonLogo}
                                alt="Daton"
                                style={{
                                    height: '20px',
                                    // filter: 'brightness(0) invert(1)',
                                }}
                            />
                        {mobileMenuOpen ? <X size={18} color="#111827" /> : <Menu size={18} color="#111827" />}
                        </button>
                </div>
            </header>

            {/* Mobile Sheet Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="right" className="w-full sm:w-80 bg-white border-l border-gray-200 p-0">
                    <div className="flex flex-col h-full px-6 py-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <img
                                src={datonLogo}
                                alt="Daton"
                                className="h-6"
                            />
                        </div>

                        {/* Navigation Links */}
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

                        {/* CTA Button */}
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

// NavLink Component
function NavLink({
    label,
    onClick,
    hasExternal = false,
}: {
    label: string;
    onClick: () => void;
    hasExternal?: boolean;
}) {
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
            {hasExternal && (
                <span style={{ fontSize: '10px', opacity: 0.7 }}>↗</span>
            )}
        </button>
    );
}

// Contact Button
function ContactButton({ onClick }: { onClick: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: '#15c470',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 500,
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
            }}
        >
            <ArrowRight
                size={16}
                style={{
                    transition: 'transform 0.2s ease-out',
                    transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                }}
            />
        </button>
    );
}

export default HeimdallNavbar;
