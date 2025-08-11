// Mobile Fullscreen Handler - Completely hide address bar on mobile devices
(function() {
    'use strict';
    
    // Detect if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone || 
                         document.referrer.includes('android-app://');
    
    console.log('Mobile Detection:', { isMobile, isStandalone });
    
    if (isMobile) {
        // Force fullscreen mode
        function hideAddressBar() {
            // Use the largest possible height
            const vh = window.innerHeight;
            document.documentElement.style.setProperty('--app-height', `${vh}px`);
            
            // Force scroll to hide address bar
            setTimeout(() => {
                window.scrollTo(0, 1);
                window.scrollTo(0, 0);
            }, 500);
            
            // Set body height to full viewport
            document.body.style.height = `${vh}px`;
            document.body.style.minHeight = `${vh}px`;
            document.body.style.maxHeight = `${vh}px`;
            document.body.style.overflow = 'hidden';
            
            // Set root container height
            const root = document.getElementById('root');
            if (root) {
                root.style.height = `${vh}px`;
                root.style.minHeight = `${vh}px`;
                root.style.maxHeight = `${vh}px`;
                root.style.overflowY = 'auto';
                root.style.webkitOverflowScrolling = 'touch';
            }
        }
        
        // Apply on load and resize
        window.addEventListener('load', hideAddressBar);
        window.addEventListener('resize', hideAddressBar);
        window.addEventListener('orientationchange', () => {
            setTimeout(hideAddressBar, 500);
        });
        
        // Apply immediately if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideAddressBar);
        } else {
            hideAddressBar();
        }
        
        // Prevent pull-to-refresh on iOS
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) return;
        }, { passive: false });
        
        document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 1) return;
            
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            
            // Allow scrolling within scrollable elements
            let scrollableParent = element;
            while (scrollableParent && scrollableParent !== document.body) {
                const overflow = window.getComputedStyle(scrollableParent).overflow;
                if (overflow === 'auto' || overflow === 'scroll') {
                    return; // Allow scrolling within this element
                }
                scrollableParent = scrollableParent.parentElement;
            }
            
            // Prevent default if we're at the top of the page
            if (window.scrollY === 0) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    // Add CSS variables for mobile viewport height
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --app-height: 100vh;
        }
        
        @media screen and (max-width: 768px) {
            html, body {
                height: var(--app-height) !important;
                max-height: var(--app-height) !important;
                overflow: hidden !important;
                position: fixed !important;
                width: 100% !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
            }
            
            #root {
                height: var(--app-height) !important;
                max-height: var(--app-height) !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
                position: relative !important;
            }
        }
    `;
    document.head.appendChild(style);
})();