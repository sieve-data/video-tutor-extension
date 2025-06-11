import { cn } from "@/lib/utils"
import { createLearnChunks, formatChunkTime, getCurrentChunk, LearnChunk } from "@/utils/learn-chunks"
import { getCachedExplanation } from "@/utils/openai-service"
import React, { useEffect, useState, useRef } from "react"
import ReactMarkdown from "react-markdown"

interface LearnViewerProps {
  transcript: any
  videoTitle?: string
}

export default function LearnViewer({ transcript, videoTitle }: LearnViewerProps) {
  const [chunks, setChunks] = useState<LearnChunk[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [currentChunk, setCurrentChunk] = useState<LearnChunk | null>(null)
  const [previousChunk, setPreviousChunk] = useState<LearnChunk | null>(null)
  const [nextChunk, setNextChunk] = useState<LearnChunk | null>(null)
  const [generatingExplanations, setGeneratingExplanations] = useState<Set<string>>(new Set())
  const contentRef = useRef<HTMLDivElement>(null)

  // Initialize chunks
  useEffect(() => {
    if (!transcript) return
    const newChunks = createLearnChunks(transcript, 45000) // 45-second chunks
    setChunks(newChunks)
  }, [transcript])

  // Update current time from video
  useEffect(() => {
    const video = document.querySelector('video')
    if (!video) return

    const updateTime = () => {
      setCurrentTime(video.currentTime * 1000)
    }

    const interval = setInterval(updateTime, 500) // Update every 500ms
    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('seeked', updateTime)

    updateTime()

    return () => {
      clearInterval(interval)
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('seeked', updateTime)
    }
  }, [])

  // Update current chunk based on time
  useEffect(() => {
    const current = getCurrentChunk(chunks, currentTime)
    
    // Always update currentChunk to reflect latest state from chunks array
    if (current) {
      const latestChunk = chunks.find(c => c.id === current.id)
      if (latestChunk) {
        setCurrentChunk(latestChunk)
        
        // Update previous and next chunks
        const currentIndex = chunks.findIndex(c => c.id === current.id)
        setPreviousChunk(currentIndex > 0 ? chunks[currentIndex - 1] : null)
        setNextChunk(currentIndex < chunks.length - 1 ? chunks[currentIndex + 1] : null)
        
        // Scroll to top only when chunk ID changes
        if (current.id !== currentChunk?.id && contentRef.current) {
          contentRef.current.scrollTop = 0
        }
      }
    }
  }, [currentTime, chunks, currentChunk?.id])

  // Generate explanation for current chunk
  useEffect(() => {
    if (!currentChunk) return

    // Check if explanation already exists or is being generated
    if (currentChunk.explanation || generatingExplanations.has(currentChunk.id)) {
      return
    }

    const generateExplanation = async () => {
      setGeneratingExplanations(prev => new Set(prev).add(currentChunk.id))
      
      try {
        const explanation = await getCachedExplanation(currentChunk.id, {
          chunkText: currentChunk.text,
          videoTitle: videoTitle,
          previousContext: previousChunk?.text
        })
        
        // Update chunk with explanation
        setChunks(prev => prev.map(chunk => 
          chunk.id === currentChunk.id 
            ? { ...chunk, explanation } 
            : chunk
        ))
      } catch (error) {
        console.error('Failed to generate explanation:', error)
        setChunks(prev => prev.map(chunk => 
          chunk.id === currentChunk.id 
            ? { ...chunk, error: 'Failed to generate explanation' } 
            : chunk
        ))
      } finally {
        setGeneratingExplanations(prev => {
          const newSet = new Set(prev)
          newSet.delete(currentChunk.id)
          return newSet
        })
      }
    }

    generateExplanation()
  }, [currentChunk, chunks, videoTitle, previousChunk?.text])

  // Pre-generate explanation for next chunk
  useEffect(() => {
    if (!nextChunk || nextChunk.explanation || generatingExplanations.has(nextChunk.id)) {
      return
    }

    const preGenerateExplanation = async () => {
      setGeneratingExplanations(prev => new Set(prev).add(nextChunk.id))
      
      try {
        const explanation = await getCachedExplanation(nextChunk.id, {
          chunkText: nextChunk.text,
          videoTitle: videoTitle,
          previousContext: currentChunk?.text
        })
        
        setChunks(prev => prev.map(chunk => 
          chunk.id === nextChunk.id 
            ? { ...chunk, explanation } 
            : chunk
        ))
      } catch (error) {
        console.error('Failed to pre-generate explanation:', error)
      } finally {
        setGeneratingExplanations(prev => {
          const newSet = new Set(prev)
          newSet.delete(nextChunk.id)
          return newSet
        })
      }
    }

    // Delay pre-generation slightly
    const timer = setTimeout(preGenerateExplanation, 2000)
    return () => clearTimeout(timer)
  }, [nextChunk, currentChunk, videoTitle, generatingExplanations])

  const jumpToChunk = (chunk: LearnChunk) => {
    const video = document.querySelector('video')
    if (video) {
      video.currentTime = chunk.startTime / 1000
    }
  }

  if (!currentChunk) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-zinc-500 dark:text-zinc-400">Loading video content...</p>
      </div>
    )
  }

  const isGenerating = generatingExplanations.has(currentChunk.id)

  return (
    <div className="h-[500px] overflow-hidden bg-white dark:bg-[#0f0f0f]">
      <div ref={contentRef} className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
        <div className="max-w-3xl mx-auto">
          {/* Current Chunk Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-[#0f0f0f] px-6 pt-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Learning Assistant
              </h3>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {formatChunkTime(currentChunk)}
              </span>
            </div>
          </div>

          {/* Explanation Content */}
          <div className="px-6 pb-6 space-y-6">
            {isGenerating ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Analyzing content...</p>
                </div>
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
                </div>
              </div>
            ) : currentChunk.error ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{currentChunk.error}</p>
              </div>
            ) : currentChunk.explanation ? (
              <div className="prose prose-lg prose-zinc dark:prose-invert max-w-none text-lg leading-relaxed">
                <ReactMarkdown>{currentChunk.explanation}</ReactMarkdown>
              </div>
            ) : null}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => previousChunk && jumpToChunk(previousChunk)}
                disabled={!previousChunk}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  previousChunk
                    ? "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    : "bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                )}
              >
                ← Previous
              </button>
              
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {chunks.findIndex(c => c.id === currentChunk.id) + 1} / {chunks.length}
              </span>

              <button
                onClick={() => nextChunk && jumpToChunk(nextChunk)}
                disabled={!nextChunk}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  nextChunk
                    ? "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    : "bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                )}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}