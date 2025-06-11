import LearnViewer from "@/components/learn-viewer"
import { useExtension } from "@/contexts/extension-context"
import React from "react"

interface SummaryProps {}

export default function Summary({}: SummaryProps) {
  const { extensionData, extensionVideoId, setExtensionVideoId, setExtensionData } = useExtension()
  
  const handleRetry = () => {
    console.log("Retry button clicked - forcing refetch")
    // Clear data and force refetch
    setExtensionData(null)
    const currentId = extensionVideoId
    setExtensionVideoId("")
    setTimeout(() => setExtensionVideoId(currentId), 100)
  }
  
  if (!extensionData?.transcript) {
    return (
      <div className="flex justify-center items-center w-full h-full p-6 bg-white dark:bg-[#0f0f0f]">
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
    <div className="h-full w-full">
      <LearnViewer 
        transcript={extensionData.transcript} 
        videoTitle={extensionData.metadata?.title}
      />
    </div>
  )
}
