"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, User } from 'lucide-react'

interface Patient {
  id: string
  full_name: string
  age: number
  gender: string
  address: string | null
  contact: string | null
}

interface EditPatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: Patient | null
  onSuccess?: () => void
}

export function EditPatientDialog({ 
  open, 
  onOpenChange, 
  patient,
  onSuccess 
}: EditPatientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    address: '',
    contact: '',
  })

  useEffect(() => {
    if (patient && open) {
      setFormData({
        full_name: patient.full_name || '',
        age: patient.age?.toString() || '',
        gender: patient.gender || '',
        address: patient.address || '',
        contact: patient.contact || '',
      })
    }
  }, [patient, open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!formData.full_name || !formData.age || !formData.gender) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!patient) {
      toast.error('Patient not found')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          age: parseInt(formData.age),
          gender: formData.gender,
          address: formData.address || null,
          contact: formData.contact || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Patient updated successfully')
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.error(data.error || 'Failed to update patient')
      }
    } catch (error) {
      console.error('Error updating patient:', error)
      toast.error('An error occurred while updating the patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Edit Patient
            </DialogTitle>
            <DialogDescription>
              Update patient information in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter patient's full name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  max="150"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Age"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  required
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact</Label>
              <Input
                id="contact"
                name="contact"
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="Phone number or email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Patient's address"
              />
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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Patient'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

