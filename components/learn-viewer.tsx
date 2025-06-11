import { cn } from "@/lib/utils";
import {
  createLearnChunks,
  formatChunkTime,
  getCurrentChunk,
  LearnChunk,
} from "@/utils/learn-chunks";
import { getCachedExplanation } from "@/utils/openai-service";
import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface LearnViewerProps {
  transcript: any;
  videoTitle?: string;
}

export default function LearnViewer({
  transcript,
  videoTitle,
}: LearnViewerProps) {
  const [chunks, setChunks] = useState<LearnChunk[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [viewingChunkId, setViewingChunkId] = useState<string | null>(null); // Track which chunk user is viewing
  const [currentVideoChunk, setCurrentVideoChunk] = useState<LearnChunk | null>(
    null
  ); // Track video's current chunk
  const [viewingChunk, setViewingChunk] = useState<LearnChunk | null>(null); // The chunk being displayed
  const [previousChunk, setPreviousChunk] = useState<LearnChunk | null>(null);
  const [nextChunk, setNextChunk] = useState<LearnChunk | null>(null);
  const [generatingExplanations, setGeneratingExplanations] = useState<
    Set<string>
  >(new Set());
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize chunks
  useEffect(() => {
    if (!transcript) return;
    const newChunks = createLearnChunks(transcript, 45000); // 45-second chunks
    setChunks(newChunks);
  }, [transcript]);

  // Update current time from video
  useEffect(() => {
    const video = document.querySelector("video");
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime * 1000);
    };

    const interval = setInterval(updateTime, 500); // Update every 500ms
    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("seeked", updateTime);

    updateTime();

    return () => {
      clearInterval(interval);
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("seeked", updateTime);
    };
  }, []);

  // Update video's current chunk based on time
  useEffect(() => {
    const current = getCurrentChunk(chunks, currentTime);
    setCurrentVideoChunk(current);

    // If user hasn't manually navigated, follow the video
    if (!viewingChunkId && current) {
      setViewingChunkId(current.id);
    }
  }, [currentTime, chunks, viewingChunkId]);

  // Update viewing chunk when viewingChunkId changes
  useEffect(() => {
    if (!viewingChunkId || chunks.length === 0) return;

    const chunk = chunks.find((c) => c.id === viewingChunkId);
    if (chunk) {
      setViewingChunk(chunk);

      // Update previous and next chunks
      const currentIndex = chunks.findIndex((c) => c.id === viewingChunkId);
      setPreviousChunk(currentIndex > 0 ? chunks[currentIndex - 1] : null);
      setNextChunk(
        currentIndex < chunks.length - 1 ? chunks[currentIndex + 1] : null
      );

      // Scroll to top when chunk changes
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [viewingChunkId, chunks]);

  // Generate explanation for viewing chunk
  useEffect(() => {
    if (!viewingChunk) return;

    // Check if explanation already exists or is being generated
    if (
      viewingChunk.explanation ||
      generatingExplanations.has(viewingChunk.id)
    ) {
      return;
    }

    const generateExplanation = async () => {
      setGeneratingExplanations((prev) => new Set(prev).add(viewingChunk.id));

      try {
        const viewingIndex = chunks.findIndex((c) => c.id === viewingChunk.id);
        const prevChunk = viewingIndex > 0 ? chunks[viewingIndex - 1] : null;

        const explanation = await getCachedExplanation(viewingChunk.id, {
          chunkText: viewingChunk.text,
          videoTitle: videoTitle,
          previousContext: prevChunk?.text,
        });

        // Update chunk with explanation
        setChunks((prev) =>
          prev.map((chunk) =>
            chunk.id === viewingChunk.id ? { ...chunk, explanation } : chunk
          )
        );
      } catch (error) {
        console.error("Failed to generate explanation:", error);
        setChunks((prev) =>
          prev.map((chunk) =>
            chunk.id === viewingChunk.id
              ? { ...chunk, error: "Failed to generate explanation" }
              : chunk
          )
        );
      } finally {
        setGeneratingExplanations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(viewingChunk.id);
          return newSet;
        });
      }
    };

    generateExplanation();
  }, [viewingChunk, chunks, videoTitle]);

  // Pre-generate explanations for upcoming chunks
  useEffect(() => {
    if (!viewingChunk || chunks.length === 0) return;

    const currentIndex = chunks.findIndex((c) => c.id === viewingChunk.id);
    const upcomingChunks = chunks.slice(currentIndex + 1, currentIndex + 4); // Pre-generate next 3 chunks

    upcomingChunks.forEach((chunk, index) => {
      if (chunk.explanation || generatingExplanations.has(chunk.id)) {
        return;
      }

      const delay = (index + 1) * 1000; // Stagger requests

      const timer = setTimeout(async () => {
        setGeneratingExplanations((prev) => new Set(prev).add(chunk.id));

        try {
          const chunkIndex = chunks.findIndex((c) => c.id === chunk.id);
          const prevChunk = chunkIndex > 0 ? chunks[chunkIndex - 1] : null;

          const explanation = await getCachedExplanation(chunk.id, {
            chunkText: chunk.text,
            videoTitle: videoTitle,
            previousContext: prevChunk?.text,
          });

          setChunks((prev) =>
            prev.map((c) => (c.id === chunk.id ? { ...c, explanation } : c))
          );
        } catch (error) {
          console.error("Failed to pre-generate explanation:", error);
        } finally {
          setGeneratingExplanations((prev) => {
            const newSet = new Set(prev);
            newSet.delete(chunk.id);
            return newSet;
          });
        }
      }, delay);

      return () => clearTimeout(timer);
    });
  }, [viewingChunk, chunks, videoTitle, generatingExplanations]);

  const navigateToChunk = (chunkId: string) => {
    setViewingChunkId(chunkId);
  };

  if (!viewingChunk) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-zinc-500 dark:text-zinc-400">
          Loading video content...
        </p>
      </div>
    );
  }

  const isGenerating = generatingExplanations.has(viewingChunk.id);
  const isCurrentVideoChunk = currentVideoChunk?.id === viewingChunk.id;

  return (
    <div className="h-[500px] overflow-hidden bg-white dark:bg-[#0f0f0f]">
      <div
        ref={contentRef}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700"
      >
        <div className="max-w-3xl mx-auto">
          {/* Current Chunk Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-[#0f0f0f] px-6 pt-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Learning Assistant
              </h3>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {formatChunkTime(viewingChunk)}
                {!isCurrentVideoChunk && (
                  <span className="ml-2 text-xs text-orange-500">
                    (Not current)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Explanation Content */}
          <div className="px-6 pb-6 space-y-6">
            {isGenerating ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Analyzing content...
                  </p>
                </div>
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
                </div>
              </div>
            ) : viewingChunk.error ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {viewingChunk.error}
                </p>
              </div>
            ) : viewingChunk.explanation ? (
              <div className="prose prose-xl prose-zinc dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    ul: ({ children }) => (
                      <ul className="space-y-6">{children}</ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-lg leading-relaxed list-disc ml-6">
                        {children}
                      </li>
                    ),
                    p: ({ children }) => (
                      <p className="text-lg leading-relaxed mb-6">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-blue-600 dark:text-blue-400">
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {viewingChunk.explanation}
                </ReactMarkdown>
              </div>
            ) : null}

            {/* Navigation */}
            <div className="flex flex-col gap-4 pt-4">
              {/* Current Video Time Indicator */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => {
                    if (
                      currentVideoChunk &&
                      currentVideoChunk.id !== viewingChunk.id
                    ) {
                      navigateToChunk(currentVideoChunk.id);
                    }
                  }}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full transition-all",
                    isCurrentVideoChunk
                      ? "bg-blue-500 text-white cursor-default"
                      : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 animate-pulse"
                  )}
                >
                  {isCurrentVideoChunk
                    ? "Current Segment"
                    : "Jump to Current Video Segment"}
                </button>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    previousChunk && navigateToChunk(previousChunk.id)
                  }
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
                  Viewing:{" "}
                  {chunks.findIndex((c) => c.id === viewingChunk.id) + 1} /{" "}
                  {chunks.length}
                  {currentVideoChunk && !isCurrentVideoChunk && (
                    <span className="block">
                      Video at:{" "}
                      {chunks.findIndex((c) => c.id === currentVideoChunk.id) +
                        1}
                    </span>
                  )}
                </span>

                <button
                  onClick={() => nextChunk && navigateToChunk(nextChunk.id)}
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
    </div>
  );
}
