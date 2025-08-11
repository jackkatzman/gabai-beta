// Emergency PWA fix - forces mobile improvements
(function() {
    // Fix viewport immediately
    function fixViewport() {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        }
    }

    // Prevent horizontal scrolling
    function preventScrolling() {
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
        document.body.style.maxWidth = '100vw';
        document.documentElement.style.maxWidth = '100vw';
    }

    // Fix input fields
    function fixInputFields() {
        const inputs = document.querySelectorAll('input[type="text"], input[placeholder*="Add new item"]');
        inputs.forEach(input => {
            input.style.fontSize = '16px';
            input.style.minHeight = '44px';
            input.style.height = '44px';
            input.style.padding = '12px 16px';
        });
    }

    // Apply fixes
    function applyFixes() {
        fixViewport();
        preventScrolling();
        fixInputFields();
    }

    // Run fixes
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFixes);
    } else {
        applyFixes();
    }

    // Re-apply fixes when new content loads
    setInterval(fixInputFields, 2000);
})();