export interface ChatContent {
    role: 'user' | 'model';
    parts: [{ text: string }];
}

interface GenerateRequest {
    kind: 'chat' | 'image';
    contents?: ChatContent[];
    prompt?: string;
    systemInstruction?: string;
    maxOutputTokens?: number;
    aspectRatio?: string;
}

interface GenerateResponse {
    text?: string;
    imageData?: string;
}

const generate = async (request: GenerateRequest): Promise<GenerateResponse> => {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`AI request failed with status ${response.status}`);
    }

    return response.json() as Promise<GenerateResponse>;
};

export const generateGeminiText = (request: Omit<GenerateRequest, 'kind'>): Promise<GenerateResponse> =>
    generate({ ...request, kind: 'chat' });

export const generateGeminiImage = (prompt: string, aspectRatio?: string): Promise<GenerateResponse> =>
    generate({ kind: 'image', prompt, aspectRatio });
