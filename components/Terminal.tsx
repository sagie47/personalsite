import React, { useState, useEffect, useRef } from 'react';
import { WELCOME_MESSAGE, ASCII_ART, PROJECTS } from '../constants';
import { TerminalLine, BlogPost } from '../types';
import Window from './Window';

interface TerminalProps {
    onClose: () => void;
    onFocus: () => void;
    onOpenApp: (appId: string) => void;
    zIndex: number;
    isFocused?: boolean;
    isClosing?: boolean;
    blogPosts: BlogPost[];
    setBlogPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
    aboutContent: string;
    setAboutContent: React.Dispatch<React.SetStateAction<string>>;
}

const WaveAscii: React.FC = () => {
    const lines = ASCII_ART.split('\n');
    return (
        <div className="font-bold leading-none select-none text-[8px] sm:text-xs md:text-sm text-[#ff1fad]">
            {lines.map((line, lineIdx) => (
                <div key={lineIdx} className="whitespace-pre h-[1em]">
                    {line.split('').map((char, charIdx) => (
                        <span
                            key={charIdx}
                            style={{ animationDelay: `${(charIdx * 0.02) + (lineIdx * 0.1)}s` }}
                            className="inline-block animate-wave"
                        >
                            {char}
                        </span>
                    ))}
                </div>
            ))}
        </div>
    );
};

const Terminal: React.FC<TerminalProps> = ({ onClose, onFocus, onOpenApp, zIndex, isFocused = true, isClosing = false, blogPosts, setBlogPosts, aboutContent, setAboutContent }) => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<TerminalLine[]>([]);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [cursorPos, setCursorPos] = useState(0);
    const [isBooting, setIsBooting] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Modes
    type InteractiveMode = 'none' | 'blog' | 'admin-pass' | 'admin-menu' | 'admin-write-title' | 'admin-write-content' | 'admin-edit-about';
    const [interactiveMode, setInteractiveMode] = useState<InteractiveMode>('none');
    const [menuSelection, setMenuSelection] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '' });

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Ref to hold the latest processCommand function to avoid stale closures in click handlers
    const processCommandRef = useRef<(cmd: string, skipInputLog?: boolean) => Promise<void>>(async () => { });

    const addLine = (content: React.ReactNode, idSuffix: string = '-sys') => {
        setHistory(prev => [
            ...prev,
            {
                id: Date.now().toString() + idSuffix + Math.random(),
                type: 'output',
                content
            }
        ]);
    };

    useEffect(() => {
        let isMounted = true;
        const runBootSequence = async () => {
            const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
            setHistory([]);

            addLine(<div><span className="text-slate-400">MS-DOS Version 6.22</span></div>);
            addLine(<div><span className="text-slate-400">Loading SYSTEM_OS...</span></div>);
            await wait(600);

            if (!isMounted) return;
            addLine(<WaveAscii />);
            await wait(800);

            if (!isMounted) return;
            addLine(<div className="whitespace-pre-wrap mb-4 leading-normal text-[#e0e0e0]">{WELCOME_MESSAGE}</div>);

            setIsBooting(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        };

        runBootSequence();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, isBooting, isProcessing, interactiveMode, menuSelection]);

    const handleContainerClick = () => {
        onFocus();
        if (!isBooting && !isProcessing) {
            inputRef.current?.focus();
        }
    };

    const renderMarkdown = (text: string): React.ReactNode => {
        const lines = text.split('\n');
        return (
            <div className="flex flex-col gap-1 my-2">
                {lines.map((line, idx) => {
                    if (line.trim() === '') return <div key={idx} className="h-4" />;
                    if (line.startsWith('# ')) return <div key={idx} className="text-[#ff1fad] underline font-bold mt-2 mb-1">{line.substring(2)}</div>;
                    if (line.startsWith('- ')) return <div key={idx} className="pl-4">- {parseInlineStyles(line.substring(2))}</div>;
                    return <div key={idx}>{parseInlineStyles(line)}</div>;
                })}
            </div>
        );
    };

    const parseInlineStyles = (text: string): React.ReactNode[] => {
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <span key={i} className="text-[#ff1fad] font-bold">{part.slice(2, -2)}</span>;
            if (part.startsWith('*') && part.endsWith('*')) return <span key={i} className="text-[#ff1fad]/70 italic">{part.slice(1, -1)}</span>;
            return <span key={i}>{part}</span>;
        });
    };

    const executeBlogSelect = (index: number) => {
        setInteractiveMode('none');
        const post = blogPosts[index];
        setHistory(prev => [...prev, {
            id: Date.now() + '-select',
            type: 'input',
            content: <div><span className="mr-2 text-[#ff1fad]">{'>'}</span>blog {post.id}</div>
        }]);
        processCommand(`blog ${post.id}`, true);
    };

    const showAdminMenu = () => {
        setInteractiveMode('admin-menu');
        addLine(
            <div className="my-2 border border-green-700 p-2 bg-green-900/10">
                <div className="text-green-400 font-bold mb-2">ADMINISTRATOR CONTROL PANEL</div>
                <div className="grid grid-cols-1 gap-1">
                    <div className="cursor-pointer hover:bg-green-900/30 text-green-300" onClick={() => processCommandRef.current('1')}>[1] Write New Blog Post</div>
                    <div className="cursor-pointer hover:bg-green-900/30 text-green-300" onClick={() => processCommandRef.current('2')}>[2] Edit About Section</div>
                    <div className="cursor-pointer hover:bg-green-900/30 text-green-300" onClick={() => processCommandRef.current('3')}>[3] Exit to Shell</div>
                </div>
                <div className="mt-2 text-green-600 text-xs">Select an option number...</div>
            </div>
        );
    };

    const processCommand = async (cmdStr: string, skipInputLog = false) => {
        setIsProcessing(true);
        const args = cmdStr.trim().split(/\s+/);
        const cmd = args[0].toLowerCase();

        if (!skipInputLog) {
            setHistory(prev => [...prev, {
                id: Date.now().toString() + '-input',
                type: 'input',
                content: <div><span className="mr-2 text-[#ff1fad]">{isAdmin ? '#' : '>'}</span>{cmdStr}</div>
            }]);
        }

        const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

        // --- INTERACTIVE MODES ---
        if (interactiveMode === 'admin-pass') {
            if (cmdStr === '100027') {
                setIsAdmin(true);
                addLine(<div className="text-green-500">ACCESS GRANTED.</div>);
                showAdminMenu();
            } else {
                addLine(<div className="text-red-500">ACCESS DENIED.</div>);
                setInteractiveMode('none');
            }
        } else if (interactiveMode === 'admin-menu') {
            if (cmdStr === '1') {
                setNewPost({ title: '', content: '' });
                addLine(<div className="text-[#ff1fad]">Enter Post Title:</div>);
                setInteractiveMode('admin-write-title');
            } else if (cmdStr === '2') {
                addLine(<div className="text-[#ff1fad] mb-1">Current About Content:</div>);
                addLine(<div className="text-gray-500 text-xs mb-2 italic">{aboutContent}</div>);
                addLine(<div className="text-[#ff1fad]">Enter New About Content (Markdown supported):</div>);
                setInteractiveMode('admin-edit-about');
            } else if (cmdStr === '3') {
                addLine(<div className="text-green-500">Exiting Admin Panel.</div>);
                setInteractiveMode('none');
            } else {
                addLine(<div className="text-red-500">Invalid Option.</div>);
                showAdminMenu();
            }
        } else if (interactiveMode === 'admin-write-title') {
            setNewPost(prev => ({ ...prev, title: cmdStr }));
            addLine(<div className="text-[#ff1fad]">Enter Content (Markdown):</div>);
            setInteractiveMode('admin-write-content');
        } else if (interactiveMode === 'admin-write-content') {
            const post = {
                id: blogPosts.length + 1,
                title: newPost.title,
                content: cmdStr,
                date: new Date().toISOString().split('T')[0]
            };
            setBlogPosts(prev => [...prev, post]);
            addLine(<div className="text-green-500">Post Published Successfully.</div>);
            showAdminMenu();
        } else if (interactiveMode === 'admin-edit-about') {
            setAboutContent(cmdStr);
            addLine(<div className="text-green-500">Profile Updated Successfully.</div>);
            showAdminMenu();
        }
        // --- STANDARD COMMANDS ---
        else {
            if (cmd === 'about') {
                addLine(
                    <div className="my-4 border-2 border-gray-600 bg-gray-900/80 p-2 font-mono text-sm shadow-md max-w-[500px]">
                        {/* Header */}
                        <div className="flex justify-between items-center border-b-2 border-gray-600 pb-2 mb-2">
                            <span className="bg-gray-600 text-black px-2 font-bold">USER_ID: 1001</span>
                            <span className="text-gray-500 text-xs">SYS_ADMIN</span>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-[100px_1fr] gap-4">
                            {/* Left Col: Avatar placeholder */}
                            <div className="flex flex-col gap-2">
                                <div className="w-full aspect-square bg-gray-800 border border-gray-600 flex items-center justify-center">
                                    <span className="text-4xl">👨‍💻</span>
                                </div>
                                <div className="text-[10px] text-gray-400 text-center">
                                    STATUS: ONLINE<br />
                                    UPTIME: 99.9%
                                </div>
                            </div>

                            {/* Right Col: Info */}
                            <div className="flex flex-col gap-1">
                                <div className="flex gap-2">
                                    <span className="text-gray-500 w-16">NAME:</span>
                                    <span className="text-[#ff1fad] font-bold tracking-wider">Sanj</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-gray-500 w-16">ROLE:</span>
                                    <span className="text-white">Full Stack Engineer & Founder, Ok Valley Web</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-gray-500 w-16">LOC:</span>
                                    <span className="text-white">Kelowna, BC</span>
                                </div>

                                <div className="mt-2 border-t border-gray-700 pt-2">
                                    <div className="text-gray-400 text-xs mb-1">BIO_DATA:</div>
                                    <div className="text-gray-200 leading-snug italic mb-2">
                                        "{aboutContent}"
                                    </div>
                                    <div className="text-gray-200 leading-snug">
                                        I run a small tech/ops consultancy called Ok Valley Web.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="mt-4 border-t-2 border-gray-600 pt-2 flex justify-end">
                            <button
                                onClick={() => processCommandRef.current('contact')}
                                className="group flex items-center gap-2 px-3 py-1 bg-gray-800 border border-gray-500 hover:bg-[#ff1fad] hover:border-[#ff1fad] hover:text-black transition-all"
                            >
                                <span>✉️</span>
                                <span className="uppercase text-xs font-bold tracking-wider">Send_Transmission</span>
                            </button>
                        </div>
                    </div>
                );
            } else if (cmd === 'blog') {
                if (args[1]) {
                    const id = parseInt(args[1], 10);
                    const post = blogPosts.find(p => p.id === id);
                    if (post) {
                        addLine(
                            <div className="flex flex-col gap-1 my-2 p-2 border-l-2 border-[#ff1fad]">
                                <div className="text-[#ff1fad] font-bold text-lg">{post.title}</div>
                                <div className="text-xs text-gray-500 mb-2">{post.date}</div>
                                <div className="whitespace-pre-wrap">{renderMarkdown(post.content)}</div>
                            </div>
                        );
                    } else {
                        addLine(<div className="text-red-500">ERROR: POST_NOT_FOUND</div>);
                    }
                } else {
                    setInteractiveMode('blog');
                    setMenuSelection(0);
                }
            } else if (cmd === 'contact') {
                addLine(<div className="text-[#ff1fad]">Launching Mail Client...</div>);
                setTimeout(() => {
                    onOpenApp('browser');
                }, 500);
            } else if (cmd === 'projects') {
                addLine(
                    <div className="my-2">
                        <div className="text-[#ff1fad] mb-2 font-bold">/// PROJECT DIRECTORY ///</div>
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-gray-600 text-gray-400">
                                    <th className="py-1">ID</th>
                                    <th className="py-1">TITLE</th>
                                    <th className="py-1">STACK</th>
                                    <th className="py-1">YEAR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PROJECTS.map(p => (
                                    <tr key={p.id} className="hover:bg-[#ff1fad]/10 cursor-pointer" onClick={() => {
                                        addLine(<div className="text-green-500">Opening {p.title}...</div>);
                                        onOpenApp('browser');
                                    }}>
                                        <td className="py-1 text-gray-500">{p.id.toString().padStart(3, '0')}</td>
                                        <td className="py-1 text-white font-bold">{p.title}</td>
                                        <td className="py-1 text-gray-400 text-xs">{p.techStack[0]}</td>
                                        <td className="py-1 text-gray-500">{p.year}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-2 text-xs text-gray-600">Tip: Click a project to view details in Netscape.</div>
                    </div>
                );
            } else if (cmd === 'clear') {
                setHistory([]);
            } else if (cmd === '/root') {
                addLine(<div className="text-yellow-400">ENTER ADMINISTRATOR PASSWORD:</div>);
                setInteractiveMode('admin-pass');
            } else if (cmd === 'help') {
                addLine(
                    <div className="grid grid-cols-[12ch_1fr] gap-2 my-2">
                        <div className="text-[#ff1fad] cursor-pointer hover:underline hover:bg-[#ff1fad]/10" onClick={() => processCommandRef.current('help')}>help</div><div>List available commands</div>
                        <div className="text-[#ff1fad] cursor-pointer hover:underline hover:bg-[#ff1fad]/10" onClick={() => processCommandRef.current('about')}>about</div><div>Display user profile</div>
                        <div className="text-[#ff1fad] cursor-pointer hover:underline hover:bg-[#ff1fad]/10" onClick={() => processCommandRef.current('projects')}>projects</div><div>List portfolio projects</div>
                        <div className="text-[#ff1fad] cursor-pointer hover:underline hover:bg-[#ff1fad]/10" onClick={() => processCommandRef.current('blog')}>blog</div><div>Read blog posts</div>
                        <div className="text-[#ff1fad] cursor-pointer hover:underline hover:bg-[#ff1fad]/10" onClick={() => processCommandRef.current('contact')}>contact</div><div>Send me an email</div>
                        <div className="text-[#ff1fad] cursor-pointer hover:underline hover:bg-[#ff1fad]/10" onClick={() => processCommandRef.current('clear')}>clear</div><div>Clear terminal</div>
                        <div className="text-[#ff1fad] cursor-pointer hover:underline hover:bg-[#ff1fad]/10" onClick={() => processCommandRef.current('/root')}>/root</div><div>Admin login</div>
                    </div>
                );
            } else if (cmd !== '') {
                addLine(<div className="text-red-500">Bad command or file name</div>);
            }
        }

        setIsProcessing(false);
        if (cmd !== 'blog' || args[1]) {
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    setCursorPos(0);
                }
            }, 10);
        }
    };

    // Sync the ref with the latest processCommand
    useEffect(() => {
        processCommandRef.current = processCommand;
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Navigation for Blog Menu
        if (interactiveMode === 'blog') {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMenuSelection(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMenuSelection(prev => Math.min(blogPosts.length - 1, prev + 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                executeBlogSelect(menuSelection);
                setInput('');
            } else if (e.key === 'Escape' || (e.key === 'c' && e.ctrlKey)) {
                setInteractiveMode('none');
                setHistory(prev => [...prev, { id: Date.now() + '-cancel', type: 'output', content: <div className="text-[#ff1fad] mb-2">^C</div> }]);
                setInput('');
            }
            return;
        }

        if (e.key === 'Enter') {
            if (input.trim() || interactiveMode !== 'none') {
                setCommandHistory(prev => [...prev, input]);
                setHistoryIndex(-1);
                processCommand(input);
            } else {
                processCommand('');
            }
            setInput('');
            setCursorPos(0);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex]);
                // Update cursor to end of new input
                setTimeout(() => {
                    if (inputRef.current) {
                        const len = commandHistory[newIndex].length;
                        inputRef.current.setSelectionRange(len, len);
                        setCursorPos(len);
                    }
                }, 0);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex !== -1) {
                const newIndex = historyIndex + 1;
                if (newIndex >= commandHistory.length) {
                    setHistoryIndex(-1);
                    setInput('');
                    setCursorPos(0);
                } else {
                    setHistoryIndex(newIndex);
                    setInput(commandHistory[newIndex]);
                    setTimeout(() => {
                        if (inputRef.current) {
                            const len = commandHistory[newIndex].length;
                            inputRef.current.setSelectionRange(len, len);
                            setCursorPos(len);
                        }
                    }, 0);
                }
            }
        }
        // Allow default ArrowLeft/ArrowRight/Home/End to occur, handled by onSelect
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (interactiveMode === 'blog') return;
        setInput(e.target.value);
        setCursorPos(e.target.selectionStart || 0);
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
        setCursorPos(e.currentTarget.selectionStart || 0);
    };

    return (
        <Window
            title="MS-DOS Prompt"
            onClose={onClose}
            onFocus={onFocus}
            zIndex={zIndex}
            isFocused={isFocused}
            isClosing={isClosing}
            width="min(85ch, 95vw)"
            height="min(500px, 80vh)"
            initialX={Math.random() * 50 + 20}
            initialY={Math.random() * 50 + 20}
            icon={<span className="font-bold text-xs">C:\</span>}
        >
            <div
                className="flex-1 overflow-y-auto p-1 font-mono text-sm leading-5 terminal-scroll bg-black text-[#c0c0c0]"
                onClick={handleContainerClick}
                ref={scrollRef}
            >
                {history.map((line) => (
                    <div key={line.id} className="break-words">{line.content}</div>
                ))}

                {interactiveMode === 'blog' && (
                    <div className="mt-2 mb-4">
                        <div className="text-slate-500 mb-2">Select a post to read:</div>
                        <div className="flex flex-col gap-1">
                            {blogPosts.map((post, idx) => {
                                const isSelected = idx === menuSelection;
                                return (
                                    <div
                                        key={post.id}
                                        className={`cursor-pointer px-2 flex gap-2 ${isSelected ? 'bg-[#ff1fad] text-black' : 'text-slate-400'}`}
                                        onClick={() => executeBlogSelect(idx)}
                                        onMouseEnter={() => setMenuSelection(idx)}
                                    >
                                        <span className="w-[2ch]">{isSelected ? '>' : ' '}</span>
                                        <span>{post.title}</span>
                                        <span className="ml-auto text-xs opacity-75">{post.date}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {(!isBooting && !isProcessing) && (
                    <div className="flex relative items-start mt-1">
                        {/* Prompt symbol hidden in blog mode */}
                        {interactiveMode !== 'blog' && (
                            <span className="mr-2 text-[#ff1fad] shrink-0 select-none">
                                {interactiveMode.startsWith('admin') ? 'ADMIN>' : 'C:\\USERS\\SANJ>'}
                            </span>
                        )}

                        <div className="relative flex-1">
                            <input
                                ref={inputRef}
                                type={interactiveMode === 'admin-pass' ? 'password' : 'text'}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onSelect={handleSelect}
                                className={`w-full bg-transparent outline-none border-none font-mono p-0 m-0 caret-transparent text-[#e0e0e0] z-10 relative
                    ${interactiveMode === 'blog' ? 'opacity-0 h-0 w-0 absolute' : ''}
                  `}
                                autoFocus
                                spellCheck="false"
                                autoComplete="off"
                            />

                            {/* Cursor Render */}
                            {interactiveMode !== 'blog' && (
                                <div className="absolute top-0 left-0 pointer-events-none h-[1.3em] flex items-center" style={{ transform: `translateX(${cursorPos}ch)` }}>
                                    <span className="retro-cursor-block" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {(isBooting || isProcessing) && <div className="animate-pulse text-[#ff1fad] mt-1 inline-block">_</div>}
            </div>
        </Window>
    );
};

export default Terminal;