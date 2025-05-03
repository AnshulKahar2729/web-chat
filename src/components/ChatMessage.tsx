import React from 'react';
import { Message } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
    message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    // Determine message type for styling
    const isUser = message.role === 'user';
    const isTool = message.role === 'tool' || message.role === 'function';

    // Style based on message type
    let containerStyle = 'max-w-3xl px-4 py-2 rounded-lg';

    if (isUser) {
        containerStyle += ' bg-blue-500 text-white ml-auto';
    } else if (isTool) {
        containerStyle += ' bg-gray-100 text-gray-700 border border-gray-300';
    } else {
        containerStyle += ' bg-gray-200 text-black';
    }

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={containerStyle}>
                {isTool && message.name && (
                    <div className="text-xs text-gray-500 mb-1">Tool: {message.name}</div>
                )}
                <ReactMarkdown components={{
                    p: ({ node, ...props }) => <p {...props} className="prose max-w-none prose-sm" />,
                }}>
                    {message.content}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default ChatMessage;
