// app/study/[id]/page.tsx
import { notFound } from "next/navigation"
import studies from "@/app/dashboard/data.json"
import ClientStudy from "@/components/study-client"

type Study = (typeof studies)[number]

export default async function StudyPage({
  // `params` is now asynchronous in Next .js 15+
  params,
}: {
  // Typing it as a Promise makes it harder to forget `await`
  params: Promise<{ id: string }>
}) {
  // Await the params object before de‑structuring
  const { id } = await params

  // Find the study that matches the param
  const study: Study | undefined = (studies as Study[]).find(
    (s) => s.id === id,
  )

  if (!study) {
    notFound()
  }

  // Render the interactive client component
  return <ClientStudy study={study} />
}
