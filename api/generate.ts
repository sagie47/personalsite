import { GoogleGenAI } from '@google/genai';

interface ApiRequest {
    method?: string;
    headers: Record<string, string | string[] | undefined>;
    body?: unknown;
}

interface ApiResponse {
    status: (code: number) => ApiResponse;
    json: (body: unknown) => void;
    setHeader: (name: string, value: string) => void;
}

interface GenerateBody {
    kind: 'chat' | 'image';
    contents?: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }>;
    prompt?: string;
    systemInstruction?: string;
    maxOutputTokens?: number;
    aspectRatio?: string;
}

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const getClientAddress = (req: ApiRequest): string => {
    const forwardedFor = req.headers['x-forwarded-for'];
    return Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim() || 'unknown';
};

const getText = (response: { text?: string }): string => response.text?.trim() || '';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const address = getClientAddress(req);
    const now = Date.now();
    const current = requestCounts.get(address);
    const entry = !current || current.resetAt <= now
        ? { count: 0, resetAt: now + WINDOW_MS }
        : current;

    if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
    }
    entry.count += 1;
    requestCounts.set(address, entry);

    const body = req.body as GenerateBody | undefined;
    if (!body || (body.kind !== 'chat' && body.kind !== 'image')) {
        res.status(400).json({ error: 'Invalid generation request' });
        return;
    }

    if (!process.env.GEMINI_API_KEY) {
        res.status(503).json({ error: 'AI service is not configured' });
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        if (body.kind === 'image') {
            if (!body.prompt || body.prompt.length > 2_000) {
                res.status(400).json({ error: 'Invalid image prompt' });
                return;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: body.prompt,
                config: { imageConfig: { aspectRatio: body.aspectRatio || '3:4' } },
            });
            const imageData = response.candidates?.[0]?.content?.parts
                ?.find(part => part.inlineData?.data)?.inlineData?.data;

            if (!imageData) {
                res.status(502).json({ error: 'AI returned no image data' });
                return;
            }
            res.status(200).json({ imageData });
            return;
        }

        if (!body.contents?.length || body.contents.length > 30) {
            res.status(400).json({ error: 'Invalid chat history' });
            return;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: body.contents,
            config: {
                systemInstruction: body.systemInstruction?.slice(0, 4_000),
                maxOutputTokens: Math.min(body.maxOutputTokens || 150, 500),
            },
        });

        res.status(200).json({ text: getText(response) || '...' });
    } catch (error) {
        console.error('Gemini request failed:', error);
        res.status(502).json({ error: 'AI request failed' });
    }
}
