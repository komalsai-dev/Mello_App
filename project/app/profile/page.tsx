'use client';

import { Navigation } from '@/components/navigation';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex flex-col">
      <Navigation />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <img
          src="/meditation.png"
          alt="Coming Soon"
          style={{ width: 180, height: 180, objectFit: 'contain' }}
          className="mx-auto mb-8"
        />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Profile Coming Soon
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          We're working hard to bring you a beautiful, personalized profile experience. Stay tuned for updates!
        </p>
      </div>
    </div>
  );
}