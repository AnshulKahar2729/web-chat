'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const categories = [
    { label: 'Summarize Article', systemMessage: 'You are an assistant that summarizes articles in a concise and clear way.' },
    { label: 'News', systemMessage: 'You summarize news articles and highlight key points.' },
    { label: 'Personal Site', systemMessage: 'You review and summarize personal websites or blogs.' },
    { label: 'LinkedIn Profile', systemMessage: 'You analyze LinkedIn profiles and summarize professional experience.' },
    { label: 'Explain Concept', systemMessage: 'You are an assistant that explains technical concepts in simple terms.' },
    { label: 'Generate Code', systemMessage: 'You are an assistant that generates clean and efficient code based on user requests.' },
    { label: 'SEO Content', systemMessage: 'You are an assistant that writes SEO-optimized content.' },
    { label: 'Chat Normally', systemMessage: 'You are a helpful, conversational assistant.' },
    { label: 'Company', systemMessage: 'You provide summaries and insights about companies and their operations.' },
    { label: 'Research Paper', systemMessage: 'You summarize and explain research papers clearly and concisely.' },
    { label: 'PDF', systemMessage: 'You read and summarize content from PDF documents.' },
    { label: 'Financial Report', systemMessage: 'You summarize and explain financial reports and key metrics.' },
];

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [systemMessage, setSystemMessage] = useState(categories[0].systemMessage);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const sendMessage = async () => {
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

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                assistantReply += chunk;
                setMessages((prev) => [
                    ...updatedMessages,
                    { role: 'assistant', content: assistantReply },
                ]);
            }

        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [
                ...updatedMessages,
                { role: 'assistant', content: '⚠️ Error fetching response.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col items-center p-4">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-3">EXA AI Assistant</h2>

            {/* Category Selector */}
            <div className="w-full max-w-3xl overflow-x-auto whitespace-nowrap mb-3 flex gap-2 pb-2 border-b scrollbar-thin scrollbar-thumb-gray-400">
                {categories.map((cat, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSystemMessage(cat.systemMessage)}
                        className={`px-4 py-1.5 rounded-full border text-sm flex-shrink-0 transition ${
                            systemMessage === cat.systemMessage
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                        }`}
                        disabled={loading}
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
                            <div
                                className={`p-3 rounded-xl max-w-[75%] text-base leading-relaxed transition ${
                                    msg.role === 'user'
                                        ? 'bg-blue-500 text-white rounded-br-none'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}
                            >
                                <span className="block text-sm font-semibold mb-1">
                                    {msg.role === 'user' ? 'You' : 'Assistant'}
                                </span>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        p: ({ node, ...props }) => (
                                            <p {...props} className="prose prose-sm max-w-full" />
                                        ),
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
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
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}
