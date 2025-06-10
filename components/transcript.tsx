import { useRef } from "react"

import TranscriptContent from "./transcript-content"

interface TranscriptProps {}

export default function Transcript({}: TranscriptProps) {
  const transcriptRef = useRef(null)

  return (
    <div className="h-full">
      <TranscriptContent ref={transcriptRef} />
    </div>
  )
}
