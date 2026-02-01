import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📝 PUT /api/appointments/[id] - Updating appointment started');
    
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

    // Only nurses and doctors can update appointments
    console.log('🔒 Checking user role permissions...');
    if (!['nurse', 'doctor'].includes(userData.role)) {
      console.error('❌ Permission denied: User role is', userData.role);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    console.log('✅ User is authorized to update appointments');

    const body = await request.json()
    console.log('📦 Update data received:', body);
    const { status, is_referred, is_lab_requested } = body

    // Validate status
    if (status && !['pending', 'diagnosed'].includes(status)) {
      console.error('❌ Validation failed: Invalid status:', status);
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update appointment
    console.log('💾 Updating appointment...');
    const supabase = createServiceRoleClient()
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        ...(status && { status }),
        ...(is_referred !== undefined && { is_referred }),
        ...(is_lab_requested !== undefined && { is_lab_requested }),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating appointment:', error);
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
    }

    if (!appointment) {
      console.error('❌ Appointment not found:', params.id);
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    console.log('🎉 Appointment updated successfully!');
    console.log('✅ Updated appointment:', { id: appointment.id, status: appointment.status });

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('💥 Unexpected error in PUT /api/appointments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ DELETE /api/appointments/[id] - Deleting appointment started');
    
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

    // Only nurses and doctors can delete appointments
    console.log('🔒 Checking user role permissions...');
    if (!['nurse', 'doctor'].includes(userData.role)) {
      console.error('❌ Permission denied: User role is', userData.role);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    console.log('✅ User is authorized to delete appointments');

    // First, verify appointment exists
    console.log('🔍 Verifying appointment exists...');
    const supabase = createServiceRoleClient()
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !appointment) {
      console.error('❌ Appointment not found:', fetchError);
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    console.log('✅ Appointment verified:', { id: appointment.id });

    // Delete appointment (cascade delete will handle related records)
    console.log('🗑️ Deleting appointment...');
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('❌ Error deleting appointment:', deleteError);
      return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 })
    }

    console.log('🎉 Appointment deleted successfully!');

    return NextResponse.json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('💥 Unexpected error in DELETE /api/appointments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
