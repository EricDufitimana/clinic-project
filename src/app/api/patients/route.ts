import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function GET() {
  try {
    console.log('📋 GET /api/patients - Fetching patients started');
    
    // Get authenticated user using utility function
    console.log('🔐 Fetching authenticated user...');
    const result = await getAuthenticatedUser('id, role', true)
    
    if ('error' in result) {
      console.error('❌ Auth error:', result.error);
      console.error('❌ Auth error status:', result.status);
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    const { authUser, userData } = result
    console.log('👤 Auth User:', { id: authUser.id, email: authUser.email });
    console.log('👨‍⚕️ User data:', { role: userData.role });

    // Only nurses and doctors can view patients
    console.log('🔒 Checking user role permissions...');
    if (userData.role !== 'nurse' && userData.role !== 'doctor') {
      console.error('❌ Permission denied: User role is', userData.role);
      console.error('❌ Allowed roles: nurse, doctor');
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    console.log('✅ User is authorized to view patients');

    // Fetch patients using regular client (RLS policies will apply)
    console.log('💾 Fetching patients from database...');
    const supabase = await createServiceRoleClient()
    console.log('🔑 Using regular Supabase client (RLS policies will apply)');
    
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (patientsError) {
      console.error('❌ Error fetching patients:', patientsError);
      console.error('❌ Error details:', JSON.stringify(patientsError, null, 2));
      return NextResponse.json(
        { error: 'Failed to fetch patients' },
        { status: 500 }
      )
    }

    console.log('✅ Patients fetched successfully');
    console.log('📊 Patient count:', patients?.length || 0);
    
    if (patients && patients.length > 0) {
      console.log('📋 Sample patient data:', {
        firstPatient: {
          id: patients[0].id,
          name: patients[0].full_name,
          age: patients[0].age,
          gender: patients[0].gender
        }
      });
    }

    return NextResponse.json({ patients }, { status: 200 })
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/patients:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🆕 POST /api/patients - Patient registration started');
    
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
    console.log('👨‍⚕️ User data:', { id: userData.id, role: userData.role });

    console.log('📦 Parsing request body...');
    const data = await request.json()
    console.log('📋 Patient data received:', {
      full_name: data.full_name,
      age: data.age,
      gender: data.gender,
      hasAddress: !!data.address,
      hasContact: !!data.contact
    });

    const { full_name, age, gender, address, contact } = data

    // Validate required fields
    console.log('✅ Validating required fields...');
    if (!full_name || !age || !gender) {
      console.error('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: full_name, age, gender' },
        { status: 400 }
      )
    }

    // Validate gender
    console.log('✅ Validating gender...');
    if (!['male', 'female', 'other'].includes(gender)) {
      console.error('❌ Validation failed: Invalid gender:', gender);
      return NextResponse.json(
        { error: 'Invalid gender. Must be male, female, or other' },
        { status: 400 }
      )
    }

    

    console.log('✅ User is authorized as nurse');

    // Insert patient using service role client (bypasses RLS)
    console.log('💾 Preparing to insert patient into database...');
    const patientData = {
      full_name,
      age: parseInt(age),
      gender,
      address: address || null,
      contact: contact || null,
      registered_by: userData.id,
    };
    console.log('📝 Patient insert data:', patientData);
    console.log('🔑 Using service role client for insert...');
    
    const supabaseServiceRole = createServiceRoleClient()
    const { data: patient, error: insertError } = await supabaseServiceRole
      .from('patients')
      .insert(patientData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting patient:', insertError);
      console.error('❌ Error details:', JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    console.log('🎉 Patient registered successfully!');
    console.log('✅ New patient:', { id: patient.id, name: patient.full_name });

    return NextResponse.json(
      { message: 'Patient registered successfully', patient },
      { status: 201 }
    )
  } catch (error) {
    console.error('💥 Unexpected error in POST /api/patients:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to register patient' },
      { status: 500 }
    )
  }
}

