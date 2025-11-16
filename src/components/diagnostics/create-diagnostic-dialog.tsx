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
import { DrugSearch } from '@/components/diagnostics/drug-search'

interface Patient {
  id: string
  full_name: string
  name?: string
}

interface SelectedDrug {
  name: string
  dosage?: string
  frequency?: string
  duration?: string
  notes?: string
  ndc?: string
}

export function CreateDiagnosticDialog() {
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [prescriptions, setPrescriptions] = useState<SelectedDrug[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchPatients()
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

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!patientId || !description) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/medical-descriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          description: description.trim(),
          notes: notes.trim() || null,
          prescriptions: prescriptions.length > 0 ? prescriptions : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Medical description created successfully!')
        setPatientId('')
        setDescription('')
        setNotes('')
        setPrescriptions([])
        setOpen(false)
        // Refresh the page to show new description
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to create medical description')
      }
    } catch (error) {
      console.error('Error creating medical description:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Diagnostic
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>Create Medical Description</DialogTitle>
          <DialogDescription>
            Record a medical description and prescriptions for a patient
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
                      {patient.full_name || patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Medical Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter the medical description..."
                rows={4}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Describe the patient's condition, symptoms, and observations
              </p>
            </div>

              <div className="grid gap-2">
                <DrugSearch 
                  selectedDrugs={prescriptions}
                  onDrugsChange={setPrescriptions}
                />
              </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes..."
                rows={3}
                className="resize-none"
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
                'Create Description'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

