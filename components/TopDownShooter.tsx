import React, { useEffect, useRef, useState } from 'react';
import Window from './Window';
import { GoogleGenAI } from "@google/genai";

interface ShooterProps {
  onClose: () => void;
  onFocus: () => void;
  zIndex: number;
  isFocused: boolean;
  isClosing?: boolean;
}

// --- Constants & Config ---
const TILE_SIZE = 40;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 40;
const FOV_ANGLE = Math.PI / 3;

interface WeaponConfig {
    name: string;
    fireRate: number;
    spread: number;
    count: number;
    speed: number;
    damage: number;
    color: string;
    ammo: number;
    recoil: number;
    screenShake: number;
    range: number;
    soundType: 'pistol' | 'shotgun' | 'uzi';
}

const WEAPONS: Record<string, WeaponConfig> = {
    'PISTOL': { name: 'SILENCED 9MM', fireRate: 200, spread: 0.02, count: 1, speed: 25, damage: 100, color: '#ffeb3b', ammo: 12, recoil: 2, screenShake: 2, range: 600, soundType: 'pistol' },
    'SHOTGUN': { name: 'PUMP ACTION', fireRate: 900, spread: 0.35, count: 8, speed: 20, damage: 100, color: '#ff5722', ammo: 6, recoil: 12, screenShake: 15, range: 400, soundType: 'shotgun' },
    'UZI': { name: 'MICRO SMG', fireRate: 70, spread: 0.2, count: 1, speed: 22, damage: 100, color: '#00bcd4', ammo: 32, recoil: 3, screenShake: 3, range: 500, soundType: 'uzi' },
};

// --- Types ---
interface Vector2 { x: number; y: number; }
interface Entity {
  id: number;
  pos: Vector2;
  velocity: Vector2;
  radius: number;
  rotation: number;
  type: 'player' | 'enemy' | 'bullet' | 'pickup';
  dead: boolean;
  color: string;
  state?: 'idle' | 'chase' | 'search' | 'attack'; // AI State
  alertTimer?: number;
  path?: Vector2[];
  weapon: string;
  ammo: number;
  texture?: HTMLImageElement;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'blood' | 'smoke' | 'spark' | 'muzzle' | 'casing';
}

interface BloodSplat {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
  type: 'pool' | 'splat';
}

const TopDownShooter: React.FC<ShooterProps> = ({ onClose, onFocus, zIndex, isFocused, isClosing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // UI State
  const [score, setScore] = useState(0);
  const [ammo, setAmmo] = useState(12);
  const [currentWeapon, setCurrentWeapon] = useState('PISTOL');
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [message, setMessage] = useState("INFILTRATE. ELIMINATE.");

  // Asset Refs
  const texturesRef = useRef<{
    player: HTMLImageElement | null;
    enemy: HTMLImageElement | null;
    floor: HTMLImageElement | null;
    wall: HTMLImageElement | null;
  }>({ player: null, enemy: null, floor: null, wall: null });

  // Game Engine State
  const gameState = useRef({
    map: [] as number[], // 0 = Floor, 1 = Wall
    player: {
      id: 0,
      pos: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 14,
      rotation: 0,
      type: 'player',
      dead: false,
      color: '#fff',
      weapon: 'PISTOL',
      ammo: 12
    } as Entity,
    enemies: [] as Entity[],
    bullets: [] as Entity[],
    pickups: [] as Entity[],
    particles: [] as Particle[],
    bloodSplats: [] as BloodSplat[],
    keys: { w: false, a: false, s: false, d: false, r: false },
    mouse: { x: 0, y: 0 },
    camera: { x: 0, y: 0 },
    cameraShake: 0,
    chromaticAberration: 0,
    lastShot: 0,
    level: 1
  });

  // --- Audio System ---
  useEffect(() => {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
      return () => { if(audioCtxRef.current) audioCtxRef.current.close(); };
  }, []);

  const playSound = (type: string) => {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'pistol') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, t);
          osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
          gain.gain.setValueAtTime(0.5, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
          osc.start(t);
          osc.stop(t + 0.1);
      } else if (type === 'shotgun') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, t);
          osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);
          gain.gain.setValueAtTime(0.8, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
          
          // Noise layer
          const bufferSize = ctx.sampleRate * 0.2;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.8, t);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
          noise.connect(noiseGain).connect(ctx.destination);
          noise.start(t);

          osc.start(t);
          osc.stop(t + 0.3);
      } else if (type === 'uzi') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(400, t);
          osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
          osc.start(t);
          osc.stop(t + 0.05);
      } else if (type === 'empty') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, t);
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
          osc.start(t);
          osc.stop(t + 0.05);
      } else if (type === 'kill') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100, t);
          osc.frequency.linearRampToValueAtTime(50, t + 0.1);
          gain.gain.setValueAtTime(0.5, t);
          gain.gain.linearRampToValueAtTime(0, t + 0.1);
          osc.start(t);
          osc.stop(t + 0.1);
      }
  };

  // --- Map Generation (Binary Space Partitioning-ish) ---
  const generateMap = () => {
      const w = MAP_WIDTH;
      const h = MAP_HEIGHT;
      const map = new Array(w * h).fill(1); // Fill with walls
      const rooms: {x: number, y: number, w: number, h: number}[] = [];

      // Create rooms
      const attempts = 30;
      for (let i=0; i<attempts; i++) {
          const rw = Math.floor(Math.random() * 6) + 4; // 4-10 size
          const rh = Math.floor(Math.random() * 6) + 4;
          const rx = Math.floor(Math.random() * (w - rw - 2)) + 1;
          const ry = Math.floor(Math.random() * (h - rh - 2)) + 1;

          // Check overlap
          let overlap = false;
          for (const room of rooms) {
              if (rx < room.x + room.w + 1 && rx + rw + 1 > room.x &&
                  ry < room.y + room.h + 1 && ry + rh + 1 > room.y) {
                  overlap = true;
                  break;
              }
          }
          if (!overlap) {
              rooms.push({x: rx, y: ry, w: rw, h: rh});
              // Carve
              for(let y=ry; y<ry+rh; y++) {
                  for(let x=rx; x<rx+rw; x++) {
                      map[y * w + x] = 0;
                  }
              }
          }
      }

      // Connect rooms
      for(let i=0; i<rooms.length-1; i++) {
          const r1 = rooms[i];
          const r2 = rooms[i+1];
          const cx1 = Math.floor(r1.x + r1.w/2);
          const cy1 = Math.floor(r1.y + r1.h/2);
          const cx2 = Math.floor(r2.x + r2.w/2);
          const cy2 = Math.floor(r2.y + r2.h/2);

          // Horizontal then Vertical
          if (Math.random() > 0.5) {
              const startX = Math.min(cx1, cx2);
              const endX = Math.max(cx1, cx2);
              for(let x=startX; x<=endX; x++) map[cy1 * w + x] = 0;
              
              const startY = Math.min(cy1, cy2);
              const endY = Math.max(cy1, cy2);
              for(let y=startY; y<=endY; y++) map[y * w + cx2] = 0;
          } else {
              const startY = Math.min(cy1, cy2);
              const endY = Math.max(cy1, cy2);
              for(let y=startY; y<=endY; y++) map[y * w + cx1] = 0;

              const startX = Math.min(cx1, cx2);
              const endX = Math.max(cx1, cx2);
              for(let x=startX; x<=endX; x++) map[cy2 * w + x] = 0;
          }
      }
      return { map, rooms };
  };

  // --- Physics & Collision ---
  const checkWall = (x: number, y: number) => {
      const map = gameState.current.map;
      const tx = Math.floor(x / TILE_SIZE);
      const ty = Math.floor(y / TILE_SIZE);
      if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return true;
      return map[ty * MAP_WIDTH + tx] === 1;
  };

  const resolveWallCollision = (ent: Entity) => {
      const nextX = ent.pos.x + ent.velocity.x;
      const nextY = ent.pos.y + ent.velocity.y;
      
      // X Axis
      if (!checkWall(nextX + (ent.velocity.x > 0 ? ent.radius : -ent.radius), ent.pos.y) &&
          !checkWall(nextX + (ent.velocity.x > 0 ? ent.radius : -ent.radius), ent.pos.y + ent.radius * 0.5) &&
          !checkWall(nextX + (ent.velocity.x > 0 ? ent.radius : -ent.radius), ent.pos.y - ent.radius * 0.5)) {
          ent.pos.x = nextX;
      } else {
          ent.velocity.x = 0;
      }

      // Y Axis
      if (!checkWall(ent.pos.x, nextY + (ent.velocity.y > 0 ? ent.radius : -ent.radius)) &&
          !checkWall(ent.pos.x + ent.radius * 0.5, nextY + (ent.velocity.y > 0 ? ent.radius : -ent.radius)) &&
          !checkWall(ent.pos.x - ent.radius * 0.5, nextY + (ent.velocity.y > 0 ? ent.radius : -ent.radius))) {
          ent.pos.y = nextY;
      } else {
          ent.velocity.y = 0;
      }
  };

  const raycast = (x1: number, y1: number, x2: number, y2: number): boolean => {
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      const sx = (x1 < x2) ? 1 : -1;
      const sy = (y1 < y2) ? 1 : -1;
      let err = dx - dy;

      let cx = x1;
      let cy = y1;
      
      // Safety limit
      let maxSteps = 1000;
      while (maxSteps-- > 0) {
          if (checkWall(cx, cy)) return true; // Hit Wall
          if (Math.abs(cx - x2) < 2 && Math.abs(cy - y2) < 2) return false; // Reached Target
          
          const e2 = 2 * err;
          if (e2 > -dy) { err -= dy; cx += sx; }
          if (e2 < dx) { err += dx; cy += sy; }
      }
      return false;
  };

  // --- Asset Generation ---
  const generateAssets = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-2.5-flash-image';

        const generateSprite = async (prompt: string): Promise<HTMLImageElement> => {
            const response = await ai.models.generateContent({ model, contents: prompt });
            let base64 = '';
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData && part.inlineData.data) { base64 = part.inlineData.data; break; }
            }
            if (!base64) throw new Error("No image data");
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = `data:image/png;base64,${base64}`;
            });
        };

        const [playerImg, enemyImg, floorImg, wallImg] = await Promise.all([
            generateSprite("Top down view pixel art of a man in a white suit and animal mask holding a gun, transparent background, hotline miami style"),
            generateSprite("Top down view pixel art of a thug in a teal suit holding a bat, transparent background, hotline miami style"),
            generateSprite("Seamless grunge concrete floor texture, top down, pixel art, dark moody"),
            generateSprite("Top down view seamless brick wall texture, pixel art, dark")
        ]);

        texturesRef.current = { player: playerImg, enemy: enemyImg, floor: floorImg, wall: wallImg };
        setAssetsLoaded(true);
        setMessage("ASSETS ACQUIRED. GOOD LUCK.");
    } catch (e) {
        setMessage("GENERATION FAILED. USING SYSTEM DEFAULTS.");
    } finally {
        setIsGenerating(false);
    }
  };

  // --- Game Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Input Handlers
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isFocused) return;
        const k = e.key.toLowerCase();
        if (gameState.current.keys.hasOwnProperty(k)) gameState.current.keys[k as keyof typeof gameState.current.keys] = true;
        if (e.code === 'Space' && (gameOver || gameWon)) resetGame();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (gameState.current.keys.hasOwnProperty(k)) gameState.current.keys[k as keyof typeof gameState.current.keys] = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        gameState.current.mouse.x = e.clientX - rect.left;
        gameState.current.mouse.y = e.clientY - rect.top;
    };
    const handleMouseDown = (e: MouseEvent) => {
         if (!isFocused || gameOver || gameWon) return;
         if (e.button === 0) fireWeapon();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);

    const spawnParticles = (x: number, y: number, count: number, type: Particle['type'], color: string) => {
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (type === 'blood' ? 6 : 2);
            gameState.current.particles.push({
                x, y, 
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 30, maxLife: 60,
                color, size: 2 + Math.random() * 2, type
            });
        }
    };

    const fireWeapon = () => {
        const s = gameState.current;
        const now = Date.now();
        const weapon = WEAPONS[s.player.weapon];

        if (now - s.lastShot < weapon.fireRate) return;
        if (s.player.ammo <= 0) {
            playSound('empty');
            setMessage("CLICK. CLICK. EMPTY.");
            return;
        }

        s.lastShot = now;
        s.player.ammo--;
        setAmmo(s.player.ammo);
        playSound(weapon.soundType);

        s.cameraShake = weapon.screenShake;
        s.player.velocity.x -= Math.cos(s.player.rotation) * weapon.recoil;
        s.player.velocity.y -= Math.sin(s.player.rotation) * weapon.recoil;

        const muzzleX = s.player.pos.x + Math.cos(s.player.rotation) * 25;
        const muzzleY = s.player.pos.y + Math.sin(s.player.rotation) * 25;
        spawnParticles(muzzleX, muzzleY, 5, 'muzzle', '#ffffaa');
        spawnParticles(s.player.pos.x, s.player.pos.y, 1, 'casing', '#ddaa00');

        // Noise alerts enemies
        s.enemies.forEach(e => {
            const dist = Math.sqrt((e.pos.x - s.player.pos.x)**2 + (e.pos.y - s.player.pos.y)**2);
            if (dist < 500) {
                e.state = 'chase';
                e.alertTimer = 100;
            }
        });

        for(let i=0; i<weapon.count; i++) {
            const angle = s.player.rotation + (Math.random() - 0.5) * weapon.spread;
            s.bullets.push({
                id: Math.random(),
                pos: { x: muzzleX, y: muzzleY },
                velocity: { x: Math.cos(angle) * weapon.speed, y: Math.sin(angle) * weapon.speed },
                radius: 2, rotation: angle, type: 'bullet', dead: false, color: '#ff0',
                weapon: s.player.weapon, ammo: 0
            });
        }
    };

    const resetGame = () => {
        const { map, rooms } = generateMap();
        gameState.current.map = map;
        const startRoom = rooms[0];
        
        const s = gameState.current;
        s.player.pos = { x: (startRoom.x + startRoom.w/2) * TILE_SIZE, y: (startRoom.y + startRoom.h/2) * TILE_SIZE };
        s.player.dead = false;
        s.player.weapon = 'PISTOL';
        s.player.ammo = 12;
        s.player.velocity = {x:0, y:0};
        
        s.enemies = [];
        s.bullets = [];
        s.pickups = [];
        s.particles = [];
        s.bloodSplats = [];
        s.cameraShake = 0;
        
        setScore(0);
        setAmmo(12);
        setCurrentWeapon('PISTOL');
        setGameOver(false);
        setGameWon(false);
        setMessage("CLEAR THE BUILDING.");

        // Spawn Enemies in other rooms
        rooms.slice(1).forEach(r => {
            const count = Math.max(1, Math.floor(Math.random() * 3));
            for(let i=0; i<count; i++) {
                const ex = (r.x + 1 + Math.random() * (r.w - 2)) * TILE_SIZE;
                const ey = (r.y + 1 + Math.random() * (r.h - 2)) * TILE_SIZE;
                const type = Math.random() > 0.7 ? 'SHOTGUN' : 'UZI';
                const hasGun = Math.random() > 0.4;
                
                s.enemies.push({
                    id: Math.random(),
                    pos: { x: ex, y: ey },
                    velocity: { x: 0, y: 0 },
                    radius: 14,
                    rotation: Math.random() * Math.PI * 2,
                    type: 'enemy',
                    dead: false,
                    color: '#ff0000',
                    state: 'idle',
                    weapon: hasGun ? (type === 'SHOTGUN' ? 'SHOTGUN' : 'UZI') : 'PISTOL', // Melee logic later, give pistol for now
                    ammo: 999
                });
            }
        });
    };

    let animationFrameId: number;

    const loop = () => {
        const s = gameState.current;
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        if (!gameOver && !gameWon) {
            // -- Player Logic --
            const moveSpeed = 4;
            const friction = 0.8;
            if (s.keys.w) s.player.velocity.y -= 1;
            if (s.keys.s) s.player.velocity.y += 1;
            if (s.keys.a) s.player.velocity.x -= 1;
            if (s.keys.d) s.player.velocity.x += 1;
            
            // Normalize & Apply Speed
            const len = Math.sqrt(s.player.velocity.x**2 + s.player.velocity.y**2);
            if (len > 0) {
                s.player.velocity.x = (s.player.velocity.x / len) * moveSpeed;
                s.player.velocity.y = (s.player.velocity.y / len) * moveSpeed;
            }
            resolveWallCollision(s.player);
            
            // Aiming
            const screenX = s.player.pos.x - s.camera.x;
            const screenY = s.player.pos.y - s.camera.y;
            s.player.rotation = Math.atan2(s.mouse.y - screenY, s.mouse.x - screenX);

            // -- Enemy Logic --
            if (s.enemies.length === 0 && !gameWon) {
                setGameWon(true);
                setMessage("SECTOR CLEAR. GOOD JOB.");
            }

            s.enemies.forEach(e => {
                const dist = Math.sqrt((e.pos.x - s.player.pos.x)**2 + (e.pos.y - s.player.pos.y)**2);
                const angleToPlayer = Math.atan2(s.player.pos.y - e.pos.y, s.player.pos.x - e.pos.x);

                // Line of Sight
                let canSee = false;
                if (dist < 400) {
                     // Check angle (cone of vision)
                     let angleDiff = Math.abs(e.rotation - angleToPlayer);
                     if (angleDiff > Math.PI) angleDiff = 2*Math.PI - angleDiff;
                     
                     if (angleDiff < Math.PI / 2 || e.state === 'chase') {
                         if (!raycast(e.pos.x, e.pos.y, s.player.pos.x, s.player.pos.y)) {
                             canSee = true;
                         }
                     }
                }

                if (canSee) {
                    e.state = 'chase';
                    e.alertTimer = 100;
                    e.rotation = angleToPlayer;
                } else if (e.alertTimer && e.alertTimer > 0) {
                    e.alertTimer--;
                } else {
                    e.state = 'idle';
                }

                if (e.state === 'chase') {
                    // Shoot Logic
                    if (dist < 300 && canSee) {
                         if (Math.random() < 0.05) { // Fire chance
                             // Enemy shoot
                             const eWep = WEAPONS[e.weapon];
                             const fireAngle = e.rotation + (Math.random()-0.5)*0.2;
                             playSound(eWep.soundType);
                             s.bullets.push({
                                 id: Math.random(),
                                 pos: { x: e.pos.x + Math.cos(e.rotation)*20, y: e.pos.y + Math.sin(e.rotation)*20 },
                                 velocity: { x: Math.cos(fireAngle) * eWep.speed, y: Math.sin(fireAngle) * eWep.speed },
                                 radius: 2, rotation: fireAngle, type: 'bullet', dead: false, color: '#f00',
                                 weapon: e.weapon, ammo: 0
                             });
                         }
                    } else {
                        // Move towards player
                        e.velocity.x = Math.cos(e.rotation) * 2;
                        e.velocity.y = Math.sin(e.rotation) * 2;
                        resolveWallCollision(e);
                    }
                }
            });

            // -- Pickups --
            for(let i=s.pickups.length-1; i>=0; i--) {
                const p = s.pickups[i];
                const d = Math.sqrt((p.pos.x - s.player.pos.x)**2 + (p.pos.y - s.player.pos.y)**2);
                if (d < 20) {
                    s.player.weapon = p.weapon;
                    s.player.ammo = WEAPONS[p.weapon].ammo;
                    setAmmo(s.player.ammo);
                    setCurrentWeapon(p.weapon);
                    s.pickups.splice(i, 1);
                    setMessage(`PICKED UP ${WEAPONS[p.weapon].name}`);
                }
            }

            // -- Bullets --
            for(let i=s.bullets.length-1; i>=0; i--) {
                const b = s.bullets[i];
                b.pos.x += b.velocity.x;
                b.pos.y += b.velocity.y;
                
                // Wall Hit
                if (checkWall(b.pos.x, b.pos.y)) {
                    s.bullets.splice(i, 1);
                    spawnParticles(b.pos.x, b.pos.y, 3, 'spark', '#fff');
                    continue;
                }

                // Entity Hit
                let hit = false;
                const targets = b.color === '#ff0' ? s.enemies : [s.player]; // Player bullets are yellow
                
                for(let j=targets.length-1; j>=0; j--) {
                    const t = targets[j];
                    const d = Math.sqrt((b.pos.x - t.pos.x)**2 + (b.pos.y - t.pos.y)**2);
                    if (d < t.radius + 5) {
                        spawnParticles(t.pos.x, t.pos.y, 10, 'blood', '#f00');
                        s.bloodSplats.push({x: t.pos.x, y: t.pos.y, rotation: Math.random()*6, scale: 0.5+Math.random(), opacity: 0.8, type: 'pool'});
                        
                        // Kill
                        t.dead = true;
                        hit = true;
                        
                        if (t.type === 'enemy') {
                            playSound('kill');
                            setScore(prev => prev + 100);
                            s.enemies.splice(j, 1);
                            // Drop weapon
                            if (Math.random() < 0.5) {
                                s.pickups.push({
                                    id: Math.random(), pos: {x: t.pos.x, y: t.pos.y}, velocity: {x:0, y:0}, radius: 10, rotation: 0,
                                    type: 'pickup', dead: false, color: '#fff', weapon: t.weapon, ammo: 0
                                });
                            }
                        } else {
                            setGameOver(true);
                            setMessage("KIA. PRESS SPACE TO RESTART.");
                        }
                        break;
                    }
                }
                if (hit) s.bullets.splice(i, 1);
            }
            
            // Particles
            for(let i=s.particles.length-1; i>=0; i--) {
                const p = s.particles[i];
                p.x += p.vx; p.y += p.vy; p.life--;
                if (checkWall(p.x, p.y)) { p.vx *= -0.5; p.vy *= -0.5; } // Bounce
                p.vx *= 0.9; p.vy *= 0.9;
                if (p.life <= 0) s.particles.splice(i, 1);
            }
        }

        // -- Camera --
        const targetX = s.player.pos.x - 400 + (s.mouse.x - 400) * 0.3;
        const targetY = s.player.pos.y - 300 + (s.mouse.y - 300) * 0.3;
        s.camera.x += (targetX - s.camera.x) * 0.1;
        s.camera.y += (targetY - s.camera.y) * 0.1;
        
        if (s.cameraShake > 0) {
            s.camera.x += (Math.random()-0.5) * s.cameraShake;
            s.camera.y += (Math.random()-0.5) * s.cameraShake;
            s.cameraShake *= 0.9;
        }

        // -- RENDER --
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, 800, 600);

        ctx.save();
        ctx.translate(-s.camera.x, -s.camera.y);

        // Render Map
        const startCol = Math.floor(s.camera.x / TILE_SIZE);
        const endCol = startCol + (800 / TILE_SIZE) + 1;
        const startRow = Math.floor(s.camera.y / TILE_SIZE);
        const endRow = startRow + (600 / TILE_SIZE) + 1;

        for(let y=startRow; y<=endRow; y++) {
            for(let x=startCol; x<=endCol; x++) {
                if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                    const tile = s.map[y * MAP_WIDTH + x];
                    if (tile === 0) {
                        // Floor
                        if (texturesRef.current.floor) {
                            ctx.drawImage(texturesRef.current.floor, x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        } else {
                            ctx.fillStyle = (x+y)%2 === 0 ? '#333' : '#3a3a3a';
                            ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        }
                    } else {
                        // Wall
                        if (texturesRef.current.wall) {
                            ctx.drawImage(texturesRef.current.wall, x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        } else {
                            ctx.fillStyle = '#555';
                            ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
                            // Fake 3D top
                            ctx.fillStyle = '#222';
                            ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE + TILE_SIZE - 5, TILE_SIZE, 5);
                        }
                    }
                }
            }
        }

        // Blood
        s.bloodSplats.forEach(b => {
             ctx.save();
             ctx.translate(b.x, b.y);
             ctx.rotate(b.rotation);
             ctx.fillStyle = '#8a0303';
             ctx.globalAlpha = b.opacity;
             ctx.beginPath();
             ctx.ellipse(0, 0, 15*b.scale, 10*b.scale, 0, 0, Math.PI*2);
             ctx.fill();
             ctx.restore();
        });

        // Entities
        const drawEntity = (e: Entity) => {
             ctx.save();
             ctx.translate(e.pos.x, e.pos.y);
             ctx.rotate(e.rotation);
             
             // Legs
             if (e.velocity.x !== 0 || e.velocity.y !== 0) {
                 const t = Date.now()/100;
                 ctx.fillStyle = '#000';
                 ctx.fillRect(-10, 5 + Math.sin(t)*5, 6, 6);
                 ctx.fillRect(4, 5 + Math.cos(t)*5, 6, 6);
             }

             if (e.type === 'player' && texturesRef.current.player) {
                 ctx.drawImage(texturesRef.current.player, -20, -20, 40, 40);
             } else if (e.type === 'enemy' && texturesRef.current.enemy) {
                 ctx.drawImage(texturesRef.current.enemy, -20, -20, 40, 40);
             } else {
                 // Fallback graphics
                 ctx.fillStyle = e.color;
                 ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI*2); ctx.fill();
                 ctx.fillStyle = '#000';
                 // Weapon arm
                 ctx.fillRect(0, 5, 25, 4);
             }
             ctx.restore();
        };

        if (!s.player.dead) drawEntity(s.player);
        s.enemies.forEach(e => drawEntity(e));
        
        // Pickups
        s.pickups.forEach(p => {
            ctx.save();
            ctx.translate(p.pos.x, p.pos.y);
            const float = Math.sin(Date.now()/200)*3;
            ctx.fillStyle = WEAPONS[p.weapon].color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle;
            ctx.font = '10px Arial';
            ctx.fillText(WEAPONS[p.weapon].name, -20, -10 + float);
            ctx.fillRect(-10, 0 + float, 20, 6);
            ctx.restore();
        });

        // Bullets
        s.bullets.forEach(b => {
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(b.pos.x, b.pos.y);
            ctx.lineTo(b.pos.x - b.velocity.x*0.5, b.pos.y - b.velocity.y*0.5);
            ctx.stroke();
        });

        // Particles
        s.particles.forEach(p => {
             ctx.fillStyle = p.color;
             ctx.globalAlpha = p.life / p.maxLife;
             ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;

        // Darkness / Line of Sight
        ctx.restore(); // Reset to Screen Space
        ctx.save();
        
        // Vignette (Camera based, not player based, subtle)
        const grad = ctx.createRadialGradient(400, 300, 300, 400, 300, 600);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,800,600);
        
        ctx.restore();

        // UI
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Courier New';
        ctx.fillText(`${score}`, 20, 40);
        
        ctx.textAlign = 'right';
        ctx.fillStyle = WEAPONS[currentWeapon].color;
        ctx.fillText(`${currentWeapon} ${ammo}/${WEAPONS[currentWeapon].ammo}`, 780, 560);
        
        ctx.textAlign = 'center';
        ctx.font = '16px Courier New';
        ctx.fillStyle = '#00ff00';
        ctx.fillText(message, 400, 40);

        if (gameOver) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(0,0,800,600);
            ctx.font = 'bold 60px Courier New';
            ctx.fillStyle = '#fff';
            ctx.fillText("R E S T A R T", 400, 300);
        }
        if (gameWon) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.fillRect(0,0,800,600);
            ctx.font = 'bold 60px Courier New';
            ctx.fillStyle = '#fff';
            ctx.fillText("C L E A R", 400, 300);
            ctx.font = '20px Courier New';
            ctx.fillText("PRESS SPACE FOR NEXT FLOOR", 400, 350);
        }

        // Scanlines
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for(let i=0; i<600; i+=2) ctx.fillRect(0, i, 800, 1);

        animationFrameId = requestAnimationFrame(loop);
    };

    resetGame();
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver, gameWon]);

  return (
    <Window
      title="Neon Vengeance II"
      onClose={onClose}
      onFocus={onFocus}
      zIndex={zIndex}
      isFocused={isFocused}
      isClosing={isClosing}
      width="800px"
      height="auto"
      initialX={80}
      initialY={50}
      icon={<div className="bg-red-900 text-white font-bold flex items-center justify-center w-full h-full text-xs">☠️</div>}
    >
        <div className="bg-[#111] relative border-2 border-gray-600 group">
            <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                    onClick={generateAssets}
                    disabled={isGenerating || assetsLoaded}
                    className={`px-2 py-1 text-[10px] font-bold border-2 ${assetsLoaded ? 'bg-green-700 text-white border-green-500' : 'bg-pink-600 text-white border-pink-400 animate-pulse'}`}
                 >
                    {isGenerating ? 'GENERATING TEXTURES...' : assetsLoaded ? 'TEXTURES LOADED' : 'ENHANCE GRAPHICS (AI)'}
                 </button>
            </div>
            <canvas 
                ref={canvasRef} 
                width={800} 
                height={600} 
                className="cursor-crosshair w-full h-full block bg-black"
                style={{ imageRendering: 'pixelated' }}
            />
        </div>
        <div className="bg-[#c0c0c0] px-2 py-1 text-xs border-t border-white flex justify-between font-mono">
            <span>WASD=MOVE L-CLICK=SHOOT SPACE=RESTART</span>
            <span className="text-red-800 font-bold">KILL EVERYONE</span>
        </div>
    </Window>
  );
};

export default TopDownShooter;