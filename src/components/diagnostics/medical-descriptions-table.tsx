"use client"

import React, { useEffect, useState } from 'react'
import { Search, MoreVertical, Filter, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/hooks/use-user'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { ViewDiagnosticDialog } from '@/components/diagnostics/view-diagnostic-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MedicalDescription {
  id: string
  patient_id: string
  doctor_id: string
  description: string
  notes: string | null
  prescriptions: any[] | null
  created_at: string
  patient?: {
    id: string
    full_name: string
    name?: string
    contact: string
  }
  doctor?: {
    id: string
    first_name: string
    last_name: string
  }
}

export function MedicalDescriptionsTable() {
  const { user } = useUser()
  const [medicalDescriptions, setMedicalDescriptions] = useState<MedicalDescription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDescription, setSelectedDescription] = useState<MedicalDescription | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const fetchMedicalDescriptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/medical-descriptions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch medical descriptions')
      }

      const data = await response.json()
      setMedicalDescriptions(data.medicalDescriptions || [])
    } catch (error) {
      console.error('Error fetching medical descriptions:', error)
      toast.error('Failed to load medical descriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedicalDescriptions()
  }, [])

  const filteredDescriptions = medicalDescriptions.filter(description => {
    const matchesSearch = 
      description.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
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

  const handleViewDetails = (description: MedicalDescription) => {
    setSelectedDescription(description)
    setIsViewDialogOpen(true)
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
          <CardTitle className="text-xl font-semibold">Medical Descriptions</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search descriptions..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDescriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery 
              ? 'No medical descriptions found matching your search.' 
              : 'No medical descriptions yet.'}
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="min-w-full">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Patient</TableHead>
                  <TableHead className="min-w-[200px]">Description</TableHead>
                  <TableHead className="min-w-[150px]">Doctor</TableHead>
                  <TableHead className="min-w-[150px]">Created</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDescriptions.map((description) => (
                  <TableRow key={description.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium whitespace-nowrap">
                          {description.patient?.full_name || description.patient?.name || 'Unknown Patient'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {description.patient?.contact || 'No contact'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-[200px]">
                        <div className="truncate" title={description.description}>
                          {description.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm whitespace-nowrap font-medium">
                        {description.doctor 
                          ? `Dr. ${description.doctor.first_name} ${description.doctor.last_name}`
                          : 'Unknown Doctor'
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(description.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(description)}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {selectedDescription && (
        <ViewDiagnosticDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          medicalDescription={selectedDescription}
        />
      )}
    </Card>
  )
}

