"use client"

import DashboardLayout from "@/components/other/DashboardLayout"
import { DiagnosticsTable } from "@/components/diagnostics/diagnostics-table"
import { CreateLabRequestDialog } from "@/components/diagnostics/create-lab-request-dialog"
import { TestTube2, TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"

export default function LabRequestsPage() {
  const { user, loading } = useUser()

  return (
    <DashboardLayout>
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
                <Badge variant="secondary" className="text-xs">+8%</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">128</CardTitle>
              <p className="text-xs text-muted-foreground">Total Requests</p>
            </CardHeader>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">23</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">Pending</CardTitle>
              <p className="text-xs text-muted-foreground">Awaiting Results</p>
            </CardHeader>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">+25%</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">15</CardTitle>
              <p className="text-xs text-muted-foreground">Completed Today</p>
            </CardHeader>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">94%</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">Rate</CardTitle>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </CardHeader>
          </Card>
        </div>

        <DiagnosticsTable />
      </div>
    </DashboardLayout>
  )
}

