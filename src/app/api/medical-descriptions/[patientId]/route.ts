import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params
    
    // Get authenticated user
    const result = await getAuthenticatedUser('id, role', true)
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    const { userData } = result

    // Only nurses and doctors can view patient history
    if (userData.role !== 'nurse' && userData.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch medical descriptions for the specific patient
    const supabase = createServiceRoleClient()
    
    const { data: medicalDescriptions, error: fetchError } = await supabase
      .from('medical_descriptions')
      .select(`
        *,
        doctor:users!medical_descriptions_doctor_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching patient medical descriptions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch patient medical descriptions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ medicalDescriptions: medicalDescriptions || [] }, { status: 200 })
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/medical-descriptions/[patientId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

