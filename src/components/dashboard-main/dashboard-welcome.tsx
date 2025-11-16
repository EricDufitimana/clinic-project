"use client"

import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardWelcome() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
    )
  }

  const welcomeName = user 
    ? `${user.role === 'doctor' ? 'Dr. ' : ''}${user.first_name} ${user.last_name}`
    : 'there'

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard Content</h1>
      <p className="text-muted-foreground mt-2">
        Welcome back, {welcomeName}! Welcome to your clinic management dashboard.
      </p>
    </div>
  )
}

