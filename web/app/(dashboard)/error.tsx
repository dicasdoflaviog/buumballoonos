'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard Client Error:", error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-white bg-[#0D0A14]">
      <h2 className="text-2xl font-bold text-red-500 mb-4">Algo deu errado no Dashboard!</h2>
      <div className="bg-black/50 p-4 rounded-lg overflow-auto max-w-full border border-red-500/30 mb-6">
        <pre className="text-red-400 text-sm whitespace-pre-wrap font-mono">
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
      </div>
      <button
        className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 font-medium transition-colors"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Tentar Novamente
      </button>
    </div>
  )
}
