import { useExtension } from "@/contexts/extension-context"
import { useTranscript } from "@/contexts/transcript-context"
import React from "react"

import TranscriptViewer from "./transcript-viewer"
import TranscriptSkeleton from "./transcript-skeleton"

interface TranscriptContentProps {
  ref: React.RefObject<HTMLDivElement>
}

const TranscriptContent = React.forwardRef<HTMLDivElement, TranscriptContentProps>(
  (props, ref) => {
    const { transcriptJson, transcriptSearch } = useTranscript()
    const { extensionLoading, extensionData, extensionVideoId, setExtensionVideoId, setExtensionData } = useExtension()

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

    if (!extensionData.transcript) {
      const handleRetry = () => {
        console.log("Retry button clicked in transcript - forcing refetch")
        // Clear data and force refetch
        setExtensionData(null)
        const currentId = extensionVideoId
        setExtensionVideoId("")
        setTimeout(() => setExtensionVideoId(currentId), 100)
      }
      
      return (
        <div className="flex justify-center items-center w-full p-6 bg-white dark:bg-[#0f0f0f]">
          <div className="text-center space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">No transcript available</p>
              <p className="text-xs text-gray-400">This video may not have captions or there was a loading error</p>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className="w-full h-full bg-white dark:bg-[#0f0f0f]">
        <TranscriptViewer transcript={extensionData.transcript} />
      </div>
    )
  }
)

export default TranscriptContent
