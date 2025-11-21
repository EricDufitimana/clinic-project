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

    // Get pending lab requests count
    const { count: pendingLabRequests, error: labRequestsError } = await supabase
      .from('lab_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (labRequestsError) {
      console.error('Error fetching pending lab requests:', labRequestsError)
    }

    // Get completed lab requests count
    const { count: completedLabRequests, error: completedError } = await supabase
      .from('lab_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    if (completedError) {
      console.error('Error fetching completed lab requests:', completedError)
    }

    // Get total medical diagnostics count
    const { count: totalMedicalDiagnostics, error: diagnosticsError } = await supabase
      .from('medical_descriptions')
      .select('*', { count: 'exact', head: true })

    if (diagnosticsError) {
      console.error('Error fetching total medical diagnostics:', diagnosticsError)
    }

    const stats = {
      totalPatients: totalPatients || 0,
      completedLabRequests: completedLabRequests || 0,
      pendingLabRequests: pendingLabRequests || 0,
      totalMedicalDiagnostics: totalMedicalDiagnostics || 0,
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

