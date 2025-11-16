"use client"

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FileText, Pill, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

interface MedicalDescription {
  id: string
  description: string
  notes: string | null
  prescriptions: any[] | null
  created_at: string
  doctor?: {
    id: string
    first_name: string
    last_name: string
  }
}

interface PatientHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  patientName: string
}

export function PatientHistoryDialog({ 
  open, 
  onOpenChange, 
  patientId, 
  patientName 
}: PatientHistoryDialogProps) {
  const [medicalDescriptions, setMedicalDescriptions] = useState<MedicalDescription[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && patientId) {
      fetchPatientHistory()
    }
  }, [open, patientId])

  const fetchPatientHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/medical-descriptions/${patientId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch patient history')
      }

      const data = await response.json()
      setMedicalDescriptions(data.medicalDescriptions || [])
    } catch (error) {
      console.error('Error fetching patient history:', error)
      toast.error('Failed to load patient history')
    } finally {
      setLoading(false)
    }
  }

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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical History - {patientName}
          </DialogTitle>
          <DialogDescription>
            View all medical descriptions and prescriptions for this patient
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : medicalDescriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No medical history found for this patient.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {medicalDescriptions.map((record, index) => (
                <div key={record.id} className="space-y-4">
                  {index > 0 && <Separator />}
                  
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {formatDate(record.created_at)}
                        </span>
                      </div>
                      {record.doctor && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            Dr. {record.doctor.first_name} {record.doctor.last_name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Description</div>
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        {record.description}
                      </div>
                    </div>

                    {record.notes && (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold">Notes</div>
                        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          {record.notes}
                        </div>
                      </div>
                    )}

                    {record.prescriptions && record.prescriptions.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold flex items-center gap-2">
                          <Pill className="h-4 w-4" />
                          Prescriptions ({record.prescriptions.length})
                        </div>
                        <div className="space-y-2">
                          {record.prescriptions.map((prescription: any, idx: number) => (
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
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

