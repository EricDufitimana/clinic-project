"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { TestTube2, Calendar, User, FileText } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface LabRequest {
  id: string
  test_type: string
  reason: string | null
  result: string | null
  status: 'pending' | 'completed'
  created_at: string
  patient?: {
    full_name: string
    age: number
  }
  nurse?: {
    first_name: string
    last_name: string
  }
  doctor?: {
    first_name: string
    last_name: string
  }
}

interface ViewLabResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  labRequest: LabRequest | null
}

export function ViewLabResultDialog({ 
  open, 
  onOpenChange, 
  labRequest 
}: ViewLabResultDialogProps) {
  if (!labRequest) return null

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            Lab Test Results
          </DialogTitle>
          <DialogDescription>
            View complete details and results for this lab request
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Test Information */}
            <div className="space-y-2">
              <div className="text-sm font-semibold flex items-center gap-2">
                <TestTube2 className="h-4 w-4" />
                Test Information
              </div>
              <div className="bg-muted/50 p-3 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{labRequest.test_type}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Request ID: {labRequest.id.slice(0, 8)}
                    </div>
                  </div>
                  <Badge 
                    className={
                      labRequest.status === 'completed' 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                        : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    }
                  >
                    {labRequest.status === 'completed' ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Patient Information */}
            {labRequest.patient && (
              <div className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient Information
                </div>
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="text-sm">
                    <span className="font-medium">Name: </span>
                    {labRequest.patient.full_name}
                  </div>
                  {labRequest.patient.age && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Age: </span>
                      {labRequest.patient.age} years old
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Request Details */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Requested: {formatDate(labRequest.created_at)}
                  </span>
                </div>
                {labRequest.doctor && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>
                      Dr. {labRequest.doctor.first_name} {labRequest.doctor.last_name}
                    </span>
                  </div>
                )}
              </div>
              {labRequest.nurse && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Requested by: </span>
                  {labRequest.nurse.first_name} {labRequest.nurse.last_name}
                </div>
              )}
            </div>

            <Separator />

            {/* Reason */}
            {labRequest.reason && (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Request Reason</div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {labRequest.reason}
                </div>
              </div>
            )}

            {/* Results */}
            {labRequest.status === 'completed' && labRequest.result ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Test Results
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md whitespace-pre-wrap">
                    {labRequest.result}
                  </div>
                </div>
              </>
            ) : labRequest.status === 'completed' && !labRequest.result ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Test Results
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md text-center">
                    No results available
                  </div>
                </div>
              </>
            ) : (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Test Results
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md text-center">
                    Results are pending. Please check back later.
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

