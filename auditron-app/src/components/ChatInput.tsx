'use client';

import React, { useState } from 'react';
import './ChatInput.css';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="input-container">
      <div className="input-wrapper sizer">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask Audi about your cloud security... (e.g., 'What can you audit?' or 'Check my AWS S3 buckets')"
          disabled={isLoading}
          className="chat-input text-black"
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className="send-button"
          title="Send message"
        >
          →
        </button>
      </div>
    </div>
  );
};
