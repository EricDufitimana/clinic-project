"use client"

import { useState, useEffect } from "react"
import { AppointmentsTable } from "@/components/appointments/appointments-table"
import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"

export default function AppointmentsPage() {
  const [userData, setUserData] = useState<{ role: string } | null>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/me')
        if (!response.ok) throw new Error('Failed to fetch user data')
        const data = await response.json()
        setRole(data.role)
        console.log("Data:", data.role)
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [])

  const isDoctor = role === 'doctor'
  const isNurse = role === 'nurse'

  console.log("User Role:", role)

  return (
    <div className="w-full max-w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isDoctor ? 'Referred Appointments' : 'Appointments'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isDoctor 
              ? 'View and manage patient appointments referred to you'
              : 'Manage and create patient appointments'
            }
          </p>
        </div>
        {isNurse && <CreateAppointmentDialog />}
      </div>
      <AppointmentsTable userRole={role || undefined} />
    </div>
  )
}
