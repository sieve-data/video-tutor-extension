import { createLlm } from "@/utils/llm"
import type { ChatCompletionMessageParam } from "openai/resources"

import type { PlasmoMessaging } from "@plasmohq/messaging"

const SYSTEM = `
You are an expert educational assistant with deep knowledge about the video being watched. You have access to the complete transcript.

Your role:
- Answer questions clearly and concisely
- Explain complex concepts in simple terms
- Reference specific parts of the video when relevant
- Provide additional context and insights beyond what's explicitly stated
- Use examples and analogies to clarify difficult ideas
- Be conversational and engaging

Keep responses brief (2-3 paragraphs max) unless the user asks for more detail.

Video Title: {title}

Full Transcript:
{transcript}
`

async function createChatCompletion(
  model: string,
  messages: ChatCompletionMessageParam[],
  context: any
) {
  const llm = createLlm(context.openAIKey)
  console.log("Creating Chat Completion")

  const parsed = context.transcript.events
    .filter((x: { segs: any }) => x.segs)
    .map((x: { segs: any[] }) => x.segs.map((y: { utf8: any }) => y.utf8).join(" "))
    .join(" ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")

  const SYSTEM_WITH_CONTEXT = SYSTEM.replace("{title}", context.metadata.title).replace(
    "{transcript}",
    parsed
  )
  messages.unshift({ role: "system", content: SYSTEM_WITH_CONTEXT })

  console.log("Messages sent to OpenAI")
  console.log(messages)

  return llm.beta.chat.completions.stream({
    messages: messages,
    model: model || "gpt-3.5-turbo",
    stream: true
  })
}

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  let cumulativeDelta = ""

  const model = req.body.model
  const messages = req.body.messages
  const context = req.body.context

  console.log("Model")
  console.log(model)
  console.log("Messages")
  console.log(messages)
  console.log("Context")
  console.log(context)

  try {
    const completion = await createChatCompletion(model, messages, context)

    completion.on("content", (delta, snapshot) => {
      cumulativeDelta += delta
      // console.log("Cumulative Delta")
      // console.log(cumulativeDelta)
      res.send({ message: cumulativeDelta, error: null, isEnd: false })
    })

    completion.on("end", () => {
      res.send({ message: "END", error: null, isEnd: true })
    })
  } catch (error) {
    res.send({ error: "something went wrong" })
  }
}

export default handler
