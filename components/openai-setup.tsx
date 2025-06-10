import { openAIKeyAtom, sieveAPIKeyAtom } from "@/lib/atoms/openai"
import { useSetAtom } from "jotai"
import React from "react"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

interface OpenAISetupProps {}

export default function OpenAISetup({}: OpenAISetupProps) {
  const setOpenAIKey = useSetAtom(openAIKeyAtom)
  const setSieveAPIKey = useSetAtom(sieveAPIKeyAtom)
  const openAIInputRef = React.useRef<HTMLInputElement>(null)
  const sieveInputRef = React.useRef<HTMLInputElement>(null)

  const onClick = () => {
    const openAIInput = openAIInputRef.current
    const sieveInput = sieveInputRef.current
    if (openAIInput) {
      setOpenAIKey(openAIInput.value)
    }
    if (sieveInput) {
      setSieveAPIKey(sieveInput.value)
    }
  }

  return (
    <div className="flex flex-row w-full justify-between items-center sticky top-0 z-10 bg-white dark:bg-[#0f0f0f] pt-3.5 pb-2 px-3">
      <div className="grid gap-4 w-full p-3 border-[0.5px] rounded-md border-zinc-200 dark:border-zinc-800  group">
        <div className="grid gap-2">
          <Label htmlFor="apiKey">OpenAI API Key</Label>
          <Input
            ref={openAIInputRef}
            id="apiKey"
            type="password"
            placeholder="Enter your OpenAI API key"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sieveApiKey">Sieve API Key</Label>
          <Input
            ref={sieveInputRef}
            id="sieveApiKey"
            type="password"
            placeholder="Enter your Sieve API key"
          />
        </div>
        <div className="flex justify-center items-center w-full p-3 bg-white dark:bg-[#0f0f0f]">
          <Button variant="outline" className="w-full h-12" onClick={onClick}>
            <span className="text-sm">Save API Keys</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
