import LearnViewer from "@/components/learn-viewer"
import { useExtension } from "@/contexts/extension-context"
import React from "react"

interface SummaryProps {}

export default function Summary({}: SummaryProps) {
  const { extensionData } = useExtension()
  
  if (!extensionData?.transcript) {
    return (
      <div className="flex justify-center items-center w-full h-full p-6 bg-white dark:bg-[#0f0f0f]">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">No transcript available for learning</p>
          <p className="text-xs text-gray-400">Try a different video with captions</p>
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
