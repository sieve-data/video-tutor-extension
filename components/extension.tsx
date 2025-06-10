import APIKeyModal from "@/components/api-key-modal"
import SettingsModal from "@/components/settings-modal"
import ExtensionActions from "@/components/extension-actions"
import ExtensionPanels from "@/components/extension-panels"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { useExtension } from "@/contexts/extension-context"
import { dismissedAPIKeySetupAtom, openAIKeyAtom, sieveAPIKeyAtom } from "@/lib/atoms/openai"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { getVideoData } from "@/utils/functions"
import { useAtom, useAtomValue } from "jotai"
import React from "react"

export default function Extension() {
  //https://github.com/vantezzen/plasmo-state

  const {
    setExtensionContainer,
    setExtensionIsOpen,
    setExtensionVideoId,
    setExtensionLoading,
    setExtensionData,
    setExtensionTheme,
    extensionTheme,
    extensionIsOpen,
    extensionVideoId
  } = useExtension()

  const openAIKey = useAtomValue(openAIKeyAtom)
  const sieveAPIKey = useAtomValue(sieveAPIKeyAtom)
  const [dismissedSetup, setDismissedSetup] = useAtom(dismissedAPIKeySetupAtom)
  const [showAPIKeyModal, setShowAPIKeyModal] = React.useState(false)
  const [showSettingsModal, setShowSettingsModal] = React.useState(false)
  const [keysLoaded, setKeysLoaded] = React.useState(false)
  
  // Wait a bit for atoms to load from storage
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setKeysLoaded(true)
      console.log("Extension: Keys should be loaded now, sieveAPIKey:", !!sieveAPIKey)
    }, 500) // Give atoms time to load
    
    return () => clearTimeout(timer)
  }, [])

  // Don't reset dismissed state on component mount - keep user's preference

  React.useEffect(() => {
    console.log("Use Effect That Fetches Video Data Called")
    const getVideoId = () => {
      return new URLSearchParams(window.location.search).get("v")
    }

    const fetchVideoData = async () => {
      const id = getVideoId()
      // Only fetch after keys have had time to load
      if (!keysLoaded) {
        console.log("Waiting for keys to load from storage...")
        return
      }
      
      // Only require sieveAPIKey for transcript fetching
      if (id && id !== extensionVideoId && sieveAPIKey) {
        console.log("Starting to fetch video data for ID:", id)
        setExtensionVideoId(id)
        setExtensionLoading(true)
        try {
          const data = await getVideoData(id)
          console.log("Received video data:", data)
          console.log("Transcript exists:", !!data?.transcript)
          console.log("Transcript source:", data?.transcriptSource)
          setExtensionData(data)
          setExtensionLoading(false)
        } catch (error) {
          console.error("Error fetching video data:", error)
          setExtensionLoading(false)
        }
      } else if (id && !sieveAPIKey && keysLoaded) {
        console.log("Sieve API key not set, cannot fetch transcripts")
      }
    }

    fetchVideoData()

    const intervalId = setInterval(fetchVideoData, 2000)

    return () => clearInterval(intervalId)
  }, [extensionVideoId, sieveAPIKey, keysLoaded])

  React.useEffect(() => {
    console.log("Use Effect That Fetches Theme Called")
    const getCssVariable = (name: string) => {
      const rootStyle = getComputedStyle(document.documentElement)
      return rootStyle.getPropertyValue(name).trim()
    }
    const backgroundColor = getCssVariable("--yt-spec-base-background")
    if (backgroundColor === "#fff") {
      setExtensionTheme("light")
    } else {
      setExtensionTheme("dark")
    }
  }, [])

  // Only show API key modal once per session if keys are missing
  React.useEffect(() => {
    // Only check on initial mount, not on every render
    const hasShownThisSession = sessionStorage.getItem('hasShownAPIKeyModal')
    
    if (!openAIKey || !sieveAPIKey) {
      if (!dismissedSetup && !hasShownThisSession) {
        // Pause YouTube video
        const video = document.querySelector('video')
        if (video && !video.paused) {
          video.pause()
        }
        setShowAPIKeyModal(true)
        sessionStorage.setItem('hasShownAPIKeyModal', 'true')
      }
    }
  }, []) // Empty dependency array - only run once on mount

  const handleAPIKeyModalLater = () => {
    setDismissedSetup(true)
    setShowAPIKeyModal(false)
    // Resume video if it was paused
    const video = document.querySelector('video')
    if (video && video.paused) {
      video.play()
    }
  }

  const handleAPIKeyModalClose = (open: boolean) => {
    setShowAPIKeyModal(open)
    if (!open) {
      // Mark as shown for this session
      sessionStorage.setItem('hasShownAPIKeyModal', 'true')
      // Resume video if modal is closed with keys set
      if (openAIKey && sieveAPIKey) {
        const video = document.querySelector('video')
        if (video && video.paused) {
          video.play()
        }
      }
    }
  }

  const handleOpenSettings = () => {
    setShowSettingsModal(true)
  }

  // Don't render extension if API keys are missing
  if (!openAIKey || !sieveAPIKey) {
    // Show the modal if not dismissed
    if (!dismissedSetup && !showAPIKeyModal) {
      setShowAPIKeyModal(true)
    }
    // Don't render the extension without keys
    return (
      <>
        <APIKeyModal
          open={showAPIKeyModal}
          onOpenChange={handleAPIKeyModalClose}
          onLater={handleAPIKeyModalLater}
          theme={extensionTheme}
        />
      </>
    )
  }

  if (!extensionTheme) return null

  return (
    <>
      <APIKeyModal
        open={showAPIKeyModal}
        onOpenChange={handleAPIKeyModalClose}
        onLater={handleAPIKeyModalLater}
        theme={extensionTheme}
      />
      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        theme={extensionTheme}
      />
      <main
        ref={setExtensionContainer}
        className={`antialiased w-full mb-3 z-10 ${extensionTheme}`}>
        <div className="w-full">
          <Collapsible
            open={extensionIsOpen}
            onOpenChange={setExtensionIsOpen}
            className="space-y-3">
            <ExtensionActions onOpenSettings={handleOpenSettings} />
            <CollapsibleContent className="w-full dark:bg-[#0f0f0f] dark:text-white h-fit max-h-[500px] border border-zinc-200 dark:border-zinc-800 rounded-md overflow-auto no-scrollbar">
              <ExtensionPanels />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </main>
    </>
  )
}
