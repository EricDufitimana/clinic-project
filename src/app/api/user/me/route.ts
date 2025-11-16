import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role client to bypass RLS and fetch user data
    const serviceRoleClient = createServiceRoleClient()
    const { data: userData, error: userError } = await serviceRoleClient
      .from('users')
      .select('id, user_id, first_name, last_name, email, role')
      .eq('user_id', authUser.id)
      .single()

    if (userError) {
      console.error('Error fetching user data:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: userData.id,
      user_id: userData.user_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      role: userData.role,
    })
  } catch (error) {
    console.error('Unexpected error in /api/user/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

