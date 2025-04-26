//study-client.tsx
"use client"

import { useEffect } from "react"
import { useRecents } from "@/hooks/use-recents"
import dynamic from 'next/dynamic';

const BrainViewer = dynamic(() => import('@/components/brain-viewer'), {
  ssr: false,
  loading: () => <p className="p-6 text-gray-400">Loading 3-D viewer…</p>,
});

type Study = {
  id: string
  patientName: string
  scanDate: string
  status: string
  type: string
  priority: string
  comments: string
}

export default function ClientStudy({ study }: { study: Study }) {
  const { markOpened } = useRecents()

  // record this study as "recent" **once** when the id changes
  useEffect(() => {
    markOpened(study.id)
    // markOpened is memo‑ised inside useRecents, safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [study.id])

  return (
    <div className="flex flex-col h-screen">
      {/* Study info header
      <div className="p-4 bg-background border-b">
        <h1 className="text-2xl font-semibold">Study {study.id}</h1>
        <div className="flex gap-6 mt-2">
          <p>
            <strong>Patient:</strong> {study.patientName}
          </p>
          <p>
            <strong>Scan&nbsp;date:</strong> {study.scanDate}
          </p>
        </div>
      </div> */}
      
      {/* Brain viewer component takes the rest of the screen */}
      <div className="flex-1">
        <BrainViewer />
      </div>
    </div>
  )
}