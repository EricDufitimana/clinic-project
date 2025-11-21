"use client"

import React, { useEffect, useState } from 'react'
import { Search, MoreVertical, History, Eye, Edit, Trash2 } from 'lucide-react'
import { PatientHistoryDialog } from '@/components/patients/patient-history-dialog'
import { ViewPatientDialog } from '@/components/patients/view-patient-dialog'
import { EditPatientDialog } from '@/components/patients/edit-patient-dialog'
import { DeletePatientDialog } from '@/components/patients/delete-patient-dialog'
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

interface Patient {
  id: string
  full_name: string
  age: number
  gender: string
  address: string | null
  contact: string | null
  registered_by: string
  created_at: string
}

export function PatientsTable() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [viewPatient, setViewPatient] = useState<Patient | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editPatient, setEditPatient] = useState<Patient | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deletePatient, setDeletePatient] = useState<{ id: string; name: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patients')
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients')
      }

      const data = await response.json()
      setPatients(data.patients || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Failed to load patients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const handleViewDetails = async (patient: Patient) => {
    try {
      const response = await fetch(`/api/patients/${patient.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch patient details')
      }
      const data = await response.json()
      setViewPatient(data.patient)
      setViewDialogOpen(true)
    } catch (error) {
      console.error('Error fetching patient details:', error)
      toast.error('Failed to load patient details')
    }
  }

  const handleEdit = (patient: Patient) => {
    setEditPatient(patient)
    setEditDialogOpen(true)
  }

  const handleDelete = (patient: Patient) => {
    setDeletePatient({ id: patient.id, name: patient.full_name })
    setDeleteDialogOpen(true)
  }

  const handleSuccess = () => {
    fetchPatients()
  }

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
          <CardTitle className="text-xl font-semibold">All Patients</CardTitle>
          <div className="relative w-full sm:w-72">
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
        {filteredPatients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No patients found matching your search.' : 'No patients registered yet.'}
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="min-w-full">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Patient</TableHead>
                  <TableHead className="min-w-[150px]">Contact</TableHead>
                  <TableHead className="min-w-[200px]">Address</TableHead>
                  <TableHead className="min-w-[120px]">Registered</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium whitespace-nowrap">{patient.full_name}</div>
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {patient.age}y • {patient.gender}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {patient.contact ? (
                          <div className="whitespace-nowrap">{patient.contact}</div>
                        ) : (
                          <div className="text-muted-foreground">No contact</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-[250px]">
                        {patient.address ? (
                          <div className="truncate" title={patient.address}>{patient.address}</div>
                        ) : (
                          <div className="text-muted-foreground">No address</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(patient.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPatient({ id: patient.id, name: patient.full_name })
                              setHistoryDialogOpen(true)
                            }}
                          >
                            <History className="h-4 w-4 mr-2" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewDetails(patient)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(patient)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Patient
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(patient)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Patient
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

      {selectedPatient && (
        <PatientHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
        />
      )}

      {viewPatient && (
        <ViewPatientDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          patient={viewPatient}
        />
      )}

      {editPatient && (
        <EditPatientDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          patient={editPatient}
          onSuccess={handleSuccess}
        />
      )}

      {deletePatient && (
        <DeletePatientDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          patient={deletePatient}
          onSuccess={handleSuccess}
        />
      )}
    </Card>
  )
}

