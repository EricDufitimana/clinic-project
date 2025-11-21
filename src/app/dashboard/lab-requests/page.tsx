"use client"

import { useEffect, useState } from "react"
import { DiagnosticsTable } from "@/components/diagnostics/diagnostics-table"
import { CreateLabRequestDialog } from "@/components/diagnostics/create-lab-request-dialog"
import { TestTube2, TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"

interface LabRequestStats {
  totalRequests: number
  completed: number
  pending: number
  completedToday: number
  completionRate: number
  completedTodayChange: string
}

export default function LabRequestsPage() {
  const { user, loading } = useUser()
  const [stats, setStats] = useState<LabRequestStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true)
        const response = await fetch('/api/lab-requests/stats')
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const data = await response.json()
        setStats(data.stats)
      } catch (error) {
        console.error('Error fetching lab request stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="w-full max-w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-64" />
              ) : user?.role === 'doctor' ? (
                'My Lab Requests'
              ) : (
                'Lab Requests'
              )}
            </h1>
            <div className="text-muted-foreground mt-2">
              {loading ? (
                <Skeleton className="h-4 w-80" />
              ) : user?.role === 'doctor' ? (
                'View and complete lab requests assigned to you'
              ) : (
                'Create lab requests and send them to doctors'
              )}
            </div>
          </div>
          {!loading && user?.role === 'nurse' && <CreateLabRequestDialog />}
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6'>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TestTube2 className="h-4 w-4 text-muted-foreground" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <CardTitle className="text-2xl font-bold">{stats?.totalRequests || 0}</CardTitle>
              )}
              <p className="text-xs text-muted-foreground">Total Requests</p>
            </CardHeader>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {!statsLoading && stats && (
                  <Badge variant="secondary" className="text-xs">{stats.pending}</Badge>
                )}
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <CardTitle className="text-2xl font-bold">{stats?.pending || 0}</CardTitle>
              )}
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardHeader>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                {!statsLoading && stats && (
                  <Badge variant="secondary" className="text-xs">{stats.completedTodayChange}</Badge>
                )}
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <CardTitle className="text-2xl font-bold">{stats?.completedToday || 0}</CardTitle>
              )}
              <p className="text-xs text-muted-foreground">Completed Today</p>
            </CardHeader>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                {!statsLoading && stats && (
                  <Badge variant="secondary" className="text-xs">{stats.completionRate}%</Badge>
                )}
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <CardTitle className="text-2xl font-bold">{stats?.completed || 0}</CardTitle>
              )}
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardHeader>
          </Card>
        </div>

        <DiagnosticsTable />
      </div>
  )
}

