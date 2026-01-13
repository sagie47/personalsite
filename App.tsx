import React, { useState } from 'react';
import Terminal from './components/Terminal';
import PlatformerGame from './components/PlatformerGame';
import Browser from './components/Browser';
import Synth from './components/Synth';
import Bookshelf from './components/Bookshelf';
import { BLOG_POSTS, DEFAULT_ABOUT, BOOKS } from './constants';
import { BlogPost, Book } from './types';

const App: React.FC = () => {
    const [openApps, setOpenApps] = useState<string[]>(['terminal']);
    const [closingApps, setClosingApps] = useState<string[]>([]);
    const [focusedApp, setFocusedApp] = useState<string | null>('terminal');
    const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    // Shared State
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>(BLOG_POSTS);
    const [aboutContent, setAboutContent] = useState<string>(DEFAULT_ABOUT);
    const [browserStartPath, setBrowserStartPath] = useState<string>('home');
    const [books, setBooks] = useState<Book[]>(BOOKS);

    // Clock
    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleApp = (appId: string) => {
        setIsStartMenuOpen(false);
        if (openApps.includes(appId)) {
            if (focusedApp === appId) {
                // Minimize behavior? For now just do nothing or maybe minimize
                setFocusedApp(null);
            } else {
                setFocusedApp(appId);
            }
        } else {
            if (closingApps.includes(appId)) return;
            setOpenApps(prev => [...prev, appId]);
            setFocusedApp(appId);
        }
    };

    const openApp = (appId: string) => {
        setIsStartMenuOpen(false);
        if (!openApps.includes(appId)) {
            if (closingApps.includes(appId)) {
                setClosingApps(prev => prev.filter(id => id !== appId));
            }
            setOpenApps(prev => [...prev, appId]);
        }
        setFocusedApp(appId);
    };

    const openBrowserTo = (path: string) => {
        setBrowserStartPath(path);
        openApp('browser');
    }

    const closeApp = (appId: string) => {
        if (closingApps.includes(appId)) return;
        setClosingApps(prev => [...prev, appId]);
        setTimeout(() => {
            setOpenApps(prev => prev.filter(id => id !== appId));
            setClosingApps(prev => prev.filter(id => id !== appId));
            if (focusedApp === appId) {
                setFocusedApp(null);
            }
        }, 100);
    };

    const focusApp = (appId: string) => {
        if (openApps.includes(appId) && !closingApps.includes(appId)) {
            setFocusedApp(appId);
        }
    };

    const getZIndex = (appId: string) => {
        return focusedApp === appId ? 50 : 10;
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#008080] select-none font-sans cursor-default">
            <style>{`
        @keyframes wave {
            0% { transform: translateY(0); color: #ff1fad; }
            50% { transform: translateY(-3px); color: #ffffff; }
            100% { transform: translateY(0); color: #ff1fad; }
        }
        .animate-wave {
            animation: wave 1s ease-in-out infinite;
        }
        .font-ms-sans {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        /* Windows 95 Button Style */
        .win95-btn {
            background-color: #c0c0c0;
            box-shadow: inset 1px 1px #fff, inset -1px -1px #000, 1px 1px #000, -1px -1px #fff;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .win95-btn:active, .win95-btn.active {
            box-shadow: inset 1px 1px #000, inset -1px -1px #fff, 1px 1px #fff, -1px -1px #000;
        }
        .win95-panel {
            background-color: #c0c0c0;
            box-shadow: inset 1px 1px #fff, inset -1px -1px #000;
        }
        .sidebar-text {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
        }
        .writing-vertical-rl {
            writing-mode: vertical-rl;
        }
      `}</style>

            {/* Desktop Icons - Responsive Grid */}
            <div className="absolute top-4 left-4 right-4 md:right-auto md:w-20 grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-col gap-4 md:gap-6 text-white text-xs text-center font-ms-sans z-0">
                <div className="group flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform" onClick={() => toggleApp('terminal')}>
                    <div className="w-12 h-12 md:w-8 md:h-8 bg-black border-2 border-gray-400 flex items-center justify-center text-green-400 font-bold text-sm md:text-xs">
                        &gt;_
                    </div>
                    <span className="bg-[#008080] group-hover:bg-[#000080] px-1 text-[10px] md:text-xs">Terminal</span>
                </div>

                <div className="group flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform" onClick={() => openBrowserTo('home')}>
                    <div className="w-12 h-12 md:w-8 md:h-8 bg-teal-700 border-2 border-white flex items-center justify-center font-serif font-bold text-white text-lg md:text-base">
                        N
                    </div>
                    <span className="bg-[#008080] group-hover:bg-[#000080] px-1 text-[10px] md:text-xs">Internet</span>
                </div>

                <div className="group flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform" onClick={() => openBrowserTo('projects')}>
                    <div className="w-12 h-12 md:w-8 md:h-8 bg-yellow-200 border-2 border-yellow-600 flex items-center justify-center shadow-md">
                        <div className="w-8 h-5 md:w-6 md:h-4 bg-yellow-400 border border-yellow-600 relative top-1">
                            <div className="absolute -top-1 left-0 w-4 md:w-3 h-1 bg-yellow-400 border-t border-l border-r border-yellow-600"></div>
                        </div>
                    </div>
                    <span className="bg-[#008080] group-hover:bg-[#000080] px-1 text-[10px] md:text-xs">Projects</span>
                </div>

                <div className="group flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform" onClick={() => toggleApp('library')}>
                    <div className="w-12 h-12 md:w-8 md:h-8 bg-amber-800 border-2 border-amber-950 flex flex-col items-center justify-center shadow-md gap-[2px] md:gap-[1px] px-1.5 md:px-1">
                        <div className="w-full h-1.5 md:h-1 bg-white/50"></div>
                        <div className="w-full h-1.5 md:h-1 bg-white/50"></div>
                        <div className="w-full h-1.5 md:h-1 bg-white/50"></div>
                    </div>
                    <span className="bg-[#008080] group-hover:bg-[#000080] px-1 text-[10px] md:text-xs">Library</span>
                </div>

                <div className="group flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform" onClick={() => toggleApp('game')}>
                    <div className="w-12 h-12 md:w-8 md:h-8 bg-yellow-400 border-2 border-red-500 flex items-center justify-center">
                        <div className="w-5 h-5 md:w-4 md:h-4 bg-blue-500" />
                    </div>
                    <span className="bg-[#008080] group-hover:bg-[#000080] px-1 text-[10px] md:text-xs">Game.exe</span>
                </div>

                <div className="group flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform" onClick={() => toggleApp('synth')}>
                    <div className="w-12 h-12 md:w-8 md:h-8 bg-gray-300 border-2 border-black flex items-center justify-center text-black font-bold text-lg md:text-base">
                        ♪
                    </div>
                    <span className="bg-[#008080] group-hover:bg-[#000080] px-1 text-[10px] md:text-xs">Synth</span>
                </div>
            </div>

            {/* Windows Area - pointer-events-none to let desktop icons below be clickable */}
            <div className="absolute inset-0 pointer-events-none pb-10 z-10">
                {openApps.includes('terminal') && (
                    <Terminal
                        onClose={() => closeApp('terminal')}
                        onFocus={() => focusApp('terminal')}
                        onOpenApp={openApp}
                        zIndex={getZIndex('terminal')}
                        isFocused={focusedApp === 'terminal'}
                        isClosing={closingApps.includes('terminal')}
                        blogPosts={blogPosts}
                        setBlogPosts={setBlogPosts}
                        aboutContent={aboutContent}
                        setAboutContent={setAboutContent}
                    />
                )}
                {openApps.includes('game') && (
                    <PlatformerGame
                        onClose={() => closeApp('game')}
                        onFocus={() => focusApp('game')}
                        zIndex={getZIndex('game')}
                        isFocused={focusedApp === 'game'}
                        isClosing={closingApps.includes('game')}
                    />
                )}
                {openApps.includes('browser') && (
                    <Browser
                        onClose={() => closeApp('browser')}
                        onFocus={() => focusApp('browser')}
                        zIndex={getZIndex('browser')}
                        isFocused={focusedApp === 'browser'}
                        isClosing={closingApps.includes('browser')}
                        blogPosts={blogPosts}
                        aboutContent={aboutContent}
                        initialPath={browserStartPath}
                    />
                )}
                {openApps.includes('synth') && (
                    <Synth
                        onClose={() => closeApp('synth')}
                        onFocus={() => focusApp('synth')}
                        zIndex={getZIndex('synth')}
                        isFocused={focusedApp === 'synth'}
                        isClosing={closingApps.includes('synth')}
                    />
                )}
                {openApps.includes('library') && (
                    <Bookshelf
                        onClose={() => closeApp('library')}
                        onFocus={() => focusApp('library')}
                        zIndex={getZIndex('library')}
                        isFocused={focusedApp === 'library'}
                        isClosing={closingApps.includes('library')}
                        books={books}
                        setBooks={setBooks}
                    />
                )}
            </div>

            {/* Start Menu */}
            {isStartMenuOpen && (
                <div className="absolute bottom-10 left-1 w-48 bg-[#c0c0c0] win95-panel border-2 border-white border-b-black border-r-black z-[100] flex shadow-xl">
                    {/* Sidebar */}
                    <div className="bg-[#000080] w-8 flex flex-col items-center justify-end pb-2">
                        <div className="sidebar-text text-white font-bold text-lg tracking-widest">
                            Windows<span className="font-normal">95</span>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="flex-1 flex flex-col py-1">
                        <div className="hover:bg-[#000080] hover:text-white px-2 py-2 cursor-pointer flex items-center gap-2" onClick={() => toggleApp('terminal')}>
                            <div className="w-6 h-6 bg-black flex items-center justify-center text-[8px] text-green-500 border border-gray-400">&gt;_</div>
                            <div><span className="underline">M</span>S-DOS Prompt</div>
                        </div>
                        <div className="hover:bg-[#000080] hover:text-white px-2 py-2 cursor-pointer flex items-center gap-2" onClick={() => openBrowserTo('home')}>
                            <div className="w-6 h-6 bg-teal-700 flex items-center justify-center text-[8px] text-white font-serif font-bold">N</div>
                            <div><span className="underline">N</span>etscape</div>
                        </div>
                        <div className="hover:bg-[#000080] hover:text-white px-2 py-2 cursor-pointer flex items-center gap-2" onClick={() => openBrowserTo('projects')}>
                            <div className="w-6 h-6 bg-yellow-200 border border-yellow-600 flex items-center justify-center">
                                <div className="w-3 h-3 bg-yellow-400 border border-yellow-600"></div>
                            </div>
                            <div><span className="underline">P</span>rojects</div>
                        </div>
                        <div className="hover:bg-[#000080] hover:text-white px-2 py-2 cursor-pointer flex items-center gap-2" onClick={() => toggleApp('library')}>
                            <div className="w-6 h-6 bg-amber-800 border border-black flex items-center justify-center text-[8px] text-white">📚</div>
                            <div><span className="underline">L</span>ibrary</div>
                        </div>
                        <div className="hover:bg-[#000080] hover:text-white px-2 py-2 cursor-pointer flex items-center gap-2" onClick={() => toggleApp('game')}>
                            <div className="w-6 h-6 bg-yellow-400 border border-black"></div>
                            <div><span className="underline">G</span>ames</div>
                        </div>
                        <div className="hover:bg-[#000080] hover:text-white px-2 py-2 cursor-pointer flex items-center gap-2" onClick={() => toggleApp('synth')}>
                            <div className="w-6 h-6 bg-gray-300 border border-black flex items-center justify-center text-xs font-bold">♪</div>
                            <div><span className="underline">S</span>ynthesizer</div>
                        </div>
                        <div className="border-t border-gray-500 my-1 mx-1 shadow-[0_1px_0_white]"></div>
                        <div className="hover:bg-[#000080] hover:text-white px-2 py-2 cursor-pointer flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-400 border border-gray-600 flex items-center justify-center text-xs">X</div>
                            <div><span className="underline">S</span>hut Down...</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Taskbar - Responsive */}
            <div className="absolute bottom-0 left-0 right-0 h-12 md:h-10 bg-[#c0c0c0] border-t-2 border-white flex items-center p-1 gap-1 z-[90]">
                {/* Start Button */}
                <button
                    className={`win95-btn px-3 md:px-2 h-full gap-1.5 md:gap-1 font-bold text-sm ${isStartMenuOpen ? 'active' : ''}`}
                    onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
                >
                    <div className="w-5 h-5 md:w-4 md:h-4 bg-black skew-x-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 bg-red-500 w-2.5 h-2.5 md:w-2 md:h-2"></div>
                        <div className="absolute bottom-0 right-0 bg-blue-500 w-2.5 h-2.5 md:w-2 md:h-2"></div>
                        <div className="absolute bottom-0 left-0 bg-green-500 w-2.5 h-2.5 md:w-2 md:h-2"></div>
                        <div className="absolute top-0 right-0 bg-yellow-500 w-2.5 h-2.5 md:w-2 md:h-2"></div>
                    </div>
                    <span className="hidden sm:inline">Start</span>
                </button>

                <div className="w-[2px] h-full border-l border-gray-500 border-r border-white mx-1 hidden sm:block"></div>

                {/* Active Tasks - Hidden on smallest mobile, simplified on medium */}
                <div className="flex-1 flex gap-1 overflow-x-auto">
                    {openApps.map(app => (
                        <button
                            key={app}
                            onClick={() => focusApp(app)}
                            className={`win95-btn px-2 h-full min-w-[44px] sm:min-w-[80px] md:min-w-[120px] max-w-[150px] justify-center sm:justify-start gap-1 sm:gap-2 text-sm truncate ${focusedApp === app ? 'active font-bold bg-[#e0e0e0]' : ''}`}
                        >
                            {app === 'terminal' && <span className="font-mono text-xs">&gt;_</span>}
                            {app === 'game' && <div className="w-4 h-4 sm:w-3 sm:h-3 bg-yellow-400 border border-black" />}
                            {app === 'browser' && <div className="w-4 h-4 sm:w-3 sm:h-3 bg-teal-700 text-white flex items-center justify-center text-[8px]">N</div>}
                            {app === 'synth' && <div className="w-4 h-4 sm:w-3 sm:h-3 bg-gray-300 text-black flex items-center justify-center text-[8px]">♪</div>}
                            {app === 'library' && <div className="w-4 h-4 sm:w-3 sm:h-3 bg-amber-800 text-white flex items-center justify-center text-[8px]">📚</div>}
                            <span className="hidden sm:inline truncate">
                                {
                                    app === 'terminal' ? 'DOS' :
                                        app === 'browser' ? 'Web' :
                                            app === 'game' ? 'Game' :
                                                app === 'library' ? 'Library' :
                                                    'Synth'
                                }
                            </span>
                        </button>
                    ))}
                </div>

                <div className="w-[2px] h-full border-l border-gray-500 border-r border-white mx-1 hidden sm:block"></div>

                {/* System Tray */}
                <div className="win95-panel h-full px-2 sm:px-3 flex items-center justify-center text-xs sm:text-sm inset-shadow bg-[#c0c0c0] border-2 border-gray-500 border-b-white border-r-white">
                    <div className="mr-1 sm:mr-2 hidden sm:block">🔊</div>
                    {currentTime}
                </div>
            </div>
        </div>
    );
};

export default App;