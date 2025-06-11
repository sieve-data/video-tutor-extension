export interface LearnChunk {
  id: string
  text: string
  startTime: number
  endTime: number
  explanation?: string
  isGenerating?: boolean
  error?: string
}

export function createLearnChunks(transcript: any, chunkDurationMs: number = 45000): LearnChunk[] {
  if (!transcript?.events || transcript.events.length === 0) {
    return []
  }

  const chunks: LearnChunk[] = []
  let currentChunk: LearnChunk = {
    id: `chunk-0`,
    text: '',
    startTime: 0,
    endTime: 0
  }
  
  let chunkIndex = 0

  transcript.events.forEach((event: any) => {
    if (!event.segs) return

    event.segs.forEach((seg: any) => {
      if (!seg.utf8 || !seg.utf8.trim()) return

      const segmentStartTime = event.tStartMs + (seg.tOffsetMs || 0)
      const segmentText = seg.utf8.trim()

      // Start a new chunk if we've exceeded the duration or it's the first segment
      if (currentChunk.text === '') {
        currentChunk.startTime = segmentStartTime
      }

      // Check if we should start a new chunk
      if (segmentStartTime - currentChunk.startTime >= chunkDurationMs && currentChunk.text !== '') {
        // Finalize current chunk
        currentChunk.endTime = segmentStartTime
        chunks.push({ ...currentChunk })

        // Start new chunk
        chunkIndex++
        currentChunk = {
          id: `chunk-${chunkIndex}`,
          text: segmentText + ' ',
          startTime: segmentStartTime,
          endTime: segmentStartTime
        }
      } else {
        // Add to current chunk
        currentChunk.text += segmentText + ' '
        currentChunk.endTime = segmentStartTime + (event.dDurationMs || 1000)
      }
    })
  })

  // Push the last chunk if it has content
  if (currentChunk.text.trim()) {
    chunks.push(currentChunk)
  }

  return chunks
}

export function getCurrentChunk(chunks: LearnChunk[], currentTimeMs: number): LearnChunk | null {
  return chunks.find(chunk => 
    currentTimeMs >= chunk.startTime && currentTimeMs <= chunk.endTime
  ) || null
}

export function formatChunkTime(chunk: LearnChunk): string {
  const startSeconds = Math.floor(chunk.startTime / 1000)
  const endSeconds = Math.floor(chunk.endTime / 1000)
  
  const startMinutes = Math.floor(startSeconds / 60)
  const startRemainingSeconds = startSeconds % 60
  
  const endMinutes = Math.floor(endSeconds / 60)
  const endRemainingSeconds = endSeconds % 60
  
  return `${startMinutes}:${startRemainingSeconds.toString().padStart(2, '0')} - ${endMinutes}:${endRemainingSeconds.toString().padStart(2, '0')}`
}