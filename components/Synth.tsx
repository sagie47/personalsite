import React, { useEffect, useRef, useState, useCallback } from 'react';
import Window from './Window';

interface SynthProps {
    onClose: () => void;
    onFocus: () => void;
    zIndex: number;
    isFocused: boolean;
    isClosing?: boolean;
}

// --- Constants ---
const NOTES: Record<string, number> = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25
};

const KEY_MAP: Record<string, string> = {
    'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4', 'f': 'F4', 't': 'F#4',
    'g': 'G4', 'y': 'G#4', 'h': 'A4', 'u': 'A#4', 'j': 'B4', 'k': 'C5', 'o': 'C#5',
    'l': 'D5', 'p': 'D#5', ';': 'E5'
};

const DRUM_NAMES = ['KICK', 'SNARE', 'CL-HAT', 'OP-HAT'];

const Synth: React.FC<SynthProps> = ({ onClose, onFocus, zIndex, isFocused, isClosing }) => {
    // Audio Context & Nodes
    const audioCtxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const delayNodeRef = useRef<DelayNode | null>(null);
    const delayFeedbackRef = useRef<GainNode | null>(null);
    const synthFilterRef = useRef<BiquadFilterNode | null>(null);

    // Visualizer
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();

    // Sequencer State
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBpm] = useState(120);
    const [currentStep, setCurrentStep] = useState(0);
    // 4 Tracks (Kick, Snare, CH, OH) x 16 Steps
    const [sequencerGrid, setSequencerGrid] = useState<boolean[][]>(
        Array(4).fill(null).map(() => Array(16).fill(false))
    );

    // Scheduler State
    const nextNoteTimeRef = useRef(0);
    const currentStepRef = useRef(0);
    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // s

    // Synth Params
    const activeOscillators = useRef<Map<string, { osc: OscillatorNode, gain: GainNode, filter: BiquadFilterNode }>>(new Map());
    const [activeNotes, setActiveNotes] = useState<string[]>([]);
    const [params, setParams] = useState({
        waveType: 'sawtooth' as OscillatorType,
        volume: 0.5,
        attack: 0.05,
        release: 0.3,
        cutoff: 2000,
        resonance: 5,
        delayTime: 0.3,
        delayMix: 0.3
    });

    // --- Audio Init ---
    useEffect(() => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        // Master Chain
        const master = ctx.createGain();
        master.gain.value = params.volume;
        masterGainRef.current = master;

        // Analyser for Visuals
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        // Delay Effect
        const delay = ctx.createDelay(2.0);
        delay.delayTime.value = params.delayTime;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.4;
        const delayGain = ctx.createGain(); // Dry/Wet mix
        delayGain.gain.value = params.delayMix;

        delayNodeRef.current = delay;
        delayFeedbackRef.current = feedback;

        // Routing: 
        // Synth -> Delay -> Master
        // Synth -> Master (Dry)
        // Drums -> Master

        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(master);
        master.connect(analyser);
        analyser.connect(ctx.destination);

        return () => {
            if (ctx.state !== 'closed') ctx.close();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    // --- Param Updates ---
    useEffect(() => {
        if (!masterGainRef.current || !delayNodeRef.current) return;
        const now = audioCtxRef.current?.currentTime || 0;
        masterGainRef.current.gain.setTargetAtTime(params.volume, now, 0.1);
        delayNodeRef.current.delayTime.setTargetAtTime(params.delayTime, now, 0.1);
    }, [params.volume, params.delayTime]);

    // --- Visualizer Loop ---
    const drawVisualizer = useCallback(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00ff00'; // Retro Green
            ctx.beginPath();

            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();

            // Scanline effect
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            for (let i = 0; i < canvas.height; i += 4) {
                ctx.fillRect(0, i, canvas.width, 1);
            }
        };
        draw();
    }, []);

    useEffect(() => {
        drawVisualizer();
    }, [drawVisualizer]);


    // --- Drum Synthesis ---
    const playDrum = (trackIndex: number, time: number) => {
        const ctx = audioCtxRef.current;
        if (!ctx || !masterGainRef.current) return;

        const dest = masterGainRef.current;

        if (trackIndex === 0) { // KICK
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
            gain.gain.setValueAtTime(1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(time);
            osc.stop(time + 0.5);
        } else if (trackIndex === 1) { // SNARE
            const noise = ctx.createBufferSource();
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
            noise.buffer = buffer;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 1000;
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(1, time);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, time);
            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0.5, time);
            oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

            noise.connect(noiseFilter).connect(noiseGain).connect(dest);
            osc.connect(oscGain).connect(dest);

            noise.start(time);
            osc.start(time);
            noise.stop(time + 0.2);
            osc.stop(time + 0.2);
        } else if (trackIndex === 2) { // CL-HAT
            const bufferSize = ctx.sampleRate * 1; // 1 sec buffer
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 5000;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

            noise.connect(filter).connect(gain).connect(dest);
            noise.start(time);
            noise.stop(time + 0.05);
        } else if (trackIndex === 3) { // OP-HAT
            const bufferSize = ctx.sampleRate * 1;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 4000;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

            noise.connect(filter).connect(gain).connect(dest);
            noise.start(time);
            noise.stop(time + 0.3);
        }
    };

    // --- Sequencer Scheduler ---
    const scheduleNote = (stepNumber: number, time: number) => {
        // Update UI synchronously-ish (visual only)
        requestAnimationFrame(() => {
            setCurrentStep(stepNumber);
        });

        // Trigger Drums
        sequencerGrid.forEach((track, trackIndex) => {
            if (track[stepNumber]) {
                playDrum(trackIndex, time);
            }
        });
    };

    const nextNote = () => {
        const secondsPerBeat = 60.0 / bpm;
        const secondsPer16th = secondsPerBeat / 4; // 16th notes
        nextNoteTimeRef.current += secondsPer16th;
        currentStepRef.current = (currentStepRef.current + 1) % 16;
    };

    useEffect(() => {
        let timerID: number;
        if (isPlaying) {
            // Check if context is suspended (Chrome autoplay policy)
            if (audioCtxRef.current?.state === 'suspended') {
                audioCtxRef.current.resume();
            }

            // Init time if just started
            if (nextNoteTimeRef.current < (audioCtxRef.current?.currentTime || 0)) {
                nextNoteTimeRef.current = (audioCtxRef.current?.currentTime || 0) + 0.1;
            }

            timerID = window.setInterval(() => {
                const ctx = audioCtxRef.current;
                if (!ctx) return;

                while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
                    scheduleNote(currentStepRef.current, nextNoteTimeRef.current);
                    nextNote();
                }
            }, lookahead);
        }
        return () => window.clearInterval(timerID);
    }, [isPlaying, bpm, sequencerGrid]);


    // --- Synth Playback ---
    const playNote = (note: string) => {
        if (!audioCtxRef.current || activeOscillators.current.has(note) || !masterGainRef.current || !delayNodeRef.current) return;
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = params.waveType;
        osc.frequency.setValueAtTime(NOTES[note], ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(params.cutoff, ctx.currentTime);
        filter.Q.value = params.resonance;

        // Envelope Attack
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + params.attack);

        // Chain: Osc -> Filter -> Gain -> Master
        //                        |-> Delay -> Master
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGainRef.current);

        // Connect to delay (Effect Send)
        const delaySend = ctx.createGain();
        delaySend.gain.value = params.delayMix; // Manual send amount logic
        gain.connect(delaySend);
        delaySend.connect(delayNodeRef.current);

        osc.start();

        activeOscillators.current.set(note, { osc, gain, filter });
        setActiveNotes(prev => [...prev, note]);
    };

    const stopNote = (note: string) => {
        if (!audioCtxRef.current) return;
        const node = activeOscillators.current.get(note);
        if (node) {
            const { osc, gain } = node;
            const ctx = audioCtxRef.current;
            const now = ctx.currentTime;

            // Envelope Release
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(gain.gain.value, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + params.release);
            osc.stop(now + params.release + 0.1);

            setTimeout(() => {
                if (activeOscillators.current.get(note) === node) {
                    activeOscillators.current.delete(note);
                }
            }, (params.release * 1000) + 100);
        }
        setActiveNotes(prev => prev.filter(n => n !== note));
    };

    // Keyboard Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isFocused) return;
            const note = KEY_MAP[e.key.toLowerCase()];
            if (note && !e.repeat) playNote(note);
            if (e.code === 'Space') {
                e.preventDefault(); // Stop scrolling
                setIsPlaying(prev => !prev);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            const note = KEY_MAP[e.key.toLowerCase()];
            if (note) stopNote(note);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isFocused, params]);

    // --- UI Components ---
    const PianoKey: React.FC<{ note: string, isBlack: boolean, leftOffset?: number }> = ({ note, isBlack, leftOffset }) => {
        const isActive = activeNotes.includes(note);
        return (
            <div
                className={`absolute border-b-black border-r-black select-none cursor-pointer flex items-end justify-center pb-2 transition-colors duration-75 touch-manipulation
                    ${isBlack
                        ? 'bg-black text-white h-[100px] w-[24px] z-10 border-l border-b-4 border-r-2 border-l-gray-600'
                        : 'bg-white text-black h-[160px] w-[36px] z-0 border-l border-b-4 border-r-2 border-l-gray-300'
                    }
                    ${isActive ? (isBlack ? '!bg-gray-700' : '!bg-gray-300') : ''}
                `}
                style={{
                    left: leftOffset !== undefined ? leftOffset : 'auto',
                    boxShadow: isActive ? 'inset 0 0 10px rgba(0,0,0,0.5)' : 'none',
                    touchAction: 'none'
                }}
                onPointerDown={(e) => {
                    e.preventDefault();
                    playNote(note);
                }}
                onPointerUp={() => stopNote(note)}
                onPointerLeave={() => stopNote(note)}
                onPointerCancel={() => stopNote(note)}
            >
                <span className="text-[9px] opacity-50 pointer-events-none mb-1">{note}</span>
            </div>
        );
    };

    const Knob: React.FC<{ label: string, value: number, min: number, max: number, onChange: (v: number) => void }> = ({ label, value, min, max, onChange }) => {
        return (
            <div className="flex flex-col items-center gap-1">
                <input
                    type="range" min={min} max={max} step={(max - min) / 100} value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                className="touch-manipulation w-12 h-24 appearance-none bg-gray-700 border-2 border-gray-600 rounded-full"
                style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any}
            />
                <span className="text-[10px] font-bold text-gray-800 uppercase">{label}</span>
            </div>
        );
    };

    const renderSequencer = () => (
        <div className="bg-[#a0a0a0] p-1 border-2 border-white border-b-gray-600 border-r-gray-600 inset-shadow overflow-x-auto">
            <div className="grid grid-cols-[60px_repeat(16,1fr)] gap-1 mb-1">
                <div className="text-[10px] font-bold self-end text-right pr-2">STEP</div>
                {Array(16).fill(0).map((_, i) => (
                    <div key={i} className={`text-[9px] text-center ${currentStep === i ? 'text-red-600 font-bold bg-black/10' : 'text-gray-600'}`}>
                        {i + 1}
                    </div>
                ))}
            </div>
            {sequencerGrid.map((row, trackIdx) => (
                <div key={trackIdx} className="grid grid-cols-[60px_repeat(16,1fr)] gap-1 mb-1 items-center">
                    <div className="text-[10px] font-bold text-gray-800 pl-1">{DRUM_NAMES[trackIdx]}</div>
                    {row.map((active, stepIdx) => (
                        <div
                            key={stepIdx}
                            onClick={() => {
                                const newGrid = [...sequencerGrid];
                                newGrid[trackIdx][stepIdx] = !active;
                                setSequencerGrid(newGrid);
                            }}
                            className={`
                                h-6 w-full cursor-pointer border border-gray-600 shadow-sm
                                ${active ? 'bg-orange-500 border-orange-700' : 'bg-gray-300'}
                                ${currentStep === stepIdx ? 'brightness-125 ring-1 ring-white' : ''}
                            `}
                        />
                    ))}
                </div>
            ))}
        </div>
    );

    const renderPiano = () => {
        const whiteNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
        const blackNotes = [
            { note: 'C#4', offset: 20 }, { note: 'D#4', offset: 56 },
            { note: 'F#4', offset: 128 }, { note: 'G#4', offset: 164 }, { note: 'A#4', offset: 200 },
            { note: 'C#5', offset: 272 }, { note: 'D#5', offset: 308 }
        ];

        return (
            <div className="relative w-[360px] h-[160px] bg-[#808080] border-t-4 border-l-4 border-gray-600 shadow-inner flex-shrink-0">
                {whiteNotes.map((note, i) => (
                    <div key={note} className="absolute" style={{ left: i * 36 }}>
                        <PianoKey note={note} isBlack={false} />
                    </div>
                ))}
                {blackNotes.map((k) => (
                    <PianoKey key={k.note} note={k.note} isBlack={true} leftOffset={k.offset} />
                ))}
            </div>
        );
    };

    return (
        <Window
            title="GrooveStation 95"
            onClose={onClose}
            onFocus={onFocus}
            zIndex={zIndex}
            isFocused={isFocused}
            isClosing={isClosing}
            width="min(720px, 95vw)"
            height="min(auto, 90vh)"
            initialX={100}
            initialY={80}
            icon={<div className="w-full h-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs">♪</div>}
        >
            <div className="bg-[#c0c0c0] p-2 flex flex-col gap-3 w-full min-w-0 overflow-x-hidden">

                {/* Top Rack: Visualizer & Transport */}
                <div className="flex flex-col lg:flex-row gap-2 lg:h-24">
                    {/* Visualizer */}
                    <div className="bg-black border-2 border-gray-600 flex-1 relative rounded-sm overflow-hidden min-h-[120px] lg:min-h-0">
                        <canvas ref={canvasRef} width={400} height={96} className="w-full h-full" />
                        <div className="absolute top-1 left-1 text-[10px] text-green-500 font-mono">OSCILLOSCOPE</div>
                    </div>

                    {/* Transport */}
                    <div className="w-full lg:w-48 bg-[#a0a0a0] border-2 border-white border-b-gray-600 border-r-gray-600 p-2 flex flex-col justify-between">
                        <div className="flex items-center justify-between bg-black px-2 py-1 border border-gray-600 mb-2">
                            <span className="text-red-500 font-mono text-xl font-bold">{bpm}</span>
                            <span className="text-gray-400 text-[10px]">BPM</span>
                        </div>
                        <input
                            type="range" min="60" max="200" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))}
                            className="w-full mb-2"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`touch-manipulation flex-1 min-h-11 py-2 font-bold text-xs border-2 ${isPlaying ? 'bg-green-300 border-inset border-gray-600' : 'bg-gray-300 border-outset border-white'}`}
                            >
                                {isPlaying ? 'STOP' : 'PLAY'}
                            </button>
                            <button
                                onClick={() => { setSequencerGrid(Array(4).fill(null).map(() => Array(16).fill(false))); }}
                                className="touch-manipulation flex-1 min-h-11 py-2 font-bold text-xs bg-gray-300 border-2 border-white border-b-gray-600 border-r-gray-600 active:border-t-black active:border-l-black"
                            >
                                CLEAR
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sequencer Grid */}
                {renderSequencer()}

                {/* Bottom Rack: Synth Controls & Keyboard */}
                <div className="flex flex-col xl:flex-row gap-2">
                    <div className="w-full xl:w-auto overflow-x-auto">
                        {renderPiano()}
                    </div>

                    <div className="flex-1 bg-[#d0d0d0] border-2 border-white border-b-gray-600 border-r-gray-600 p-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="col-span-2 sm:col-span-4 text-[10px] font-bold border-b border-gray-500 mb-1">SYNTHESIZER CONTROL</div>

                        <div className="flex flex-col gap-2 border-r border-gray-400 pr-2">
                            <label className="text-[9px] font-bold">WAVEFORM</label>
                            <select
                                className="touch-manipulation min-h-11 text-xs border border-gray-500"
                                value={params.waveType} onChange={(e) => setParams(p => ({ ...p, waveType: e.target.value as any }))}
                            >
                                <option value="sawtooth">Saw</option>
                                <option value="square">Square</option>
                                <option value="sine">Sine</option>
                                <option value="triangle">Tri</option>
                            </select>
                        </div>

                        <Knob label="Attack" value={params.attack} min={0.01} max={1} onChange={(v) => setParams(p => ({ ...p, attack: v }))} />
                        <Knob label="Release" value={params.release} min={0.1} max={2} onChange={(v) => setParams(p => ({ ...p, release: v }))} />
                        <Knob label="Filter" value={params.cutoff} min={100} max={5000} onChange={(v) => setParams(p => ({ ...p, cutoff: v }))} />

                        <div className="col-span-2 sm:col-span-4 text-[10px] font-bold border-b border-gray-500 mb-1 mt-1">EFFECTS</div>

                        <Knob label="Delay Time" value={params.delayTime} min={0.05} max={1.0} onChange={(v) => setParams(p => ({ ...p, delayTime: v }))} />
                        <Knob label="Delay Mix" value={params.delayMix} min={0} max={0.8} onChange={(v) => setParams(p => ({ ...p, delayMix: v }))} />
                        <Knob label="Volume" value={params.volume} min={0} max={1} onChange={(v) => setParams(p => ({ ...p, volume: v }))} />
                    </div>
                </div>

                <div className="text-[10px] text-gray-500 text-center bg-gray-300 border border-gray-500">
                    STATUS: {isPlaying ? 'PLAYING' : 'READY'} | KEYBOARD INPUT: {isFocused ? 'ACTIVE' : 'INACTIVE'}
                </div>
            </div>
        </Window>
    );
};

export default Synth;
