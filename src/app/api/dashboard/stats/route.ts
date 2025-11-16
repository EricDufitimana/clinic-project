import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function GET() {
  try {
    // Get authenticated user
    const result = await getAuthenticatedUser('id, role', true)
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    const { userData } = result

    // Only nurses and doctors can view dashboard stats
    if (userData.role !== 'nurse' && userData.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get total patients count
    const { count: totalPatients, error: patientsError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })

    if (patientsError) {
      console.error('Error fetching total patients:', patientsError)
    }

    // Get active patients count
    const { count: activePatients, error: activeError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE')

    if (activeError) {
      console.error('Error fetching active patients:', activeError)
    }

    // Get pending lab requests count
    const { count: pendingLabRequests, error: labRequestsError } = await supabase
      .from('lab_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (labRequestsError) {
      console.error('Error fetching pending lab requests:', labRequestsError)
    }

    // Get total lab requests count
    const { count: totalLabRequests, error: totalLabError } = await supabase
      .from('lab_requests')
      .select('*', { count: 'exact', head: true })

    if (totalLabError) {
      console.error('Error fetching total lab requests:', totalLabError)
    }

    // Get completed lab requests today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const { count: completedToday, error: completedError } = await supabase
      .from('lab_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', todayISO)

    if (completedError) {
      console.error('Error fetching completed lab requests today:', completedError)
    }

    // Get patients with appointments today (if next_appointment exists)
    const { count: appointmentsToday, error: appointmentsError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .not('next_appointment', 'is', null)
      .gte('next_appointment', todayISO)
      .lt('next_appointment', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())

    if (appointmentsError) {
      console.error('Error fetching appointments today:', appointmentsError)
    }

    // Calculate percentage changes (simplified - comparing to previous period)
    // For now, we'll use static percentages or calculate based on recent data
    const stats = {
      totalPatients: totalPatients || 0,
      activePatients: activePatients || 0,
      pendingLabRequests: pendingLabRequests || 0,
      totalLabRequests: totalLabRequests || 0,
      completedToday: completedToday || 0,
      appointmentsToday: appointmentsToday || 0,
    }

    return NextResponse.json({ stats }, { status: 200 })
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/dashboard/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

