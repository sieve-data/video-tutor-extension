import APIKeyModal from "@/components/api-key-modal";
import SettingsModal from "@/components/settings-modal";
import ExtensionActions from "@/components/extension-actions";
import ExtensionPanels from "@/components/extension-panels";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useExtension } from "@/contexts/extension-context";
import {
  dismissedAPIKeySetupAtom,
  openAIKeyAtom,
  sieveAPIKeyAtom,
} from "@/lib/atoms/openai";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { getVideoData } from "@/utils/functions";
import { useAtom, useAtomValue } from "jotai";
import React from "react";

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
    extensionVideoId,
  } = useExtension();

  const openAIKey = useAtomValue(openAIKeyAtom);
  const sieveAPIKey = useAtomValue(sieveAPIKeyAtom);
  const [dismissedSetup, setDismissedSetup] = useAtom(dismissedAPIKeySetupAtom);
  const [showAPIKeyModal, setShowAPIKeyModal] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [keysLoaded, setKeysLoaded] = React.useState(false);

  // Wait for atoms to actually load from storage
  React.useEffect(() => {
    // Check if keys have loaded (they'll be undefined while loading, then either a string or null)
    if (openAIKey !== undefined && sieveAPIKey !== undefined) {
      console.log(
        "Extension: Keys actually loaded - openAIKey:",
        !!openAIKey,
        "sieveAPIKey:",
        !!sieveAPIKey
      );
      setKeysLoaded(true);
      return;
    }

    // Fallback timeout in case storage is slow
    const timer = setTimeout(() => {
      console.log(
        "Extension: Timeout reached - openAIKey:",
        !!openAIKey,
        "sieveAPIKey:",
        !!sieveAPIKey
      );
      setKeysLoaded(true);
    }, 3000); // Give atoms even more time to load

    return () => clearTimeout(timer);
  }, [openAIKey, sieveAPIKey]);

  // Don't reset dismissed state on component mount - keep user's preference

  React.useEffect(() => {
    console.log("Use Effect That Fetches Video Data Called");
    const getVideoId = () => {
      return new URLSearchParams(window.location.search).get("v");
    };

    const fetchVideoData = async () => {
      const id = getVideoId();
      // Only fetch after keys have had time to load
      if (!keysLoaded) {
        console.log("Waiting for keys to load from storage...");
        return;
      }

      // Only require sieveAPIKey for transcript fetching
      if (id && id !== extensionVideoId && sieveAPIKey) {
        console.log("Starting to fetch video data for ID:", id);
        setExtensionVideoId(id);
        setExtensionLoading(true);
        try {
          const data = await getVideoData(id);
          console.log("Received video data:", data);
          console.log("Transcript exists:", !!data?.transcript);
          console.log("Transcript source:", data?.transcriptSource);
          setExtensionData(data);
          setExtensionLoading(false);
        } catch (error) {
          console.error("Error fetching video data:", error);
          setExtensionLoading(false);
        }
      } else if (id && !sieveAPIKey && keysLoaded) {
        console.log("Sieve API key not set, cannot fetch transcripts");
      }
    };

    fetchVideoData();

    const intervalId = setInterval(fetchVideoData, 2000);

    return () => clearInterval(intervalId);
  }, [extensionVideoId, sieveAPIKey, keysLoaded]);

  React.useEffect(() => {
    console.log("Use Effect That Fetches Theme Called");
    const getCssVariable = (name: string) => {
      const rootStyle = getComputedStyle(document.documentElement);
      return rootStyle.getPropertyValue(name).trim();
    };
    const backgroundColor = getCssVariable("--yt-spec-base-background");
    if (backgroundColor === "#fff") {
      setExtensionTheme("light");
    } else {
      setExtensionTheme("dark");
    }
  }, []);

  // Only show API key modal once per session if keys are missing
  React.useEffect(() => {
    // Don't check until keys have had time to load
    if (!keysLoaded) return;

    const hasShownThisSession = sessionStorage.getItem("hasShownAPIKeyModal");

    if (!openAIKey || !sieveAPIKey) {
      if (!dismissedSetup && !hasShownThisSession) {
        // Pause YouTube video
        const video = document.querySelector("video");
        if (video && !video.paused) {
          video.pause();
        }
        setShowAPIKeyModal(true);
        sessionStorage.setItem("hasShownAPIKeyModal", "true");
      }
    }
  }, [keysLoaded, openAIKey, sieveAPIKey]); // Check when keys are actually loaded

  const handleAPIKeyModalLater = () => {
    setDismissedSetup(true);
    setShowAPIKeyModal(false);
    // Resume video if it was paused
    const video = document.querySelector("video");
    if (video && video.paused) {
      video.play();
    }
  };

  const handleAPIKeyModalClose = (open: boolean) => {
    setShowAPIKeyModal(open);
    if (!open) {
      // Mark as shown for this session
      sessionStorage.setItem("hasShownAPIKeyModal", "true");
      // Resume video if modal is closed with keys set
      if (openAIKey && sieveAPIKey) {
        const video = document.querySelector("video");
        if (video && video.paused) {
          video.play();
        }
      }
    }
  };

  const handleOpenSettings = () => {
    setShowSettingsModal(true);
  };

  // Don't wait for theme, use a default
  const theme = extensionTheme || "light";

  console.log("Extension render:", {
    keysLoaded,
    hasOpenAIKey: !!openAIKey,
    hasSieveAPIKey: !!sieveAPIKey,
    theme,
    showAPIKeyModal,
  });

  // Always render the modal component so it can be shown when needed
  const modalComponent = (
    <>
      <APIKeyModal
        open={showAPIKeyModal}
        onOpenChange={handleAPIKeyModalClose}
        onLater={handleAPIKeyModalLater}
        theme={theme}
      />
      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        theme={theme}
      />
    </>
  );

  // If keys aren't loaded yet, show a minimal container with the modal
  if (!keysLoaded) {
    return <div className={theme}>{modalComponent}</div>;
  }

  // If keys are missing after loading, show a setup prompt with the modal
  if (!openAIKey || !sieveAPIKey) {
    return (
      <main className={`antialiased w-full mb-3 z-10 ${theme}`}>
        {modalComponent}
        {!showAPIKeyModal && (
          <div className="w-full p-4 bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-zinc-800 rounded-md">
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                VideoTutor requires API keys to function
              </p>
              <button
                onClick={() => setShowAPIKeyModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors"
              >
                Setup API Keys
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  // Keys exist, show the full extension
  return (
    <>
      {modalComponent}
      <main
        ref={setExtensionContainer}
        className={`antialiased w-full mb-3 z-10 ${theme}`}
      >
        <div className="w-full">
          <Collapsible
            open={extensionIsOpen}
            onOpenChange={setExtensionIsOpen}
            className="space-y-3"
          >
            <ExtensionActions onOpenSettings={handleOpenSettings} />
            <CollapsibleContent className="w-full dark:bg-[#0f0f0f] dark:text-white h-fit max-h-[500px] border border-zinc-200 dark:border-zinc-800 rounded-md overflow-auto no-scrollbar">
              <ExtensionPanels />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </main>
    </>
  );
}
