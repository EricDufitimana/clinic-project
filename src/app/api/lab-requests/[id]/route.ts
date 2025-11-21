import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔄 PATCH /api/lab-requests/[id] - Update lab request started');
    console.log('📋 Request ID:', id);
    
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

    // Only doctors can submit results
    console.log('🔒 Checking user role...');
    if (userData.role !== 'doctor') {
      console.error('❌ Permission denied: User is not a doctor. Role:', userData.role);
      return NextResponse.json(
        { error: 'Only doctors can submit test results' },
        { status: 403 }
      )
    }

    console.log('✅ User is authorized as doctor');

    console.log('📦 Parsing request body...');
    const data = await request.json()
    const { result: testResult, status } = data
    console.log('📋 Update data received:', { hasResult: !!testResult, status });

    // Validate required fields
    if (!testResult || !status) {
      console.error('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: result, status' },
        { status: 400 }
      )
    }

    // Verify the lab request exists and is assigned to this doctor
    const supabase = createServiceRoleClient()
    console.log('🔍 Verifying lab request ownership...');
    
    const { data: labRequest, error: fetchError } = await supabase
      .from('lab_requests')
      .select('id, doctor_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !labRequest) {
      console.error('❌ Lab request not found:', fetchError);
      return NextResponse.json(
        { error: 'Lab request not found' },
        { status: 404 }
      )
    }

    console.log('📊 Lab request found:', { 
      id: labRequest.id, 
      doctor_id: labRequest.doctor_id,
      current_status: labRequest.status 
    });

    // Check if the doctor is assigned to this request
    if (labRequest.doctor_id !== userData.id) {
      console.error('❌ Permission denied: Doctor not assigned to this request');
      return NextResponse.json(
        { error: 'You are not assigned to this lab request' },
        { status: 403 }
      )
    }

    console.log('✅ Doctor is assigned to this request');

    // Update the lab request
    console.log('💾 Updating lab request...');
    const { data: updatedRequest, error: updateError } = await supabase
      .from('lab_requests')
      .update({
        result: testResult,
        status: status,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating lab request:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    console.log('🎉 Lab request updated successfully!');
    console.log('✅ Updated request:', { 
      id: updatedRequest.id, 
      status: updatedRequest.status,
      hasResult: !!updatedRequest.result 
    });

    return NextResponse.json(
      { message: 'Test result submitted successfully', labRequest: updatedRequest },
      { status: 200 }
    )
  } catch (error) {
    console.error('💥 Unexpected error in PATCH /api/lab-requests/[id]:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to submit result' },
      { status: 500 }
    )
  }
}

