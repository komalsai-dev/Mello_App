'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const moods = [
  { id: 'stressed', emoji: '😤', label: 'Stressed', color: 'from-red-400 to-red-600' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', color: 'from-orange-400 to-orange-600' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: 'from-blue-400 to-blue-600' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: 'from-purple-400 to-purple-600' },
  { id: 'neutral', emoji: '😐', label: 'Neutral', color: 'from-gray-400 to-gray-600' },
  { id: 'happy', emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-yellow-600' },
  { id: 'excited', emoji: '🤩', label: 'Excited', color: 'from-pink-400 to-pink-600' },
  { id: 'peaceful', emoji: '😌', label: 'Peaceful', color: 'from-green-400 to-green-600' },
];

interface MoodSelectorProps {
  selectedMood: string | null;
  onMoodSelect: (mood: string) => void;
}

export function MoodSelector({ selectedMood, onMoodSelect }: MoodSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          How are you feeling right now?
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Select the mood that best describes your current state
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {moods.map((mood, index) => (
          <motion.div
            key={mood.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg",
                selectedMood === mood.id
                  ? "ring-2 ring-primary shadow-lg"
                  : "hover:shadow-md"
              )}
              onClick={() => onMoodSelect(mood.id)}
            >
              <CardContent className="p-4 text-center">
                <div className={cn(
                  "mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r text-2xl",
                  mood.color
                )}>
                  {mood.emoji}
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {mood.label}
                </p>
                {selectedMood === mood.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-2 mx-auto h-2 w-2 rounded-full bg-primary"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}