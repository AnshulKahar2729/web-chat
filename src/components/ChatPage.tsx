'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { categories, Category } from '@/utils/categories';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    sources?: Array<{url: string, title: string}>;
    audioUrl?: string;
};

// Thinking animation component
const ThinkingAnimation = () => {
    return (
        <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-xl max-w-[75%] rounded-bl-none">
            <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
            </div>
            <span className="text-sm text-gray-500">Thinking...</span>
        </div>
    );
};

// Custom renderer for code blocks
const CodeBlock = ({className, children}: {className?: string, children: React.ReactNode}) => {
    const language = className ? className.replace(/language-/, '') : '';
    const codeString = children?.toString() || '';
    
    return (
        <div className="relative rounded-md overflow-hidden my-4">
            <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
                <span className="text-xs font-mono text-gray-400">{language || 'code'}</span>
                <button 
                    className="text-xs text-gray-400 hover:text-white transition"
                    onClick={() => {
                        navigator.clipboard.writeText(codeString);
                    }}
                >
                    Copy
                </button>
            </div>
            <pre className="bg-gray-900 p-4 overflow-x-auto text-gray-100 text-sm">
                <code>{children}</code>
            </pre>
        </div>
    );
};

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [systemMessage, setSystemMessage] = useState(categories[0].systemMessage);
    const [ttsLoading, setTtsLoading] = useState<number | null>(null);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Function to clean markdown formatting
    const cleanMarkdown = (text: string): string => {
        return text
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`([^`]+)`/g, '$1') // Remove inline code
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links but keep text
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
            .replace(/\*([^*]+)\*/g, '$1') // Remove italic
            .replace(/#{1,6}\s/g, '') // Remove headers
            .replace(/>\s/g, '') // Remove blockquotes
            .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
            .trim();
    };

    // Function to generate speech
    const generateSpeech = async (text: string, messageIndex: number): Promise<void> => {
        setTtsLoading(messageIndex);
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanMarkdown(text) }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate speech');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Update message with audio URL
            setMessages((prev: Message[]) => prev.map((msg: Message, idx: number) => 
                idx === messageIndex ? { ...msg, audioUrl } : msg
            ));
        } catch (error) {
            console.error('TTS error:', error);
        } finally {
            setTtsLoading(null);
        }
    };

    // Function to toggle play/pause
    const togglePlayPause = (messageIndex: number): void => {
        if (currentAudio) {
            if (isPlaying) {
                currentAudio.pause();
            } else {
                currentAudio.play();
            }
        } else if (messages[messageIndex].audioUrl) {
            const audio = new Audio(messages[messageIndex].audioUrl);
            setCurrentAudio(audio);
            
            audio.onended = () => {
                setIsPlaying(false);
                setCurrentAudio(null);
            };

            audio.onpause = () => {
                setIsPlaying(false);
            };

            audio.onplay = () => {
                setIsPlaying(true);
            };

            audio.play();
        }
    };

    // Function to extract URLs from markdown links
    const extractSourcesFromContent = (content: string): Array<{url: string, title: string}> | undefined => {
        const sources: Array<{url: string, title: string}> = [];
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        
        while ((match = linkRegex.exec(content)) !== null) {
            sources.push({
                title: match[1],
                url: match[2]
            });
        }
        
        return sources.length > 0 ? sources : undefined;
    };

    // Function to format citation links
    const formatCitations = (content: string): string => {
        return content.replace(/\[(\d+)\]/g, '<sup>$1</sup>');
    };

    // Update the sendMessage function to auto-trigger TTS
    const sendMessage = async (): Promise<void> => {
        if (!input.trim()) return;

        const newMessage: Message = { role: 'user', content: input.trim() };
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemMessage },
                        ...updatedMessages.map((msg) => ({
                            role: msg.role,
                            content: msg.content,
                        })),
                    ],
                }),
            });

            if (!response.body) throw new Error('No response stream');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantReply = '';

            // Add an empty assistant message to show the thinking animation
            setMessages([...updatedMessages, { role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data === '[DONE]') continue;
                            
                            const content = data.choices?.[0]?.delta?.content || '';
                            if (content) {
                                assistantReply += content;
                                const formattedContent = formatCitations(assistantReply);
                                const sources = extractSourcesFromContent(assistantReply);
                                
                                setMessages((prev: Message[]) => [
                                    ...updatedMessages,
                                    { 
                                        role: 'assistant', 
                                        content: formattedContent,
                                        sources
                                    },
                                ]);
                            }
                        } catch (e) {
                            console.warn('Invalid SSE data:', line.substring(6));
                        }
                    }
                }
            }

            // Auto-trigger TTS for the complete response
            if (assistantReply) {
                generateSpeech(assistantReply, updatedMessages.length);
            }

        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev: Message[]) => [
                ...updatedMessages,
                { role: 'assistant', content: '⚠️ Error fetching response. Please try again.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Function to handle category selection
    const handleCategorySelect = (category: Category): void => {
        setSystemMessage(category.systemMessage);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col items-center p-4">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-3">AI Assistant</h2>

            {/* Category Selector */}
            <div className="flex space-x-2 overflow-x-auto p-4 bg-white border-b">
                {categories.map((cat: Category, idx: number) => (
                    <button
                        key={idx}
                        onClick={() => handleCategorySelect(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            systemMessage === cat.systemMessage
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Chat Container */}
            <div className="w-full max-w-3xl flex flex-col flex-grow border rounded-lg shadow bg-white overflow-hidden h-[70vh]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && loading && idx === messages.length - 1 && msg.content === '' ? (
                                <ThinkingAnimation />
                            ) : (
                                <div
                                    className={`p-3 rounded-xl max-w-[75%] text-base leading-relaxed transition ${
                                        msg.role === 'user'
                                            ? 'bg-blue-500 text-white rounded-br-none'
                                            : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-semibold">
                                            {msg.role === 'user' ? 'You' : 'Assistant'}
                                        </span>
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-2 mt-2">
                                                {ttsLoading === idx ? (
                                                    <span className="text-sm text-gray-500 flex items-center gap-2">
                                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Generating audio...
                                                    </span>
                                                ) : msg.audioUrl && (
                                                    <button
                                                        onClick={() => togglePlayPause(idx)}
                                                        className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                                    >
                                                        {isPlaying ? (
                                                            <>
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Pause
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Play
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="prose prose-sm max-w-full">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeRaw]}
                                            components={{
                                                p: ({ node, ...props }) => (
                                                    <p {...props} className="my-2" />
                                                ),
                                                h1: ({ node, ...props }) => (
                                                    <h1 {...props} className="text-xl font-bold my-3" />
                                                ),
                                                h2: ({ node, ...props }) => (
                                                    <h2 {...props} className="text-lg font-bold my-2" />
                                                ),
                                                h3: ({ node, ...props }) => (
                                                    <h3 {...props} className="text-md font-bold my-2" />
                                                ),
                                                ul: ({ node, ...props }) => (
                                                    <ul {...props} className="list-disc pl-5 my-2" />
                                                ),
                                                ol: ({ node, ...props }) => (
                                                    <ol {...props} className="list-decimal pl-5 my-2" />
                                                ),
                                                li: ({ node, ...props }) => (
                                                    <li {...props} className="my-1" />
                                                ),
                                                blockquote: ({ node, ...props }) => (
                                                    <blockquote {...props} className="border-l-4 border-gray-300 pl-4 italic my-2" />
                                                ),
                                                code: ({ node, className, children, ...props }) => {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    return match ? (
                                                        <CodeBlock className={className}>{children}</CodeBlock>
                                                    ) : (
                                                        <code {...props} className="px-1 py-0.5 bg-gray-200 rounded text-red-500 text-sm">{children}</code>
                                                    );
                                                }
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                    
                                    {/* Sources/Citations Section */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-gray-200">
                                            <p className="text-xs text-gray-500 mb-1">Sources:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.sources.map((source, idx) => (
                                                    <a 
                                                        key={idx}
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs bg-gray-200 hover:bg-gray-300 rounded-full px-2 py-1 text-blue-600 transition"
                                                    >
                                                        {source.title || `Source ${idx + 1}`}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Bar pinned at bottom */}
                <div className="border-t p-3 flex gap-2 items-center bg-white">
                    <textarea
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = '42px';
                            target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Type your message... (Shift+Enter for new line)"
                        rows={1}
                        className="flex-1 resize-none px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black min-h-[42px] max-h-40 overflow-y-auto transition-all scrollbar-thin scrollbar-thumb-gray-400"
                        disabled={loading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className={`px-5 py-2 rounded-md font-semibold transition ${
                            loading || !input.trim()
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {loading ? 'Thinking...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}