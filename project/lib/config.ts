// Centralized configuration for the app
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
  health: `${BACKEND_URL}/api/health`,
  meditation: `${BACKEND_URL}/api/meditation`,
  visualization: `${BACKEND_URL}/api/visualization`,
  audio: `${BACKEND_URL}/api/audio`,
} as const;

// App configuration
export const APP_CONFIG = {
  name: 'Meditation Coach',
  version: '1.0.0',
  description: 'AI-powered meditation and visualization coaching app',
} as const;
