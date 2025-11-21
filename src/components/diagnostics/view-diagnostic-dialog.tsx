"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FileText, Pill, Calendar, User } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface Prescription {
  name: string
  dosage?: string
  frequency?: string
  duration?: string
  notes?: string
}

interface MedicalDescription {
  id: string
  description: string
  notes: string | null
  prescriptions: Prescription[] | null
  created_at: string
  patient?: {
    id: string
    full_name: string
    contact: string
  }
  doctor?: {
    id: string
    first_name: string
    last_name: string
  }
}

interface ViewDiagnosticDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medicalDescription: MedicalDescription | null
}

export function ViewDiagnosticDialog({ 
  open, 
  onOpenChange, 
  medicalDescription 
}: ViewDiagnosticDialogProps) {
  if (!medicalDescription) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Description Details
          </DialogTitle>
          <DialogDescription>
            View complete details of this medical description
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Patient Information */}
            {medicalDescription.patient && (
              <div className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient Information
                </div>
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="text-sm">
                    <span className="font-medium">Name: </span>
                    {medicalDescription.patient.full_name}
                  </div>
                  {medicalDescription.patient.contact && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Contact: </span>
                      {medicalDescription.patient.contact}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Date and Doctor */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {formatDate(medicalDescription.created_at)}
                </span>
              </div>
              {medicalDescription.doctor && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>
                    Dr. {medicalDescription.doctor.first_name} {medicalDescription.doctor.last_name}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <div className="text-sm font-semibold">Description</div>
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                {medicalDescription.description}
              </div>
            </div>

            {/* Notes */}
            {medicalDescription.notes && (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Notes</div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {medicalDescription.notes}
                </div>
              </div>
            )}

            {/* Prescriptions */}
            {medicalDescription.prescriptions && medicalDescription.prescriptions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Prescriptions ({medicalDescription.prescriptions.length})
                </div>
                <div className="space-y-2">
                  {medicalDescription.prescriptions.map((prescription: Prescription, idx: number) => (
                    <div 
                      key={idx} 
                      className="bg-muted/50 p-3 rounded-md border-l-2 border-l-primary"
                    >
                      <div className="font-medium text-sm mb-2">
                        {prescription.name}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {prescription.dosage && (
                          <div>
                            <span className="font-medium">Dosage: </span>
                            {prescription.dosage}
                          </div>
                        )}
                        {prescription.frequency && (
                          <div>
                            <span className="font-medium">Frequency: </span>
                            {prescription.frequency}
                          </div>
                        )}
                        {prescription.duration && (
                          <div>
                            <span className="font-medium">Duration: </span>
                            {prescription.duration}
                          </div>
                        )}
                        {prescription.notes && (
                          <div className="col-span-2">
                            <span className="font-medium">Notes: </span>
                            {prescription.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

