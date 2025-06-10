import { fetchTranscriptFromSieve } from "./sieve-api"
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
      throw new Error("No subtitles found for this video")
    }
    
    console.log("Successfully fetched transcript from Sieve")
    
    // Resume video if it was playing
    if (video && wasPlaying) {
      video.play()
    }
    
    return { metadata, transcript, transcriptSource: 'sieve' }
    
  } catch (error) {
    console.error("Failed to fetch from Sieve:", error)
    
    // Resume video on error
    if (video && wasPlaying) {
      video.play()
    }
    
    // Return empty data with error message
    return {
      metadata: {
        title: "Error loading transcript",
        duration: "0",
        author: error.message || "Failed to fetch from Sieve",
        views: "0"
      },
      transcript: null,
      transcriptSource: 'error'
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
