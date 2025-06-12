import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";

// prettier-ignore
import { ActivityLogIcon, CaretSortIcon, ChatBubbleIcon, CheckIcon, Link2Icon, Pencil2Icon, GearIcon } from "@radix-ui/react-icons";

import { IconSieve } from "@/components/ui/icons";
import { useExtension } from "@/contexts/extension-context";

interface ExtensionActionsProps {
  onOpenSettings?: () => void;
}

export default function ExtensionActions({
  onOpenSettings,
}: ExtensionActionsProps) {
  const {
    extensionIsOpen,
    extensionPanel,
    setExtensionIsOpen,
    setExtensionPanel,
  } = useExtension();

  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  function CopyVideoURL() {
    if (isCopied) return;
    copyToClipboard(window.location.href);
  }

  return (
    <div className="dark:bg-[#0f0f0f] dark:text-white rounded-md border border-zinc-200 dark:border-zinc-800">
      {/* Header with logo and title */}
      <div className="p-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          <IconSieve className="h-7 w-7 opacity-80" />
          <span className="font-semibold text-base">Sieve VideoTutor</span>
        </div>
      </div>

      {/* Actions bar */}
      <div className="p-2.5 px-3">
        <div className="flex items-center justify-between">
          <div className="flex justify-center items-center space-x-2">
            <div className="flex -space-x-px">
              <Button
                variant="outline"
                onClick={() => {
                  setExtensionPanel("Learn");
                  if (!extensionIsOpen) setExtensionIsOpen(true);
                }}
                className={`rounded-r-none focus:z-10 space-x-2 items-center transition-all duration-200 relative ${
                  extensionPanel === "Learn"
                    ? "bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-850 border-zinc-300 dark:border-zinc-600 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
                    : "bg-transparent dark:bg-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                }`}
              >
                <Pencil2Icon
                  className={`h-4 w-4 ${extensionPanel === "Learn" ? "opacity-90" : "opacity-60"}`}
                />
                <span
                  className={
                    extensionPanel === "Learn"
                      ? "opacity-100 font-medium"
                      : "opacity-90"
                  }
                >
                  Learn
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setExtensionPanel("Transcript");
                  if (!extensionIsOpen) setExtensionIsOpen(true);
                }}
                className={`rounded-none focus:z-10 space-x-2 items-center transition-all duration-200 relative ${
                  extensionPanel === "Transcript"
                    ? "bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-850 border-zinc-300 dark:border-zinc-600 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
                    : "bg-transparent dark:bg-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                }`}
              >
                <ActivityLogIcon
                  className={`h-4 w-4 ${extensionPanel === "Transcript" ? "opacity-90" : "opacity-60"}`}
                />
                <span
                  className={
                    extensionPanel === "Transcript"
                      ? "opacity-100 font-medium"
                      : "opacity-90"
                  }
                >
                  Transcript
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setExtensionPanel("Chat");
                  if (!extensionIsOpen) setExtensionIsOpen(true);
                }}
                className={`rounded-l-none focus:z-10 space-x-2 items-center transition-all duration-200 relative ${
                  extensionPanel === "Chat"
                    ? "bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-850 border-zinc-300 dark:border-zinc-600 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
                    : "bg-transparent dark:bg-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                }`}
              >
                <ChatBubbleIcon
                  className={`h-4 w-4 ${extensionPanel === "Chat" ? "opacity-90" : "opacity-60"}`}
                />
                <span
                  className={
                    extensionPanel === "Chat"
                      ? "opacity-100 font-medium"
                      : "opacity-90"
                  }
                >
                  Chat
                </span>
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => CopyVideoURL()}
              >
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

        {/* Subtext for selected tab */}
        <div className="mt-2 px-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 animate-in fade-in duration-200">
            {extensionPanel === "Learn" && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                Get AI-powered summaries and key insights from this video
              </span>
            )}
            {extensionPanel === "Transcript" && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                Read the full transcript with timestamps and search
              </span>
            )}
            {extensionPanel === "Chat" && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-purple-500 animate-pulse"></span>
                Ask anything about the video content and get instant answers
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
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
