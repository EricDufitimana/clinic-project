"use client"

import React, { useState } from 'react'
import { FileText, Pill, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { DrugSearch } from '@/components/diagnostics/drug-search'

interface SelectedDrug {
  name: string
  dosage?: string
  frequency?: string
  duration?: string
  notes?: string
  ndc?: string
}

interface NurseDiagnosisFormProps {
  appointment: {
    id: string
    patient_id: string
    patient_name: string
  }
  onSuccess: () => void
  onCancel: () => void
}

export function NurseDiagnosisForm({ appointment, onSuccess, onCancel }: NurseDiagnosisFormProps) {
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [prescriptions, setPrescriptions] = useState<SelectedDrug[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!description.trim()) {
      toast.error('Please provide a medical description')
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
          appointment_id: appointment.id,
          description: description.trim(),
          notes: notes.trim() || null,
          prescriptions: prescriptions.length > 0 ? prescriptions : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Diagnosis recorded successfully!')
        setDescription('')
        setNotes('')
        setPrescriptions([])
        onSuccess()
      } else {
        toast.error(data.error || 'Failed to record diagnosis')
      }
    } catch (error) {
      console.error('Error creating diagnosis:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="">
          <h3 className="text-lg font-semibold">Diagnose Patient</h3>
          <p className="text-sm text-muted-foreground">
            Record diagnosis and prescribe medications for {appointment.patient_name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Medical Description *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the patient's condition, symptoms, and observations..."
            rows={4}
            required
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Detailed description of the patient's medical condition
          </p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Prescriptions (Optional)
          </Label>
          <DrugSearch 
            selectedDrugs={prescriptions}
            onDrugsChange={setPrescriptions}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter any additional notes or follow-up instructions..."
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" /> 
                Recording...
              </>
            ) : (
              'Record Diagnosis'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
