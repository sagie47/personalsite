import React, { useState, useEffect, useRef } from 'react';
import Window from './Window';
import { BlogPost } from '../types';
import { PROJECTS } from '../constants';
import { GoogleGenAI } from "@google/genai";

interface BrowserProps {
    onClose: () => void;
    onFocus: () => void;
    zIndex: number;
    isFocused: boolean;
    isClosing?: boolean;
    blogPosts: BlogPost[];
    aboutContent: string;
    initialPath?: string;
}

// --- Dating Site Types & Data ---
interface DatingProfile {
    id: number;
    name: string;
    age: number;
    location: string;
    occupation: string;
    bio: string;
    image: string;
}

interface ChatMessage {
    sender: 'user' | 'match';
    text: string;
}

const FIRST_NAMES = ['Jennifer', 'Michael', 'Jessica', 'Chris', 'Amanda', 'Matt', 'Sarah', 'Joshua', 'Nicole', 'Andrew', 'Stephanie', 'Ryan', 'Heather', 'Justin', 'Elizabeth', 'Jason', 'Megan', 'David', 'Melissa', 'James'];
const LOCATIONS = ['Seattle, WA', 'Austin, TX', 'New York, NY', 'San Fran, CA', 'Chicago, IL', 'Boulder, CO', 'Portland, OR'];
const OCCUPATIONS = ['Webmaster', 'Pager Salesman', 'Blockbuster Clerk', 'Barista', 'HTML Architect', 'Zine Editor', 'Rollerblade Instructor', 'Temp', 'Student', 'Musician'];
const HOBBIES = ['collecting Pogs', 'hacky sack', 'watching X-Files', 'making mixtapes', 'coding Java', 'Magic: The Gathering', 'waiting for downloads', 'reading Wired', 'IRC chat', 'scanning photos'];
const QUOTES = [
    "My modem is faster than yours.",
    "Looking for my player 2.",
    "I own 3 Tamagotchis and they are all alive.",
    "Not looking for anyone who uses AOL.",
    "My mom says I'm cool.",
    "Will code HTML for food (or dates).",
    "I can solve a Rubik's cube in under 2 minutes.",
    "Y2K ready.",
    "Don't message me if you don't know who Mulder is.",
    "Looking for someone to help me install Windows 98."
];

const CHAT_RESPONSES = [
    "lol",
    "asl?",
    "cool... u have a pic?",
    "brb my mom needs the phone line",
    "do u like oasis?",
    "k",
    "internet is slow today :(",
    "wanna join my webring?",
    "rofl",
    "u seem nice",
    "gtg soon, X-Files is on"
];

const Browser: React.FC<BrowserProps> = ({ onClose, onFocus, zIndex, isFocused, isClosing, blogPosts, aboutContent, initialPath = 'home' }) => {
    // Default to Mail Client
    const [url, setUrl] = useState('mailto:sanj@sanj.com');
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [inputValue, setInputValue] = useState('');

    // --- Mail Client State ---
    const [mailForm, setMailForm] = useState({ from: '', subject: '', message: '' });
    const [mailStatus, setMailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    // --- Dating Site State ---
    const [datingProfiles, setDatingProfiles] = useState<DatingProfile[]>([]);
    const [datingView, setDatingView] = useState<'list' | 'profile' | 'chat'>('list');
    const [activeProfile, setActiveProfile] = useState<DatingProfile | null>(null);
    const [chats, setChats] = useState<Record<number, ChatMessage[]>>({});
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initialize generic profiles once
    useEffect(() => {
        const profiles: DatingProfile[] = Array.from({ length: 8 }).map((_, i) => {
            const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
            const hobby = HOBBIES[Math.floor(Math.random() * HOBBIES.length)];
            const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
            return {
                id: i,
                name: name,
                age: 19 + Math.floor(Math.random() * 12),
                location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
                occupation: OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)],
                bio: `Hi! I'm ${name}. I enjoy ${hobby}. ${quote}`,
                image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${name + i}`
            };
        });
        setDatingProfiles(profiles);
    }, []);

    // Handle external path changes
    useEffect(() => {
        if (initialPath) {
            navigate(initialPath);
        }
    }, [initialPath]);

    const navigate = (path: string) => {
        // Internal Routing Logic
        let newUrl = '';
        if (path === 'lovelink') {
            newUrl = 'http://www.lovelink.com';
            setDatingView('list');
        } else if (path === 'home') {
            newUrl = 'http://www.sanj.com/home';
        } else if (path === 'projects') {
            newUrl = 'http://www.sanj.com/projects';
        } else if (path === 'mail') {
            newUrl = 'mailto:sanj@sanj.com';
        } else if (path === 'about') {
            newUrl = 'http://www.sanj.com/about';
        } else if (!isNaN(parseInt(path))) {
            newUrl = `http://www.sanj.com/blog/${path}`;
        } else {
            newUrl = `http://www.sanj.com/${path}`;
        }

        setCurrentPath(path);
        setUrl(newUrl);
        setInputValue(newUrl);
    };

    const handleGo = (e?: React.FormEvent) => {
        e?.preventDefault();
        // Rudimentary routing
        const lowerVal = inputValue.toLowerCase();
        if (lowerVal.includes('sanj.com/home')) navigate('home');
        else if (lowerVal.includes('sanj.com/projects')) navigate('projects');
        else if (lowerVal.includes('sanj.com/about')) navigate('about');
        else if (lowerVal.includes('lovelink') || lowerVal.includes('love-match')) navigate('lovelink');
        else if (lowerVal.includes('mail') || lowerVal.includes('@')) navigate('mail');
        else {
            // Check blog ids
            const match = inputValue.match(/blog\/(\d+)/);
            if (match && match[1]) {
                navigate(match[1]);
            } else {
                // Fallback to home if unknown, or stay put (simulating 404 handled in render)
                setCurrentPath('404');
            }
        }
    };

    // --- Mail Client Logic ---
    const handleSendMail = (e: React.FormEvent) => {
        e.preventDefault();
        setMailStatus('sending');
        setTimeout(() => {
            setMailStatus('sent');
            setMailForm({ from: '', subject: '', message: '' });
        }, 1500);
    };

    // --- Dating Site Logic ---
    const handleProfileClick = (profile: DatingProfile) => {
        setActiveProfile(profile);
        setDatingView('profile');
    };

    const handleStartChat = () => {
        if (!activeProfile) return;
        setDatingView('chat');
        // Init chat if empty
        if (!chats[activeProfile.id]) {
            setChats(prev => ({
                ...prev,
                [activeProfile.id]: [{ sender: 'match', text: `Hey! I see you like ${activeProfile.occupation.toLowerCase()} stuff. ASL?` }]
            }));
        }
    };

    const sendChatMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProfile || !chatInput.trim()) return;

        const userText = chatInput;
        const userMsg: ChatMessage = { sender: 'user', text: userText };
        const profileId = activeProfile.id;

        setChats(prev => ({
            ...prev,
            [profileId]: [...(prev[profileId] || []), userMsg]
        }));
        setChatInput('');

        // Scroll to bottom
        setTimeout(() => {
            if (chatEndRef.current) {
                chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 10);

        try {
            // Initialize Gemini AI
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const currentHistory = chats[profileId] || [];
            const contents = currentHistory.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            contents.push({ role: 'user', parts: [{ text: userText }] });

            const systemInstruction = `You are ${activeProfile.name}, a ${activeProfile.age}-year-old ${activeProfile.occupation} living in ${activeProfile.location}.
Your bio is: "${activeProfile.bio}".
You are chatting on "LoveLink", a 1990s dating website.
- Adopt a 90s persona (references to 90s pop culture, slow internet, pagers, etc. are encouraged).
- Use some 90s internet slang (e.g., "lol", "brb", "da bomb") but keep it readable.
- Be casual, conversational, and maybe a little flirtatious if it fits the context.
- Keep responses short, like a chat message.
- Do NOT admit to being an AI. You are a human using a slow computer.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: contents,
                config: {
                    systemInstruction: systemInstruction,
                    maxOutputTokens: 150,
                }
            });

            const responseText = response.text || "...";
            const matchMsg: ChatMessage = { sender: 'match', text: responseText };

            setChats(prev => ({
                ...prev,
                [profileId]: [...(prev[profileId] || []), matchMsg]
            }));

        } catch (error) {
            console.error("Gemini AI Error:", error);
            // Fallback to canned response logic if API fails
            setTimeout(() => {
                const randomResponse = CHAT_RESPONSES[Math.floor(Math.random() * CHAT_RESPONSES.length)];
                const matchMsg: ChatMessage = { sender: 'match', text: randomResponse };
                setChats(prev => ({
                    ...prev,
                    [profileId]: [...(prev[profileId] || []), matchMsg]
                }));
            }, 1500);
        }

        // Scroll again after response
        setTimeout(() => {
            if (chatEndRef.current) {
                chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    // --- Rendering ---
    const renderMailClient = () => {
        return (
            <div className="flex flex-col h-full bg-[#c0c0c0] font-sans">
                <div className="bg-[#000080] text-white p-1 px-2 font-bold text-sm flex justify-between items-center">
                    <span>SanjMail v1.0 - [Compose]</span>
                    <span>_ [] X</span>
                </div>

                {/* Menu */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 py-2 text-sm border-b border-gray-400 mb-1">
                    <span className="underline">F</span>ile
                    <span className="underline">E</span>dit
                    <span className="underline">V</span>iew
                    <span className="underline">I</span>nsert
                    <span className="underline">F</span>ormat
                    <span className="underline">H</span>elp
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap gap-2 p-1 border-b border-white mb-2 shadow-sm">
                    <button onClick={handleSendMail} className="touch-manipulation flex flex-col items-center justify-center w-14 h-12 border border-gray-500 bg-[#d4d0c8] active:border-inset active:bg-gray-400">
                        <span className="text-lg">✉️</span>
                        <span className="text-[9px]">Send</span>
                    </button>
                    <button className="touch-manipulation flex flex-col items-center justify-center w-14 h-12 border border-gray-500 bg-[#d4d0c8]">
                        <span className="text-lg">📎</span>
                        <span className="text-[9px]">Attach</span>
                    </button>
                    <button className="touch-manipulation flex flex-col items-center justify-center w-14 h-12 border border-gray-500 bg-[#d4d0c8]">
                        <span className="text-lg">💾</span>
                        <span className="text-[9px]">Save</span>
                    </button>
                </div>

                {mailStatus === 'sent' ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-white border-2 border-gray-500 m-2 inset-shadow">
                        <div className="text-4xl mb-4">📨</div>
                        <h2 className="text-xl font-bold text-green-700 mb-2">Message Sent!</h2>
                        <p className="text-gray-600 mb-4">Your email has been queued for delivery.</p>
                        <button
                            onClick={() => setMailStatus('idle')}
                            className="touch-manipulation min-h-11 px-4 py-2 bg-[#c0c0c0] border-2 border-white border-b-black border-r-black active:border-t-black active:border-l-black"
                        >
                            Write Another
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
                        <div className="grid grid-cols-[60px_1fr] items-center gap-2">
                            <label className="text-right text-xs">To:</label>
                            <input className="border border-gray-500 px-1 text-sm bg-gray-100" value="Sanj [Webmaster]" disabled />
                        </div>
                        <div className="grid grid-cols-[60px_1fr] items-center gap-2">
                            <label className="text-right text-xs">From:</label>
                            <input
                                className="min-h-11 border border-gray-500 px-2 text-sm"
                                value={mailForm.from}
                                onChange={e => setMailForm({ ...mailForm, from: e.target.value })}
                                placeholder="guest@internet.com"
                            />
                        </div>
                        <div className="grid grid-cols-[60px_1fr] items-center gap-2">
                            <label className="text-right text-xs">Subject:</label>
                            <input
                                className="min-h-11 border border-gray-500 px-2 text-sm"
                                value={mailForm.subject}
                                onChange={e => setMailForm({ ...mailForm, subject: e.target.value })}
                            />
                        </div>

                        <div className="flex-1 mt-2 border border-gray-500 bg-white p-1">
                            <textarea
                                className="w-full h-full resize-none outline-none font-mono text-sm p-2 touch-manipulation"
                                value={mailForm.message}
                                onChange={e => setMailForm({ ...mailForm, message: e.target.value })}
                                placeholder={mailStatus === 'sending' ? 'Sending...' : 'Type your message here...'}
                                disabled={mailStatus === 'sending'}
                            />
                        </div>

                        <div className="h-4 border-t border-gray-400 text-[10px] text-gray-500 flex items-center">
                            {mailStatus === 'sending' ? 'Connecting to SMTP server...' : 'Ready'}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderDatingSite = () => {
        if (datingView === 'list') {
            return (
                <div className="font-sans bg-[#ffcccc] min-h-full p-4">
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-serif text-red-600 font-bold tracking-widest italic drop-shadow-md">LoveLink.com</h1>
                        <p className="text-xs font-bold text-gray-600">Making Connections at 56k Modem Speeds</p>
                        <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-400 to-transparent my-2"></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {datingProfiles.map(profile => (
                            <div key={profile.id} className="touch-manipulation bg-white border-2 border-pink-300 p-3 min-h-32 flex flex-col items-center shadow-md cursor-pointer hover:bg-pink-50 active:bg-pink-100" onClick={() => handleProfileClick(profile)}>
                                <img src={profile.image} alt={profile.name} className="w-16 h-16 bg-gray-200 border border-gray-400 mb-2" />
                                <div className="font-bold text-blue-800 underline text-sm">{profile.name}</div>
                                <div className="text-xs text-gray-500">{profile.age} / {profile.location.split(',')[1].trim()}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center text-xs text-gray-500 font-serif border-t border-red-300 pt-2">
                        &copy; 1995 LoveLink Inc. | Best viewed with Netscape Navigator | <span className="text-blue-600 underline">Webmaster</span>
                    </div>
                </div>
            );
        }

        if (datingView === 'profile' && activeProfile) {
            return (
                <div className="font-sans bg-[#ffcccc] min-h-full p-4 sm:p-6">
                    <button onClick={() => setDatingView('list')} className="touch-manipulation min-h-11 px-2 text-blue-700 underline text-sm mb-4">&lt;&lt; Back to Search Results</button>

                    <div className="bg-white border-2 border-pink-400 p-4 shadow-lg max-w-lg mx-auto">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <img src={activeProfile.image} alt={activeProfile.name} className="w-32 h-32 bg-gray-100 border-2 border-gray-300 shadow-inner" />
                                <button onClick={handleStartChat} className="touch-manipulation min-h-11 w-full bg-red-500 text-white font-bold py-2 px-3 text-sm border-2 border-red-700 active:border-red-300 shadow">
                                    Message Me!
                                </button>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-800 border-b border-pink-200 mb-2">{activeProfile.name}</h2>
                                <div className="text-sm grid grid-cols-[80px_1fr] gap-y-1">
                                    <span className="font-bold text-gray-600">Age:</span>
                                    <span>{activeProfile.age}</span>

                                    <span className="font-bold text-gray-600">Location:</span>
                                    <span>{activeProfile.location}</span>

                                    <span className="font-bold text-gray-600">Job:</span>
                                    <span>{activeProfile.occupation}</span>
                                </div>

                                <div className="mt-4">
                                    <span className="font-bold text-gray-600 text-sm block mb-1">About Me:</span>
                                    <p className="text-sm bg-yellow-50 p-2 border border-yellow-200 italic text-gray-700">
                                        "{activeProfile.bio}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (datingView === 'chat' && activeProfile) {
            return (
                <div className="font-sans bg-[#e0e0e0] min-h-full flex flex-col h-full">
                    {/* Chat Header */}
                    <div className="bg-blue-800 text-white p-2 font-bold flex justify-between items-center text-sm">
                        <span>Instant Message - {activeProfile.name}</span>
                        <button onClick={() => setDatingView('profile')} className="touch-manipulation min-h-11 min-w-11 bg-gray-300 text-black px-2 border border-white text-xs">X</button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 bg-white border-2 border-gray-500 m-2 p-2 overflow-y-auto font-mono text-sm inset-shadow">
                        {chats[activeProfile.id]?.map((msg, idx) => (
                            <div key={idx} className={`mb-1 ${msg.sender === 'user' ? 'text-blue-800 text-right' : 'text-red-700 text-left'}`}>
                                <span className="font-bold">{msg.sender === 'user' ? 'You' : activeProfile.name}: </span>
                                <span>{msg.text}</span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={sendChatMessage} className="p-2 pt-0 flex gap-2">
                        <input
                            className="flex-1 min-h-11 border-2 border-gray-500 p-2 font-mono text-sm"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            autoFocus
                            placeholder="Type a message..."
                        />
                        <button type="submit" className="touch-manipulation min-h-11 bg-[#c0c0c0] border-2 border-white border-b-black border-r-black px-4 font-bold active:border-t-black active:border-l-black active:border-r-white active:border-b-white">
                            Send
                        </button>
                    </form>
                </div>
            );
        }
        return null;
    };

    const renderContent = () => {
        // Handle Mail Route
        if (currentPath === 'mail') {
            return renderMailClient();
        }

        // Handle LoveLink Route
        if (currentPath === 'lovelink') {
            return renderDatingSite();
        }

        if (currentPath === 'projects') {
            return (
                <div className="p-4 sm:p-6 font-serif bg-white min-h-full">
                    <div className="border-b-4 border-gray-800 mb-6 pb-2">
                        <h1 className="text-4xl font-bold text-gray-800">My Projects</h1>
                        <p className="text-gray-600 mt-1">A directory of digital artifacts.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {PROJECTS.map(project => (
                            <div key={project.id} className="border-2 border-gray-400 bg-gray-50 p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                                <div className="bg-blue-900 text-white px-2 py-1 flex justify-between items-center mb-2">
                                    <span className="font-bold font-sans text-sm">{project.title}</span>
                                    <span className="text-xs bg-blue-800 px-1">{project.year}</span>
                                </div>
                                <div className="p-2">
                                    <p className="mb-3 text-gray-800 leading-relaxed">{project.description}</p>
                                    <div className="mb-3">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tech Stack:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {project.techStack.map(tech => (
                                                <span key={tech} className="bg-gray-200 border border-gray-400 px-1 text-xs font-mono text-blue-800">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {project.link && (
                                        <a href={project.link} className="inline-block text-blue-600 underline text-sm hover:text-red-500">
                                            [View Source]
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <button onClick={() => navigate('home')} className="touch-manipulation min-h-11 px-3 text-blue-600 underline">&lt; Return to Home</button>
                    </div>
                </div>
            );
        }

        if (currentPath === 'home') {
            return (
                <div className="p-4 sm:p-6 font-serif bg-white min-h-full">
                    <h1 className="text-4xl font-bold mb-4 text-blue-800 underline">Welcome to Sanj's Web Portal</h1>
                    <p className="mb-4">This is my personal corner of the World Wide Web.</p>
                    <div className="border-t border-b border-gray-300 py-4 my-4">
                        <h2 className="text-2xl font-bold mb-2">Latest Blog Posts</h2>
                        <ul className="list-disc pl-5">
                            {blogPosts.map(post => (
                                <li key={post.id} className="mb-1">
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate(post.id.toString()); }} className="touch-manipulation inline-block py-2 text-blue-600 underline hover:text-red-600">
                                        {post.title}
                                    </a>
                                    <span className="text-gray-500 text-xs ml-2">({post.date})</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Cool Links</h2>
                        <ul className="list-disc pl-5">
                            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('projects'); }} className="touch-manipulation inline-block py-2 text-blue-600 underline font-bold">My Projects</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('about'); }} className="touch-manipulation inline-block py-2 text-blue-600 underline">About Me</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('lovelink'); }} className="touch-manipulation inline-block py-2 text-blue-600 underline">LoveLink (Dating)</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('mail'); }} className="touch-manipulation inline-block py-2 text-blue-600 underline">Contact Me</a></li>
                        </ul>
                    </div>
                </div>
            );
        }

        // Handle About
        if (currentPath === 'about') {
            return (
                <div className="p-4 sm:p-6 font-serif bg-white min-h-full">
                    <h1 className="text-3xl font-bold mb-4">About Me</h1>
                    <div className="whitespace-pre-wrap font-sans">{aboutContent}</div>
                </div>
            );
        }

        // Handle Blog Post
        const postId = parseInt(currentPath);
        if (!isNaN(postId)) {
            const post = blogPosts.find(p => p.id === postId);
            if (post) {
                return (
                    <div className="p-4 sm:p-6 font-serif bg-white min-h-full">
                        <button onClick={() => navigate('home')} className="touch-manipulation min-h-11 px-3 text-blue-600 underline mb-4">&lt; Back to Home</button>
                        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
                        <div className="text-gray-500 text-sm mb-6">{post.date}</div>
                        <div className="whitespace-pre-wrap font-sans leading-relaxed">{post.content}</div>
                    </div>
                );
            }
        }

        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-200">
                <h1 className="text-4xl text-gray-500 font-bold mb-2">404</h1>
                <p>Page Not Found</p>
                <button onClick={() => navigate('home')} className="touch-manipulation min-h-11 px-3 mt-4 text-blue-600 underline">Go Home</button>
            </div>
        );
    };

    return (
        <Window
            title="Netscape Navigator"
            onClose={onClose}
            onFocus={onFocus}
            zIndex={zIndex}
            isFocused={isFocused}
            isClosing={isClosing}
            width="min(800px, 95vw)"
            height="min(600px, 85vh)"
            initialX={40}
            initialY={40}
            icon={<div className="bg-teal-700 text-white font-serif font-bold w-full h-full flex items-center justify-center">N</div>}
        >
            <div className="flex flex-col h-full bg-[#c0c0c0] border-t border-l border-white border-b border-r border-gray-600">
                {/* Menu Bar */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 py-2 text-sm border-b border-gray-400">
                    <span className="underline cursor-pointer">F</span>ile
                    <span className="underline cursor-pointer">E</span>dit
                    <span className="underline cursor-pointer">V</span>iew
                    <span className="underline cursor-pointer">G</span>o
                    <span className="underline cursor-pointer">B</span>ookmarks
                    <span className="underline cursor-pointer">O</span>ptions
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 p-1 border-b border-white mb-1">
                    <button onClick={() => navigate('home')} className="touch-manipulation win95-btn px-2 py-2 text-xs font-bold flex flex-col items-center min-w-[58px]">
                        <span className="text-lg">🏠</span>
                        Home
                    </button>
                    <button onClick={() => navigate('projects')} className="touch-manipulation win95-btn px-2 py-2 text-xs font-bold flex flex-col items-center min-w-[58px]">
                        <span className="text-lg">📁</span>
                        Projects
                    </button>
                    <button onClick={() => navigate('mail')} className="touch-manipulation win95-btn px-2 py-2 text-xs font-bold flex flex-col items-center min-w-[58px]">
                        <span className="text-lg">✉️</span>
                        Mail
                    </button>
                    <button onClick={() => navigate('lovelink')} className="touch-manipulation win95-btn px-2 py-2 text-xs font-bold flex flex-col items-center min-w-[58px]">
                        <span className="text-lg">❤️</span>
                        Dating
                    </button>
                    <div className="flex-1"></div>
                    <div className="bg-black w-8 h-8 self-center animate-pulse"></div>
                </div>

                {/* Address Bar */}
                <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-400">
                    <span className="text-xs font-bold">Location:</span>
                    <form onSubmit={handleGo} className="flex-1 flex">
                        <input
                            className="flex-1 min-h-11 border-2 border-gray-500 border-inset px-2 text-sm font-mono touch-manipulation"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                    </form>
                </div>

                {/* Viewport */}
                <div className="flex-1 bg-white border-2 border-gray-500 border-inset overflow-auto m-1 relative">
                    {renderContent()}
                </div>

                {/* Status Bar */}
                <div className="h-5 border-t border-gray-400 flex items-center px-2 text-xs text-gray-600 shadow-inner bg-[#c0c0c0]">
                    Document: Done
                </div>
            </div>
        </Window>
    );
};

export default Browser;
