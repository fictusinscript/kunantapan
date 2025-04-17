"use client"

import { useEffect } from "react"
import { useRecents } from "@/hooks/use-recents"

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

  // record this study as “recent” **once** when the id changes
  useEffect(() => {
    markOpened(study.id)
    // markOpened is memo‑ised inside useRecents, safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [study.id])

  return (
    <div className="flex flex-col gap-2 p-6">
      <h1 className="text-2xl font-semibold">Study {study.id}</h1>
      <p>
        <strong>Patient:</strong> {study.patientName}
      </p>
      <p>
        <strong>Scan&nbsp;date:</strong> {study.scanDate}
      </p>
      {/* viewer / analysis components will be added later */}
    </div>
  )
}
