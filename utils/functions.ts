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
    
    // Get basic metadata from the page since we're not fetching it from Sieve
    const metadata = {
      title: document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent || "Video Title",
      duration: "0",
      author: document.querySelector('ytd-channel-name a')?.textContent || "Channel",
      views: document.querySelector('span.view-count')?.textContent || "0 views"
    }
    
    // Get the transcript
    const transcript = sieveData.subtitles?.en
    
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
    
    // Resume video on error
    if (video && wasPlaying) {
      video.play()
    }
    
    // Return empty data with user-friendly error message
    let userMessage = "Unable to load captions"
    if (sieveError.message.includes("No captions available") || sieveError.message.includes("No English subtitles")) {
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

export function cleanJsonTranscript(transcript) {
  console.log("cleanJsonTranscript called with:", transcript)
  
  if (!transcript) {
    console.error("No transcript provided to cleanJsonTranscript")
    return []
  }
  
  if (!transcript.events) {
    console.error("Transcript does not have events property. Keys:", Object.keys(transcript))
    return []
  }
  
  if (transcript.events.length === 0) {
    console.error("Transcript has empty events array")
    return []
  }
  
  const chunks = []
  let currentChunk = ""
  let currentStartTime = transcript.events[0].tStartMs || 0
  let currentEndTime = currentStartTime

  transcript.events.forEach((event) => {
    event.segs?.forEach((seg) => {
      const segmentText = seg.utf8?.replace(/\n/g, " ") || ""
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

  console.log(`cleanJsonTranscript processed ${chunks.length} chunks`)
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
