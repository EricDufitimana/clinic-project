"use client"

import * as React from "react"
import { LayoutDashboard, UserPlus, Stethoscope, User, EllipsisVertical, LogOut, TestTube2, Calendar } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { VersionSwitcher } from "@/components/version-switcher"
import { useUser } from "@/hooks/use-user"
import { logout } from "@/utils/auth/logout"
import { toast } from "sonner"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

// Navigation data
const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Patients",
    url: "/dashboard/patients",
    icon: UserPlus,
  },
  {
    title: "Appointments",
    url: "/dashboard/appointments",
    icon: Calendar,
  },
  {
    title: "Lab Requests",
    url: "/dashboard/lab-requests",
    icon: TestTube2,
  },
  {
    title: "Diagnostics",
    url: "/dashboard/diagnostics",
    icon: Stethoscope,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, loading } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  
  const displayName = user 
    ? `${user.role === 'doctor' ? 'Dr. ' : ''}${user.first_name} ${user.last_name}`
    : 'Loading...'
  
  const displayEmail = user?.email || ''

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      toast.success('Logged out successfully')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to log out. Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => {
                // Hide Diagnostics for nurses
                if (item.title === "Diagnostics" && user?.role === 'nurse') {
                  return null
                }
                
                const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname?.startsWith(item.url))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span className="font-normal">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" disabled={loading}>
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    {loading ? (
                      <Skeleton className="h-4 w-4 rounded" />
                    ) : (
                      <User className="size-4" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none flex-1 min-w-0">
                    {loading ? (
                      <>
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </>
                    ) : (
                      <>
                        <span className="font-semibold truncate">{displayName}</span>
                        <span className="text-xs text-muted-foreground truncate">{displayEmail}</span>
                      </>
                    )}
                  </div>
                  {!loading && <EllipsisVertical className="ml-auto" />}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56">
                <DropdownMenuItem 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

