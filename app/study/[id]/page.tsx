// app/study/[id]/page.tsx
import { notFound } from "next/navigation"
import studies from "@/app/dashboard/data.json"
import ClientStudy from "@/components/study-client"

type Study = (typeof studies)[number]

export default function StudyPage({
  params: { id },
}: {
  params: { id: string }
}) {
  const study: Study | undefined = (studies as Study[]).find((s) => s.id === id)
  if (!study) notFound()

  // Render the client component for interactivity
  return <ClientStudy study={study} />
}