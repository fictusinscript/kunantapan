//nav-secondary.tsx
"use client"  
  
import * as React from "react"  
import { type Icon, IconDropletHalf2Filled, IconScissors, IconClick } from "@tabler/icons-react"  
import Link from "next/link"  
  
import {  
  SidebarGroup,  
  SidebarGroupContent,  
  SidebarMenu,  
  SidebarMenuButton,  
  SidebarMenuItem,  
} from "@/components/ui/sidebar"  
import { Slider } from "@/components/ui/slider"  
import { Switch } from "@/components/ui/switch"  
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"  
  
// Define the interface for brain viewer controls  
interface BrainViewerControls {  
  opacity: number;  
  clipPlane: boolean;  
  setOpacity: (value: number) => void;  
  setClipPlane: (value: boolean) => void;  
}  
  
export function NavSecondary({  
  items,  
  brainViewerControls,  
  ...props  
}: {  
  items: {  
    title: string  
    url: string  
    icon: Icon  
  }[]  
  brainViewerControls?: BrainViewerControls;  
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {  
  return (  
    <SidebarGroup {...props}>  
      <SidebarGroupContent>  
        <SidebarMenu>  
          {items.map((item) => (  
            <SidebarMenuItem key={item.title}>  
              <SidebarMenuButton asChild>  
                <Link href={item.url}>  
                  <item.icon />  
                  <span>{item.title}</span>  
                </Link>  
              </SidebarMenuButton>  
            </SidebarMenuItem>  
          ))}  
            
          {/* Add NiiVue Controls if brainViewerControls is provided */}  
          {brainViewerControls && (  
            <>  
              <SidebarMenuItem>  
                <SidebarMenuButton asChild>  
                  <label>  
                    <IconDropletHalf2Filled />  
                    <span>Lesion Opacity</span>  
                    <Slider  
                      className="ml-auto w-24"  
                      min={0}  
                      max={255}  
                      step={1}  
                      value={[brainViewerControls.opacity]}  
                      onValueChange={(value) => brainViewerControls.setOpacity(value[0])}  
                    />  
                  </label>  
                </SidebarMenuButton>  
              </SidebarMenuItem>  
                
              <SidebarMenuItem>  
                <SidebarMenuButton asChild>  
                  <label>  
                    <IconScissors />  
                    <span>Clip Plane</span>  
                    <Switch  
                      className="ml-auto"  
                      checked={brainViewerControls.clipPlane}  
                      onCheckedChange={brainViewerControls.setClipPlane}  
                    />  
                  </label>  
                </SidebarMenuButton>  
              </SidebarMenuItem>  
                
              {/* <SidebarMenuItem>  
                <SidebarMenuButton asChild>  
                  <label>  
                    <IconClick />  
                    <span>Left Click</span>  
                    <Select  
                      value={brainViewerControls.dragMode.toString()}  
                      onValueChange={(value) => brainViewerControls.setDragMode(parseInt(value))}  
                    >  
                      <SelectTrigger className="ml-auto w-36">  
                        <SelectValue placeholder="Select mode" />  
                      </SelectTrigger>  
                      <SelectContent>  
                        <SelectItem value="0">Draw</SelectItem>  
                        <SelectItem value="1">Color Picker</SelectItem>  
                        <SelectItem value="2">Measurement</SelectItem>  
                        <SelectItem value="3">Pan/Zoom</SelectItem>  
                      </SelectContent>  
                    </Select>  
                  </label>  
                </SidebarMenuButton>  
              </SidebarMenuItem>   */}
            </>  
          )}  
        </SidebarMenu>  
      </SidebarGroupContent>  
    </SidebarGroup>  
  )  
}