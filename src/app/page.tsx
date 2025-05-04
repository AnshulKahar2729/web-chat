'use client';

import React from 'react';
import ChatPage from '@/components/ChatPage';

export default function Home(): React.ReactElement {
  return (
    <main className="min-h-screen bg-gray-100">
      <ChatPage />
    </main>
  );
}
