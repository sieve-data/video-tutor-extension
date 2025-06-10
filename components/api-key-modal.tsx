import { openAIKeyAtom, sieveAPIKeyAtom } from "@/lib/atoms/openai"
import { useSetAtom } from "jotai"
import React from "react"

import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

interface APIKeyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLater: () => void
  theme?: string | null
}

export default function APIKeyModal({ open, onOpenChange, onLater, theme }: APIKeyModalProps) {
  const setOpenAIKey = useSetAtom(openAIKeyAtom)
  const setSieveAPIKey = useSetAtom(sieveAPIKeyAtom)
  const [openAIKeyValue, setOpenAIKeyValue] = React.useState("")
  const [sieveKeyValue, setSieveKeyValue] = React.useState("")

  const handleSubmit = () => {
    if (openAIKeyValue && sieveKeyValue) {
      setOpenAIKey(openAIKeyValue)
      setSieveAPIKey(sieveKeyValue)
      onOpenChange(false)
    }
  }

  const handleLater = () => {
    onLater()
    onOpenChange(false)
  }

  return (
    <div className={theme}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Setup API Keys</DialogTitle>
            <DialogDescription>
              Enter your API keys to start using Breakdown. You can find your OpenAI key at platform.openai.com and your Sieve key at sievedata.com.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={openAIKeyValue}
                onChange={(e) => setOpenAIKeyValue(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sieve-key">Sieve API Key</Label>
              <Input
                id="sieve-key"
                type="password"
                placeholder="Enter your Sieve API key"
                value={sieveKeyValue}
                onChange={(e) => setSieveKeyValue(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleLater}>
              Later
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!openAIKeyValue || !sieveKeyValue}
            >
              Save Keys
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}