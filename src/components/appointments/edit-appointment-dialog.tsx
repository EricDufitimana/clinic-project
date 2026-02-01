"use client"

import React, { useState, useEffect } from 'react'
import { Edit, Calendar, User, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

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

interface EditAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment
  onSuccess: () => void
  userData: {
    role: string
  }
}

export function EditAppointmentDialog({ open, onOpenChange, appointment, onSuccess, userData }: EditAppointmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'pending' | 'diagnosed'>(appointment.status)
  const [isReferred, setIsReferred] = useState(appointment.is_referred)
  const [isLabRequested, setIsLabRequested] = useState(appointment.is_lab_requested)
  const [isContinueAppointment, setIsContinueAppointment] = useState(false)

  useEffect(() => {
    if (open && appointment) {
      setStatus(appointment.status)
      setIsReferred(appointment.is_referred)
      setIsLabRequested(appointment.is_lab_requested)
      setIsContinueAppointment(false)
    }
  }, [open, appointment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          is_referred: isReferred,
          is_lab_requested: isLabRequested,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update appointment')
      }

      toast.success('Appointment updated successfully')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update appointment')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (statusValue: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      diagnosed: 'bg-green-100 text-green-800 border-green-200'
    }
    
    const icons = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      diagnosed: <AlertCircle className="h-3 w-3 mr-1" />
    }

    return (
      <Badge className={`flex items-center w-fit ${variants[statusValue as keyof typeof variants] || variants.pending}`}>
        {icons[statusValue as keyof typeof icons]}
        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Appointment
          </DialogTitle>
          <DialogDescription>
            Update appointment status and indicators
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Info */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Patient Information</Label>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium">{appointment.patient_name}</div>
                <div className="text-sm text-muted-foreground">
                  {appointment.patient_age}y • {appointment.patient_gender}
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label htmlFor="status">Appointment Status</Label>
            <div className="text-sm text-muted-foreground mb-3">
              {userData.role === 'nurse' 
                ? 'Update the appointment status when you have completed the diagnosis'
                : 'Update the appointment status as needed'
              }
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  status === 'pending' 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Pending</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Patient waiting for diagnosis
                </div>
              </button>
              <button
                type="button"
                onClick={() => setStatus('diagnosed')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  status === 'diagnosed' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Diagnosed</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {userData.role === 'nurse' 
                    ? 'Complete diagnosis as nurse'
                    : 'Patient has been diagnosed'
                  }
                </div>
              </button>
            </div>
          </div>

          {/* Indicators */}
          <div className="space-y-4">
            <Label>Appointment Indicators</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input
                  type="checkbox"
                  id="referred"
                  checked={isReferred}
                  onChange={(e) => setIsReferred(e.target.checked)}
                  className="rounded border-gray-300 w-4 h-4"
                />
                <Label htmlFor="referred" className="text-sm font-normal cursor-pointer flex-1">
                  Patient is referred to specialist
                </Label>
                {isReferred && (
                  <Badge variant="outline" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Referred
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input
                  type="checkbox"
                  id="lab-requested"
                  checked={isLabRequested}
                  onChange={(e) => setIsLabRequested(e.target.checked)}
                  className="rounded border-gray-300 w-4 h-4"
                />
                <Label htmlFor="lab-requested" className="text-sm font-normal cursor-pointer flex-1">
                  Lab tests are required
                </Label>
                {isLabRequested && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Lab Request
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input
                  type="checkbox"
                  id="continue-appointment"
                  checked={isContinueAppointment}
                  onChange={(e) => setIsContinueAppointment(e.target.checked)}
                  className="rounded border-gray-300 w-4 h-4"
                />
                <Label htmlFor="continue-appointment" className="text-sm font-normal cursor-pointer flex-1">
                  Regular appointment check-up will be scheduled
                </Label>
                {isContinueAppointment && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Continue Appointment
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
