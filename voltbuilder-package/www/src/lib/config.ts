// Centralized API configuration - Force production URL for mobile builds
export const API_BASE = "https://gabai.ai";

// Helper to build absolute API URLs
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

console.log('🔧 API Configuration:', { API_BASE });