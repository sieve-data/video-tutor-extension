// Fallback YouTube transcript fetcher
export async function fetchYouTubeTranscript(videoId: string): Promise<any> {
  try {
    // Try to get transcript from YouTube's native API
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`)
    const html = await response.text()
    
    // Extract initial data from YouTube page
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/)
    if (!ytInitialDataMatch) {
      throw new Error("Could not extract YouTube data")
    }
    
    const ytInitialData = JSON.parse(ytInitialDataMatch[1])
    
    // Try to find captions in the data
    const captionTracks = ytInitialData?.captions?.playerCaptionsTracklistRenderer?.captionTracks
    
    if (!captionTracks || captionTracks.length === 0) {
      throw new Error("No captions found in YouTube data")
    }
    
    // Get the first available caption track (preferably English)
    const englishTrack = captionTracks.find(track => track.languageCode === 'en') || captionTracks[0]
    
    // Fetch the actual transcript
    const transcriptResponse = await fetch(englishTrack.baseUrl)
    const transcriptXml = await transcriptResponse.text()
    
    // Parse the XML transcript
    const parser = new DOMParser()
    const doc = parser.parseFromString(transcriptXml, 'text/xml')
    const textElements = doc.getElementsByTagName('text')
    
    const events = []
    for (let i = 0; i < textElements.length; i++) {
      const element = textElements[i]
      const start = parseFloat(element.getAttribute('start') || '0') * 1000
      const duration = parseFloat(element.getAttribute('dur') || '0') * 1000
      const text = element.textContent || ''
      
      events.push({
        tStartMs: start,
        dDurationMs: duration,
        segs: [{
          utf8: text
        }]
      })
    }
    
    return { events }
    
  } catch (error) {
    console.error("Failed to fetch YouTube transcript:", error)
    throw error
  }
}