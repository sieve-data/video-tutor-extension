import { Button } from "@/components/ui/button";
import { IconSparkles } from "@/components/ui/icons";
import { useChat } from "@/contexts/chat-context";
import { useExtension } from "@/contexts/extension-context";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import React from "react";

import { usePort } from "@plasmohq/messaging/hook";

const exampleMessages = [
  {
    heading: "Explain the main concept",
    message: "Can you explain the main concept discussed in this video in simple terms?",
  },
  {
    heading: "Give me an example",
    message: "Can you provide a real-world example of what's being discussed?",
  },
  {
    heading: "Why is this important?",
    message: "Why is this topic important? How does it apply to real life?",
  },
  {
    heading: "Break down the complex parts",
    message: "What are the most complex ideas here and can you break them down?",
  },
];

interface EmptyScreenProps {
  className?: string;
  setPromptInput: (value: any) => void;
}

export default function EmptyScreen({
  className,
  setPromptInput,
}: EmptyScreenProps) {
  // const port = usePort("suggestions")

  // const {
  //   chatSuggestions,
  //   setChatSuggestions,
  //   chatIsGeneratingSuggestions,
  //   setChatIsGeneratingSuggestions,
  //   chatIsErrorSuggestions,
  //   setChatIsErrorSuggestions,
  //   chatModel
  // } = useChat()
  // const { extensionData } = useExtension()

  // async function generateSuggestions() {
  //   console.log("Function That Generates Suggestions Called")
  //   setChatIsGeneratingSuggestions(true)
  //   setChatIsErrorSuggestions(false)
  //   console.log("Chat suggestions")
  //   console.log(chatSuggestions)
  //   port.send({
  //     model: chatModel,
  //     context: extensionData
  //   })
  // }

  // React.useEffect(() => {
  //   console.log("Use Effect That Generates Suggestions Called")
  //   if (port.data?.message !== undefined && port.data.isEnd === false) {
  //     console.log("Return port.data.message")
  //     console.log(port.data.message)

  //     setChatSuggestions([port.data.message])
  //   } else {
  //     setChatIsGeneratingSuggestions(false)
  //   }
  // }, [port.data?.message])

  // React.useEffect(() => {
  //   console.log("Use Effect That Streams Summary Error Called")
  //   if (port.data?.error !== undefined && port.data?.error !== null) {
  //     console.log("Error")
  //     setChatIsErrorSuggestions(true)
  //     setChatSuggestions([])
  //   } else {
  //     setChatIsErrorSuggestions(false)
  //   }
  // }, [port.data?.error])

  // console.log("Chat Suggestions")
  // console.log(chatSuggestions)

  // if chatIsGeneratingSuggestions Create array with len 5 and map and generate loading buttons else map chatSuggestions and generate buttons
  return (
    <div className={cn("mx-auto px-8", className)}>
      <div className="rounded-md bg-background p-8 w-full justify-center flex flex-col items-center">
        <span className="text-2xl flex items-center mb-8">
          <IconSparkles className="inline mr-0 ml-0.5 w-4 sm:w-5 mb-1" />
          Breakdown
        </span>
        <p className="mb-4 leading-normal text-muted-foreground text-center opacity-70">
          Breakdown is a tool that provides real-time concept explanations and
          provides users with a chat interface to ask questions about the
          content.
        </p>

        <p className="leading-normal text-muted-foreground mb-8 opacity-70">
          Try an example:
        </p>
        {/* <Button onClick={generateSuggestions}>Generate Suggestions</Button> */}

        {/* @ts-ignore */}
        {/* {JSON.stringify(chatSuggestions?.questions)} */}

        <div className="flex flex-col items-start space-y-3 justify-start">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => setPromptInput(message.message)}
              className="h-auto w-full  justify-start dark:bg-transparent border-[0.5px] p-3 opacity-80"
            >
              <ArrowRightIcon className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SuggestionItemProps {
  message: string;
  index: number;
  idx: number;
  setPromptInput: (message: string) => void;
}

const SuggestionItem: React.FC<SuggestionItemProps> = React.memo(
  ({ message, index, idx, setPromptInput }) => {
    return (
      <Button
        key={`${index}-${idx}`}
        variant="outline"
        onClick={() => setPromptInput(message)}
        className="h-auto w-full justify-start dark:bg-transparent border-[0.5px] p-3 opacity-80 text-wrap"
      >
        {message}
      </Button>
    );
  }
);
