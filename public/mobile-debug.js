// Mobile debugging script - logs everything to help diagnose white screen
console.log('🔍 Mobile debug script starting...');

// Log all errors
window.addEventListener('error', function(e) {
  console.error('❌ ERROR:', e.message, 'File:', e.filename, 'Line:', e.lineno);
  alert('Error: ' + e.message);
});

// Log unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
  console.error('❌ PROMISE REJECTION:', e.reason);
  alert('Promise error: ' + e.reason);
});

// Check if React is loading
setTimeout(function() {
  const root = document.getElementById('root');
  if (root && root.innerHTML.trim() === '') {
    console.error('❌ React app not loaded - root element is empty');
    alert('React app failed to load');
  } else {
    console.log('✅ React app loaded successfully');
  }
}, 3000);

console.log('🔍 Debug script ready');