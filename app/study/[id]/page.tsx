// app/study/[id]/page.tsx – server component
import { notFound } from "next/navigation"
// import Viewer from "@/components/viewer"          // your VTK.js wrapper
// import { getStudy } from "@/lib/db"               // server‑side DB helper

export default async function StudyPage({ params:{ id } }: { params: { id: string } }) {

  /* Optional streaming UI */
  return (
    <div>
        <h1>Study Page</h1>
        <p>Study ID: {id}</p>
    </div>
    // <Viewer study={study} />                      // passes dicom paths + masks
  )
}
