import { Button } from "@/components/ui/button"
import { CollapsibleTrigger } from "@/components/ui/collapsible"
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper"
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard"

// prettier-ignore
import { ActivityLogIcon, CaretSortIcon, ChatBubbleIcon, CheckIcon, Link2Icon, Pencil2Icon, GearIcon } from "@radix-ui/react-icons";

import { IconSieve } from "@/components/ui/icons"
import { useExtension } from "@/contexts/extension-context"

interface ExtensionActionsProps {
  onOpenSettings?: () => void
}

export default function ExtensionActions({ onOpenSettings }: ExtensionActionsProps) {
  const { extensionIsOpen, extensionPanel, setExtensionIsOpen, setExtensionPanel } =
    useExtension()

  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  function CopyVideoURL() {
    if (isCopied) return
    copyToClipboard(window.location.href)
  }

  return (
    <div className="dark:bg-[#0f0f0f] dark:text-white rounded-md border border-zinc-200 dark:border-zinc-800">
      {/* Header with logo and title */}
      <div className="p-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          <IconSieve className="h-7 w-7 opacity-80" />
          <span className="font-semibold text-base">Sieve Breakdown</span>
        </div>
      </div>
      
      {/* Actions bar */}
      <div className="p-2.5 px-3 flex items-center justify-between">
        <div className="flex justify-center items-center space-x-2">
          <div className="flex -space-x-px">
            <Button
              variant="outline"
              onClick={() => {
                setExtensionPanel("Learn")
                if (!extensionIsOpen) setExtensionIsOpen(true)
              }}
              className="rounded-r-none focus:z-10 bg-transparent dark:bg-transparent space-x-2 items-center">
              <Pencil2Icon className="h-4 w-4 opacity-60" />
              <span className="opacity-90">Learn</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setExtensionPanel("Transcript")
                if (!extensionIsOpen) setExtensionIsOpen(true)
              }}
              className="rounded-none focus:z-10 bg-transparent dark:bg-transparent space-x-2 items-center">
              <ActivityLogIcon className="h-4 w-4 opacity-60" />
              <span className="opacity-90">Transcript</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setExtensionPanel("Chat")
                if (!extensionIsOpen) setExtensionIsOpen(true)
              }}
              className="rounded-l-none focus:z-10 bg-transparent dark:bg-transparent space-x-2 items-center">
              <ChatBubbleIcon className="h-4 w-4 opacity-60" />
              <span className="opacity-90">Chat</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <TooltipWrapper text="Settings">
            <Button variant="outline" size="icon" onClick={onOpenSettings}>
              <GearIcon className="h-4.5 w-4.5 opacity-60" />
            </Button>
          </TooltipWrapper>

          <TooltipWrapper text="Copy Video URL">
            <Button variant="outline" size="icon" onClick={() => CopyVideoURL()}>
              {isCopied ? (
                <CheckIcon className="h-4.5 w-4.5 opacity-60" />
              ) : (
                <Link2Icon className="h-4.5 w-4.5 opacity-60" />
              )}
            </Button>
          </TooltipWrapper>

          <CollapsibleTrigger asChild>
            <Button variant="outline" size="icon">
              <CaretSortIcon className="h-4.5 w-4.5 opacity-60" />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
    </div>
  )
}

// TODO: Add hotkeys import { useHotkeys } from "react-hotkeys-hook"

// useHotkeys("ctrl+j", () => {
//   if (extensionPanel !== "Learn") {
//     if (!extensionIsOpen) setExtensionIsOpen(true)
//     setExtensionPanel("Learn")
//   }
// })

// useHotkeys("ctrl+t", () => {
//   if (extensionPanel !== "Transcript") {
//     if (!extensionIsOpen) setExtensionIsOpen(true)
//     setExtensionPanel("Transcript")
//   }
// })

// useHotkeys("c", () => {
//   if (extensionPanel !== "Chat") {
//     if (!extensionIsOpen) setExtensionIsOpen(true)
//     setExtensionPanel("Chat")
//   }
// })

// useHotkeys("ctrl+shift+c", () => {
//   CopyVideoURL()
// })

// useHotkeys("ctrl+shift+b", () => {
//   setExtensionIsOpen(!extensionIsOpen)
// })
