import { fetchTranscriptFromSieve } from "./sieve-api"
import { fetchYouTubeTranscript } from "./youtube-transcript"
import { storage } from "@/lib/atoms/storage"

export async function getVideoData(id: string) {
  const videoUrl = `https://www.youtube.com/watch?v=${id}`
  
  // Pause the video while fetching
  const video = document.querySelector('video')
  const wasPlaying = video && !video.paused
  if (video && wasPlaying) {
    video.pause()
  }

  try {
    // Get API key from secure storage
    const sieveApiKey = await storage.get("sieveAPIKey")
    
    if (!sieveApiKey) {
      throw new Error("Sieve API key not configured. Please set your API key in the extension settings.")
    }
    
    console.log("Fetching transcript from Sieve...")
    const sieveData = await fetchTranscriptFromSieve(videoUrl, sieveApiKey)
    
    // Extract metadata
    const metadata = {
      title: sieveData.metadata?.title || "Unknown Title",
      duration: sieveData.metadata?.duration || "0",
      author: sieveData.metadata?.channel_id || "Unknown Author",
      views: sieveData.metadata?.view_count || "0"
    }
    
    // Get the transcript - prefer English
    const subtitles = sieveData.subtitles || {}
    const transcript = subtitles.en || subtitles.eng || Object.values(subtitles)[0]
    
    if (!transcript) {
      throw new Error("No captions available for this video. Try a different video with captions enabled.")
    }
    
    console.log("Successfully fetched transcript from Sieve")
    
    // Resume video if it was playing
    if (video && wasPlaying) {
      video.play()
    }
    
    return { metadata, transcript, transcriptSource: 'sieve' }
    
  } catch (sieveError) {
    console.error("Failed to fetch from Sieve:", sieveError)
    
    // Try YouTube fallback
    try {
      console.log("Attempting YouTube transcript fallback...")
      const transcript = await fetchYouTubeTranscript(id)
      
      // Resume video if it was playing
      if (video && wasPlaying) {
        video.play()
      }
      
      return {
        metadata: {
          title: "Transcript loaded (fallback)",
          duration: "0",
          author: "Using YouTube's native captions",
          views: "0"
        },
        transcript: transcript,
        transcriptSource: 'youtube-fallback'
      }
      
    } catch (fallbackError) {
      console.error("YouTube fallback also failed:", fallbackError)
      
      // Resume video on error
      if (video && wasPlaying) {
        video.play()
      }
      
      // Return empty data with user-friendly error message
      let userMessage = "Unable to load captions"
      if (sieveError.message.includes("No captions available")) {
        userMessage = "No captions available"
      } else if (sieveError.message.includes("timed out")) {
        userMessage = "Loading timed out - please try again"
      } else if (sieveError.message.includes("API key")) {
        userMessage = "API key issue - check settings"
      }
      
      return {
        metadata: {
          title: userMessage,
          duration: "0",
          author: "This video may not have captions or there was a loading error",
          views: "0"
        },
        transcript: null,
        transcriptSource: 'error'
      }
    }
  }
}

export function cleanJsonTranscript(transcript) {
  const chunks = []
  let currentChunk = ""
  let currentStartTime = transcript.events[0].tStartMs
  let currentEndTime = currentStartTime

  transcript.events.forEach((event) => {
    event.segs?.forEach((seg) => {
      const segmentText = seg.utf8.replace(/\n/g, " ")
      currentEndTime = event.tStartMs + (seg.tOffsetMs || 0)
      if ((currentChunk + segmentText).length > 300) {
        chunks.push({
          text: currentChunk.trim(),
          startTime: currentStartTime,
          endTime: currentEndTime
        })
        currentChunk = segmentText
        currentStartTime = currentEndTime
      } else {
        currentChunk += segmentText
      }
    })
  })

  if (currentChunk) {
    chunks.push({
      text: currentChunk.trim(),
      startTime: currentStartTime,
      endTime: currentEndTime
    })
  }

  return chunks
}

export function cleanTextTranscript(transcript) {
  // Initialize variables to hold lines of text and temporary segment text
  let textLines = []
  let tempText = ""
  let lastTime = 0

  // Loop through the events array
  transcript.events.forEach((event) => {
    // Check if the event has segments and process them
    if (event.segs) {
      event.segs.forEach((seg) => {
        // Calculate the segment's start time in milliseconds
        const segmentStartTimeMs = event.tStartMs + (seg.tOffsetMs || 0)

        // If there's a significant time gap or it's a new line, output the accumulated text
        if (tempText && (segmentStartTimeMs - lastTime > 1000 || seg.utf8 === "\n")) {
          const timeFormatted = new Date(lastTime).toISOString().substr(11, 12)
          textLines.push(`${timeFormatted}: ${tempText.trim()}`)
          tempText = ""
        }

        // Update last time and append segment text to temporary text
        lastTime = segmentStartTimeMs
        tempText += seg.utf8
      })
    }
  })

  // Append the last accumulated segment if any remains
  if (tempText) {
    const timeFormatted = new Date(lastTime).toISOString().substr(11, 12)
    textLines.push(`${timeFormatted}: ${tempText.trim()}`)
  }

  // Join all lines into a single string separated by new lines
  return textLines.join("\n")
}
