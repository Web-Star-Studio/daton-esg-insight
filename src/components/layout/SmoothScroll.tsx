import { useEffect } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        // Pause Lenis when Radix dialogs are open to allow internal modal scrolling
        const observer = new MutationObserver(() => {
            const isDialogOpen = document.querySelector('[data-state="open"][role="dialog"]');
            if (isDialogOpen) {
                lenis.stop();
            } else {
                lenis.start();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-state'],
        });

        return () => {
            observer.disconnect();
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
}
