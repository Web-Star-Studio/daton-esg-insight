/**
 * CustomCursor - Follows mouse with mix-blend-mode difference
 * 
 * Features:
 * - Small white circle (10px) follows mouse
 * - On hover over links/buttons: scales to 40px
 * - mix-blend-mode: difference (inverts colors underneath)
 * - Pointer-events: none
 */
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './heimdall.css';

export function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            if (!isVisible) setIsVisible(true);

            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.15,
                ease: 'power2.out',
            });
        };

        // Mouse enter/leave window
        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseLeave = () => setIsVisible(false);

        // Hover detection for interactive elements
        const handleElementEnter = () => setIsHovering(true);
        const handleElementLeave = () => setIsHovering(false);

        // Add mouse listeners
        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('mouseleave', handleMouseLeave);

        // Add hover listeners to all interactive elements
        const interactiveElements = document.querySelectorAll(
            'a, button, [role="button"], input, textarea, select, .interactive'
        );

        interactiveElements.forEach((el) => {
            el.addEventListener('mouseenter', handleElementEnter);
            el.addEventListener('mouseleave', handleElementLeave);
        });

        // MutationObserver to handle dynamically added elements
        const observer = new MutationObserver(() => {
            const newElements = document.querySelectorAll(
                'a, button, [role="button"], input, textarea, select, .interactive'
            );
            newElements.forEach((el) => {
                el.removeEventListener('mouseenter', handleElementEnter);
                el.removeEventListener('mouseleave', handleElementLeave);
                el.addEventListener('mouseenter', handleElementEnter);
                el.addEventListener('mouseleave', handleElementLeave);
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseenter', handleMouseEnter);
            document.removeEventListener('mouseleave', handleMouseLeave);
            interactiveElements.forEach((el) => {
                el.removeEventListener('mouseenter', handleElementEnter);
                el.removeEventListener('mouseleave', handleElementLeave);
            });
            observer.disconnect();
        };
    }, [isVisible]);

    // Don't show on touch devices
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
        return null;
    }

    return (
        <div
            ref={cursorRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: isHovering ? '40px' : '10px',
                height: isHovering ? '40px' : '10px',
                background: '#ffffff',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 9999,
                mixBlendMode: 'difference',
                transform: 'translate(-50%, -50%)',
                transition: 'width 0.2s ease, height 0.2s ease',
                opacity: isVisible ? 1 : 0,
            }}
        />
    );
}

export default CustomCursor;
