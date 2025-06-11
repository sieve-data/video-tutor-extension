import ChatActions from "./chat-actions"
import ChatList from "./chat-list"
import PromptForm from "./chat-prompt-form"
import { useChat } from "@/contexts/chat-context"
import { useExtension } from "@/contexts/extension-context"
import { useEffect } from "react"

interface ChatProps {}

export default function Chat({}: ChatProps) {
  const { chatMessages, setChatMessages } = useChat()
  const { extensionData } = useExtension()

  // Add welcome message when chat is first opened and transcript is available
  useEffect(() => {
    if (chatMessages.length === 0 && extensionData?.transcript) {
      setChatMessages([{
        role: "assistant",
        content: "👋 Hi! I can answer questions about this video. Ask me anything about the concepts, topics, or specific moments discussed!"
      }])
    }
  }, [extensionData?.transcript])

  return (
    <div className="w-full h-[498px] relative bg-white dark:bg-[#0f0f0f]">
      <ChatActions />
      <ChatList />
      <PromptForm />
    </div>
  )
}
