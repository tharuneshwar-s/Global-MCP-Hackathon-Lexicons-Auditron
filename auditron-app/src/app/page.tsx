

'use client';

import { useState } from 'react';
import { Header, MessageList, ChatInput, Sidebar } from '../components';
import Loading from '../components/Loading';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import '../components/App.css';

export default function Home() {
  const { messages, isLoading, currentStatus, streamingMessage, sendMessage, resetChat } = useChat();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return <Loading />;
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <main className='w-full h-full relative'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <Header onReset={resetChat} onToggleSidebar={toggleSidebar} />
      <MessageList
        messages={messages}
        isLoading={isLoading}
        currentStatus={currentStatus}
        streamingMessage={streamingMessage}
      />
      <div className='absolute w-full bottom-0'>
        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </main>
  );
}
