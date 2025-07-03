const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(response.status, errorData.message || `API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Enhanced interfaces for better type safety
export interface QuizQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'scale' | 'text' | 'textarea';
  options?: string[];
  required: boolean;
}

export interface DynamicQuestion {
  nextQuestion: string;
  questionType: 'text' | 'textarea' | 'single' | 'multiple' | 'scale';
  isLastQuestion: boolean;
  totalQuestions: number;
  questionId: string;
}

export interface MeditationResponse {
  sessionId: string;
  audioUrl?: string;
  script: string;
  duration: number;
  backgroundMusic?: string;
  mood?: string;
  createdAt: string;
  voiceId?: string;
}

export interface VisualizationResponse {
  sessionId: string;
  script: string;
  audioUrl?: string;
  goal?: string;
  goalCategory?: string;
  challenges?: string[];
  solutions?: Array<{challenge: string; solution: string}>;
  actionPlan?: string[];
  createdAt: string;
  voiceId?: string;
  sessionType?: string;
}

export interface AudioGenerationRequest {
  text: string;
  voiceId: string;
  sessionType: 'meditation' | 'visualization';
  mood?: string;
  goal?: string;
}

export interface AudioGenerationResponse {
  audioUrl: string;
  duration: number;
  voiceId: string;
  sessionId: string;
}

export interface Voice {
  id: string;
  name: string;
  category: 'meditation' | 'visualization' | 'general';
  description: string;
  previewUrl?: string;
}

export interface BackendVoice {
  voice_id: string;
  name: string;
  category?: string;
  description: string;
  previewUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: {
    preferredSessionLength: number;
    favoriteThemes: string[];
    reminderSettings: {
      enabled: boolean;
      time: string;
      frequency: 'daily' | 'weekly';
    };
    voicePreferences?: {
      preferredVoiceId: string;
      speed: number;
    };
  };
  stats: {
    totalSessions: number;
    totalMinutes: number;
    streakDays: number;
    favoriteMood: string;
  };
}

export interface SessionHistory {
  id: string;
  type: 'meditation' | 'visualization';
  mood?: string;
  duration: number;
  completedAt: string;
  rating?: number;
  notes?: string;
  audioUrl?: string;
}

// Enhanced API functions
export const api = {
  // Dynamic Question Generation
  async getNextMeditationQuestion(data: {
    mood: string;
    previousAnswers: Record<string, any>;
    currentQuestionIndex: number;
  }): Promise<DynamicQuestion> {
    return apiRequest('/meditate/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getNextVisualizationQuestion(data: {
    goal: string;
    goalCategory: string;
    goalComplexity: string;
    previousAnswers: Record<string, any>;
    currentQuestionIndex: number;
    userExperienceLevel?: string;
  }): Promise<DynamicQuestion> {
    return apiRequest('/visualize/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async analyzeGoal(data: {
    goal: string;
    category: string;
    timeline: string;
    currentEmotionalState: string;
    desiredEmotionalState: string;
  }): Promise<any> {
    return apiRequest('/visualize/goal-analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async identifyChallenges(data: {
    goal: string;
    goalCategory: string;
    allAnswers: Record<string, any>;
    userProfile: Record<string, any>;
  }): Promise<any> {
    return apiRequest('/visualize/challenges', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Meditation endpoints
  async startMeditation(data: {
    mood: string;
    voiceId: string;
    duration?: number;
    allAnswers: Record<string, any>;
  }): Promise<MeditationResponse> {
    return apiRequest('/meditate/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMeditationSession(sessionId: string): Promise<MeditationResponse> {
    return apiRequest(`/meditate/session/${sessionId}`);
  },

  async completeMeditationSession(sessionId: string, data: {
    rating?: number;
    notes?: string;
  }): Promise<{ success: boolean }> {
    return apiRequest(`/meditate/session/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Visualization endpoints
  async startVisualization(data: {
    goal: string;
    goalCategory: string;
    goalComplexity: string;
    voiceId: string;
    allAnswers: Record<string, any>;
    identifiedChallenges: string[];
    userExperienceLevel?: string;
    sessionType?: string;
  }): Promise<VisualizationResponse> {
    return apiRequest('/visualize/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getVisualizationSession(sessionId: string): Promise<VisualizationResponse> {
    return apiRequest(`/visualize/session/${sessionId}`);
  },

  async completeVisualizationSession(sessionId: string, data: {
    rating?: number;
    notes?: string;
    clarityScore?: number;
    confidenceScore?: number;
  }): Promise<{ success: boolean }> {
    return apiRequest(`/visualize/session/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Audio generation endpoints
  async generateAudio(data: AudioGenerationRequest): Promise<AudioGenerationResponse> {
    return apiRequest('/audio/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAvailableVoices(): Promise<Voice[]> {
    const voices = await apiRequest<BackendVoice[]>('/meditate/voices');
    // Map backend response to frontend interface
    return voices.map((voice) => ({
      id: voice.voice_id,
      name: voice.name,
      category: (voice.category as 'meditation' | 'visualization' | 'general') || 'meditation',
      description: voice.description,
      previewUrl: voice.previewUrl
    }));
  },

  // User endpoints
  async getUserProfile(): Promise<UserProfile> {
    return apiRequest('/user/profile');
  },

  async updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return apiRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getSessionHistory(limit?: number, offset?: number): Promise<{
    sessions: SessionHistory[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    return apiRequest(`/user/sessions?${params.toString()}`);
  },

  async getUserStats(): Promise<{
    totalSessions: number;
    totalMinutes: number;
    streakDays: number;
    favoriteMood: string;
    weeklyProgress: Array<{ date: string; minutes: number }>;
  }> {
    return apiRequest('/user/stats');
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return apiRequest('/health');
  },
};