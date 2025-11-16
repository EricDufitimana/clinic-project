"use client"

import { useEffect, useState } from 'react'

interface UserData {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  role: 'doctor' | 'nurse'
}

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true)
        const response = await fetch('/api/user/me')
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Unauthorized')
            setUser(null)
            return
          }
          const data = await response.json()
          throw new Error(data.error || 'Failed to fetch user')
        }

        const userData = await response.json()
        setUser(userData)
        setError(null)
      } catch (err) {
        console.error('Error fetching user:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading, error }
}

