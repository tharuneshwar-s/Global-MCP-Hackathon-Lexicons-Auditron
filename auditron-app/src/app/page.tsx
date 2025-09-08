

'use client';

import { Header, MessageList, ChatInput } from '../components';
import { useChat } from '../hooks/useChat';
import '../components/App.css';

export default function Home() {
  const { messages, isLoading, currentStatus, streamingMessage, sendMessage, resetChat } = useChat();

  return (
    <main className='w-full h-full relative'>
      <Header onReset={resetChat} />
        <MessageList
          messages={messages}
          isLoading={isLoading}
          currentStatus={currentStatus}
          streamingMessage={streamingMessage}
        />
      <div className='absolute w-full bg-red-500 bottom-0'>
        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </main>
  );
}
