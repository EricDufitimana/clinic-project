import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function GET() {
  try {
    console.log('📋 GET /api/appointments - Fetching appointments started');
    
    // Get authenticated user using utility function
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
    console.log('👨‍⚕️ User data:', { role: userData.role });

    // Only nurses and doctors can view appointments
    console.log('🔒 Checking user role permissions...');
    if (userData.role !== 'nurse' && userData.role !== 'doctor') {
      console.error('❌ Permission denied: User role is', userData.role);
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    console.log('✅ User is authorized to view appointments');

    // Fetch appointments with patient information
    console.log('💾 Fetching appointments from database...');
    const supabase = createServiceRoleClient()
    
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (
          id,
          full_name,
          age,
          gender
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    console.log('✅ Appointments fetched successfully');
    console.log('📊 Appointment count:', appointments?.length || 0);

    // Transform the data to match the expected format
    const transformedAppointments = appointments?.map((apt: any) => ({
      id: apt.id.toString(),
      patient_id: apt.patient_id,
      patient_name: apt.patients?.full_name || 'Unknown Patient',
      patient_age: apt.patients?.age || 0,
      patient_gender: apt.patients?.gender || 'unknown',
      created_at: apt.created_at,
      status: apt.status,
      is_referred: apt.is_referred,
      is_lab_requested: apt.is_lab_requested
    })) || []

    return NextResponse.json({ appointments: transformedAppointments })
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🆕 POST /api/appointments - Creating appointment started');
    
    // Get authenticated user using utility function
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
    console.log('👨‍⚕️ User data:', { role: userData.role });

    // Only nurses and doctors can create appointments
    console.log('🔒 Checking user role permissions...');
    if (!['nurse', 'doctor'].includes(userData.role)) {
      console.error('❌ Permission denied: User role is', userData.role);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    console.log('✅ User is authorized to create appointments');

    const body = await request.json()
    console.log('📦 Appointment data received:', body);
    const { patient_id, is_referred = false, is_lab_requested = false } = body

    if (!patient_id) {
      console.error('❌ Validation failed: Missing patient_id');
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    // Verify patient exists
    console.log('🔍 Verifying patient exists...');
    const supabase = createServiceRoleClient()
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patient_id)
      .single()

    if (patientError || !patient) {
      console.error('❌ Patient not found:', patientError);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    console.log('✅ Patient verified:', { id: patient.id });

    // Create appointment
    console.log('💾 Creating appointment...');
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        patient_id,
        is_referred,
        is_lab_requested,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating appointment:', error);
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
    }

    console.log('🎉 Appointment created successfully!');
    console.log('✅ New appointment:', { id: appointment.id });

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    console.error('💥 Unexpected error in POST /api/appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
