import { storage } from "@/lib/atoms/storage";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface ExplanationRequest {
  chunkText: string;
  videoTitle?: string;
  previousContext?: string;
}

export async function generateExplanation(
  request: ExplanationRequest
): Promise<string> {
  try {
    // Get API key from storage
    const openAIKey = await storage.get("openAIKey");

    if (!openAIKey) {
      throw new Error("OpenAI API key not configured");
    }

    const instructions = `
You are a **learning coach** whose job is to both *summarize* and *elevate* ideas from a video segment.

GOALS
• Give the learner a rapid mental model of the content.
• Surface definitions, examples or context that clarify tricky terms.
• Highlight the WHY behind each point so the learner understands its significance.
• Prompt reflection when useful.

FORMAT
1. Start with ONE short paragraph (1–2 sentences) that hooks the learner with the core idea.

2. Follow with 3–6 bullet points (markdown "-") that expand on essential concepts or provide quick definitions/analogies.

3. End, if appropriate, with a "💡 Think Further:" line posing a reflection question (keep it to 1 sentence).

4. Keep every paragraph AND bullet point to **max 2 sentences**.

5. Use **bold** to emphasize key terms or numbers.

6. Avoid fluff (e.g. "In this video..."). Get straight to learning value.

7. Separate paragraphs and bullet blocks with a blank line for readability.

EXAMPLE
Education debt can feel abstract—think of it as **future purchasing power** borrowed from your older self.

- **Compound Interest**: Small deferrals today snowball into much larger pay-offs or costs tomorrow.

- **Opportunity Cost**: Every dollar of debt is a dollar not invested elsewhere.

- **Rule of 60**: Adding 1 % to an interest rate roughly adds 60 % to total cost over 30 years.

💡 Think Further: What non-financial costs accompany long-term debt?`;

    const textToSummarize = `Video: "${request.videoTitle || "Educational Video"}"

Transcript:
"${request.chunkText}"

Produce a concise learning breakdown that follows the FORMAT guidelines above.`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: "o3-mini-2025-01-31",
        messages: [
          { role: "user", content: textToSummarize },
          { role: "user", content: instructions },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate explanation");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No explanation generated";
  } catch (error) {
    console.error("Error generating explanation:", error);
    throw error;
  }
}

// Cache for storing generated explanations
const explanationCache = new Map<string, string>();

export async function getCachedExplanation(
  chunkId: string,
  request: ExplanationRequest
): Promise<string> {
  // Check cache first
  if (explanationCache.has(chunkId)) {
    return explanationCache.get(chunkId)!;
  }

  // Generate new explanation
  const explanation = await generateExplanation(request);

  // Cache the result
  explanationCache.set(chunkId, explanation);

  return explanation;
}

export function clearExplanationCache() {
  explanationCache.clear();
}
