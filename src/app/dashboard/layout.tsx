"use client"

import DashboardLayout from "@/components/other/DashboardLayout"

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}

