'use client';

import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Brain,
  Heart,
  Sparkles,
  Users,
  Trophy,
  Clock,
  Star,
  Play,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: Heart,
    title: 'Mood-Based Meditation',
    description: 'Personalized meditation sessions that adapt to your current emotional state.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Brain,
    title: 'Visualization Coaching',
    description: 'Goal-oriented visualization exercises to manifest your dreams into reality.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Guidance',
    description: 'Advanced AI creates personalized scripts and audio for your unique journey.',
    color: 'from-purple-500 to-violet-500',
  },
  {
    icon: Users,
    title: 'Community Support',
    description: 'Join a supportive community of mindfulness practitioners.',
    color: 'from-green-500 to-emerald-500',
  },
];

const stats = [
  { label: 'Active Users', value: '10,000+', icon: Users },
  { label: 'Sessions Completed', value: '100K+', icon: Trophy },
  { label: 'Minutes Meditated', value: '1M+', icon: Clock },
  { label: 'Average Rating', value: '4.9', icon: Star },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
              Transform Your Mind with{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mello
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300 sm:text-xl">
              Discover personalized meditation and visualization experiences powered by AI. 
              Transform stress into serenity, goals into reality.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/meditation">
                  <Heart className="mr-2 h-5 w-5" />
                  Start Meditating
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/visualization">
                  <Brain className="mr-2 h-5 w-5" />
                  Try Visualization
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Hero Image/Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-4 flex justify-center"
          >
            <img
              src="/meditation.png"
              alt="Meditation Hero"
              style={{ width: 320, height: 320, objectFit: 'contain' }}
              className=""
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need for mindful living
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Powerful features designed to support your meditation and visualization practice
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-0 bg-white/80 dark:bg-gray-700/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${feature.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* One-Tap Sessions Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              One-Tap Sessions
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Start your meditation journey instantly with our pre-designed sessions
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Quick Relief */}
            <Card
              className="cursor-pointer border-0 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/10 hover:shadow-lg transition-shadow"
              onClick={() => router.push('/quick-relief')}
            >
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-500">
                  <span className="text-white text-3xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quick Relief</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">3-minute emergency stress relief</p>
                <span className="inline-block rounded-full bg-orange-200 dark:bg-orange-800/60 text-orange-800 dark:text-orange-100 px-4 py-1 text-sm font-medium">3 min</span>
              </CardContent>
            </Card>
            {/* Daily Practice */}
            <Card
              className="cursor-pointer border-0 bg-gradient-to-br from-blue-100 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/10 hover:shadow-lg transition-shadow"
              onClick={() => router.push('/daily-practice')}
            >
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-purple-500">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Daily Practice</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">10-minute regular meditation</p>
                <span className="inline-block rounded-full bg-blue-200 dark:bg-blue-800/60 text-blue-800 dark:text-blue-100 px-4 py-1 text-sm font-medium">10 min</span>
              </CardContent>
            </Card>
            {/* Deep Dive */}
            <Card
              className="cursor-pointer border-0 bg-gradient-to-br from-green-100 to-blue-50 dark:from-green-900/30 dark:to-blue-900/10 hover:shadow-lg transition-shadow"
              onClick={() => router.push('/deep-dive')}
            >
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-blue-400">
                  <span className="text-white text-3xl">🌊</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Deep Dive</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">20-minute extended session</p>
                <span className="inline-block rounded-full bg-green-200 dark:bg-green-800/60 text-green-800 dark:text-green-100 px-4 py-1 text-sm font-medium">20 min</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to begin your journey?
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              Join thousands of users who have transformed their lives with Mindful Coach
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/meditation">
                  Get Started Today
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}