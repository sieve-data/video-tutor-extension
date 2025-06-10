import { useExtension } from "@/contexts/extension-context"
import { useTranscript } from "@/contexts/transcript-context"
import React from "react"

import TranscriptList from "./transcript-list"
import TranscriptSkeleton from "./transcript-skeleton"

interface TranscriptContentProps {
  ref: React.RefObject<HTMLDivElement>
}

const TranscriptContent = React.forwardRef<HTMLDivElement, TranscriptContentProps>(
  (props, ref) => {
    const { transcriptJson, transcriptSearch } = useTranscript()
    const { extensionLoading, extensionData } = useExtension()

    console.log("TranscriptContent render:", {
      extensionLoading,
      hasExtensionData: !!extensionData,
      hasTranscript: !!extensionData?.transcript,
      transcriptJsonLength: transcriptJson.length,
      extensionData: extensionData
    })

    if (extensionLoading || !extensionData) {
      return (
        <div className="flex justify-center items-center w-full p-3 bg-white dark:bg-[#0f0f0f]">
          <TranscriptSkeleton />
        </div>
      )
    }

    if (!extensionData.transcript || transcriptJson.length === 0) {
      return (
        <div className="flex justify-center items-center w-full p-3 bg-white dark:bg-[#0f0f0f]">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">No transcript available</p>
            <p className="text-xs text-gray-400">{extensionData.metadata?.author || "Try a different video"}</p>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref} // Attach the ref here
        className="flex justify-center items-center w-full  p-3 bg-white dark:bg-[#0f0f0f]">
        <TranscriptList transcript={transcriptJson} searchInput={transcriptSearch} />
      </div>
    )
  }
)

export default TranscriptContent
