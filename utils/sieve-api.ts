const SIEVE_API_URL = "https://mango.sievedata.com/v2/push"
const SIEVE_JOBS_URL = "https://mango.sievedata.com/v2/jobs"

interface SieveJobResponse {
  id: string
  status: string
  outputs?: any
}

async function waitForJobCompletion(jobId: string, apiKey: string): Promise<any> {
  const maxAttempts = 120 // 120 attempts = 2 minutes with 1 second intervals
  let attempts = 0

  while (attempts < maxAttempts) {
    const response = await fetch(`${SIEVE_JOBS_URL}/${jobId}`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to check job status: ${response.statusText}`)
    }

    const job: SieveJobResponse = await response.json()

    if (job.status === "finished") {
      return job.outputs
    } else if (job.status === "error" || job.status === "cancelled") {
      throw new Error(`Job failed with status: ${job.status}`)
    }

    // Wait 1 second before next check
    await new Promise(resolve => setTimeout(resolve, 1000))
    attempts++
  }

  throw new Error("Job timed out after 2 minutes")
}

export async function fetchTranscriptFromSieve(videoUrl: string, sieveApiKey: string, retryCount = 0): Promise<any> {
  if (!sieveApiKey) {
    throw new Error("Sieve API key not configured")
  }

  try {
    // Push job to Sieve
    const pushResponse = await fetch(SIEVE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": sieveApiKey
    },
    body: JSON.stringify({
      function: "sieve/youtube-downloader",
      inputs: {
        url: videoUrl,
        download_type: "subtitles",
        include_metadata: true,
        metadata_fields: ["title", "description", "duration", "channel_id", "upload_date", "view_count"],
        include_subtitles: true,
        subtitle_languages: ["en", "es", "fr", "de", "ja", "ko", "zh"], // Common languages
        subtitle_format: "json3" // json3 format includes word-level timestamps
      }
    })
  })

  if (!pushResponse.ok) {
    const errorText = await pushResponse.text()
    throw new Error(`Failed to push job to Sieve: ${pushResponse.statusText} - ${errorText}`)
  }

  const pushResult = await pushResponse.json()
  const jobId = pushResult.id

  console.log("Sieve job created:", jobId)

  // Wait for job completion
  const outputs = await waitForJobCompletion(jobId, sieveApiKey)

  // Process the outputs
  const processedOutputs = { ...outputs.output || outputs }
  
  if (processedOutputs.subtitles) {
    const parsedSubtitles = {}
    for (const [lang, fileInfo] of Object.entries(processedOutputs.subtitles)) {
      try {
        // Fetch the subtitle file content
        const subtitleResponse = await fetch(fileInfo.url)
        const subtitleContent = await subtitleResponse.text()
        
        // Parse JSON3 format
        try {
          parsedSubtitles[lang] = JSON.parse(subtitleContent)
        } catch {
          // If not JSON, keep as text (VTT format)
          parsedSubtitles[lang] = subtitleContent
        }
      } catch (error) {
        console.error(`Failed to fetch subtitle for language ${lang}:`, error)
      }
    }
    processedOutputs.subtitles = parsedSubtitles
  }

  return processedOutputs
  } catch (error) {
    // Retry logic for transient failures
    if (retryCount < 2 && (error.message.includes("timed out") || error.message.includes("fetch"))) {
      console.log(`Retrying Sieve request (attempt ${retryCount + 2}/3)...`)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds before retry
      return fetchTranscriptFromSieve(videoUrl, sieveApiKey, retryCount + 1)
    }
    throw error
  }
}