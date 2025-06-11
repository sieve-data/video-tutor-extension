import { storage } from "@/lib/atoms/storage"

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

export interface ExplanationRequest {
  chunkText: string
  videoTitle?: string
  previousContext?: string
}

export async function generateExplanation(request: ExplanationRequest): Promise<string> {
  try {
    // Get API key from storage
    const openAIKey = await storage.get("openAIKey")
    
    if (!openAIKey) {
      throw new Error("OpenAI API key not configured")
    }

    const systemPrompt = `You are a concise learning assistant. Create SHORT, PUNCHY insights using bullet points.

RULES:
- Maximum 3-4 bullet points
- Each bullet: 1-2 sentences MAX
- Start with the insight, not meta-commentary
- Use **bold** for key concepts
- Focus on the "aha!" moments
- Make it scannable and memorable
- NO phrases like "In this segment" or "The speaker discusses"
- Get straight to the point

Example format:
• **Key Concept**: Quick insight or principle
• **Why it matters**: Real-world impact
• **Remember this**: Memorable takeaway`

    const userPrompt = `Video: "${request.videoTitle || 'Educational Video'}"

Transcript:
"${request.chunkText}"

Give me the key insights as bullet points. Be direct and concise.`

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate explanation')
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'No explanation generated'

  } catch (error) {
    console.error('Error generating explanation:', error)
    throw error
  }
}

// Cache for storing generated explanations
const explanationCache = new Map<string, string>()

export async function getCachedExplanation(
  chunkId: string, 
  request: ExplanationRequest
): Promise<string> {
  // Check cache first
  if (explanationCache.has(chunkId)) {
    return explanationCache.get(chunkId)!
  }

  // Generate new explanation
  const explanation = await generateExplanation(request)
  
  // Cache the result
  explanationCache.set(chunkId, explanation)
  
  return explanation
}

export function clearExplanationCache() {
  explanationCache.clear()
}