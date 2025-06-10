import { openAIKeyAtom, sieveAPIKeyAtom } from "@/lib/atoms/openai"
import { useAtom } from "jotai"
import React from "react"

import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  theme?: string | null
}

export default function SettingsModal({ open, onOpenChange, theme }: SettingsModalProps) {
  const [openAIKey, setOpenAIKey] = useAtom(openAIKeyAtom)
  const [sieveAPIKey, setSieveAPIKey] = useAtom(sieveAPIKeyAtom)
  const [openAIKeyValue, setOpenAIKeyValue] = React.useState("")
  const [sieveKeyValue, setSieveKeyValue] = React.useState("")
  const [showKeys, setShowKeys] = React.useState(false)

  // Prefill the inputs with masked versions of existing keys when modal opens
  React.useEffect(() => {
    if (open) {
      if (openAIKey) {
        setOpenAIKeyValue(maskApiKey(openAIKey))
      }
      if (sieveAPIKey) {
        setSieveKeyValue(maskApiKey(sieveAPIKey))
      }
    }
  }, [open, openAIKey, sieveAPIKey])

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key
    return key.substring(0, 4) + '...' + key.substring(key.length - 4)
  }

  const handleSubmit = async () => {
    // Only update if the value has changed (not the masked version)
    if (openAIKeyValue && !openAIKeyValue.includes('...')) {
      setOpenAIKey(openAIKeyValue)
    }
    if (sieveKeyValue && !sieveKeyValue.includes('...')) {
      setSieveAPIKey(sieveKeyValue)
    }
    // Small delay to ensure storage write completes
    await new Promise(resolve => setTimeout(resolve, 100))
    onOpenChange(false)
    // Reset the form
    setOpenAIKeyValue("")
    setSieveKeyValue("")
    setShowKeys(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
    // Reset the form
    setOpenAIKeyValue("")
    setSieveKeyValue("")
    setShowKeys(false)
  }

  const handleInputFocus = (setter: (value: string) => void) => {
    setter("") // Clear the masked value on focus
  }

  return (
    <div className={theme}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Update your API keys. Leave a field empty to keep the existing key.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="openai-key-settings">OpenAI API Key</Label>
              <Input
                id="openai-key-settings"
                type={showKeys ? "text" : "password"}
                placeholder="sk-..."
                value={openAIKeyValue}
                onChange={(e) => setOpenAIKeyValue(e.target.value)}
                onFocus={() => openAIKeyValue.includes('...') && handleInputFocus(setOpenAIKeyValue)}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a>
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sieve-key-settings">Sieve API Key</Label>
              <Input
                id="sieve-key-settings"
                type={showKeys ? "text" : "password"}
                placeholder="Enter your Sieve API key"
                value={sieveKeyValue}
                onChange={(e) => setSieveKeyValue(e.target.value)}
                onFocus={() => sieveKeyValue.includes('...') && handleInputFocus(setSieveKeyValue)}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Get your key from <a href="https://sievedata.com" target="_blank" rel="noopener noreferrer" className="underline">sievedata.com</a>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-keys"
                checked={showKeys}
                onChange={(e) => setShowKeys(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
              />
              <Label htmlFor="show-keys" className="text-sm font-normal cursor-pointer">
                Show API keys
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}