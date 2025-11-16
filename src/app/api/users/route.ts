import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /api/users - Fetching users started');
    
    // Get authenticated user
    console.log('🔐 Fetching authenticated user...');
    const result = await getAuthenticatedUser('id, role', true)
    
    if ('error' in result) {
      console.error('❌ Auth error:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    const { authUser, userData } = result
    console.log('👤 Auth User:', { id: authUser.id, email: authUser.email });

    // Only nurses and doctors can view users
    console.log('🔒 Checking user role permissions...');
    if (userData.role !== 'nurse' && userData.role !== 'doctor') {
      console.error('❌ Permission denied: User role is', userData.role);
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    console.log('✅ User is authorized to view users');

    // Get role filter from query params
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')
    console.log('🔍 Role filter:', roleFilter || 'none');

    // Fetch users
    console.log('💾 Fetching users from database...');
    const supabase = createServiceRoleClient()
    
    let query = supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .order('first_name', { ascending: true })

    if (roleFilter && (roleFilter === 'doctor' || roleFilter === 'nurse')) {
      query = query.eq('role', roleFilter)
      console.log(`📊 Filtering by role: ${roleFilter}`);
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    console.log('✅ Users fetched successfully');
    console.log('📊 User count:', users?.length || 0);

    return NextResponse.json({ users }, { status: 200 })
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

