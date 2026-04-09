import React, { useState, useEffect } from 'react';
import Window from './Window';
import { Book } from '../types';
import { GoogleGenAI } from "@google/genai";

interface BookshelfProps {
    onClose: () => void;
    onFocus: () => void;
    zIndex: number;
    isFocused: boolean;
    isClosing?: boolean;
    books: Book[];
    setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}

const Bookshelf: React.FC<BookshelfProps> = ({ onClose, onFocus, zIndex, isFocused, isClosing, books, setBooks }) => {
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);

    // Auto-trigger generation if needed on mount
    useEffect(() => {
        const needsGeneration = books.some(b => b.coverPrompt && !b.coverImage);
        if (needsGeneration && !isGenerating) {
            generateCovers();
        }
    }, []);

    const renderRatingBar = (rating: number) => {
        return (
            <div className="flex gap-1">
                {Array(5).fill(0).map((_, i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 border border-black ${i < rating ? 'bg-[#ff1fad]' : 'bg-[#333]'}`}
                    />
                ))}
            </div>
        );
    };

    const generateCovers = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        setGenerationProgress(0);

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const booksToUpdate = books.filter(b => !b.coverImage && b.coverPrompt);
        let completed = 0;

        for (const book of booksToUpdate) {
            try {
                if (!book.coverPrompt) continue;

                // Using gemini-2.5-flash-image (Nano Banana) to generate image content
                // Setting aspectRatio to 3:4 to better fit the book shape
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [{ text: book.coverPrompt }]
                    },
                    config: {
                        imageConfig: {
                            aspectRatio: "3:4"
                        }
                    }
                });

                // Extract image part
                let base64Image = null;
                const candidates = response.candidates;
                if (candidates && candidates.length > 0) {
                    for (const part of candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            base64Image = part.inlineData.data;
                            break;
                        }
                    }
                }

                if (base64Image) {
                    const imageUrl = `data:image/png;base64,${base64Image}`;
                    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, coverImage: imageUrl } : b));
                }

            } catch (error) {
                console.error(`Failed to generate cover for ${book.title}`, error);
            }
            completed++;
            setGenerationProgress(Math.floor((completed / booksToUpdate.length) * 100));
        }
        setIsGenerating(false);
    };

    return (
        <Window
            title="ARCHIVE_READER.EXE"
            onClose={onClose}
            onFocus={onFocus}
            zIndex={zIndex}
            isFocused={isFocused}
            isClosing={isClosing}
            width="min(700px, 95vw)"
            height="min(550px, 85vh)"
            initialX={100}
            initialY={80}
            icon={<span className="text-xs font-bold text-[#ff1fad]">[]</span>}
        >
            <div className="flex-1 bg-black flex flex-col relative overflow-hidden font-mono text-sm select-none border-2 border-[#ff1fad]">
                {/* Tech Background Grid - Pink */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255, 31, 173, 0.2) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 31, 173, 0.2) 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                    }}
                />

                {/* Header Status Bar - Black & Pink */}
                <div className="bg-black text-[#ff1fad] px-3 py-2 border-b border-[#ff1fad] flex justify-between items-center z-10 shadow-[0_0_10px_rgba(255,31,173,0.3)]">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-white animate-ping' : 'bg-[#ff1fad] animate-pulse'}`}></div>
                        <span className="tracking-widest font-bold text-xs text-white">
                            {isGenerating ? `DOWNLOADING_ASSETS... ${generationProgress}%` : 'SYSTEM_ARCHIVE // V1.0.4'}
                        </span>
                    </div>
                    <div className="text-[10px] text-[#ff1fad]/70 font-mono">
                        MEM_USAGE: {books.length * 128}KB
                    </div>
                </div>

                {/* Toolbar - Dark Gray & Pink */}
                <div className="bg-[#111] border-b border-[#ff1fad]/30 p-1 flex flex-wrap gap-2 text-xs">
                    <button
                        onClick={generateCovers}
                        disabled={isGenerating}
                        className={`touch-manipulation min-h-11 px-3 py-2 border font-bold flex items-center gap-2 transition-all ${isGenerating
                            ? 'bg-[#333] border-gray-600 text-gray-500 cursor-wait'
                            : 'bg-black border-[#ff1fad] text-[#ff1fad] hover:bg-[#ff1fad] hover:text-black hover:shadow-[0_0_8px_#ff1fad]'
                            }`}
                    >
                        <span>{isGenerating ? 'PROCESSING...' : 'EXECUTE: ART_GEN'}</span>
                    </button>
                    <div className="border border-[#ff1fad] bg-black text-[#ff1fad] px-2 py-2 min-w-[100px] placeholder-[#ff1fad]/30 font-mono">Search...</div>
                    <div className="flex-1"></div>
                    <span className="text-[#ff1fad] self-center">{books.length} ITEMS</span>
                </div>

                {/* Grid Container */}
                <div className="flex-1 p-3 sm:p-6 overflow-y-auto custom-scrollbar relative z-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                        {books.map(book => (
                            <div
                                key={book.id}
                                onClick={() => setSelectedBook(book)}
                                className="group touch-manipulation cursor-pointer relative flex flex-col items-center gap-2"
                            >
                                {/* Book Artifact */}
                                <div className="relative w-full aspect-[2/3] transition-transform duration-200 group-hover:-translate-y-2">
                                    {/* Shadow */}
                                    <div className="absolute top-2 left-2 w-full h-full bg-[#ff1fad]/20 border border-[#ff1fad]/30"></div>

                                    {/* Main Cover Container */}
                                    <div
                                        className="absolute inset-0 border border-[#ff1fad]/50 flex flex-col overflow-hidden bg-gray-900 group-hover:border-[#ff1fad] group-hover:shadow-[0_0_15px_rgba(255,31,173,0.4)] transition-all"
                                        style={{ backgroundColor: book.coverImage ? '#000' : book.color }}
                                    >
                                        {book.coverImage ? (
                                            // Generated Image
                                            <div className="w-full h-full relative">
                                                <img
                                                    src={book.coverImage}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                    style={{ imageRendering: 'pixelated' }}
                                                />
                                                {/* Scanline Overlay */}
                                                <div className="absolute inset-0 pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAABlBMVEUAAAAAAAClZ7nPAAAAAXRSTlMAQObYZgAAAA5JREFUCNdjYGBgYAAAAAUAAYc2Dt0AAAAASUVORK5CYII=')] opacity-30"></div>
                                            </div>
                                        ) : (
                                            // Fallback Design
                                            <>
                                                {/* Spine Highlight */}
                                                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-white/20"></div>

                                                {/* Tech Pattern Overlay */}
                                                <div className="absolute inset-0 opacity-20"
                                                    style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '4px 4px', backgroundPosition: '0 0, 2px 2px' }}>
                                                </div>

                                                {/* Label Area */}
                                                <div className="mt-auto mb-4 mx-2 bg-black/90 border border-[#ff1fad]/50 p-1 backdrop-blur-sm">
                                                    <div className="h-[2px] w-full bg-[#ff1fad]/50 mb-1"></div>
                                                    <div className="text-[6px] text-white leading-tight font-mono break-words uppercase tracking-tighter">
                                                        {book.title}
                                                    </div>
                                                </div>

                                                {/* Corner Marker */}
                                                <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#ff1fad]"></div>
                                            </>
                                        )}
                                    </div>

                                    {/* Selection Glow - Pink */}
                                    <div className="absolute -inset-1 border-2 border-[#ff1fad] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-[0_0_10px_#ff1fad]"></div>
                                </div>

                                {/* Label Below */}
                                <span className="text-[9px] text-[#ff1fad]/70 group-hover:text-[#ff1fad] group-hover:bg-black/80 px-1 truncate max-w-full font-mono text-center leading-tight">
                                    {book.title.toUpperCase()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detail Modal */}
                {selectedBook && (
                    <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-8 backdrop-blur-[2px]" onClick={() => setSelectedBook(null)}>
                        <div
                            className="bg-black w-full max-w-2xl max-h-[90vh] h-auto shadow-[0_0_30px_rgba(255,31,173,0.2)] border-2 border-[#ff1fad] flex flex-col relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="bg-[#ff1fad] text-black px-2 py-2 flex justify-between items-center border-b border-black">
                                <span className="font-bold text-sm tracking-widest">PROPERTIES: {selectedBook.title.toUpperCase()}</span>
                                <button onClick={() => setSelectedBook(null)} className="touch-manipulation min-h-11 min-w-11 border border-black px-3 hover:bg-black hover:text-[#ff1fad] font-bold transition-colors">X</button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-4 flex flex-col md:flex-row gap-6 overflow-y-auto">
                                {/* Left Column: Visuals */}
                                <div className="w-full md:w-1/3 flex flex-col gap-4">
                                    <div
                                        className="w-full aspect-[2/3] border-2 border-[#ff1fad] shadow-[0_0_10px_rgba(255,31,173,0.3)] relative bg-black overflow-hidden"
                                        style={{ backgroundColor: selectedBook.coverImage ? '#000' : selectedBook.color }}
                                    >
                                        {selectedBook.coverImage ? (
                                            <img src={selectedBook.coverImage} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-4xl opacity-50 font-bold mix-blend-overlay text-[#ff1fad]">#{selectedBook.id}</span>
                                                </div>
                                                <div className="absolute bottom-2 right-2 text-[10px] text-[#ff1fad] bg-black border border-[#ff1fad] px-1 font-mono">
                                                    {selectedBook.year}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="bg-black border border-[#ff1fad]/50 p-2 text-[#ff1fad] text-xs font-mono">
                                        <div>STATUS: <span className="animate-pulse">DECRYPTED</span></div>
                                        <div>SIZE: {Math.floor(Math.random() * 500) + 100}KB</div>
                                        <div>TYPE: TEXT/UTF-8</div>
                                        {selectedBook.coverImage && <div className="text-white">COVER_ART: LOADED</div>}
                                    </div>
                                </div>

                                {/* Right Column: Data */}
                                <div className="flex-1 flex flex-col text-white">
                                    <div className="mb-4 pb-2 border-b border-[#ff1fad]/30">
                                        <h2 className="text-2xl font-bold font-serif tracking-wide text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{selectedBook.title}</h2>
                                        <div className="text-[#ff1fad] text-sm mt-1 uppercase tracking-wider">AUTH: {selectedBook.author}</div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="text-[10px] text-gray-400 mb-1">USER_RATING_INDEX</div>
                                        {renderRatingBar(selectedBook.rating)}
                                    </div>

                                    <div className="flex-1 bg-[#111] border border-[#ff1fad]/30 p-3 relative overflow-y-auto">
                                        <div className="absolute top-0 left-0 bg-[#ff1fad] text-black px-1 text-[8px] font-bold">NOTES.TXT</div>
                                        <p className="font-mono text-sm leading-6 text-gray-300 mt-2">
                                            <span className="text-[#ff1fad] mr-2">{'>'}</span>
                                            {selectedBook.thoughts}
                                        </p>
                                        <div className="h-4 w-2 bg-[#ff1fad] animate-pulse mt-1 inline-block"></div>
                                    </div>

                                    <div className="mt-4 flex justify-end gap-2">
                                        <button className="touch-manipulation min-h-11 px-4 py-2 bg-black text-[#ff1fad] border border-[#ff1fad] text-xs hover:bg-[#ff1fad] hover:text-black transition-colors">EXPORT</button>
                                        <button
                                            onClick={() => setSelectedBook(null)}
                                            className="touch-manipulation min-h-11 px-4 py-2 bg-[#ff1fad] text-black font-bold border border-[#ff1fad] text-xs hover:bg-[#d41b91]"
                                        >
                                            CLOSE_VIEWER
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Window>
    );
};

export default Bookshelf;
