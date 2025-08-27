// Fix mobile content rendering issues
export function fixMobileContent() {
  if (typeof window === 'undefined') return;
  
  // Fix character encoding issues
  document.documentElement.setAttribute('lang', 'en');
  document.documentElement.setAttribute('dir', 'ltr');
  
  // Remove problematic scripts that cause rendering issues
  const problematicScripts = document.querySelectorAll('script[src*="vite"], script[src*="replit"], script[src*="runtime-error"]');
  problematicScripts.forEach(script => {
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  });
  
  // Force proper viewport
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }
  
  // Fix text rendering
  document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  document.body.style.fontSize = '16px';
  document.body.style.lineHeight = '1.5';
  
  console.log('📱 Mobile content fixes applied');
}

// Apply fixes immediately when module loads
if (typeof window !== 'undefined') {
  fixMobileContent();
  
  // Also apply on DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixMobileContent);
  }
}