import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function GET() {
  try {
    console.log('📋 GET /api/doctor-reports - Fetching doctor reports started');
    
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

    // Only doctors can view doctor reports
    if (userData.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch doctor reports with related patient, doctor, and appointment data
    const supabase = createServiceRoleClient()
    
    const { data: doctorReports, error: fetchError } = await supabase
      .from('doctor_reports')
      .select(`
        *,
        appointment:appointments!doctor_reports_appointment_id_fkey (
          id,
          created_at,
          status,
          is_referred,
          is_lab_requested,
          patient:patients!appointments_patient_id_fkey (
            id,
            full_name,
            contact,
            age,
            gender
          )
        ),
        doctor:users!doctor_reports_doctor_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching doctor reports:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch doctor reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({ doctorReports }, { status: 200 })
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/doctor-reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🆕 POST /api/doctor-reports - Doctor report creation started');
    
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
    const { appointment_id, diagnosis, prescription, notes } = data

    // Validate required fields
    if (!appointment_id || !diagnosis) {
      return NextResponse.json(
        { error: 'Missing required fields: appointment_id, diagnosis' },
        { status: 400 }
      )
    }

    // Only doctors can create doctor reports
    if (userData.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can create doctor reports' },
        { status: 403 }
      )
    }

    // Verify appointment exists and get patient_id
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

    // Insert doctor report linked to appointment
    const doctorReportData = {
      appointment_id: parseInt(appointment_id),
      doctor_id: userData.id,
      diagnosis,
      prescription,
      notes: notes || null,
    };

    const { data: doctorReport, error: insertError } = await supabase
      .from('doctor_reports')
      .insert(doctorReportData)
      .select(`
        *,
        appointment:appointments!doctor_reports_appointment_id_fkey (
          id,
          created_at,
          status,
          is_referred,
          is_lab_requested,
          patient:patients!appointments_patient_id_fkey (
            id,
            full_name,
            contact,
            age,
            gender
          )
        ),
        doctor:users!doctor_reports_doctor_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .single()

    if (insertError) {
      console.error('❌ Error inserting doctor report:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    console.log('🎉 Doctor report created successfully!');

    return NextResponse.json(
      { message: 'Doctor report created successfully', doctorReport },
      { status: 201 }
    )
  } catch (error) {
    console.error('💥 Unexpected error in POST /api/doctor-reports:', error);
    return NextResponse.json(
      { error: 'Failed to create doctor report' },
      { status: 500 }
    )
  }
}
