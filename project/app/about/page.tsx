'use client';

import { Navigation } from '@/components/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Heart,
  Brain,
  Users,
  Shield,
  Sparkles,
  Target,
} from 'lucide-react';

const features = [
  {
    icon: Heart,
    title: 'Personalized Meditation',
    description: 'AI-powered sessions that adapt to your mood and preferences for optimal mindfulness practice.',
  },
  {
    icon: Brain,
    title: 'Guided Visualization',
    description: 'Transform your goals into reality with deep, scientifically-backed visualization techniques.',
  },
  {
    icon: Sparkles,
    title: 'Smart AI Coaching',
    description: 'Advanced algorithms create unique experiences tailored to your personal growth journey.',
  },
  {
    icon: Target,
    title: 'Goal Achievement',
    description: 'Structured approach to manifestation with proven techniques and progress tracking.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your personal journey is sacred. We protect your data with enterprise-grade security.',
  },
  {
    icon: Users,
    title: 'Community Support',
    description: 'Connect with like-minded individuals on their own paths to mindfulness and success.',
  },
];

const team = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Mindfulness Expert',
    bio: 'PhD in Psychology with 15+ years researching meditation and cognitive behavioral therapy.',
  },
  {
    name: 'Alex Rodriguez',
    role: 'AI Specialist',
    bio: 'Former Google engineer specializing in natural language processing and personalization.',
  },
  {
    name: 'Maya Patel',
    role: 'Wellness Coach',
    bio: 'Certified life coach and visualization expert with 1000+ hours of client sessions.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <Navigation />
      
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            About Mindful Coach
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We believe everyone deserves access to personalized mindfulness and manifestation tools. 
            Our AI-powered platform combines ancient wisdom with modern technology to help you 
            achieve inner peace and manifest your dreams.
          </p>
        </motion.section>

        {/* Mission Statement */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <Card className="border-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                To democratize access to personalized mindfulness and visualization coaching, 
                empowering individuals to transform their mental wellbeing and achieve their 
                highest potential through the perfect blend of technology and human wisdom.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Features */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              What Makes Us Different
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We combine cutting-edge AI technology with proven mindfulness techniques 
              to create truly personalized experiences for your growth journey.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card className="h-full border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our diverse team of experts brings together decades of experience in 
              psychology, technology, and wellness coaching.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-white">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {member.name}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">
                      {member.role}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {member.bio}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Values */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="border-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Our Values
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    🧘‍♀️ Mindful Innovation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    We thoughtfully integrate technology with wellness practices, ensuring our 
                    innovations enhance rather than complicate your mindfulness journey.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    🤝 Inclusive Wellness
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Mental wellness should be accessible to everyone, regardless of background, 
                    experience level, or personal circumstances.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    🔬 Science-Based Approach
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    All our techniques are grounded in peer-reviewed research and validated 
                    psychological principles for maximum effectiveness.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    🌱 Continuous Growth
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    We believe in the infinite potential for personal growth and are committed 
                    to evolving our platform alongside your journey.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}