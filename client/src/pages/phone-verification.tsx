// after successful verify + token storage
setMsg('Verified! Redirecting…');
setStep('done');

// go to chat via our tiny router
if (onVerified) {
  onVerified();
} else {
  window.history.replaceState({}, '', '/chat');
  window.location.reload();
}
