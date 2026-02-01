"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Calendar, User, Search, ArrowRight, CheckCircle, AlertCircle, TestTube2, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface Patient {
  id: string
  full_name: string
  age: number
  gender: string
  contact?: string
}

interface LabRequestData {
  test_type: string
  reason: string
  doctor_id: string
}

type AppointmentStep = 'patient-selection' | 'action-selection' | 'lab-request-form' | 'confirmation'

export function CreateAppointmentDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentStep, setCurrentStep] = useState<AppointmentStep>('patient-selection')
  const [selectedAction, setSelectedAction] = useState<'lab-request' | 'refer-doctor' | 'diagnose' | null>(null)
  const [labRequestData, setLabRequestData] = useState<LabRequestData>({
    test_type: '',
    reason: '',
    doctor_id: ''
  })
  const [patientLabRequests, setPatientLabRequests] = useState<any[]>([])
  const [loadingLabRequests, setLoadingLabRequests] = useState(false)

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      if (!response.ok) throw new Error('Failed to fetch patients')
      const data = await response.json()
      setPatients(data.patients || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Failed to load patients')
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/users?role=doctor')
      if (!response.ok) throw new Error('Failed to fetch doctors')
      const data = await response.json()
      console.log('👨‍⚕️ Doctors loaded:', data.users)
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

  useEffect(() => {
    if (open) {
      fetchPatients()
      fetchDoctors()
      setCurrentStep('patient-selection')
      setSelectedPatient(null)
      setSelectedAction(null)
      setSearchQuery('')
    }
  }, [open])

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.contact?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setSearchQuery('')
    setCurrentStep('action-selection')
  }

  const handleActionSelect = (action: 'lab-request' | 'refer-doctor' | 'diagnose') => {
    setSelectedAction(action)
    if (action === 'lab-request') {
      setCurrentStep('lab-request-form')
    } else {
      setCurrentStep('confirmation')
    }
  }

  const handleCreateAppointment = async () => {
    if (!selectedPatient || !selectedAction) {
      toast.error('Please complete all steps')
      return
    }

    if (selectedAction === 'lab-request' && (!labRequestData.test_type || !labRequestData.doctor_id)) {
      toast.error('Please select a test type and doctor')
      return
    }

    setLoading(true)
    try {
      const isReferred = selectedAction === 'refer-doctor'
      const isLabRequested = selectedAction === 'lab-request'

      // Create appointment first
      const appointmentResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          is_referred: isReferred,
          is_lab_requested: isLabRequested,
          is_diagnosed: selectedAction === 'diagnose',
        }),
      })

      const appointmentData = await appointmentResponse.json()

      if (!appointmentResponse.ok) {
        throw new Error(appointmentData.message || 'Failed to create appointment')
      }

      // If lab request was selected, create the lab request
      if (selectedAction === 'lab-request') {
        console.log('🔍 Lab request data before sending:', {
          appointment_id: appointmentData.appointment.id,
          test_type: labRequestData.test_type,
          reason: labRequestData.reason,
          doctor_id: labRequestData.doctor_id,
          fullLabRequestData: labRequestData
        })
        
        const labResponse = await fetch('/api/lab-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointment_id: appointmentData.appointment.id,
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

      toast.success('Appointment created successfully')
      resetForm()
      setOpen(false)
      // Refresh the page to show new appointment
      window.location.reload()
    } catch (error: any) {
      console.error('Error creating appointment:', error)
      toast.error(error.message || 'Failed to create appointment')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedPatient(null)
    setSelectedAction(null)
    setCurrentStep('patient-selection')
    setSearchQuery('')
    setLabRequestData({
      test_type: '',
      reason: '',
      doctor_id: ''
    })
  }

  const goBack = () => {
    if (currentStep === 'action-selection') {
      setCurrentStep('patient-selection')
      setSelectedPatient(null)
    } else if (currentStep === 'lab-request-form') {
      setCurrentStep('action-selection')
    } else if (currentStep === 'confirmation') {
      setCurrentStep('action-selection')
      setSelectedAction(null)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Appointment
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'patient-selection' && 'Select a patient for the appointment'}
            {currentStep === 'action-selection' && 'Choose the action for this appointment'}
            {currentStep === 'lab-request-form' && 'Fill in the lab request details'}
            {currentStep === 'confirmation' && 'Confirm appointment details'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Step 1: Patient Selection */}
          {currentStep === 'patient-selection' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patient-search">Select Patient</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="patient-search"
                    type="search"
                    placeholder="Search patients..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {searchQuery && (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No patients found
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          className="p-3 cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium">{patient.full_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {patient.age}y • {patient.gender}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {patient.contact && (
                                <div className="text-sm text-muted-foreground">
                                  {patient.contact}
                                </div>
                              )}
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Action Selection */}
          {currentStep === 'action-selection' && selectedPatient && (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-lg">{selectedPatient.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPatient.age}y • {selectedPatient.gender}
                    </div>
                  </div>
                </div>
              </div>

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
            </div>
          )}

          {/* Step 3: Lab Request Form */}
          {currentStep === 'lab-request-form' && selectedPatient && (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-lg">{selectedPatient.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPatient.age}y • {selectedPatient.gender}
                    </div>
                  </div>
                </div>
              </div>

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
                  <Select 
                    value={labRequestData.doctor_id} 
                    onValueChange={(value: string) => {
                      console.log('👨‍⚕️ Doctor selected:', value)
                      setLabRequestData(prev => ({ ...prev, doctor_id: value }))
                    }}
                  >
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

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                      <TestTube2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Lab Request Details</div>
                      <div className="text-sm text-blue-700">
                        The lab request will be created and linked to this appointment
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 'confirmation' && selectedPatient && selectedAction && (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-lg">{selectedPatient.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPatient.age}y • {selectedPatient.gender}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                    {getActionIcon()}
                  </div>
                  <div>
                    <div className="font-medium">
                      {selectedAction === 'lab-request' && 'Lab Tests Requested'}
                      {selectedAction === 'refer-doctor' && 'Referred to Doctor'}
                      {selectedAction === 'diagnose' && 'Direct Diagnosis'}
                    </div>
                    <div className="text-sm text-blue-700">
                      {getActionDescription()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Show lab request details if applicable */}
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

              <div className="text-sm text-muted-foreground">
                <strong>Summary:</strong> An appointment will be created for {selectedPatient.full_name} 
                {selectedAction === 'lab-request' && ' with lab tests requested'}
                {selectedAction === 'refer-doctor' && ' and they will be referred to a specialist'}
                {selectedAction === 'diagnose' && ' for direct diagnosis'}.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full">
            {currentStep !== 'patient-selection' && (
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={loading}
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className={currentStep === 'patient-selection' ? 'w-full' : ''}
            >
              Cancel
            </Button>
            {currentStep === 'lab-request-form' && (
              <Button 
                type="button" 
                onClick={() => setCurrentStep('confirmation')}
                disabled={!labRequestData.test_type || !labRequestData.doctor_id}
                className="flex-1"
              >
                Next
              </Button>
            )}
            {currentStep === 'confirmation' && (
              <Button 
                type="button" 
                onClick={handleCreateAppointment}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Appointment'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
