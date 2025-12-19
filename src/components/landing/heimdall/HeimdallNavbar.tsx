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
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import datonLogo from '@/assets/daton-logo-header.png';
import './heimdall.css';

export function HeimdallNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const navRef = useRef<HTMLElement>(null);
    const pillRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const mobileLinksRef = useRef<(HTMLElement | null)[]>([]);
    const navigate = useNavigate();

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    // Mobile menu animation
    useEffect(() => {
        if (mobileMenuOpen && mobileMenuRef.current) {
            gsap.fromTo(mobileMenuRef.current,
                { x: '100%' },
                { x: '0%', duration: 0.4, ease: 'power3.out' }
            );

            gsap.fromTo(mobileLinksRef.current.filter(Boolean),
                { x: 50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power3.out', delay: 0.15 }
            );
        }
    }, [mobileMenuOpen]);

    const handleNavigate = (path: string) => {
        if (mobileMenuOpen) {
            gsap.to(mobileMenuRef.current, {
                x: '100%',
                duration: 0.3,
                ease: 'power3.in',
                onComplete: () => {
                    setMobileMenuOpen(false);
                    navigate(path);
                }
            });
        } else {
            navigate(path);
        }
        setActiveDropdown(null);
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
                {!isMobile && (
                    <div
                        style={{
                            display: 'flex',
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
                )}

                {/* Mobile Pill - Logo + Hamburger (MOBILE ONLY) */}
                {isMobile && (
                    <div
                        style={{
                            display: 'flex',
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
                )}
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div
                    ref={mobileMenuRef}
                    style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        width: '100vw',
                        height: '100vh',
                        background: '#FFFFFF',
                        zIndex: 1050,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '2rem',
                        transform: 'translateX(100%)',
                    }}
                >
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                            position: 'absolute',
                            top: '1.5rem',
                            right: '1.5rem',
                            background: 'none',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={24} color="#111827" />
                    </button>

                    <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                        {allLinks.map((link, index) => (
                            <button
                                key={index}
                                ref={(el) => { mobileLinksRef.current[index] = el; }}
                                onClick={() => handleNavigate(link.href)}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: '1px solid rgba(0,0,0,0.1)',
                                    color: '#111827',
                                    fontSize: '1.75rem',
                                    fontWeight: 500,
                                    textAlign: 'left',
                                    padding: '1rem 0',
                                    cursor: 'pointer',
                                    opacity: 0,
                                }}
                            >
                                {link.label}
                            </button>
                        ))}

                        <div
                            ref={(el) => { mobileLinksRef.current[allLinks.length] = el; }}
                            style={{ marginTop: '2rem', opacity: 0 }}
                        >
                            <button
                                onClick={() => handleNavigate('/contato')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    width: '100%',
                                    background: '#15c470',
                                    color: '#ffffff',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Contato <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
