import React from 'react';
import type { Message } from '../types';
import './MessageList.css';

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    currentStatus?: string;
    streamingMessage?: string;
}

const markdownToHtml = (text: string) => {
    return text
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/~~(.*?)~~/g, '<s>$1</s>')
        // Enhanced link handling for download files
        .replace(/\[Download Report:\s*(.*?)\]\((.*?)\)/gi, '<div class="download-section"><strong>📁 Download Report:</strong><br/><a href="$2" download="$1" class="download-link" target="_blank" rel="noopener noreferrer">📄 $1</a></div>')
        .replace(/\[(.*?)\]\((\/reports\/.*?)\)/g, '<a href="$2" download class="download-link" target="_blank" rel="noopener noreferrer">📄 $1</a>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/^(#{1,6})\s*(.*)$/gm, (match, hashes, title) => {
            const level = hashes.length;
            return `<h${level}>${title}</h${level}>`;
        })
        .replace(/^\s*>\s*(.*)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^\s*-\s*(.*)$/gm, '<li>$1</li>')
        .replace(/^\s*\d+\.\s*(.*)$/gm, '<li>$1</li>')
        .replace(/\n/g, '<br/>')
        .replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>')
        .replace(/<\/ul><ul>/g, '')
        .replace(/<br\/><ul>/g, '<ul>')
        .replace(/<\/ul><br\/>/g, '</ul>')
        .replace(/<br\/><br\/>/g, '<br/><br/>')
        .replace("*", "•");
};

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, currentStatus, streamingMessage }) => {
    return (
        <div className="messages sizer h-[75vh]">
            {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                    <div className="message-avatar">
                        {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="message-content">
                        <div className="message-text">
                            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} />
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Streaming message with tool calling effects */}
            {isLoading && (
                <div className="message assistant streaming">
                    <div className="message-avatar">
                        🤖
                    </div>
                    <div className="message-content">
                        {/* Show streaming content if available */}
                        {streamingMessage && (
                            <div className="message-text streaming-text">
                                <div dangerouslySetInnerHTML={{ __html: markdownToHtml(streamingMessage) }} />
                                <span className="cursor">|</span>
                            </div>
                        )}
                        
                        {/* Show tool calling status */}
                        {currentStatus && (
                            <div className="tool-calling-container">
                                <div className="tool-calling-status">
                                    <div className="tool-icon">
                                        {currentStatus.includes('Calling') ? '🔧' : 
                                         currentStatus.includes('Processing') ? '' : 
                                         currentStatus.includes('Generating') ? '✨' : '🔍'}
                                    </div>
                                    <div className="tool-text">
                                        {currentStatus}
                                    </div>
                                    <div className="tool-loading">
                                        <div className="loading-dots">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Fallback typing indicator when no status */}
                        {!currentStatus && !streamingMessage && (
                            <div className="typing-indicator">
                                <div className="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <span className="typing-text">Audi is thinking...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
