

'use client';

import { useState, Suspense } from 'react';
import { Header, MessageList, ChatInput, Sidebar, SampleQuestions } from '../components';
import Loading from '../components/Loading';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import '../components/App.css';

// Wrapper component to handle Suspense boundary for useSearchParams
function HomeContent() {
  const { messages, isLoading, currentStatus, streamingMessage, sendMessage, resetChat, documentData } = useChat();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return <Loading />;
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const hasMessages = messages.length > 0 || streamingMessage;

  return (
    <main className='w-full h-full relative'>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <Header onReset={resetChat} onToggleSidebar={toggleSidebar} />

      {/* Show sample questions when there are no messages */}
      {!hasMessages && user && (
        <div className="flex-1 overflow-y-auto">
          <SampleQuestions onQuestionClick={sendMessage} isLoading={isLoading} />
        </div>
      )}

      {/* Show message list when there are messages */}
      {hasMessages && (
        <MessageList
          messages={messages}
          isLoading={isLoading}
          currentStatus={currentStatus}
          streamingMessage={streamingMessage}
          documentData={documentData}
        />
      )}

      <div className='absolute w-full bottom-0'>
        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}
