import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Paperclip, User } from 'lucide-react';
import {
    classifyIntent,
    generateChatResponse,
    transformToSupabaseQuery,
    generateInsightAndSummary
} from '../services/groqService';
import { executeQuery } from '../services/supabaseService';

const STORAGE_KEY = 'analyst_chat_messages';

function loadMessagesFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load messages from storage:', e);
    }
    return null;
}

function saveMessagesToStorage(messages) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
        console.error('Failed to save messages to storage:', e);
    }
}

const defaultMessages = [
    {
        text: "Hello! I'm your Data Analyst. I can help you analyze sales, profits, customers, and product performance.\n\nTry asking:\n• \"Show me sales by region\"\n• \"What are the top selling products?\"\n• \"Profit breakdown by category\"",
        isUser: false
    }
];

function TypingIndicator() {
    return (
        <div className="message ai">
            <div className="message-avatar ai">
                <Bot size={18} />
            </div>
            <div className="message-content">
                <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    );
}

function MessageBubble({ message, isUser }) {
    return (
        <div className={`message ${isUser ? 'user' : 'ai'}`}>
            <div className={`message-avatar ${isUser ? 'user' : 'ai'}`}>
                {isUser ? (
                    <User size={18} />
                ) : (
                    <Bot size={18} />
                )}
            </div>
            <div className="message-content">
                <p style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>

                {message.suggestions && (
                    <div className="message-suggestions">
                        {message.suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                className="suggestion-btn"
                                onClick={() => message.onSuggestionClick?.(suggestion)}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ChatPanel({ onQueryResult }) {
    const [messages, setMessages] = useState(() => {
        const stored = loadMessagesFromStorage();
        return stored || defaultMessages;
    });
    const [inputValue, setInputValue] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef(null);

    
    useEffect(() => {
        saveMessagesToStorage(messages);
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function processQuery(text) {
        if (!text.trim() || isProcessing) return;

        setIsProcessing(true);
        setMessages(prev => [...prev, { text: text, isUser: true }]);

        try {
            
            const { intent } = await classifyIntent(text);
            console.log("Classified Intent:", intent);

            if (intent === "general_chat") {
                
                const response = await generateChatResponse(text);
                setMessages(prev => [...prev, {
                    text: response,
                    isUser: false,
                    suggestions: ["Show me total sales", "Profit by region", "Top products"]
                }]);
                return;
            }

            
            const queryConfig = await transformToSupabaseQuery(text);
            console.log("Generated Query Config:", queryConfig);

            
            const { data, error } = await executeQuery(queryConfig);

            if (error) {
                throw new Error("Database Error: " + error);
            }

            if (!data || data.length === 0) {
                setMessages(prev => [...prev, {
                    text: "I ran the query but no data was returned. Try a different search criteria.",
                    isUser: false
                }]);
                onQueryResult([], null);
                return;
            }

            
            const analysis = await generateInsightAndSummary(text, data);

            
            onQueryResult(data, analysis);

            
            setMessages(prev => [...prev, {
                text: analysis.summary,
                isUser: false,
                suggestions: ["Visualize this", "Export data", "Drill down further"]
            }]);

        } catch (error) {
            console.error("Process Error:", error);
            setMessages(prev => [...prev, {
                text: `Sorry, I encountered an error: ${error.message}`,
                isUser: false
            }]);
        } finally {
            setIsProcessing(false);
        }
    }

    const handleSend = (e) => {
        e.preventDefault();
        processQuery(inputValue);
        setInputValue('');
    };

    const handleSuggestionClick = (suggestion) => {
        processQuery(suggestion);
    };

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
        <div className="chat-panel">
            {}
            <header className="chat-header">
                <div className="chat-header-top">
                    <h1>Analyst AI</h1>
                </div>
                <p className="chat-header-time">Today, {timeString}</p>
            </header>

            {}
            <div className="chat-messages">
                {messages.map((msg, idx) => (
                    <MessageBubble
                        key={idx}
                        message={{
                            ...msg,
                            onSuggestionClick: handleSuggestionClick
                        }}
                        isUser={msg.isUser}
                    />
                ))}
                {isProcessing && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>

            {}
            <div className="chat-input-area">
                <form className="chat-input-form" onSubmit={handleSend}>
                    <div className="chat-input-wrapper">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask a question about your data..."
                            disabled={isProcessing}
                            className="chat-input"
                        />
                        <Paperclip className="chat-input-icon" size={16} />
                    </div>
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isProcessing}
                        className={`send-btn ${inputValue.trim() && !isProcessing ? 'active' : 'inactive'}`}
                    >
                        {isProcessing ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <Send />
                        )}
                    </button>
                </form>
                <p className="chat-disclaimer">
                    AI can make mistakes. Verify important data.
                </p>
            </div>
        </div>
    );
}
