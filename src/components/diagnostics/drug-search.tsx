"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Search, X, Pill, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Drug {
  product_ndc?: string
  generic_name?: string
  brand_name?: string
  active_ingredients?: Array<{
    name: string
    strength: string
  }>
  dosage_form?: string
  route?: string[]
}

interface SelectedDrug {
  name: string
  dosage?: string
  frequency?: string
  duration?: string
  notes?: string
  ndc?: string
}

interface DrugSearchProps {
  selectedDrugs: SelectedDrug[]
  onDrugsChange: (drugs: SelectedDrug[]) => void
}

export function DrugSearch({ selectedDrugs, onDrugsChange }: DrugSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Drug[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [noResultsFound, setNoResultsFound] = useState(false)

  // Debounce search
  const searchDrugs = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      setNoResultsFound(false)
      return
    }

    setIsSearching(true)
    setNoResultsFound(false)
    try {
      // Using openFDA API - free and no authentication required
      const response = await fetch(
        `https://api.fda.gov/drug/ndc.json?search=brand_name:"${encodeURIComponent(query)}" OR generic_name:"${encodeURIComponent(query)}"&limit=10`
      )

      if (!response.ok) {
        throw new Error('Failed to search drugs')
      }

      const data = await response.json()
      const results = data.results || []
      
      if (results.length === 0) {
        setSearchResults([])
        setNoResultsFound(true)
      } else {
        setSearchResults(results)
        setNoResultsFound(false)
      }
      setShowResults(true)
    } catch (error) {
      console.error('Error searching drugs:', error)
      setSearchResults([])
      setNoResultsFound(true)
      setShowResults(true)
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchDrugs(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, searchDrugs])

  const handleSelectDrug = (drug: Drug) => {
    const drugName = drug.brand_name || drug.generic_name || 'Unknown Drug'
    const newDrug: SelectedDrug = {
      name: drugName,
      dosage: '',
      frequency: '',
      duration: '',
      notes: '',
      ndc: drug.product_ndc,
    }

    onDrugsChange([...selectedDrugs, newDrug])
    setSearchQuery('')
    setShowResults(false)
  }

  const handleRemoveDrug = (index: number) => {
    const updated = selectedDrugs.filter((_, i) => i !== index)
    onDrugsChange(updated)
  }

  const handleUpdateDrug = (index: number, field: keyof SelectedDrug, value: string) => {
    const updated = selectedDrugs.map((drug, i) => 
      i === index ? { ...drug, [field]: value } : drug
    )
    onDrugsChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Search and Add Medications</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Search for medications (e.g., Aspirin, Ibuprofen)..."
            className="pl-8 pr-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
          <div className="absolute right-2.5 top-2.5">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : searchQuery ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => {
                  setSearchQuery('')
                  setShowResults(false)
                  setSearchResults([])
                  setNoResultsFound(false)
                }}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            ) : null}
          </div>
          
          {/* Search Results Dropdown */}
          {showResults && !isSearching && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2">
                {noResultsFound ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <Pill className="h-5 w-5 mx-auto mb-2 opacity-50" />
                    <p>Drug not found</p>
                    <p className="text-xs mt-1">Try searching with a different name</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((drug, index) => {
                    const name = drug.brand_name || drug.generic_name || 'Unknown'
                    return (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelectDrug(drug)
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">{name}</div>
                            {drug.generic_name && drug.brand_name && (
                              <div className="text-xs text-muted-foreground">
                                Generic: {drug.generic_name}
                              </div>
                            )}
                            {drug.dosage_form && (
                              <div className="text-xs text-muted-foreground">
                                Form: {drug.dosage_form}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Drugs */}
      {selectedDrugs.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium">Prescribed Medications ({selectedDrugs.length})</label>
          <div className="space-y-3">
            {selectedDrugs.map((drug, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    <span className="font-medium">{drug.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveDrug(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Dosage</label>
                    <Input
                      placeholder="e.g., 500mg"
                      value={drug.dosage || ''}
                      onChange={(e) => handleUpdateDrug(index, 'dosage', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Frequency</label>
                    <Input
                      placeholder="e.g., Twice daily"
                      value={drug.frequency || ''}
                      onChange={(e) => handleUpdateDrug(index, 'frequency', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Duration</label>
                    <Input
                      placeholder="e.g., 7 days"
                      value={drug.duration || ''}
                      onChange={(e) => handleUpdateDrug(index, 'duration', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Notes</label>
                    <Input
                      placeholder="Additional notes"
                      value={drug.notes || ''}
                      onChange={(e) => handleUpdateDrug(index, 'notes', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDrugs.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg">
          No medications added. Search above to add prescriptions.
        </div>
      )}
    </div>
  )
}

