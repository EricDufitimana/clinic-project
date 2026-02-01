"use client"

import React, { useEffect, useState } from 'react'
import { Search, MoreVertical, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { ViewAppointmentDialog } from '@/components/appointments/view-appointment-dialog'
import { EditAppointmentDialog } from '@/components/appointments/edit-appointment-dialog'
import { DeleteAppointmentDialog } from '@/components/appointments/delete-appointment-dialog'
import { ContinueAppointmentDialog } from '@/components/appointments/continue-appointment-dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
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
import { ScrollArea } from '@/components/ui/scroll-area'

interface Appointment {
  id: string
  patient_id: string
  patient_name: string
  patient_age: number
  patient_gender: string
  created_at: string
  status: 'pending' | 'diagnosed'
  is_referred: boolean
  is_lab_requested: boolean
  lab_requests?: Array<{
    id: string
    status: string
    result: string | null
  }>
}

interface AppointmentsTableProps {
  userRole?: string
}

export function AppointmentsTable({ userRole }: AppointmentsTableProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteAppointment, setDeleteAppointment] = useState<{ id: string; patientName: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [continueAppointment, setContinueAppointment] = useState<Appointment | null>(null)
  const [continueDialogOpen, setContinueDialogOpen] = useState(false)
  const [userData, setUserData] = useState<{ role: string } | null>(null)

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/me')
      if (!response.ok) throw new Error('Failed to fetch user data')
      const data = await response.json()
      setUserData(data.user)
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/appointments')
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()
      let appointments = data.appointments || []

      // Filter appointments for doctors to only show referred ones
      if (userRole === 'doctor') {
        appointments = appointments.filter((appointment: Appointment) => 
          appointment.is_referred === true
        )
      }

      // Fetch lab requests for each appointment to check for results
      const appointmentsWithLabRequests = await Promise.all(
        appointments.map(async (appointment: Appointment) => {
          try {
            const labResponse = await fetch(`/api/lab-requests?patient_id=${appointment.patient_id}`)
            if (labResponse.ok) {
              const labData = await labResponse.json()
              return {
                ...appointment,
                lab_requests: labData.labRequests || []
              }
            }
          } catch (error) {
            console.error('Error fetching lab requests:', error)
          }
          return {
            ...appointment,
            lab_requests: []
          }
        })
      )

      setAppointments(appointmentsWithLabRequests)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
    fetchAppointments()
  }, [userRole])

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setViewDialogOpen(true)
  }

  const handleEdit = (appointment: Appointment) => {
    setEditAppointment(appointment)
    setEditDialogOpen(true)
  }

  const handleDelete = (appointment: Appointment) => {
    setDeleteAppointment({ id: appointment.id, patientName: appointment.patient_name })
    setDeleteDialogOpen(true)
  }

  const handleContinue = (appointment: Appointment) => {
    setContinueAppointment(appointment)
    setContinueDialogOpen(true)
  }

  const handleSuccess = () => {
    fetchAppointments()
  }

  const filteredAppointments = appointments.filter(appointment =>
    appointment.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    appointment.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      diagnosed: 'bg-green-100 text-green-800 border-green-200'
    }
    
    const icons = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      diagnosed: <CheckCircle className="h-3 w-3 mr-1" />
    }

    return (
      <Badge className={`flex items-center w-fit ${variants[status as keyof typeof variants] || variants.pending}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card className="shadow-none w-full">
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
    <Card className="shadow-none w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-semibold">All Appointments</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search appointments..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No appointments found matching your search.' : 'No appointments scheduled yet.'}
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="min-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Patient</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[150px]">Created</TableHead>
                    <TableHead className="min-w-[200px]">Indicators</TableHead>
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium whitespace-nowrap">{appointment.patient_name}</div>
                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                              {appointment.patient_age}y • {appointment.patient_gender}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(appointment.status)}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(appointment.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          {appointment.is_referred && (
                            <Badge variant="outline" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Referred
                            </Badge>
                          )}
                          {appointment.is_lab_requested && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                appointment.lab_requests?.some(lr => lr.result) 
                                  ? 'bg-green-50 border-green-200 text-green-700' 
                                  : ''
                              }`}
                            >
                              {appointment.lab_requests?.some(lr => lr.result) ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
                              Lab Request
                            </Badge>
                          )}
                          {!appointment.is_referred && !appointment.is_lab_requested && (
                            <span className="text-xs text-muted-foreground">No special indicators</span>
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
                            {userData?.role === 'nurse' && appointment.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => handleEdit(appointment)}
                                className="text-green-600 font-medium"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Diagnose Patient
                              </DropdownMenuItem>
                            )}
                            {appointment.status !== 'diagnosed' && (
                              <DropdownMenuItem onClick={() => handleContinue(appointment)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Continue Appointment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleViewDetails(appointment)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(appointment)}>
                              <User className="h-4 w-4 mr-2" />
                              Edit Appointment
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(appointment)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Appointment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {selectedAppointment && (
        <ViewAppointmentDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          appointment={selectedAppointment}
        />
      )}

      {editAppointment && userData && (
        <EditAppointmentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          appointment={editAppointment}
          onSuccess={handleSuccess}
          userData={userData}
        />
      )}

      {deleteAppointment && (
        <DeleteAppointmentDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          appointment={deleteAppointment}
          onSuccess={handleSuccess}
        />
      )}

      {continueAppointment && (
        <ContinueAppointmentDialog
          open={continueDialogOpen}
          onOpenChange={setContinueDialogOpen}
          appointment={continueAppointment}
          onSuccess={handleSuccess}
        />
      )}
    </Card>
  )
}
