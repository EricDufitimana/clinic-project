"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

interface Patient {
  id: string
  full_name: string
}

interface Doctor {
  id: string
  first_name: string
  last_name: string
}

export function CreateLabRequestDialog() {
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [testType, setTestType] = useState('')
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchPatients()
      fetchDoctors()
    }
  }, [open])

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true)
      const response = await fetch('/api/patients')
      if (!response.ok) throw new Error('Failed to fetch patients')
      const data = await response.json()
      setPatients(data.patients || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Failed to load patients')
    } finally {
      setLoadingPatients(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true)
      const response = await fetch('/api/users?role=doctor')
      if (!response.ok) throw new Error('Failed to fetch doctors')
      const data = await response.json()
      setDoctors(data.users || [])
    } catch (error) {
      console.error('Error fetching doctors:', error)
      toast.error('Failed to load doctors')
    } finally {
      setLoadingDoctors(false)
    }
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!patientId || !testType || !doctorId) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/lab-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: doctorId,
          test_type: testType,
          reason: reason || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Lab request sent to doctor successfully!')
        setPatientId('')
        setDoctorId('')
        setTestType('')
        setReason('')
        setOpen(false)
        // Refresh the page to show new request
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to create lab request')
      }
    } catch (error) {
      console.error('Error creating lab request:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Lab Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>Send Lab Request to Doctor</DialogTitle>
          <DialogDescription>
            Request a diagnostic test for a patient and assign it to a doctor
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="patient">Patient *</Label>
              <Select value={patientId} onValueChange={setPatientId} required>
                <SelectTrigger id="patient">
                  <SelectValue placeholder={loadingPatients ? "Loading patients..." : "Select patient"} />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="doctor">Assign to Doctor *</Label>
              <Select value={doctorId} onValueChange={setDoctorId} required>
                <SelectTrigger id="doctor">
                  <SelectValue placeholder={loadingDoctors ? "Loading doctors..." : "Select doctor"} />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="test-type">Test Type *</Label>
              <Select value={testType} onValueChange={setTestType} required>
                <SelectTrigger id="test-type">
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Blood Test">Blood Test</SelectItem>
                  <SelectItem value="Urine Test">Urine Test</SelectItem>
                  <SelectItem value="X-Ray">X-Ray</SelectItem>
                  <SelectItem value="CT Scan">CT Scan</SelectItem>
                  <SelectItem value="MRI">MRI</SelectItem>
                  <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                  <SelectItem value="ECG">ECG</SelectItem>
                  <SelectItem value="EEG">EEG</SelectItem>
                  <SelectItem value="Biopsy">Biopsy</SelectItem>
                  <SelectItem value="Colonoscopy">Colonoscopy</SelectItem>
                  <SelectItem value="Endoscopy">Endoscopy</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for the test..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> 
                  Creating...
                </>
              ) : (
                'Create Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

