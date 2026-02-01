"use client"

import React, { useState } from 'react'
import { Trash2, Calendar, User, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface DeleteAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: {
    id: string
    patientName: string
  }
  onSuccess: () => void
}

export function DeleteAppointmentDialog({ open, onOpenChange, appointment, onSuccess }: DeleteAppointmentDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to cancel appointment')
      }

      toast.success('Appointment cancelled successfully')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to cancel appointment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancel Appointment
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                <Calendar className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-red-900">Appointment to Cancel</div>
                <div className="text-sm text-red-700 mt-1">
                  <div className="flex items-center gap-2 mt-2">
                    <User className="h-3 w-3" />
                    <span>{appointment.patientName}</span>
                  </div>
                  <div className="text-xs mt-1">
                    This will remove the appointment from the system
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <strong>Note:</strong> Cancelling this appointment will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Remove the appointment record</li>
              <li>Delete any associated medical descriptions</li>
              <li>Cancel any lab requests</li>
              <li>Remove doctor reports</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Keep Appointment
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Cancelling...' : 'Cancel Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
