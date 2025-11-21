"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { User, Calendar, MapPin, Phone } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface Patient {
  id: string
  full_name: string
  age: number
  gender: string
  address: string | null
  contact: string | null
  created_at: string
}

interface ViewPatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: Patient | null
}

export function ViewPatientDialog({ 
  open, 
  onOpenChange, 
  patient 
}: ViewPatientDialogProps) {
  if (!patient) return null

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
      <DialogContent className="sm:max-w-[600px] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Details
          </DialogTitle>
          <DialogDescription>
            View complete information for this patient
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="space-y-2">
            <div className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Information
            </div>
            <div className="bg-muted/50 p-4 rounded-md space-y-3">
              <div>
                <div className="text-sm font-medium">{patient.full_name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Patient ID: {patient.id.slice(0, 8)}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-medium">Age: </span>
                  {patient.age} years
                </div>
                <Badge variant="secondary" className="capitalize">
                  {patient.gender}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-2">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Information
            </div>
            <div className="bg-muted/50 p-4 rounded-md">
              {patient.contact ? (
                <div className="text-sm">{patient.contact}</div>
              ) : (
                <div className="text-sm text-muted-foreground">No contact information</div>
              )}
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div className="space-y-2">
            <div className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </div>
            <div className="bg-muted/50 p-4 rounded-md">
              {patient.address ? (
                <div className="text-sm">{patient.address}</div>
              ) : (
                <div className="text-sm text-muted-foreground">No address on file</div>
              )}
            </div>
          </div>

          <Separator />

          {/* Registration Date */}
          <div className="space-y-2">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Registration Date
            </div>
            <div className="bg-muted/50 p-4 rounded-md">
              <div className="text-sm">{formatDate(patient.created_at)}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

