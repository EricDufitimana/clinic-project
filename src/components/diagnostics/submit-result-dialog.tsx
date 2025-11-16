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
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

interface SubmitResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  labRequest: {
    id: string
    test_type: string
    patient?: {
      full_name: string
    }
    reason?: string | null
  }
  onSuccess?: () => void
}

export function SubmitResultDialog({ open, onOpenChange, labRequest, onSuccess }: SubmitResultDialogProps) {
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!result.trim()) {
      toast.error('Please enter the test result')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/lab-requests/${labRequest.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result: result.trim(),
          status: 'completed',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Result submitted successfully!')
        setResult('')
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.error(data.error || 'Failed to submit result')
      }
    } catch (error) {
      console.error('Error submitting result:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Submit Test Result
          </DialogTitle>
          <DialogDescription>
            Submit the result for <span className="font-semibold">{labRequest.test_type}</span>
            {labRequest.patient && ` - ${labRequest.patient.full_name}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {labRequest.reason && (
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Request Reason</Label>
                <p className="text-sm p-3 bg-muted rounded-md">{labRequest.reason}</p>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="result">Test Result *</Label>
              <Textarea
                id="result"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="Enter the test result details..."
                rows={6}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Include all relevant findings, measurements, and interpretations
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> 
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Result
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

