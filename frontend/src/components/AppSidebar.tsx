import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppSidebarLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        {/* Leave space for header/logo here */}
        <SidebarHeader>
          <div className="h-12 rounded-md border flex items-center px-3 text-sm font-medium">
            Header space
          </div>
        </SidebarHeader>
        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                    <NavLink to="/">Home</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === "/insights"}>
                    <NavLink to="/insights">Insights</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />
      </Sidebar>

      {/* Main content area with a small header bar */}
      <SidebarInset>
        <div className="sticky top-0 z-10 w-full border-b bg-[rgb(var(--background))]">
          <div className="flex h-14 items-center gap-2 px-4">
            <SidebarTrigger />
            <div className="ml-2 text-sm text-muted-foreground">Content header placeholder</div>
          </div>
        </div>
        <div className="min-h-[calc(100svh-3.5rem)]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
