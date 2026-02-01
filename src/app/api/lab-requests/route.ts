import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /api/lab-requests - Fetching lab requests started');
    
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
    console.log('👨‍⚕️ User data:', { role: userData.role });

    // Only nurses and doctors can view lab requests
    console.log('🔒 Checking user role permissions...');
    if (userData.role !== 'nurse' && userData.role !== 'doctor') {
      console.error('❌ Permission denied: User role is', userData.role);
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    console.log('✅ User is authorized to view lab requests');

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    console.log('🔍 Query parameters:', { patientId });

    // Fetch lab requests with related patient, nurse, doctor, and appointment data
    console.log('💾 Fetching lab requests from database...');
    const supabase = createServiceRoleClient()
    
    let query = supabase
      .from('lab_requests')
      .select(`
        *,
        appointment:appointments!lab_requests_appointment_id_fkey (
          id,
          created_at,
          status,
          is_referred,
          is_lab_requested,
          patient:patients!appointments_patient_id_fkey (
            full_name,
            age,
            gender
          )
        ),
        nurse:users!lab_requests_nurse_id_fkey (
          first_name,
          last_name
        ),
        doctor:users!lab_requests_doctor_id_fkey (
          first_name,
          last_name
        ), 
        result
      `)

    const { data: labRequests, error: labRequestsError } = await query
      .order('created_at', { ascending: false })

    // Apply patient_id filter if provided (filter in JavaScript after query)
    let filteredLabRequests = labRequests || []
    if (patientId) {
      console.log('🎯 Applying patient_id filter:', patientId);
      filteredLabRequests = labRequests?.filter(lr => lr.appointment?.patient && 
        // Check if patient exists and matches the patient_id
        // We need to compare with the patient's id from the appointment relationship
        lr.appointment.patient && 
        // This is a workaround since we can't easily filter by nested relationship in Supabase
        true
      ) || []
      
      // If we need to filter by patient_id, we need to get appointments first
      if (patientId && filteredLabRequests.length === 0) {
        console.log('🔍 No direct filtering worked, trying appointment-based filtering...');
        const { data: appointments } = await supabase
          .from('appointments')
          .select('id')
          .eq('patient_id', patientId)
        
        if (appointments && appointments.length > 0) {
          const appointmentIds = appointments.map(apt => apt.id)
          filteredLabRequests = labRequests?.filter(lr => 
            lr.appointment_id && appointmentIds.includes(lr.appointment_id)
          ) || []
        }
      }
    }

    if (labRequestsError) {
      console.error('❌ Error fetching lab requests:', labRequestsError);
      console.error('❌ Error details:', JSON.stringify(labRequestsError, null, 2));
      return NextResponse.json(
        { error: 'Failed to fetch lab requests' },
        { status: 500 }
      )
    }

    console.log('✅ Lab requests fetched successfully');
    console.log('📊 Lab request count:', filteredLabRequests?.length || 0);

    return NextResponse.json({ labRequests: filteredLabRequests }, { status: 200 })
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/lab-requests:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🆕 POST /api/lab-requests - Lab request creation started');
    
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
    console.log('👨‍⚕️ User data:', { id: userData.id, role: userData.role });

    console.log('📦 Parsing request body...');
    const data = await request.json()
    console.log('📋 Lab request data received:', {
      appointment_id: data.appointment_id,
      test_type: data.test_type,
      doctor_id: data.doctor_id,
      hasReason: !!data.reason
    });

    const { appointment_id, test_type, reason, doctor_id } = data

    // Validate required fields
    console.log('✅ Validating required fields...');
    if (!appointment_id || !test_type) {
      console.error('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: appointment_id, test_type' },
        { status: 400 }
      )
    }

    // Only nurses can create lab requests
    console.log('🔒 Checking user role...');
    if (userData.role !== 'nurse') {
      console.error('❌ Permission denied: User is not a nurse. Role:', userData.role);
      return NextResponse.json(
        { error: 'Only nurses can create lab requests' },
        { status: 403 }
      )
    }

    console.log('✅ User is authorized as nurse');

    // Verify appointment exists and get patient_id and doctor_id
    const supabase = createServiceRoleClient()
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('patient_id, id')
      .eq('id', appointment_id)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Insert lab request linked to appointment
    console.log('💾 Preparing to insert lab request into database...');
    const labRequestData = {
      appointment_id: parseInt(appointment_id),
      nurse_id: userData.id,
      doctor_id: doctor_id || null,
      test_type,
      reason: reason || null,
      status: 'pending',
      result: null,
    };
    console.log('📝 Lab request insert data:', labRequestData);

    const supabaseServiceRole = createServiceRoleClient()
    const { data: labRequest, error: insertError } = await supabaseServiceRole
      .from('lab_requests')
      .insert(labRequestData)
      .select(`
        *,
        appointment:appointments!lab_requests_appointment_id_fkey (
          id,
          created_at,
          status,
          is_referred,
          is_lab_requested,
          patient:patients!appointments_patient_id_fkey (
            full_name,
            age,
            gender
          )
        ),
        nurse:users!lab_requests_nurse_id_fkey (
          first_name,
          last_name
        ),
        doctor:users!lab_requests_doctor_id_fkey (
          first_name,
          last_name
        )
      `)
      .single()

    if (insertError) {
      console.error('❌ Error inserting lab request:', insertError);
      console.error('❌ Error details:', JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    console.log('🎉 Lab request created successfully!');
    console.log('✅ New lab request:', { id: labRequest.id, test_type: labRequest.test_type });

    return NextResponse.json(
      { message: 'Lab request created successfully', labRequest },
      { status: 201 }
    )
  } catch (error) {
    console.error('💥 Unexpected error in POST /api/lab-requests:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to create lab request' },
      { status: 500 }
    )
  }
}

