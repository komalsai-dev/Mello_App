'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { VoiceSelector } from '@/components/voice-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Brain, Target, Lightbulb, CheckCircle2, Play, Pause, Volume2, VolumeX, Star, MessageSquare, Zap, Shield, BookOpen, Users, TrendingUp, Heart, Clock, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useBackend } from '@/hooks/use-backend';
import { api, DynamicQuestion } from '@/lib/api';
import { toast } from 'sonner';
import { BACKEND_URL } from '@/lib/config';

type VisualizationStep = 'goal' | 'analysis' | 'voice' | 'questions' | 'challenges' | 'summary' | 'visualization' | 'complete';

// Goal categories with icons and descriptions
const GOAL_CATEGORIES = [
  { id: 'career', name: 'Career', icon: TrendingUp, description: 'Professional growth and advancement' },
  { id: 'health', name: 'Health & Wellness', icon: Heart, description: 'Physical and mental well-being' },
  { id: 'relationships', name: 'Relationships', icon: Users, description: 'Personal connections and love' },
  { id: 'personal_growth', name: 'Personal Growth', icon: Brain, description: 'Self-improvement and learning' },
  { id: 'financial', name: 'Financial', icon: TrendingUp, description: 'Money and financial security' },
  { id: 'creative', name: 'Creative', icon: Zap, description: 'Artistic expression and creativity' },
];

const TIMELINES = [
  { id: '30', name: '30 days', description: 'Short-term goal' },
  { id: '90', name: '3 months', description: 'Medium-term goal' },
  { id: '180', name: '6 months', description: 'Long-term goal' },
  { id: '365', name: '1 year', description: 'Long-term goal' },
  { id: '1825', name: '5 years', description: 'Very long-term goal' },
];

const EMOTIONAL_STATES = [
  'Excited', 'Hopeful', 'Anxious', 'Confident', 'Overwhelmed', 'Determined', 'Stressed', 'Peaceful', 'Frustrated', 'Inspired'
];

export default function VisualizationPage() {
  const [currentStep, setCurrentStep] = useState<VisualizationStep>('goal');
  const [goal, setGoal] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTimeline, setSelectedTimeline] = useState<string>('');
  const [currentEmotionalState, setCurrentEmotionalState] = useState<string>('');
  const [desiredEmotionalState, setDesiredEmotionalState] = useState<string>('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<DynamicQuestion | null>(null);
  const [goalAnalysis, setGoalAnalysis] = useState<any>(null);
  const [challenges, setChallenges] = useState<any>(null);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [clarityScore, setClarityScore] = useState<number | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);

  const { startVisualizationSession, completeSession, isLoading, error } = useAppStore();
  const { isConnected } = useBackend();

  const steps = [
    { id: 'goal', title: 'Set Your Goal', progress: 12 },
    { id: 'analysis', title: 'Goal Analysis', progress: 25 },
    { id: 'voice', title: 'Choose Voice', progress: 37 },
    { id: 'questions', title: 'Deep Reflection', progress: 50 },
    { id: 'challenges', title: 'Challenge Mapping', progress: 62 },
    { id: 'summary', title: 'Session Summary', progress: 75 },
    { id: 'visualization', title: 'Visualization', progress: 87 },
    { id: 'complete', title: 'Complete', progress: 100 },
  ];

  const currentStepData = steps.find(step => step.id === currentStep);

  // Handle audio element
  useEffect(() => {
    if (audioElement) {
      audioElement.addEventListener('ended', () => {
        setIsAudioPlaying(false);
      });
      
      audioElement.addEventListener('play', () => {
        setIsAudioPlaying(true);
      });
      
      audioElement.addEventListener('pause', () => {
        setIsAudioPlaying(false);
      });
    }

    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  // Load first question when entering questions step
  useEffect(() => {
    if (currentStep === 'questions' && goal && currentQuestionIndex === 0) {
      loadNextQuestion();
    }
  }, [currentStep, goal]);

  useEffect(() => {
    if (currentStep === 'questions' && goal) {
      loadNextQuestion();
    }
    // eslint-disable-next-line
  }, [currentQuestionIndex]);

  const loadNextQuestion = async () => {
    if (!goal || !selectedCategory) return;

    try {
      setIsLoadingQuestion(true);
      const question = await api.getNextVisualizationQuestion({
        goal: goal,
        goalCategory: selectedCategory,
        goalComplexity: goalAnalysis?.goalComplexity || 'Moderate',
        previousAnswers: questionAnswers,
        currentQuestionIndex: currentQuestionIndex,
        userExperienceLevel: 'beginner',
      });
      
      setCurrentQuestion(question);
    } catch (error) {
      toast.error('Failed to load question');
      console.error('Error loading question:', error);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleAnswerChange = (answer: string) => {
    if (currentQuestion) {
      setQuestionAnswers(prev => ({
        ...prev,
        [currentQuestion.questionId]: answer
      }));
    }
  };

  const handleNextQuestion = async () => {
    if (!currentQuestion) return;

    // Save current answer
    if (currentQuestion.questionId) {
      setQuestionAnswers(prev => ({
        ...prev,
        [currentQuestion.questionId]: questionAnswers[currentQuestion.questionId] || ''
      }));
    }

    if (currentQuestion.isLastQuestion) {
      setCurrentStep('challenges');
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const analyzeGoal = async () => {
    if (!goal || !selectedCategory || !selectedTimeline || !currentEmotionalState || !desiredEmotionalState) {
      toast.error('Please fill in all goal details');
      return;
    }

    try {
      const analysis = await api.analyzeGoal({
        goal,
        category: selectedCategory,
        timeline: selectedTimeline,
        currentEmotionalState,
        desiredEmotionalState,
      });
      
      setGoalAnalysis(analysis);
      setCurrentStep('voice');
      toast.success('Goal analyzed successfully!');
    } catch (error) {
      toast.error('Failed to analyze goal');
      console.error('Error analyzing goal:', error);
    }
  };

  const identifyChallenges = async () => {
    try {
      const challengeData = await api.identifyChallenges({
        goal,
        goalCategory: selectedCategory,
        allAnswers: questionAnswers,
        userProfile: {},
      });
      
      setChallenges(challengeData);
      setCurrentStep('summary');
    } catch (error) {
      toast.error('Failed to identify challenges');
      console.error('Error identifying challenges:', error);
    }
  };

  // Helper to get full audio URL
  const getFullAudioUrl = (audioUrl: string) => {
    if (!audioUrl) return '';
    if (audioUrl.startsWith('http')) return audioUrl;
    return `${BACKEND_URL}${audioUrl}`;
  };

  const handleNext = async () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    
    if (currentStep === 'goal') {
      if (goal && selectedCategory && selectedTimeline && currentEmotionalState && desiredEmotionalState) {
        setCurrentStep('analysis');
      } else {
        toast.error('Please fill in all goal details');
        return;
      }
    } else if (currentStep === 'analysis') {
      await analyzeGoal();
    } else if (currentStep === 'voice' && selectedVoiceId) {
      setCurrentStep('questions');
    } else if (currentStep === 'questions') {
      // Questions are handled by handleNextQuestion
      return;
    } else if (currentStep === 'challenges') {
      await identifyChallenges();
    } else if (currentStep === 'summary') {
      try {
        // Start visualization session with backend
        const response = await startVisualizationSession(
          goal,
          selectedCategory,
          goalAnalysis?.goalComplexity || 'Moderate',
          selectedVoiceId!,
          questionAnswers,
          challenges?.primaryChallenges || []
        );
        
        console.log('Visualization session response:', response);
        
        // Store the generated script and session ID
        setGeneratedScript(response.script);
        setSessionId(response.sessionId);
        
        // Set up audio if available
        if (response.audioUrl) {
          const fullAudioUrl = getFullAudioUrl(response.audioUrl);
          console.log('Setting up audio with URL:', fullAudioUrl);
          const audioObj = new Audio(fullAudioUrl);
          
          // Add error handling for audio loading
          audioObj.addEventListener('error', (e) => {
            console.error('Audio loading error:', e);
            toast.error('Failed to load audio. Please try again.');
          });
          
          audioObj.addEventListener('loadeddata', () => {
            console.log('Audio loaded successfully');
          });
          
          setAudioElement(audioObj);
        } else {
          console.log('No audio URL in response');
        }
        
        setCurrentStep('visualization');
      } catch (error) {
        toast.error('Failed to start visualization session. Please try again.');
        console.error('Visualization session error:', error);
      }
    } else if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as VisualizationStep);
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as VisualizationStep);
    }
  };

  const handleSessionComplete = async () => {
    try {
      // Complete the session
      await completeSession(sessionId, rating || undefined, notes || undefined);
      setCurrentStep('complete');
      toast.success('Visualization session completed!');
    } catch (error) {
      toast.error('Failed to complete session. Please try again.');
      console.error('Session completion error:', error);
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      if (!sessionId) {
        toast.error('No active session to complete');
        return;
      }
      console.log('Completing session with ID:', sessionId);
      console.log('Rating:', rating);
      console.log('Notes:', notes);
      // Complete the session with current rating and notes
      await completeSession(sessionId, rating || undefined, notes || undefined);
      toast.success('Session saved successfully!');
      // Reset form for new session (only after successful completion)
      setRating(null);
      setNotes('');
      setCurrentStep('goal');
      setGoal('');
      setSelectedCategory('');
      setSelectedTimeline('');
      setCurrentEmotionalState('');
      setDesiredEmotionalState('');
      setQuestionAnswers({});
      setCurrentQuestionIndex(0);
      setGoalAnalysis(null);
      setChallenges(null);
      setGeneratedScript('');
      setSessionId('');
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        setAudioElement(null);
      }
    } catch (error) {
      toast.error('Failed to save session. Please try again.');
      console.error('Session save error:', error);
    }
  };

  const toggleAudio = () => {
    if (audioElement) {
      console.log('Audio element src:', audioElement.src);
      console.log('Audio element readyState:', audioElement.readyState);
      console.log('Audio element paused:', audioElement.paused);
      
      if (isAudioPlaying) {
        audioElement.pause();
      } else {
        audioElement.play().catch(error => {
          console.error('Error playing audio:', error);
          toast.error('Failed to play audio. Please try again.');
        });
      }
    } else {
      console.log('No audio element available');
      toast.error('No audio available for this session');
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'goal':
        return goal.trim().length > 0 && selectedCategory && selectedTimeline && currentEmotionalState && desiredEmotionalState;
      case 'analysis':
        return true;
      case 'voice':
        return selectedVoiceId !== null;
      case 'questions':
        return currentQuestion && questionAnswers[currentQuestion.questionId]?.trim().length > 0;
      case 'challenges':
        return true;
      case 'summary':
        return true;
      case 'visualization':
        return true;
      default:
        return true;
    }
  };

  const handleVoiceSelect = (voiceId: string, voiceName: string) => {
    setSelectedVoiceId(voiceId);
    setSelectedVoiceName(voiceName);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = GOAL_CATEGORIES.find(cat => cat.id === categoryId);
    return category ? category.icon : Target;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <Navigation />
      
      {/* Backend Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Backend service is not available. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Visualization Journey
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Brain className="h-4 w-4" />
              <span>{currentStepData?.title}</span>
            </div>
          </div>
          <Progress value={currentStepData?.progress || 0} className="h-2" />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'goal' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <Target className="h-6 w-6" />
                    What's Your Goal?
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    Define what you want to achieve or manifest in your life
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Goal Input */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Your Goal
                      </label>
                      <Input
                        placeholder="e.g., Start my own business, improve my health, find inner peace..."
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="text-lg py-3"
                      />
                    </div>

                    {/* Goal Category */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Goal Category
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {GOAL_CATEGORIES.map((category) => {
                          const IconComponent = category.icon;
                          return (
                            <button
                              key={category.id}
                              onClick={() => setSelectedCategory(category.id)}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                selectedCategory === category.id
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                  : 'border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              <IconComponent className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                              <div className="text-sm font-medium">{category.name}</div>
                              <div className="text-xs text-gray-500">{category.description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Timeline
                      </label>
                      <Select value={selectedTimeline} onValueChange={setSelectedTimeline}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMELINES.map((timeline) => (
                            <SelectItem key={timeline.id} value={timeline.id}>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{timeline.name}</span>
                                <span className="text-gray-500">({timeline.description})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Emotional States */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Current Emotional State
                        </label>
                        <Select value={currentEmotionalState} onValueChange={setCurrentEmotionalState}>
                          <SelectTrigger>
                            <SelectValue placeholder="How do you feel now?" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMOTIONAL_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Desired Emotional State
                        </label>
                        <Select value={desiredEmotionalState} onValueChange={setDesiredEmotionalState}>
                          <SelectTrigger>
                            <SelectValue placeholder="How do you want to feel?" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMOTIONAL_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                        💡 Tips for setting your goal:
                      </h3>
                      <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                        <li>• Be specific and concrete</li>
                        <li>• Focus on what you want, not what you don't want</li>
                        <li>• Make it meaningful to you personally</li>
                        <li>• Think big but keep it achievable</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'analysis' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <Brain className="h-6 w-6" />
                    Goal Analysis
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    Analyzing your goal and identifying potential challenges
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <motion.div
                      className="relative mx-auto"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Brain className="h-8 w-8 text-white" />
                      </div>
                    </motion.div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Analyzing your goal...
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Our AI is analyzing your goal to understand its complexity and identify potential challenges.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'voice' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <VoiceSelector
                    selectedVoiceId={selectedVoiceId}
                    onVoiceSelect={handleVoiceSelect}
                    sessionType="visualization"
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 'questions' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Deep Reflection
                    </CardTitle>
                    <span className="text-sm text-gray-500">
                      {currentQuestionIndex + 1} of 5
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Goal: <span className="font-medium">{goal}</span>
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  {isLoadingQuestion ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading your personalized question...</p>
                    </div>
                  ) : currentQuestion ? (
                  <div className="space-y-6">
                    <div>
                      <label className="text-lg font-medium text-gray-900 dark:text-white mb-4 block">
                          {currentQuestion.nextQuestion}
                      </label>
                        {currentQuestion.questionType === 'textarea' ? (
                      <Textarea
                        placeholder="Take your time to reflect deeply and answer honestly..."
                            value={questionAnswers[currentQuestion.questionId] || ''}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                        className="min-h-[120px] text-base"
                      />
                        ) : (
                          <Input
                            placeholder="Your answer..."
                            value={questionAnswers[currentQuestion.questionId] || ''}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            className="text-lg py-3"
                          />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          Question {currentQuestionIndex + 1} of {currentQuestion.totalQuestions}
                        </span>
                        <span>
                          {Object.keys(questionAnswers).length} answered
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No questions available at the moment.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 'challenges' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <Shield className="h-6 w-6" />
                    Challenge Mapping
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    Identifying potential obstacles and solutions for your goal
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <motion.div
                      className="relative mx-auto"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                    </motion.div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Mapping your challenges...
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Our AI is analyzing your responses to identify potential obstacles and create personalized solutions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'summary' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    Session Summary
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    Review your goal and insights before starting your visualization
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Goal Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Your Goal</h3>
                        <p className="text-purple-700 dark:text-purple-300">{goal}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {(() => {
                            const IconComponent = getCategoryIcon(selectedCategory);
                            return <IconComponent className="h-4 w-4" />;
                          })()}
                          <span className="text-sm text-purple-600 dark:text-purple-400">
                            {GOAL_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Voice Guide</h3>
                        <p className="text-blue-700 dark:text-blue-300">{selectedVoiceName || 'Selected voice'}</p>
                      </div>
                    </div>

                    {/* Goal Analysis */}
                    {goalAnalysis && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Goal Analysis</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700 dark:text-green-300">Complexity:</span>
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                              {goalAnalysis.goalComplexity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700 dark:text-green-300">Timeline:</span>
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                              {TIMELINES.find(t => t.id === selectedTimeline)?.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700 dark:text-green-300">Approach:</span>
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                              {goalAnalysis.recommendedApproach}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Challenges */}
                    {challenges && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                        <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-3">Identified Challenges</h3>
                        <div className="space-y-2">
                          {challenges.primaryChallenges?.slice(0, 3).map((challenge: string, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-orange-700 dark:text-orange-300">{challenge}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Your Answers */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Reflections</h3>
                      <div className="space-y-2">
                        {Object.entries(questionAnswers).map(([questionId, answer], index) => (
                          <div key={questionId} className="flex justify-between items-start">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Q{index + 1}:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white text-right max-w-xs">
                              {answer}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'visualization' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Guided Visualization</CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    Your personalized visualization for: <span className="font-medium">{goal}</span>
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <motion.div
                      className="relative mx-auto"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="h-32 w-32 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Brain className="h-12 w-12 text-white" />
                      </div>
                      <motion.div
                        className="absolute inset-0 h-32 w-32 mx-auto rounded-full border-4 border-purple-400 opacity-50"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Close your eyes and imagine...
                      </h3>
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg text-left">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {generatedScript || `You have achieved your goal: ${goal}. Feel the satisfaction and joy flowing through your body. See yourself living this reality clearly and vividly. Notice how confident and fulfilled you feel. This is not just a dream—this is your future becoming reality.`}
                        </p>
                      </div>
                    </div>
                    
                    {/* Audio Controls */}
                    {audioElement ? (
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleAudio}
                            className="flex items-center gap-2"
                          >
                            {isAudioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {isAudioPlaying ? 'Pause Audio' : 'Play Audio'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t pt-6">
                        <div className="text-center text-gray-500 text-sm">
                          <VolumeX className="h-4 w-4 mx-auto mb-2" />
                          Audio not available for this session
                        </div>
                      </div>
                    )}
                    
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={handleSessionComplete}
                    >
                      Complete Visualization
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'complete' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center mb-6">
                      <CheckCircle2 className="h-12 w-12 text-white" />
                    </div>
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Visualization Complete!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-8">
                    Excellent work! You've planted the seeds of manifestation. 
                    Remember to revisit this visualization regularly to strengthen your path to success.
                  </p>
                  
                  {/* Rating and Feedback */}
                  <div className="space-y-6 mb-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        How was your session?
                      </h3>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`p-2 rounded-full transition-colors ${
                              rating && rating >= star
                                ? 'text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          >
                            <Star className="h-6 w-6 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Any thoughts or notes? (optional)
                      </label>
                      <Textarea
                        placeholder="How are you feeling? What did you notice?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="max-w-md mx-auto"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => {
                      setCurrentStep('goal');
                      setGoal('');
                      setSelectedCategory('');
                      setSelectedTimeline('');
                      setCurrentEmotionalState('');
                      setDesiredEmotionalState('');
                      setQuestionAnswers({});
                      setCurrentQuestionIndex(0);
                      setGoalAnalysis(null);
                      setChallenges(null);
                    }}>
                      Start New Visualization
                    </Button>
                    <Button onClick={handleSaveAndContinue}>
                      Save & Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep !== 'complete' && (
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 'goal'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep === 'questions' ? (
              <Button
                onClick={handleNextQuestion}
                disabled={!canProceed() || isLoadingQuestion}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isLoadingQuestion ? (
                  'Loading...'
                ) : currentQuestion?.isLastQuestion ? (
                  'Complete Questions'
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
            <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
                {isLoading ? (
                  'Loading...'
                ) : (
                  <>
                    {currentStep === 'visualization' ? 'Complete' : 'Next'}
              <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
            </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}