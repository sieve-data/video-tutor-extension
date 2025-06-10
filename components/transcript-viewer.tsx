import { cn } from "@/lib/utils"
import React, { useEffect, useRef, useState } from "react"

interface TranscriptSegment {
  text: string
  startTime: number
  endTime: number
}

interface TranscriptViewerProps {
  transcript: any
}

export default function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([])

  // Parse transcript into fine-grained segments
  useEffect(() => {
    if (!transcript?.events) return

    const newSegments: TranscriptSegment[] = []
    
    transcript.events.forEach((event: any) => {
      if (event.segs) {
        event.segs.forEach((seg: any) => {
          if (seg.utf8 && seg.utf8.trim()) {
            const startTime = event.tStartMs + (seg.tOffsetMs || 0)
            const duration = event.dDurationMs || 1000
            newSegments.push({
              text: seg.utf8.trim(),
              startTime: startTime,
              endTime: startTime + duration
            })
          }
        })
      }
    })

    setSegments(newSegments)
  }, [transcript])

  // Update current time from video
  useEffect(() => {
    const video = document.querySelector('video')
    if (!video) return

    const updateTime = () => {
      setCurrentTime(video.currentTime * 1000)
    }

    // Update more frequently for smoother transitions
    const interval = setInterval(updateTime, 100)
    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('seeked', updateTime)

    // Initial update
    updateTime()

    return () => {
      clearInterval(interval)
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('seeked', updateTime)
    }
  }, [])

  // Auto-scroll to current segment
  useEffect(() => {
    if (!isAutoScrolling) return

    const currentIndex = segments.findIndex(
      seg => currentTime >= seg.startTime && currentTime <= seg.endTime
    )

    if (currentIndex !== -1 && segmentRefs.current[currentIndex]) {
      segmentRefs.current[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [currentTime, segments, isAutoScrolling])

  // Handle manual scroll
  const handleScroll = () => {
    // Temporarily disable auto-scroll when user manually scrolls
    setIsAutoScrolling(false)
    // Re-enable after 5 seconds
    setTimeout(() => setIsAutoScrolling(true), 5000)
  }

  // Click to jump to time
  const handleSegmentClick = (startTime: number) => {
    const video = document.querySelector('video')
    if (video) {
      video.currentTime = startTime / 1000
    }
  }

  const getSegmentStyle = (segment: TranscriptSegment, index: number) => {
    const isCurrent = currentTime >= segment.startTime && currentTime <= segment.endTime
    const isPast = currentTime > segment.endTime
    const isFuture = currentTime < segment.startTime
    
    // Calculate distance from current for opacity
    const distanceFromCurrent = Math.abs(index - segments.findIndex(
      seg => currentTime >= seg.startTime && currentTime <= seg.endTime
    ))

    return {
      current: isCurrent,
      past: isPast,
      future: isFuture,
      distance: distanceFromCurrent
    }
  }

  return (
    <div className="relative h-[500px] w-full overflow-hidden">
      {/* Auto-scroll indicator */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white dark:from-[#0f0f0f] to-transparent h-16 pointer-events-none" />
      
      {/* Main container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent px-6 py-24 scroll-smooth"
      >
        <div className="max-w-2xl mx-auto space-y-2">
          {segments.map((segment, index) => {
            const style = getSegmentStyle(segment, index)
            
            return (
              <div
                key={index}
                ref={el => segmentRefs.current[index] = el}
                onClick={() => handleSegmentClick(segment.startTime)}
                className={cn(
                  "relative px-6 py-3 rounded-xl cursor-pointer transition-all duration-300 group",
                  // Base styles
                  "hover:bg-zinc-50 dark:hover:bg-zinc-900",
                  // Current segment
                  style.current && "bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30 dark:to-transparent scale-105 shadow-sm",
                  // Distance-based opacity
                  style.distance > 5 && "opacity-20",
                  style.distance > 3 && style.distance <= 5 && "opacity-40",
                  style.distance > 1 && style.distance <= 3 && "opacity-60",
                  style.distance <= 1 && !style.current && "opacity-85",
                  style.current && "opacity-100"
                )}
              >
                {/* Time indicator for current segment */}
                {style.current && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full animate-pulse" />
                )}
                
                <p className={cn(
                  "transition-all duration-300 leading-relaxed",
                  // Text size based on position
                  style.current && "text-lg font-medium text-zinc-900 dark:text-zinc-50",
                  !style.current && style.distance <= 1 && "text-base text-zinc-700 dark:text-zinc-300",
                  !style.current && style.distance > 1 && "text-sm text-zinc-600 dark:text-zinc-400",
                  // Past segments
                  style.past && "text-zinc-400 dark:text-zinc-600"
                )}>
                  {segment.text}
                </p>
                
                {/* Timestamp on hover */}
                <span className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 text-xs opacity-0 transition-opacity group-hover:opacity-100 bg-white dark:bg-zinc-900 px-2 py-1 rounded-md shadow-sm",
                  style.current ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"
                )}>
                  {formatTime(segment.startTime)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white dark:from-[#0f0f0f] to-transparent h-16 pointer-events-none" />
      
      {/* Center line indicator */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-blue-200 dark:via-blue-900 to-transparent opacity-30 pointer-events-none" />
      
      {/* Auto-scroll status */}
      {!isAutoScrolling && (
        <div className="absolute bottom-4 right-4 bg-zinc-900/90 dark:bg-zinc-100/90 backdrop-blur-sm text-white dark:text-zinc-900 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
          Auto-scroll paused
        </div>
      )}
    </div>
  )
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}