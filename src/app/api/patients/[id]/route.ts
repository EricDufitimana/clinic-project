import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get authenticated user
    const result = await getAuthenticatedUser('id, role', true)
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    const { userData } = result

    // Only nurses and doctors can view patients
    if (userData.role !== 'nurse' && userData.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()
    
    const { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch patient' },
        { status: 500 }
      )
    }

    return NextResponse.json({ patient }, { status: 200 })
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/patients/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get authenticated user
    const result = await getAuthenticatedUser('id, role', true)
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    const { userData } = result

    // Only nurses and doctors can edit patients
    if (userData.role !== 'nurse' && userData.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only nurses and doctors can edit patients' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { full_name, age, gender, address, contact } = data

    // Validate required fields
    if (!full_name || !age || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, age, gender' },
        { status: 400 }
      )
    }

    // Validate gender
    if (!['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json(
        { error: 'Invalid gender. Must be male, female, or other' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()
    
    // Check if patient exists
    const { data: existingPatient, error: checkError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Update patient
    const updateData = {
      full_name,
      age: parseInt(age),
      gender,
      address: address || null,
      contact: contact || null,
    }

    const { data: patient, error: updateError } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Patient updated successfully', patient },
      { status: 200 }
    )
  } catch (error) {
    console.error('💥 Unexpected error in PATCH /api/patients/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get authenticated user
    const result = await getAuthenticatedUser('id, role', true)
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    const { userData } = result

    // Only nurses can delete patients
    if (userData.role !== 'nurse') {
      return NextResponse.json(
        { error: 'Only nurses can delete patients' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()
    
    // Check if patient exists
    const { data: existingPatient, error: checkError } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('id', id)
      .single()

    if (checkError || !existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Delete patient
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Patient deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('💥 Unexpected error in DELETE /api/patients/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

