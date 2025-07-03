import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, UserProfile, SessionHistory, MeditationResponse, VisualizationResponse } from './api';

export interface User {
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

export interface MeditationSession {
  id: string;
  type: 'meditation' | 'visualization';
  mood?: string;
  duration: number;
  completedAt: string;
  rating?: number;
  notes?: string;
  audioUrl?: string;
  script?: string;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
}

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  
  // Session state
  currentSession: MeditationSession | null;
  sessionHistory: SessionHistory[];
  setCurrentSession: (session: MeditationSession | null) => void;
  addSessionToHistory: (session: MeditationSession) => void;
  fetchSessionHistory: (limit?: number, offset?: number) => Promise<void>;
  
  // Quiz state
  quizAnswers: QuizAnswer[];
  setQuizAnswers: (answers: QuizAnswer[]) => void;
  addQuizAnswer: (answer: QuizAnswer) => void;
  
  // App state
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Audio state
  isPlaying: boolean;
  currentTrack: string | null;
  volume: number;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTrack: (track: string | null) => void;
  setVolume: (volume: number) => void;
  
  // Backend integration
  startMeditationSession: (mood: string, duration?: number, voiceId?: string, allAnswers?: Record<string, any>) => Promise<MeditationResponse>;
  startVisualizationSession: (goal: string, goalCategory: string, goalComplexity: string, voiceId?: string, allAnswers?: Record<string, any>, identifiedChallenges?: string[]) => Promise<VisualizationResponse>;
  completeSession: (sessionId: string, rating?: number, notes?: string) => Promise<void>;
  healthCheck: () => Promise<boolean>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),
      
      fetchUserProfile: async () => {
        try {
          set({ isLoading: true, error: null });
          const profile = await api.getUserProfile();
          set({ user: profile });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch user profile' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      updateUserProfile: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const updatedProfile = await api.updateUserProfile(data);
          set({ user: updatedProfile });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update user profile' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Session state
      currentSession: null,
      sessionHistory: [],
      setCurrentSession: (session) => set({ currentSession: session }),
      addSessionToHistory: (session) => 
        set((state) => ({ 
          sessionHistory: [session as SessionHistory, ...state.sessionHistory].slice(0, 50) // Keep last 50 sessions
        })),
      
      fetchSessionHistory: async (limit = 20, offset = 0) => {
        try {
          set({ isLoading: true, error: null });
          const { sessions } = await api.getSessionHistory(limit, offset);
          set({ sessionHistory: sessions });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch session history' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Quiz state
      quizAnswers: [],
      setQuizAnswers: (answers) => set({ quizAnswers: answers }),
      addQuizAnswer: (answer) => 
        set((state) => ({
          quizAnswers: [
            ...state.quizAnswers.filter(a => a.questionId !== answer.questionId),
            answer
          ]
        })),
      
      // App state
      isLoading: false,
      error: null,
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      // Audio state
      isPlaying: false,
      currentTrack: null,
      volume: 0.7,
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTrack: (track) => set({ currentTrack: track }),
      setVolume: (volume) => set({ volume }),
      
      // Backend integration
      startMeditationSession: async (mood: string, duration = 600, voiceId?: string, allAnswers?: Record<string, any>) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.startMeditation({
            mood,
            duration,
            voiceId: voiceId || 'pNInz6obpgDQGcFmaJgB', // Default voice if not provided
            allAnswers: allAnswers || get().quizAnswers.reduce((acc, answer) => {
              acc[answer.questionId] = answer.answer;
              return acc;
            }, {} as Record<string, any>),
          });
          
          // Create session object
          const session: MeditationSession = {
            id: response.sessionId,
            type: 'meditation',
            mood,
            duration,
            completedAt: new Date().toISOString(),
            audioUrl: response.audioUrl,
            script: response.script,
          };
          
          set({ currentSession: session });
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to start meditation session';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoading: false });
        }
      },
      
        startVisualizationSession: async (goal: string, goalCategory: string, goalComplexity: string, voiceId?: string, allAnswers?: Record<string, any>, identifiedChallenges?: string[]) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.startVisualization({
            goal,
        goalCategory,
        goalComplexity,
            voiceId: voiceId || 'pNInz6obpgDQGcFmaJgB', // Default voice if not provided
            allAnswers: allAnswers || get().quizAnswers.reduce((acc, answer) => {
              acc[answer.questionId] = answer.answer;
              return acc;
            }, {} as Record<string, any>),
        identifiedChallenges: identifiedChallenges || [],
        userExperienceLevel: 'beginner',
        sessionType: 'goal_achievement',
          });
          
          // Create session object
          const session: MeditationSession = {
            id: response.sessionId,
            type: 'visualization',
            duration: 0, // Will be set when completed
            completedAt: new Date().toISOString(),
            audioUrl: response.audioUrl,
            script: response.script,
          };
          
          set({ currentSession: session });
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to start visualization session';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ isLoading: false });
        }
      },
      
      completeSession: async (sessionId: string, rating?: number, notes?: string) => {
        try {
          set({ isLoading: true, error: null });
          const currentSession = get().currentSession;
          
          if (!currentSession) {
            throw new Error('No active session to complete');
          }
          
          // Complete the session based on type
          if (currentSession.type === 'meditation') {
            await api.completeMeditationSession(sessionId, { rating, notes });
          } else {
            await api.completeVisualizationSession(sessionId, { rating, notes });
          }
          
          // Update session with completion data
          const completedSession: MeditationSession = {
            ...currentSession,
            rating,
            notes,
            completedAt: new Date().toISOString(),
          };
          
          // Add to history and clear current session
          get().addSessionToHistory(completedSession);
          set({ currentSession: null });
          
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to complete session' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      healthCheck: async () => {
        try {
          await api.healthCheck();
          return true;
        } catch (error) {
          set({ error: 'Backend service is not available' });
          return false;
        }
      },
    }),
    {
      name: 'mindful-coach-storage',
      partialize: (state) => ({
        user: state.user,
        sessionHistory: state.sessionHistory,
        quizAnswers: state.quizAnswers,
        volume: state.volume,
      }),
    }
  )
);