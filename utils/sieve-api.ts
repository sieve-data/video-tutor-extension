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
      // Return the entire job object to see its structure
      console.log("Job completed:", JSON.stringify(job, null, 2))
      return job.outputs || job
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
        include_metadata: false,  // We don't need metadata
        include_subtitles: true,
        subtitle_languages: ["en"],  // Only request English
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
  const jobResult = await waitForJobCompletion(jobId, sieveApiKey)

  console.log("Job result type:", typeof jobResult)
  console.log("Job result:", JSON.stringify(jobResult, null, 2))

  // Handle the array response structure
  let subtitlesData = jobResult;
  
  // If it's an array, get the first item's data
  if (Array.isArray(jobResult) && jobResult.length > 0) {
    const firstResult = jobResult[0];
    if (firstResult.type === "dict" && firstResult.data) {
      subtitlesData = firstResult.data;
    }
  }
  
  // Now check for English subtitles
  if (subtitlesData && subtitlesData.en && subtitlesData.en.url) {
    try {
      const subtitleUrl = subtitlesData.en.url;
      console.log("Fetching subtitle from URL:", subtitleUrl)
      
      // Fetch the subtitle file content
      const subtitleResponse = await fetch(subtitleUrl)
      if (!subtitleResponse.ok) {
        throw new Error(`Failed to fetch subtitle: ${subtitleResponse.statusText}`)
      }
      
      const subtitleContent = await subtitleResponse.text()
      console.log("Fetched subtitle content length:", subtitleContent.length)
      
      // Parse JSON3 format
      try {
        const parsedContent = JSON.parse(subtitleContent)
        console.log("Successfully parsed JSON3 subtitle, events count:", parsedContent.events?.length)
        return {
          subtitles: {
            en: parsedContent
          }
        }
      } catch (parseError) {
        console.error("Failed to parse as JSON:", parseError)
        console.log("First 500 chars of content:", subtitleContent.substring(0, 500))
        throw new Error("Subtitle format not supported - expected JSON3")
      }
    } catch (error) {
      console.error("Failed to fetch/parse subtitle:", error)
      throw error
    }
  } else {
    console.error("Unexpected response structure:", JSON.stringify(subtitlesData, null, 2))
    throw new Error("No English subtitles found in the response")
  }
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