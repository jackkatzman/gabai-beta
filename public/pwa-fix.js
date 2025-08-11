// Emergency PWA and Text Rendering Fix
(function() {
    console.log('🚀 Emergency fixes loading...');

    // Fix viewport immediately
    function fixViewport() {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
            console.log('✅ Viewport fixed');
        }
    }

    // Prevent horizontal scrolling
    function preventScrolling() {
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
        document.body.style.maxWidth = '100vw';
        document.documentElement.style.maxWidth = '100vw';
        console.log('✅ Horizontal scrolling prevented');
    }

    // Fix text rendering and direction
    function fixTextRendering() {
        // Force left-to-right text direction globally
        document.documentElement.style.direction = 'ltr';
        document.body.style.direction = 'ltr';
        document.documentElement.style.unicodeBidi = 'embed';
        
        // Fix any text elements that might be backwards
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
        textElements.forEach(el => {
            if (el.textContent && el.textContent.trim()) {
                el.style.direction = 'ltr';
                el.style.unicodeBidi = 'embed';
                el.style.textAlign = 'left';
            }
        });
        
        console.log('✅ Text direction fixed');
    }

    // Fix input fields
    function fixInputFields() {
        const inputs = document.querySelectorAll('input[type="text"], input[placeholder*="Add new item"], textarea');
        inputs.forEach(input => {
            input.style.fontSize = '16px';
            input.style.minHeight = '44px';
            input.style.height = '44px';
            input.style.padding = '12px 16px';
            input.style.direction = 'ltr';
        });
        
        if (inputs.length > 0) {
            console.log(`✅ Fixed ${inputs.length} input fields`);
        }
    }

    // Apply all fixes
    function applyAllFixes() {
        fixViewport();
        preventScrolling();
        fixTextRendering();
        fixInputFields();
        console.log('🎉 All emergency fixes applied');
    }

    // Run fixes immediately and on content changes
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyAllFixes);
    } else {
        applyAllFixes();
    }

    // Re-apply fixes when new content loads
    const observer = new MutationObserver(function(mutations) {
        let shouldUpdate = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldUpdate = true;
            }
        });
        if (shouldUpdate) {
            setTimeout(() => {
                fixTextRendering();
                fixInputFields();
            }, 100);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Fallback periodic fix
    setInterval(() => {
        fixInputFields();
        fixTextRendering();
    }, 3000);

    console.log('🔧 Emergency fix monitoring active');
})();