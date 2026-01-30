/**
 * CustomCursor - Follows mouse with mix-blend-mode difference
 * Refactored to use framer-motion instead of gsap
 */
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import './heimdall.css';

export function CustomCursor() {
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const cursorX = useMotionValue(0);
    const cursorY = useMotionValue(0);
    const springX = useSpring(cursorX, { stiffness: 300, damping: 30 });
    const springY = useSpring(cursorY, { stiffness: 300, damping: 30 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isVisible) setIsVisible(true);
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseLeave = () => setIsVisible(false);

        const handleElementEnter = () => setIsHovering(true);
        const handleElementLeave = () => setIsHovering(false);

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('mouseleave', handleMouseLeave);

        const interactiveElements = document.querySelectorAll(
            'a, button, [role="button"], input, textarea, select, .interactive'
        );

        interactiveElements.forEach((el) => {
            el.addEventListener('mouseenter', handleElementEnter);
            el.addEventListener('mouseleave', handleElementLeave);
        });

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
    }, [isVisible, cursorX, cursorY]);

    // Don't show on touch devices
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
        return null;
    }

    return (
        <motion.div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: isHovering ? 40 : 10,
                height: isHovering ? 40 : 10,
                background: '#ffffff',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 9999,
                mixBlendMode: 'difference',
                x: springX,
                y: springY,
                translateX: '-50%',
                translateY: '-50%',
                opacity: isVisible ? 1 : 0,
            }}
            transition={{ width: { duration: 0.2 }, height: { duration: 0.2 } }}
        />
    );
}

export default CustomCursor;
