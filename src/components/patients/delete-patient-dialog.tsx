"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'

interface DeletePatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: { id: string; name: string } | null
  onSuccess?: () => void
}

export function DeletePatientDialog({ 
  open, 
  onOpenChange, 
  patient,
  onSuccess 
}: DeletePatientDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!patient) {
      toast.error('Patient not found')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Patient deleted successfully')
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.error(data.error || 'Failed to delete patient')
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      toast.error('An error occurred while deleting the patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Patient
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold">{patient?.name}</span>? 
            This action cannot be undone and will permanently remove all patient data from the system.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Patient'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

