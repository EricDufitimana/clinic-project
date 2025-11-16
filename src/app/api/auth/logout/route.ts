import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
  try {
    console.log('🚪 POST /api/auth/logout - Logout request received')
    
    const supabase = await createClient()
    
    // Sign out from Supabase
    console.log('🔐 Signing out user...')
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Error signing out:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    console.log('✅ User signed out successfully')
    
    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('💥 Unexpected error in POST /api/auth/logout:', error)
    return NextResponse.json(
      { error: 'Failed to log out' },
      { status: 500 }
    )
  }
}

