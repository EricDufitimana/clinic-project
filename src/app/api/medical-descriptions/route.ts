import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function GET() {
  try {
    console.log('📋 GET /api/medical-descriptions - Fetching medical descriptions started');
    
    // Get authenticated user
    const result = await getAuthenticatedUser('id, role', true)
    
    if ('error' in result) {
      console.error('❌ Auth error:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    const { authUser, userData } = result

    // Only doctors can view medical descriptions
    if (userData.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch medical descriptions with related patient and doctor data
    const supabase = createServiceRoleClient()
    
    const { data: medicalDescriptions, error: fetchError } = await supabase
      .from('medical_descriptions')
      .select(`
        *,
        patient:patients!medical_descriptions_patient_id_fkey (
          id,
          full_name,
          contact
        ),
        doctor:users!medical_descriptions_doctor_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching medical descriptions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch medical descriptions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ medicalDescriptions }, { status: 200 })
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/medical-descriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🆕 POST /api/medical-descriptions - Medical description creation started');
    
    // Get authenticated user
    const result = await getAuthenticatedUser('id, role', true)
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    const { authUser, userData } = result

    const data = await request.json()
    const { patient_id, description, notes, prescriptions } = data

    // Validate required fields
    if (!patient_id || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: patient_id, description' },
        { status: 400 }
      )
    }

    // Only doctors can create medical descriptions
    if (userData.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can create medical descriptions' },
        { status: 403 }
      )
    }

    // Insert medical description
    const medicalDescriptionData = {
      patient_id,
      doctor_id: userData.id,
      description,
      notes: notes || null,
      prescriptions: prescriptions && prescriptions.length > 0 ? prescriptions : null,
    };

    const supabaseServiceRole = createServiceRoleClient()
    const { data: medicalDescription, error: insertError } = await supabaseServiceRole
      .from('medical_descriptions')
      .insert(medicalDescriptionData)
      .select(`
        *,
        patient:patients!medical_descriptions_patient_id_fkey (
          id,
          full_name,
          contact
        ),
        doctor:users!medical_descriptions_doctor_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .single()

    if (insertError) {
      console.error('❌ Error inserting medical description:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    console.log('🎉 Medical description created successfully!');

    return NextResponse.json(
      { message: 'Medical description created successfully', medicalDescription },
      { status: 201 }
    )
  } catch (error) {
    console.error('💥 Unexpected error in POST /api/medical-descriptions:', error);
    return NextResponse.json(
      { error: 'Failed to create medical description' },
      { status: 500 }
    )
  }
}

