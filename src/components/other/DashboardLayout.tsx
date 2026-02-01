"use client"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Get the current page name from pathname
  const getPageName = () => {
    if (pathname === '/dashboard') return 'Dashboard'
    if (pathname === '/dashboard/patients') return 'Patients'
    if (pathname === '/dashboard/appointments') return 'Appointments'
    if (pathname === '/dashboard/lab-requests') return 'Lab Requests'
    if (pathname === '/dashboard/diagnostics') return 'Diagnostics'
    return 'Dashboard'
  }
  
  const pageName = getPageName()
  const showBreadcrumb = pathname !== '/dashboard'
  
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 w-0">
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {showBreadcrumb && (
                    <>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{pageName}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
            <div className="w-full max-w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}