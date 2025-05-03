'use client';

import React from 'react';
import ChatInterface from '@/components/ChatInterface';

export default function Home(): React.ReactElement {
  return (
    <main className="min-h-screen bg-gray-100">
      <ChatInterface />
    </main>
  );
}
