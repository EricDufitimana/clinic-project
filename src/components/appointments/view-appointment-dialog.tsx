"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, User, Clock, CheckCircle, AlertCircle, X, FileText, Pill } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

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
}

interface MedicalDescription {
  id: string
  description: string
  notes: string | null
  prescriptions: Array<{
    name: string
    dosage?: string
    frequency?: string
    duration?: string
    notes?: string
  }> | null
  created_at: string
  doctor?: {
    first_name: string
    last_name: string
  }
}

interface ViewAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment
}

export function ViewAppointmentDialog({ open, onOpenChange, appointment }: ViewAppointmentDialogProps) {
  const [medicalDescription, setMedicalDescription] = useState<MedicalDescription | null>(null)
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false)

  // Fetch medical description when dialog opens and appointment is diagnosed
  useEffect(() => {
    if (open && appointment.status === 'diagnosed') {
      fetchMedicalDescription()
    } else if (!open) {
      setMedicalDescription(null)
    }
  }, [open, appointment.id, appointment.status])

  const fetchMedicalDescription = async () => {
    try {
      setLoadingDiagnosis(true)
      const response = await fetch(`/api/medical-descriptions?appointment_id=${appointment.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch medical description')
      }

      const data = await response.json()
      const descriptions = data.medicalDescriptions || []
      
      // Get the most recent medical description for this appointment
      if (descriptions.length > 0) {
        setMedicalDescription(descriptions[0])
      }
    } catch (error) {
      console.error('Error fetching medical description:', error)
    } finally {
      setLoadingDiagnosis(false)
    }
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointment Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this appointment
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Patient Information</Label>
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-lg">{appointment.patient_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {appointment.patient_age} years old • {appointment.patient_gender}
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Status */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Status</Label>
              <div className="flex items-center gap-3">
                {getStatusBadge(appointment.status)}
              </div>
            </div>

            {/* Appointment Details */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Appointment Details</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span>{formatDate(appointment.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Appointment ID:</span>
                  <span className="font-mono">{appointment.id}</span>
                </div>
              </div>
            </div>

            {/* Indicators */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Special Indicators</Label>
              <div className="flex flex-wrap gap-2">
                {appointment.is_referred && (
                  <Badge variant="outline" className="flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Referred
                  </Badge>
                )}
                {appointment.is_lab_requested && (
                  <Badge variant="outline" className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Lab Requested
                  </Badge>
                )}
                {!appointment.is_referred && !appointment.is_lab_requested && (
                  <span className="text-sm text-muted-foreground">No special indicators</span>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Timeline</Label>
              <div className="relative">
                <div className="absolute left-4 top-6 bottom-0 w-0.5 bg-border"></div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="relative z-10 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">Appointment Created</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(appointment.created_at)}
                      </div>
                    </div>
                  </div>
                  {appointment.status === 'diagnosed' && (
                    <div className="flex items-center gap-3">
                      <div className="relative z-10 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">Patient Diagnosed</div>
                        <div className="text-sm text-muted-foreground">
                          Appointment completed
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Diagnosis Section */}
            {appointment.status === 'diagnosed' && (
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Diagnosis & Medical Description
                </Label>
                {loadingDiagnosis ? (
                  <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    Loading diagnosis information...
                  </div>
                ) : medicalDescription ? (
                  <div className="space-y-4">
                    {/* Doctor Information */}
                    {medicalDescription.doctor && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Diagnosed by: Dr. {medicalDescription.doctor.first_name} {medicalDescription.doctor.last_name}</span>
                      </div>
                    )}

                    {/* Diagnosis Date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Diagnosis date: {formatDate(medicalDescription.created_at)}</span>
                    </div>

                    {/* Medical Description */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Medical Description</Label>
                      <div className="p-3 bg-muted rounded-md text-sm">
                        {medicalDescription.description}
                      </div>
                    </div>

                    {/* Additional Notes */}
                    {medicalDescription.notes && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Additional Notes</Label>
                        <div className="p-3 bg-muted rounded-md text-sm">
                          {medicalDescription.notes}
                        </div>
                      </div>
                    )}

                    {/* Prescriptions */}
                    {medicalDescription.prescriptions && medicalDescription.prescriptions.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Pill className="h-4 w-4" />
                          Prescriptions ({medicalDescription.prescriptions.length})
                        </Label>
                        <div className="space-y-2">
                          {medicalDescription.prescriptions.map((prescription, idx) => (
                            <div key={idx} className="p-3 bg-muted rounded-md border-l-2 border-l-primary">
                              <div className="font-medium text-sm mb-2">{prescription.name}</div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                {prescription.dosage && (
                                  <div>
                                    <span className="font-medium">Dosage:</span> {prescription.dosage}
                                  </div>
                                )}
                                {prescription.frequency && (
                                  <div>
                                    <span className="font-medium">Frequency:</span> {prescription.frequency}
                                  </div>
                                )}
                                {prescription.duration && (
                                  <div>
                                    <span className="font-medium">Duration:</span> {prescription.duration}
                                  </div>
                                )}
                                {prescription.notes && (
                                  <div className="col-span-2">
                                    <span className="font-medium">Notes:</span> {prescription.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    No diagnosis information available for this appointment.
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
