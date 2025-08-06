import React from "react";

export default function TempLogin() {
  const handleLogin = () => {
    window.location.href = "/auth/google";
  };

  const handleInstall = () => {
    // Check if PWA install is available
    if ('serviceWorker' in navigator) {
      // PWA install logic can be added later
      alert('PWA install not yet configured');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GabAi</h1>
          <p className="text-gray-600">Your voice-first smart assistant</p>
        </div>
        
        <button 
          onClick={handleLogin}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg transition-colors"
        >
          Continue with Google
        </button>

        <div className="space-y-3">
          <div className="text-sm text-blue-600 font-medium">📱 Install Available</div>
          <button 
            onClick={handleInstall}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            📥 Install GabAi App
          </button>
          <p className="text-xs text-gray-500">
            Install for faster access and offline support
          </p>
        </div>

        <p className="text-sm text-gray-500">
          Sign in to sync your data across all devices
        </p>
      </div>
    </div>
  );
}