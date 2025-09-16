// Mobile fullscreen optimizations for GabAi
console.log('🔧 Mobile fullscreen script loaded');

// Ensure mobile app loads properly
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 Applying mobile fullscreen fixes...');
  
  // Remove any conflicting styles
  document.body.style.position = 'relative';
  document.body.style.height = '100vh';
  document.body.style.overflow = 'hidden';
  
  // Ensure React root loads
  const root = document.getElementById('root');
  if (root) {
    root.style.height = '100vh';
    root.style.overflow = 'auto';
  }
  
  console.log('✅ Mobile fullscreen ready');
});

// Handle Capacitor readiness
document.addEventListener('deviceready', function() {
  console.log('📱 Capacitor device ready');
}, false);

// Handle any script loading errors
window.addEventListener('error', function(e) {
  console.error('Script error:', e.filename, e.lineno, e.message);
});