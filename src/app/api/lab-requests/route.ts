import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function GET() {
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

    // Fetch lab requests with related patient and nurse data
    console.log('💾 Fetching lab requests from database...');
    const supabase = createServiceRoleClient()
    
    const { data: labRequests, error: labRequestsError } = await supabase
      .from('lab_requests')
      .select(`
        *,
        patient:patients!lab_requests_patient_id_fkey (
          full_name,
          age
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
      .order('created_at', { ascending: false })

    if (labRequestsError) {
      console.error('❌ Error fetching lab requests:', labRequestsError);
      console.error('❌ Error details:', JSON.stringify(labRequestsError, null, 2));
      return NextResponse.json(
        { error: 'Failed to fetch lab requests' },
        { status: 500 }
      )
    }

    console.log('✅ Lab requests fetched successfully');
    console.log('📊 Lab request count:', labRequests?.length || 0);

    return NextResponse.json({ labRequests }, { status: 200 })
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
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      test_type: data.test_type,
      hasReason: !!data.reason
    });

    const { patient_id, doctor_id, test_type, reason } = data

    // Validate required fields
    console.log('✅ Validating required fields...');
    if (!patient_id || !test_type || !doctor_id) {
      console.error('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: patient_id, doctor_id, test_type' },
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

    // Insert lab request
    console.log('💾 Preparing to insert lab request into database...');
    const labRequestData = {
      patient_id,
      nurse_id: userData.id,
      doctor_id,
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
      .select()
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

