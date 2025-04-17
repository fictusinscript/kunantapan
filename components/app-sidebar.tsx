"use client"

import * as React from "react"
import {
  IconBrain,
  IconBone,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react"

import { useRecents } from "@/hooks/use-recents"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import studies from "@/app/dashboard/data.json"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { recents } = useRecents()

  /* ----------  recent studies ---------- */
  const recentDocs = recents
    .map(r => (studies as any[]).find(s => s.id === r.id))
    .filter(Boolean)
    .map((s: any) => ({
      name: `${s.patientName} – ${s.scanDate}`,
      url: `/study/${s.id}`,
      icon: s.type === "brain" ? IconBrain : IconBone,   // ← icon per type
    }))

  /* ----------  static nav ---------- */
  const user = {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/mark.png",
  }

  const navMain = [{ title: "Dashboard", url: "/", icon: IconDashboard }]

  const navSecondary = [
    { title: "Settings", url: "#", icon: IconSettings },
    { title: "Get Help", url: "#", icon: IconHelp },
    { title: "Search", url: "#", icon: IconSearch },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Lens Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={recentDocs} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
