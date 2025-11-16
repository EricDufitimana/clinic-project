"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/other/DashboardLayout"
import { SectionCards } from "@/components/dashboard-main/section-cards"
import { PatientTable } from "@/components/dashboard-main/patient-table"
import { DashboardWelcome } from "@/components/dashboard-main/dashboard-welcome"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Calendar, TestTube2 } from "lucide-react"

interface DashboardStats {
  totalPatients: number
  activePatients: number
  pendingLabRequests: number
  totalLabRequests: number
  completedToday: number
  appointmentsToday: number
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
      <DashboardLayout>
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
      </DashboardLayout>
    )
  }

  const totalPatients = stats?.totalPatients || 0
  const activePatients = stats?.activePatients || 0
  const appointmentsToday = stats?.appointmentsToday || 0
  const pendingLabRequests = stats?.pendingLabRequests || 0
  const totalLabRequests = stats?.totalLabRequests || 0

  // Calculate percentage changes (simplified - using static values for now)
  // In a real app, you'd compare with previous period data
  const patientsPercentage = totalPatients > 0 ? "12.5%" : "0%"
  const appointmentsPercentage = appointmentsToday > 0 ? "8.3%" : "0%"
  const pendingPercentage = pendingLabRequests > 0 ? "3.2%" : "0%"

  return (
    <DashboardLayout>
      <div>
        <DashboardWelcome />
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6'>
          <SectionCards
            title="Total Patients"
            value={totalPatients}
            increasing={true}
            percentage={patientsPercentage}
            footerHeader="Active Patients"
            footerDescription={`${activePatients} active patients`}
            icon={<Users className="h-4 w-4" />}
          />
          <SectionCards
            title="Appointments Today"
            value={appointmentsToday}
            increasing={true}
            percentage={appointmentsPercentage}
            footerHeader="Scheduled Today"
            footerDescription="Total appointments for today"
            icon={<Calendar className="h-4 w-4" />}
          />
          <SectionCards
            title="Pending Diagnostics"
            value={pendingLabRequests}
            increasing={false}
            percentage={pendingPercentage}
            footerHeader="Tests Pending"
            footerDescription="Awaiting diagnostic results"
            icon={<TestTube2 className="h-4 w-4" />}
          />
          <SectionCards
            title="Total Lab Requests"
            value={totalLabRequests}
            increasing={true}
            percentage="15.7%"
            footerHeader="All Requests"
            footerDescription="Total lab requests"
            icon={<TestTube2 className="h-4 w-4" />}
          />
        </div>
        
        <PatientTable />
      </div>
    </DashboardLayout>
  )
}

