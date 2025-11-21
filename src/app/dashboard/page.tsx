"use client"

import { useEffect, useState } from "react"
import { SectionCards } from "@/components/dashboard-main/section-cards"
import { PatientTable } from "@/components/dashboard-main/patient-table"
import { DashboardWelcome } from "@/components/dashboard-main/dashboard-welcome"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, TestTube2, CheckCircle2, FileText } from "lucide-react"

interface DashboardStats {
  totalPatients: number
  completedLabRequests: number
  pendingLabRequests: number
  totalMedicalDiagnostics: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const response = await fetch('/api/dashboard/stats')
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }

        const data = await response.json()
        setStats(data.stats)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div>
        <DashboardWelcome />
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6'>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 border rounded-lg">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const totalPatients = stats?.totalPatients || 0
  const completedLabRequests = stats?.completedLabRequests || 0
  const pendingLabRequests = stats?.pendingLabRequests || 0
  const totalMedicalDiagnostics = stats?.totalMedicalDiagnostics || 0

  // Calculate percentage changes (simplified - using static values for now)
  // In a real app, you'd compare with previous period data
  const patientsPercentage = totalPatients > 0 ? "12.5%" : "0%"
  const completedPercentage = completedLabRequests > 0 ? "8.3%" : "0%"
  const pendingPercentage = pendingLabRequests > 0 ? "3.2%" : "0%"
  const diagnosticsPercentage = totalMedicalDiagnostics > 0 ? "15.7%" : "0%"

  return (
    <div>
      <DashboardWelcome />
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6'>
        <SectionCards
          title="Total Patients"
          value={totalPatients}
          increasing={true}
          percentage={patientsPercentage}
          footerHeader="Registered"
          footerDescription="Total registered patients"
          icon={<Users className="h-4 w-4" />}
        />
        <SectionCards
          title="Completed Lab Requests"
          value={completedLabRequests}
          increasing={true}
          percentage={completedPercentage}
          footerHeader="Completed"
          footerDescription="Lab requests with results"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <SectionCards
          title="Pending Lab Requests"
          value={pendingLabRequests}
          increasing={false}
          percentage={pendingPercentage}
          footerHeader="Awaiting Results"
          footerDescription="Lab requests pending"
          icon={<TestTube2 className="h-4 w-4" />}
        />
        <SectionCards
          title="Total Medical Diagnostics"
          value={totalMedicalDiagnostics}
          increasing={true}
          percentage={diagnosticsPercentage}
          footerHeader="Records"
          footerDescription="Total medical descriptions"
          icon={<FileText className="h-4 w-4" />}
        />
      </div>
      
      <PatientTable />
    </div>
  )
}

