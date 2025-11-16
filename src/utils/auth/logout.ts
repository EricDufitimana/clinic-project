"use client"

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Utility function to handle user logout
 * Signs out the user from Supabase and redirects to the landing page
 */
export async function logout() {
  try {
    console.log('🚪 Logging out user...')
    
    const supabase = createClient()
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Error signing out:', error)
      throw error
    }
    
    console.log('✅ User signed out successfully')
    
    // Clear any local storage or session data if needed
    // The Supabase client handles cookie clearing automatically
    
    return { success: true }
  } catch (error) {
    console.error('💥 Unexpected error during logout:', error)
    throw error
  }
}

