import React, { useEffect, useRef, useState } from 'react';
import Window from './Window';

interface GameProps {
    onClose: () => void;
    onFocus: () => void;
    zIndex: number;
    isFocused: boolean;
    isClosing?: boolean;
}

interface Entity {
    x: number;
    y: number;
    w: number;
    h: number;
    type?: 'spike' | 'block' | 'coin' | 'platform';
    collected?: boolean;
}

const PlatformerGame: React.FC<GameProps> = ({ onClose, onFocus, zIndex, isFocused, isClosing = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    // Game Configuration
    const WIDTH = 640;
    const HEIGHT = 320;
    const GROUND_Y = 280;
    const PLAYER_X = 100;
    const GRAVITY = 0.6;
    const JUMP_FORCE = -12;

    const gameState = useRef({
        player: {
            y: GROUND_Y - 30,
            dy: 0,
            h: 30,
            w: 30,
            rotation: 0,
            onGround: true,
            dead: false
        },
        obstacles: [] as Entity[],
        particles: [] as { x: number, y: number, vx: number, vy: number, life: number, color: string }[],
        speed: 6,
        distance: 0,
        cameraShake: 0,
        lastSpawnX: WIDTH,
        score: 0
    });

    const isFocusedRef = useRef(isFocused);
    useEffect(() => { isFocusedRef.current = isFocused; }, [isFocused]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId: number;

        const spawnPattern = (xOffset: number) => {
            const patterns = [
                // Pattern 1: Simple Jump over spike
                (startX: number) => {
                    gameState.current.obstacles.push({ x: startX, y: GROUND_Y - 30, w: 30, h: 30, type: 'spike' });
                    return startX + 250;
                },
                // Pattern 2: Triple Spike (requires precise jump or platform)
                (startX: number) => {
                    gameState.current.obstacles.push({ x: startX - 50, y: GROUND_Y - 70, w: 200, h: 20, type: 'platform' });
                    gameState.current.obstacles.push({ x: startX + 20, y: GROUND_Y - 30, w: 30, h: 30, type: 'spike' });
                    gameState.current.obstacles.push({ x: startX + 50, y: GROUND_Y - 30, w: 30, h: 30, type: 'spike' });
                    return startX + 350;
                },
                // Pattern 3: Staircase of platforms
                (startX: number) => {
                    gameState.current.obstacles.push({ x: startX, y: GROUND_Y - 60, w: 80, h: 20, type: 'platform' });
                    gameState.current.obstacles.push({ x: startX + 120, y: GROUND_Y - 120, w: 80, h: 20, type: 'platform' });
                    gameState.current.obstacles.push({ x: startX + 150, y: GROUND_Y - 150, w: 20, h: 20, type: 'coin' });
                    gameState.current.obstacles.push({ x: startX + 80, y: GROUND_Y - 30, w: 30, h: 30, type: 'spike' });
                    return startX + 400;
                },
                // Pattern 4: Block jump
                (startX: number) => {
                    gameState.current.obstacles.push({ x: startX, y: GROUND_Y - 40, w: 40, h: 40, type: 'block' });
                    gameState.current.obstacles.push({ x: startX + 200, y: GROUND_Y - 40, w: 40, h: 40, type: 'block' });
                    return startX + 400;
                }
            ];

            const pick = patterns[Math.floor(Math.random() * patterns.length)];
            return pick(xOffset);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isFocusedRef.current) return;
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                const s = gameState.current;
                if (s.player.dead && gameOver) {
                    resetGame();
                } else if (s.player.onGround && !s.player.dead) {
                    s.player.dy = JUMP_FORCE;
                    s.player.onGround = false;
                    for (let k = 0; k < 8; k++) {
                        s.particles.push({
                            x: PLAYER_X + 15,
                            y: s.player.y + 30,
                            vx: (Math.random() - 0.5) * 6,
                            vy: Math.random() * -3,
                            life: 30,
                            color: '#00ffff'
                        });
                    }
                }
            }
            if (e.code === 'Enter' && gameOver) resetGame();
        };

        window.addEventListener('keydown', handleKeyDown);

        const resetGame = () => {
            const s = gameState.current;
            s.player = { y: GROUND_Y - 30, dy: 0, h: 30, w: 30, rotation: 0, onGround: true, dead: false };
            s.obstacles = [];
            s.particles = [];
            s.speed = 6;
            s.distance = 0;
            s.cameraShake = 0;
            s.lastSpawnX = WIDTH;
            s.score = 0;
            setScore(0);
            setGameOver(false);
        };

        const update = () => {
            const s = gameState.current;
            if (s.player.dead) return;

            s.distance += s.speed;
            s.speed = Math.min(14, 6 + s.distance / 5000);

            // Player Physics
            s.player.dy += GRAVITY;
            s.player.y += s.player.dy;

            // Ground Collision
            if (s.player.y >= GROUND_Y - 30) {
                s.player.y = GROUND_Y - 30;
                s.player.dy = 0;
                s.player.onGround = true;
                const rot = s.player.rotation % (Math.PI / 2);
                if (rot < 0.1 || rot > (Math.PI / 2 - 0.1)) {
                    s.player.rotation = Math.round(s.player.rotation / (Math.PI / 2)) * (Math.PI / 2);
                } else {
                    s.player.rotation += 0.2;
                }
            } else {
                s.player.rotation += 0.2;
            }

            // Generate Level
            if (s.lastSpawnX < s.distance + WIDTH + 100) {
                s.lastSpawnX = spawnPattern(s.lastSpawnX + 100);
            }

            s.lastSpawnX -= s.speed;

            if (s.lastSpawnX < WIDTH + 200) {
                s.lastSpawnX = spawnPattern(WIDTH + 50);
            }

            for (let i = s.obstacles.length - 1; i >= 0; i--) {
                const ob = s.obstacles[i];
                ob.x -= s.speed;

                const pRect = { x: PLAYER_X + 6, y: s.player.y + 6, w: 18, h: 18 };
                const oRect = { x: ob.x, y: ob.y, w: ob.w, h: ob.h };

                if (
                    pRect.x < oRect.x + oRect.w &&
                    pRect.x + pRect.w > oRect.x &&
                    pRect.y < oRect.y + oRect.h &&
                    pRect.y + pRect.h > oRect.y
                ) {
                    if (ob.type === 'coin') {
                        if (!ob.collected) {
                            ob.collected = true;
                            s.score += 50;
                            setScore(s.score);
                            // Coin particles
                            for (let k = 0; k < 5; k++) {
                                s.particles.push({
                                    x: ob.x + ob.w / 2,
                                    y: ob.y + ob.h / 2,
                                    vx: (Math.random() - 0.5) * 5,
                                    vy: (Math.random() - 0.5) * 5,
                                    life: 20,
                                    color: '#ffd700'
                                });
                            }
                        }
                    } else if (ob.type === 'spike') {
                        die();
                    } else if (ob.type === 'block' || ob.type === 'platform') {
                        if (s.player.dy >= 0 && s.player.y + 30 <= ob.y + 15) {
                            s.player.y = ob.y - 30;
                            s.player.dy = 0;
                            s.player.onGround = true;

                            const rot = s.player.rotation % (Math.PI / 2);
                            if (rot < 0.2 || rot > (Math.PI / 2 - 0.2)) {
                                s.player.rotation = Math.round(s.player.rotation / (Math.PI / 2)) * (Math.PI / 2);
                            } else {
                                s.player.rotation += 0.2;
                            }
                        } else if (ob.type === 'block') {
                            die();
                        }
                    }
                }

                if (ob.x + ob.w < -100) {
                    s.obstacles.splice(i, 1);
                }
            }

            for (let i = s.obstacles.length - 1; i >= 0; i--) {
                if (s.obstacles[i].type === 'coin' && s.obstacles[i].collected) s.obstacles.splice(i, 1);
            }

            for (let i = s.particles.length - 1; i >= 0; i--) {
                const p = s.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                if (p.life <= 0) s.particles.splice(i, 1);
            }

            if (s.cameraShake > 0) s.cameraShake *= 0.9;
        };

        const die = () => {
            const s = gameState.current;
            s.player.dead = true;
            setGameOver(true);
            s.cameraShake = 20;
            for (let k = 0; k < 30; k++) {
                s.particles.push({
                    x: PLAYER_X + 15,
                    y: s.player.y + 15,
                    vx: (Math.random() - 0.5) * 12,
                    vy: (Math.random() - 0.5) * 12,
                    life: 60,
                    color: '#ff1fad'
                });
            }
        };

        const draw = () => {
            const s = gameState.current;

            const shakeX = (Math.random() - 0.5) * s.cameraShake;
            const shakeY = (Math.random() - 0.5) * s.cameraShake;

            ctx.save();
            ctx.translate(shakeX, shakeY);

            // Background
            ctx.fillStyle = '#101018';
            ctx.fillRect(-20, -20, WIDTH + 40, HEIGHT + 40);

            // Retro Grid Background
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 31, 173, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const gridX = -(s.distance * 0.5) % 40;
            for (let x = gridX; x < WIDTH; x += 40) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, HEIGHT);
            }
            for (let y = 0; y < HEIGHT; y += 40) {
                ctx.moveTo(0, y);
                ctx.lineTo(WIDTH, y);
            }
            ctx.stroke();
            ctx.restore();

            // Floor with Neon Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, GROUND_Y);
            ctx.lineTo(WIDTH, GROUND_Y);
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#001a1a';
            ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

            // Obstacles
            for (const ob of s.obstacles) {
                if (ob.type === 'spike') {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#ff3333';
                    ctx.fillStyle = '#ff3333';
                    ctx.beginPath();
                    ctx.moveTo(ob.x, ob.y + ob.h);
                    ctx.lineTo(ob.x + ob.w / 2, ob.y);
                    ctx.lineTo(ob.x + ob.w, ob.y + ob.h);
                    ctx.fill();
                } else if (ob.type === 'block') {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#33ff33';
                    ctx.fillStyle = '#000';
                    ctx.strokeStyle = '#33ff33';
                    ctx.lineWidth = 2;
                    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
                    ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
                } else if (ob.type === 'coin' && !ob.collected) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#ffd700';
                    ctx.fillStyle = '#ffd700';
                    ctx.beginPath();
                    ctx.arc(ob.x + ob.w / 2, ob.y + ob.h / 2, ob.w / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (ob.type === 'platform') {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#33ccff';
                    ctx.fillStyle = '#000';
                    ctx.strokeStyle = '#33ccff';
                    ctx.lineWidth = 2;
                    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
                    ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
                }
            }

            // Particles
            for (const p of s.particles) {
                ctx.shadowBlur = 5;
                ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 30;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            // Player
            if (!s.player.dead) {
                ctx.save();
                ctx.translate(PLAYER_X + 15, s.player.y + 15);
                ctx.rotate(s.player.rotation);
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ff1fad';
                ctx.fillStyle = '#ff1fad';
                ctx.fillRect(-15, -15, 30, 30);
                ctx.fillStyle = '#000';
                ctx.fillRect(-10, -10, 20, 20); // Hollow look
                ctx.fillStyle = '#ff1fad';
                ctx.fillRect(-5, -5, 10, 10); // Center
                ctx.restore();
            }

            ctx.restore();

            // HUD - Score
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`SCORE: ${s.score.toString().padStart(6, '0')}`, 20, 30);
            ctx.restore();

            // UI Layer
            if (gameOver) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
                ctx.fillStyle = '#ff3333';
                ctx.font = 'bold 30px Arial';
                ctx.textAlign = 'center';
                ctx.fillText("CRASHED", WIDTH / 2, HEIGHT / 2 - 20);
                ctx.fillStyle = '#fff';
                ctx.font = '16px Arial';
                ctx.fillText("Press SPACE to Retry", WIDTH / 2, HEIGHT / 2 + 20);
            } else if (!isFocusedRef.current) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText("CLICK TO PLAY", WIDTH / 2, HEIGHT / 2);
            }
        };

        const loop = () => {
            update();
            draw();
            frameId = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            cancelAnimationFrame(frameId);
        };
    }, [gameOver]);

    return (
        <Window
            title="Geometry Dash.exe"
            onClose={onClose}
            onFocus={onFocus}
            zIndex={zIndex}
            isFocused={isFocused}
            isClosing={isClosing}
            width="min(660px, 95vw)"
            height="auto"
            initialX={150}
            initialY={100}
            icon={<div className="bg-yellow-400 w-full h-full border border-black" />}
        >
            <div className="bg-black p-1 border-2 border-gray-600 border-inset overflow-x-auto">
                <canvas
                    ref={canvasRef}
                    width={WIDTH}
                    height={HEIGHT}
                    className="block bg-[#050505] cursor-pointer"
                />
            </div>
            <div className="flex justify-between px-2 py-1 bg-[#c0c0c0] text-sm border-t border-gray-400">
                <span>Score: {score}</span>
                <span>Controls: SPACE to Jump</span>
            </div>
        </Window>
    );
};

export default PlatformerGame;