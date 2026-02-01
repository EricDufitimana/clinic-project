"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, User, TestTube2, Stethoscope, CheckCircle, AlertCircle, Clock } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NurseDiagnosisForm } from '@/components/appointments/nurse-diagnosis-form'
import { Textarea } from '@/components/ui/textarea'

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

interface ContinueAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment
  onSuccess: () => void
}

interface LabRequestData {
  test_type: string
  reason: string
  doctor_id: string
  result: string
}

export function ContinueAppointmentDialog({ open, onOpenChange, appointment, onSuccess }: ContinueAppointmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<any[]>([])
  const [patientLabRequests, setPatientLabRequests] = useState<any[]>([])
  const [loadingLabRequests, setLoadingLabRequests] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'refer-doctor' | 'lab-request' | 'diagnose' | null>(null)
  const [labRequestData, setLabRequestData] = useState<LabRequestData>({
    test_type: '',
    reason: '',
    doctor_id: '',
    result: ''
  })
  const [referDoctorData, setReferDoctorData] = useState({
    doctor_id: '',
    message: '',
  })

  useEffect(() => {
    if (open) {
      fetchDoctors()
      fetchPatientLabRequests(appointment.patient_id)
      setSelectedAction(null)
      setLabRequestData({
        test_type: '',
        reason: '',
        doctor_id: '',
        result: ''
      })
      setReferDoctorData({
        doctor_id: '',
        message: '',
      })
    }
  }, [open, appointment])

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/users?role=doctor')
      if (!response.ok) throw new Error('Failed to fetch doctors')
      const data = await response.json()
      setDoctors(data.users || [])
    } catch (error) {
      console.error('Error fetching doctors:', error)
      toast.error('Failed to load doctors')
    }
  }

  const fetchPatientLabRequests = async (patientId: string) => {
    try {
      setLoadingLabRequests(true)
      const response = await fetch(`/api/lab-requests?patient_id=${patientId}`)
      if (!response.ok) throw new Error('Failed to fetch lab requests')
      const data = await response.json()
      setPatientLabRequests(data.labRequests || [])
    } catch (error) {
      console.error('Error fetching lab requests:', error)
      toast.error('Failed to load lab requests')
    } finally {
      setLoadingLabRequests(false)
    }
  }

  const handleActionSelect = (action: 'refer-doctor' | 'lab-request' | 'diagnose') => {
    setSelectedAction(action)
  }

  const handleSubmit = async () => {
    if (!selectedAction) {
      toast.error('Please select an action')
      return
    }

    if (selectedAction === 'lab-request' && (!labRequestData.test_type || !labRequestData.doctor_id)) {
      toast.error('Please select a test type and doctor')
      return
    }

    if (selectedAction === 'refer-doctor' && !referDoctorData.doctor_id) {
      toast.error('Please select a doctor to refer to')
      return
    }

    setLoading(true)
    try {
      // If referring to doctor, create a new appointment with the selected doctor
      if (selectedAction === 'refer-doctor') {
        // First, update current appointment to mark as referred
        const updateResponse = await fetch(`/api/appointments/${appointment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: appointment.status,
            is_referred: true,
            is_lab_requested: false,
            referred_doctor_id: referDoctorData.doctor_id,
          }),
        })

        if (!updateResponse.ok) {
          const error = await updateResponse.json()
          throw new Error(error.message || 'Failed to update appointment')
        }

        // Create new appointment for the referred doctor
        const newAppointmentResponse = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patient_id: appointment.patient_id,
            doctor_id: referDoctorData.doctor_id,
            status: 'pending',
            is_referred: false,
            is_lab_requested: false,
          }),
        })

        if (!newAppointmentResponse.ok) {
          const error = await newAppointmentResponse.json()
          throw new Error(error.message || 'Failed to create appointment for referred doctor')
        }

        toast.success('Patient referred to doctor successfully')
      } else {
        // Update appointment with new action (lab-request or diagnose)
        const response = await fetch(`/api/appointments/${appointment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: selectedAction === 'diagnose' ? 'diagnosed' : appointment.status,
            is_referred: false,
            is_lab_requested: selectedAction === 'lab-request',
            referred_doctor_id: null,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to update appointment')
        }

        // If lab request was selected, create the lab request
        if (selectedAction === 'lab-request') {
          const labResponse = await fetch('/api/lab-requests', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              appointment_id: appointment.id,
              test_type: labRequestData.test_type,
              reason: labRequestData.reason,
              doctor_id: labRequestData.doctor_id,
            }),
          })

          if (!labResponse.ok) {
            const error = await labResponse.json()
            throw new Error(error.message || 'Failed to create lab request')
          }
        }

        toast.success('Appointment updated successfully')
      }
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error('Error updating appointment:', error)
      toast.error(error.message || 'Failed to update appointment')
    } finally {
      setLoading(false)
    }
  }

  const getActionDescription = () => {
    switch (selectedAction) {
      case 'lab-request':
        return 'Lab tests will be requested for this patient'
      case 'refer-doctor':
        return 'Patient will be referred to a specialist doctor'
      case 'diagnose':
        return 'Patient will be diagnosed directly without additional procedures'
      default:
        return ''
    }
  }

  const getActionIcon = () => {
    switch (selectedAction) {
      case 'lab-request':
        return <TestTube2 className="h-5 w-5" />
      case 'refer-doctor':
        return <Stethoscope className="h-5 w-5" />
      case 'diagnose':
        return <CheckCircle className="h-5 w-5" />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Continue Appointment
          </DialogTitle>
          <DialogDescription>
            Review existing lab requests and choose next action for this appointment
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Patient Info */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-lg">{appointment.patient_name}</div>
                <div className="text-sm text-muted-foreground">
                  {appointment.patient_age}y • {appointment.patient_gender}
                </div>
              </div>
            </div>
          </div>

          {/* Existing Lab Requests */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="font-medium text-sm">Existing Lab Requests:</div>
              <ScrollArea className="max-h-[200px] w-full">
                {loadingLabRequests ? (
                  <div className="text-sm text-muted-foreground p-2">Loading lab requests...</div>
                ) : patientLabRequests.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">No existing lab requests found</div>
                ) : (
                  <div className="space-y-2 p-2">
                    {patientLabRequests.map((labRequest: any) => (
                      <div key={labRequest.id} className="text-sm border-b pb-2 last:border-b-0">
                        <div><strong>Test:</strong> {labRequest.test_type}</div>
                        <div><strong>Assigned to:</strong> Dr. {labRequest.doctor?.first_name} {labRequest.doctor?.last_name}</div>
                        <div><strong>Status:</strong> {labRequest.status || 'Pending'}</div>
                        {labRequest.reason && <div><strong>Reason:</strong> {labRequest.reason}</div>}
                        {labRequest.result && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                            <div><strong>Result:</strong></div>
                            <div className="text-xs mt-1 whitespace-pre-wrap">{labRequest.result}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Action Selection */}
          {!selectedAction && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">What action would you like to take?</Label>
              
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => handleActionSelect('lab-request')}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                      <TestTube2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Request Lab Tests</div>
                      <div className="text-sm text-muted-foreground">
                        Order laboratory tests for this patient
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => handleActionSelect('refer-doctor')}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                      <Stethoscope className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Refer to Doctor</div>
                      <div className="text-sm text-muted-foreground">
                        Refer patient to a specialist doctor
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => handleActionSelect('diagnose')}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Diagnose Patient</div>
                      <div className="text-sm text-muted-foreground">
                        Direct diagnosis without additional procedures
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Lab Request Form */}
          {selectedAction === 'lab-request' && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="test-type">Test Type *</Label>
                <Select value={labRequestData.test_type} onValueChange={(value: string) => setLabRequestData(prev => ({ ...prev, test_type: value }))}>
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
                <Label htmlFor="doctor">Assign to Doctor *</Label>
                <Select value={labRequestData.doctor_id} onValueChange={(value: string) => setLabRequestData(prev => ({ ...prev, doctor_id: value }))}>
                  <SelectTrigger id="doctor">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor: any) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={labRequestData.reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLabRequestData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for the test..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Refer Doctor Form */}
          {selectedAction === 'refer-doctor' && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="refer-doctor">Select Doctor *</Label>
                <Select value={referDoctorData.doctor_id} onValueChange={(value: string) => setReferDoctorData(prev => ({ ...prev, doctor_id: value }))}>
                  <SelectTrigger id="refer-doctor">
                    <SelectValue placeholder="Select a doctor to refer to" />
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
                <Label htmlFor="refer-message">Referral Message (Optional)</Label>
                <Textarea
                  id="refer-message"
                  value={referDoctorData.message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReferDoctorData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Add any relevant information for the referred doctor..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Diagnosis Form */}
          {selectedAction === 'diagnose' && (
            <NurseDiagnosisForm
              appointment={appointment}
              onSuccess={async () => {
                // Update appointment status to diagnosed
                try {
                  const response = await fetch(`/api/appointments/${appointment.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      status: 'diagnosed',
                    }),
                  })

                  if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.message || 'Failed to update appointment status')
                  }
                } catch (error) {
                  console.error('Error updating appointment status:', error)
                  toast.error('Diagnosis saved but failed to update appointment status')
                }

                onSuccess()
                onOpenChange(false)
              }}
              onCancel={() => setSelectedAction(null)}
            />
          )}

          {/* Confirmation for other actions */}
          {selectedAction && selectedAction !== 'diagnose' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                    {getActionIcon()}
                  </div>
                  <div>
                    <div className="font-medium">
                      {selectedAction === 'lab-request' && 'Lab Tests Requested'}
                      {selectedAction === 'refer-doctor' && 'Referred to Doctor'}
                    </div>
                    <div className="text-sm text-blue-700">
                      {getActionDescription()}
                    </div>
                  </div>
                </div>
              </div>

              {selectedAction === 'lab-request' && (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Lab Request Details:</div>
                    <div className="text-sm space-y-1">
                      <div><strong>Test Type:</strong> {labRequestData.test_type}</div>
                      <div><strong>Assigned Doctor:</strong> {doctors.find(d => d.id === labRequestData.doctor_id)?.first_name && doctors.find(d => d.id === labRequestData.doctor_id)?.last_name ? `Dr. ${doctors.find(d => d.id === labRequestData.doctor_id)?.first_name} ${doctors.find(d => d.id === labRequestData.doctor_id)?.last_name}` : 'Not selected'}</div>
                      {labRequestData.reason && <div><strong>Reason:</strong> {labRequestData.reason}</div>}
                    </div>
                  </div>
                </div>
              )}

              {selectedAction === 'refer-doctor' && (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Referral Details:</div>
                    <div className="text-sm space-y-1">
                      <div><strong>Referred Doctor:</strong> {doctors.find(d => d.id === referDoctorData.doctor_id)?.first_name && doctors.find(d => d.id === referDoctorData.doctor_id)?.last_name ? `Dr. ${doctors.find(d => d.id === referDoctorData.doctor_id)?.first_name} ${doctors.find(d => d.id === referDoctorData.doctor_id)?.last_name}` : 'Not selected'}</div>
                      {referDoctorData.message && <div><strong>Message:</strong> {referDoctorData.message}</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {/* Only show footer buttons when not in diagnosis mode */}
          {selectedAction !== 'diagnose' && (
            <div className="flex gap-2 w-full">
              {selectedAction && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedAction(null)}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className={!selectedAction ? 'w-full' : ''}
              >
                Cancel
              </Button>
              {selectedAction && (
                <Button 
                  type="button" 
                  onClick={handleSubmit}
                  disabled={loading || (selectedAction === 'lab-request' && (!labRequestData.test_type || !labRequestData.doctor_id)) || (selectedAction === 'refer-doctor' && !referDoctorData.doctor_id)}
                  className="flex-1"
                >
                  {loading ? 'Updating...' : 'Update Appointment'}
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
