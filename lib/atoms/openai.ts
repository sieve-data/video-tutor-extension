import { atom } from "jotai"
import { atomWithPlasmoStorage } from "./atom-with-plasmo-storage"

export const openAIKeyAtom = atomWithPlasmoStorage<string | null>("openAIKey", null)
export const sieveAPIKeyAtom = atomWithPlasmoStorage<string | null>("sieveAPIKey", null)
export const dismissedAPIKeySetupAtom = atomWithPlasmoStorage<boolean>("dismissedAPIKeySetup", false)

// Reset atom for when page is reloaded
export const resetDismissedSetupAtom = atom(
  null,
  (get, set) => {
    set(dismissedAPIKeySetupAtom, false)
  }
)
