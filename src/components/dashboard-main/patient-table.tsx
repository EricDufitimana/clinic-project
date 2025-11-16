"use client"

import React, { useEffect, useState } from 'react'
import { Search, MoreVertical } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface Patient {
  id: string
  full_name: string
  age: number
  gender: string
  contact: string | null
  status: string
  condition: string
  last_visit: string
  next_appointment: string | null
}

export function PatientTable() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true)
        const response = await fetch('/api/patients')
        
        if (!response.ok) {
          throw new Error('Failed to fetch patients')
        }

        const data = await response.json()
        // Get recent patients (last 5)
        const recentPatients = (data.patients || []).slice(0, 5)
        setPatients(recentPatients)
      } catch (error) {
        console.error('Error fetching patients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.contact?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isAppointmentSoon = (appointmentDate: string | null) => {
    if (!appointmentDate) return false
    const appointment = new Date(appointmentDate)
    const today = new Date()
    const diffTime = appointment.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  }

  if (loading) {
    return (
      <Card className="mt-6 shadow-none">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Recent Patients</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patients..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead>Next Appointment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No patients found matching your search.' : 'No patients registered yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{patient.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.id.slice(0, 8)} • {patient.age}y • {patient.gender}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {patient.contact ? (
                        <div>{patient.contact}</div>
                      ) : (
                        <div className="text-muted-foreground">No contact</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={patient.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={patient.status === 'ACTIVE' ? 'border-green-200 text-green-800 bg-green-100 hover:border-green-200 hover:text-green-800 hover:bg-green-100' : 'border-gray-200 text-gray-800 bg-gray-100 hover:border-gray-200 hover:text-gray-800 hover:bg-gray-100'}
                    >
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{patient.condition || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{formatDate(patient.last_visit)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm">
                        {patient.next_appointment ? formatDateTime(patient.next_appointment) : 'None scheduled'}
                      </div>
                      {patient.next_appointment && isAppointmentSoon(patient.next_appointment) && (
                        <Badge variant="outline" className="w-fit text-xs">Soon</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Patient</DropdownMenuItem>
                        <DropdownMenuItem>Schedule Appointment</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete Patient</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

