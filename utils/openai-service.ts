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

    const systemPrompt = `You are an intelligent learning assistant that helps users understand video content. 
Your task is to analyze transcript segments and provide clear, insightful explanations that:
- Identify and explain key concepts, terms, or ideas
- Provide relevant context or background information
- Highlight important points or takeaways
- Use simple, accessible language
- Keep explanations concise but comprehensive (2-3 paragraphs max)
- Use bullet points for lists when appropriate
- Include interesting facts or connections when relevant`

    const userPrompt = `Video Title: ${request.videoTitle || 'Unknown'}

Transcript Segment:
"${request.chunkText}"

${request.previousContext ? `Previous Context: ${request.previousContext}` : ''}

Please provide a clear, educational explanation of what's being discussed in this segment. Focus on helping the viewer understand the key concepts and their significance.`

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
        max_tokens: 500
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