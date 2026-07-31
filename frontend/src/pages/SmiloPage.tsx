import React, { useRef, useEffect, useState } from 'react';

interface Item {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    status: string;
    date: string;
    image_file: string | null;
}

interface Message {
    sender: 'user' | 'bot';
    text: string;
    timestamp: Date;
    items?: Item[];
}

const playChime = (type: 'click' | 'think' | 'happy') => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const master = ctx.createGain();
        const delay  = ctx.createDelay(0.4);
        const dGain  = ctx.createGain();
        delay.delayTime.value = 0.22;
        dGain.gain.value      = 0.16;
        delay.connect(dGain); dGain.connect(master); master.connect(ctx.destination);
        const t = ctx.currentTime;

        const bell = (freq: number, start: number, vol: number, dur: number) => {
            const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
            o1.connect(g); o2.connect(g); g.connect(master); g.connect(delay);
            o1.type = 'sine'; o1.frequency.value = freq;
            o2.type = 'sine'; o2.frequency.value = freq * 2.756;
            const g2 = ctx.createGain(); o2.connect(g2); g2.gain.value = 0.1;
            g.gain.setValueAtTime(0, t + start);
            g.gain.linearRampToValueAtTime(vol, t + start + 0.012);
            g.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
            o1.start(t + start); o1.stop(t + start + dur);
            o2.start(t + start); o2.stop(t + start + dur);
        };

        if (type === 'click') {
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, i * 0.07, 0.16, 0.85));
            master.gain.setValueAtTime(0.7, t); master.gain.exponentialRampToValueAtTime(0.001, t + 1.05);
        } else if (type === 'happy') {
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, i * 0.04, 0.1, 0.9));
            master.gain.setValueAtTime(0.6, t); master.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
        } else {
            bell(293.66, 0, 0.06, 0.8); bell(369.99, 0.1, 0.05, 0.7);
            master.gain.setValueAtTime(0.5, t); master.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        }
    } catch (_) {}
};

const SmiloPage: React.FC = () => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: "Hi! I'm Smilo, your UNLOST assistant. Ask me anything about lost & found items or how to use the portal!", timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [botTyping, setBotTyping] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, botTyping]);

    const getBotResponse = async (history: Message[], text: string): Promise<{ text: string; items?: Item[] }> => {
        try {
            const historyPayload = history.map(m => ({ sender: m.sender, text: m.text }));
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: historyPayload })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                return { text: data.text, items: data.items };
            } else {
                return { text: "Sorry, my AI brain circuits are a bit scrambled right now! Please try again." };
            }
        } catch (error) {
            return { text: "I'm having trouble connecting to my central servers. Please check your connection." };
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim()) return;

        const userText = inputValue;
        setInputValue('');
        
        const newMessages = [...messages, { sender: 'user' as const, text: userText, timestamp: new Date() }];
        setMessages(newMessages);
        
        playChime('think');
        setBotTyping(true);
        
        setTimeout(async () => {
            const response = await getBotResponse(newMessages, userText);
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: response.text, 
                timestamp: new Date(),
                items: response.items 
            }]);
            setBotTyping(false);
            playChime('click');
        }, 1200);
    };

    const parseMarkdownLinks = (text: string) => {
        const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            parts.push(
                <a 
                    key={match.index} 
                    href={match[2]} 
                    className="text-emerald-400 hover:underline hover:text-emerald-300 font-semibold"
                >
                    {match[1]}
                </a>
            );
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }
        return parts.length > 0 ? parts : text;
    };

    return (
        <div className="w-full flex justify-center" style={{ height: 'calc(100vh - 160px)' }}>
            <div 
                className="flex flex-col w-full max-w-4xl h-full rounded-2xl overflow-hidden shadow-2xl bg-surface/95 border border-primary/10 backdrop-blur-xl"
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary/10 bg-primary/5">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]" />
                    <span className="text-sm font-bold text-text tracking-wider">SMILO ASSISTANT</span>
                </div>
            </div>

            {/* Message list */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 scroll-smooth">
                {messages.map((msg, i) => (
                    <div 
                        key={i} 
                        className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`
                            max-w-[85%] sm:max-w-[75%] p-4
                            ${msg.sender === 'user' ? 'rounded-2xl rounded-tr-sm btn-primary-custom' : 'rounded-2xl rounded-tl-sm bg-primary/5 border border-primary/10'}
                            text-text text-sm leading-relaxed whitespace-pre-line
                        `}>
                            {msg.sender === 'bot' ? parseMarkdownLinks(msg.text) : msg.text}


                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {botTyping && (
                    <div className="flex justify-start w-full">
                        <div className="p-4 rounded-2xl rounded-tl-sm bg-primary/5 border border-primary/10 flex gap-1.5 items-center">
                            {[0, 1, 2].map((idx) => (
                                <div 
                                    key={idx} 
                                    className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
                                    style={{ animationDelay: `${idx * 0.2}s` }} 
                                />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions */}
            <div className="px-6 pt-3 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {[
                    { label: 'Latest Items', query: 'Show latest items' },
                    { label: 'Report Item', query: 'How to report an item' },
                    { label: 'Claiming', query: 'How to claim an item' }
                ].map((s, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setInputValue(s.query);
                            setTimeout(() => handleSendMessage(), 50);
                        }}
                        className="text-xs px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-textSecondary hover:bg-primary/10 transition-colors focus:outline-none"
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Form */}
            <form 
                onSubmit={handleSendMessage} 
                className="flex p-6 border-t border-primary/10 gap-3"
            >
                <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask Smilo..."
                    className="flex-1 glass-input bg-surface border border-primary/10 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                    type="submit"
                    className="btn-primary-custom w-12 h-12 rounded-xl flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface shadow-md"
                >
                    ➔
                </button>
            </form>
        </div>
        </div>
    );
};

export default SmiloPage;
