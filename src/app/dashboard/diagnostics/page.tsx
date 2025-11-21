"use client"

import { useEffect, useState } from "react"
import { MedicalDescriptionsTable } from "@/components/diagnostics/medical-descriptions-table"
import { CreateDiagnosticDialog } from "@/components/diagnostics/create-diagnostic-dialog"
import { FileText, Clock, AlertCircle } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DiagnosticsStats {
  totalRecords: number
  thisWeek: number
}

export default function DiagnosticsPage() {
  const { user, loading } = useUser()
  const router = useRouter()
  const [stats, setStats] = useState<DiagnosticsStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!loading && user?.role !== 'doctor') {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.role !== 'doctor') return
      
      try {
        setStatsLoading(true)
        const response = await fetch('/api/medical-descriptions/stats')
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const data = await response.json()
        setStats(data.stats)
      } catch (error) {
        console.error('Error fetching diagnostics stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    if (!loading && user?.role === 'doctor') {
      fetchStats()
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="w-full max-w-full">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-80 mb-6" />
      </div>
    )
  }

  if (user?.role !== 'doctor') {
    return (
      <div className="w-full max-w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This page is only available to doctors. You will be redirected to the dashboard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Medical Diagnostics
            </h1>
            <div className="text-muted-foreground mt-2">
              Record and manage patient medical descriptions and diagnoses
            </div>
          </div>
          <CreateDiagnosticDialog />
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-2 gap-3 mb-6'>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <CardTitle className="text-2xl font-bold">{stats?.totalRecords || 0}</CardTitle>
              )}
              <p className="text-xs text-muted-foreground">Total Records</p>
            </CardHeader>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {!statsLoading && stats && (
                  <Badge variant="secondary" className="text-xs">{stats.thisWeek}</Badge>
                )}
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <CardTitle className="text-2xl font-bold">{stats?.thisWeek || 0}</CardTitle>
              )}
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardHeader>
          </Card>
        </div>

        <MedicalDescriptionsTable />
      </div>
  )
}
