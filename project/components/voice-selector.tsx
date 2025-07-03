'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, Voice } from '@/lib/api';
import { Play, Pause, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceSelectorProps {
  selectedVoiceId: string | null;
  onVoiceSelect: (voiceId: string, voiceName: string) => void;
  sessionType: 'meditation' | 'visualization';
}

export function VoiceSelector({ selectedVoiceId, onVoiceSelect, sessionType }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const loadVoices = async () => {
    try {
      setIsLoading(true);
      const availableVoices = await api.getAvailableVoices();
      // Filter voices by session type or show all meditation voices
      const filteredVoices = availableVoices.filter(
        voice => voice.category === sessionType || voice.category === 'general' || voice.category === 'meditation'
      );
      setVoices(filteredVoices);
    } catch (error) {
      toast.error('Failed to load voices');
      console.error('Error loading voices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const playVoicePreview = async (voice: Voice) => {
    if (!voice.previewUrl) {
      toast.info('No preview available for this voice. You can select it to hear it during your session.');
      return;
    }

    try {
      // Stop current audio if playing
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }

      // Create new audio element
      const audio = new Audio(voice.previewUrl);
      audio.addEventListener('ended', () => {
        setPlayingVoiceId(null);
        setAudioElement(null);
      });

      audio.addEventListener('play', () => {
        setPlayingVoiceId(voice.id);
        setAudioElement(audio);
      });

      audio.addEventListener('pause', () => {
        setPlayingVoiceId(null);
        setAudioElement(null);
      });

      await audio.play();
    } catch (error) {
      toast.error('Failed to play voice preview');
      console.error('Error playing voice preview:', error);
    }
  };

  const stopVoicePreview = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      setPlayingVoiceId(null);
      setAudioElement(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Choose Your Voice Guide
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Select a voice that resonates with you for your {sessionType} session
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 w-16 mx-auto bg-gray-200 rounded-full mb-3" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Choose Your Voice Guide
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Select a voice that resonates with you for your {sessionType} session
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {voices.map((voice, index) => (
          <motion.div
            key={voice.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg",
                selectedVoiceId === voice.id
                  ? "ring-2 ring-primary shadow-lg"
                  : "hover:shadow-md"
              )}
              onClick={() => onVoiceSelect(voice.id, voice.name)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center text-white",
                      selectedVoiceId === voice.id
                        ? "bg-gradient-to-r from-blue-500 to-purple-600"
                        : "bg-gradient-to-r from-gray-400 to-gray-600"
                    )}>
                      <Volume2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {voice.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {voice.category}
                      </p>
                    </div>
                  </div>
                  
                  {voice.previewUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (playingVoiceId === voice.id) {
                          stopVoicePreview();
                        } else {
                          playVoicePreview(voice);
                        }
                      }}
                      className="h-8 w-8 p-0"
                    >
                      {playingVoiceId === voice.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {voice.description}
                </p>
                
                {selectedVoiceId === voice.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-3 flex items-center justify-center"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="ml-2 text-sm text-primary font-medium">
                      Selected
                    </span>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {voices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            No voices available for {sessionType} sessions at the moment.
          </p>
        </div>
      )}
    </div>
  );
} 