import { Skeleton } from "@/components/ui/skeleton"
import { IconSieve } from "@/components/ui/icons"

export default function TranscriptSkeleton() {
  return (
    <div className="w-full">
      <div className="flex flex-col items-center space-y-4 py-12">
        <IconSieve className="h-16 w-16 opacity-50 animate-pulse" />
        <div className="text-center space-y-2">
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">
            Fetching transcript from Sieve
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This may take up to 60 seconds for the first request
          </p>
        </div>
      </div>
      <div className="space-y-4 w-full mt-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col w-full justify-between items-center p-3 border-[0.5px] rounded-md border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="w-full flex flex-row items-center justify-between">
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
