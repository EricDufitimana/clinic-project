"use client"

import React, { useEffect, useState } from 'react'
import { Search, MoreVertical, Filter, Download, TestTube2, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/hooks/use-user'
import { SubmitResultDialog } from '@/components/diagnostics/submit-result-dialog'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LabRequest {
  id: string
  patient_id: string
  nurse_id: string
  doctor_id: string
  test_type: string
  reason: string | null
  status: 'pending' | 'completed'
  result: string | null
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

export function DiagnosticsTable() {
  const { user } = useUser()
  const [labRequests, setLabRequests] = useState<LabRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  const fetchLabRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/lab-requests')
      
      if (!response.ok) {
        throw new Error('Failed to fetch lab requests')
      }

      const data = await response.json()
      setLabRequests(data.labRequests || [])
    } catch (error) {
      console.error('Error fetching lab requests:', error)
      toast.error('Failed to load lab requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLabRequests()
  }, [])

  const handleSubmitResult = (request: LabRequest) => {
    setSelectedRequest(request)
    setIsSubmitDialogOpen(true)
  }

  const handleResultSuccess = () => {
    fetchLabRequests() // Refresh the list
  }

  // Filter requests based on user role
  const roleFilteredRequests = user?.role === 'doctor'
    ? labRequests.filter(request => request.doctor_id === user.id)
    : labRequests

  const filteredRequests = roleFilteredRequests.filter(request => {
    const matchesSearch = 
      request.test_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.patient?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: 'pending' | 'completed') => {
    if (status === 'completed') {
      return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20">Completed</Badge>
    }
    return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20">Pending</Badge>
  }

  if (loading) {
    return (
      <Card className="shadow-none w-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-none w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-semibold">Lab Requests</CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'completed') => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tests..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || statusFilter !== 'all' 
              ? 'No lab requests found matching your filters.' 
              : 'No lab requests yet.'}
          </div>
        ) : (
          <div className="min-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Test Type</TableHead>
                  <TableHead className="min-w-[180px]">Patient</TableHead>
                  <TableHead className="min-w-[150px]">Requested By</TableHead>
                  <TableHead className="min-w-[150px]">Assigned Doctor</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[200px]">Reason</TableHead>
                  <TableHead className="min-w-[150px]">Requested On</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <TestTube2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium whitespace-nowrap">{request.test_type}</div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            ID: {request.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium whitespace-nowrap">
                          {request.patient?.full_name || 'Unknown Patient'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.patient?.age ? `${request.patient.age} years old` : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm whitespace-nowrap">
                        {request.nurse 
                          ? `${request.nurse.first_name} ${request.nurse.last_name}`
                          : 'Unknown Nurse'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm whitespace-nowrap font-medium">
                        {request.doctor 
                          ? `Dr. ${request.doctor.first_name} ${request.doctor.last_name}`
                          : 'Unassigned'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-[200px]">
                        {request.reason ? (
                          <div className="truncate" title={request.reason}>
                            {request.reason}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">No reason provided</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(request.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {request.status === 'completed' ? (
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 mr-2" />
                              View Results
                            </DropdownMenuItem>
                          ) : user?.role === 'doctor' ? (
                            <DropdownMenuItem onClick={() => handleSubmitResult(request)}>
                              <TestTube2 className="h-4 w-4 mr-2" />
                              Submit Result
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem>Edit Request</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Delete Request</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {selectedRequest && (
        <SubmitResultDialog
          open={isSubmitDialogOpen}
          onOpenChange={setIsSubmitDialogOpen}
          labRequest={selectedRequest}
          onSuccess={handleResultSuccess}
        />
      )}
    </Card>
  )
}

