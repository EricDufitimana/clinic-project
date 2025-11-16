import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Login request received');
    const data = await request.json();
    console.log('📦 Request data:', { 
      email: data.email, 
      hasPassword: !!data.password
    });

    const { email, password } = data;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use server client for auth login
    const supabase = await createClient();
    console.log('🔐 Attempting to sign in user...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('❌ Supabase Auth login error:', signInError);
      return NextResponse.json(
        { error: signInError.message },
        { status: 401 }
      );
    }

    console.log('✅ User signed in:', { userId: signInData.user?.id, email: signInData.user?.email });

    if (!signInData.user) {
      console.error('❌ Login failed - no user object returned');
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 401 }
      );
    }

    // Fetch user data from users table to return role and name
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email, role')
      .eq('user_id', signInData.user.id)
      .single();

    if (userError) {
      console.error('⚠️ Error fetching user data:', userError);
      // Still return success even if we can't fetch user data
      return NextResponse.json(
        { message: 'Login successful', user: signInData.user },
        { status: 200 }
      );
    }

    console.log('🎉 Login successful! User ID:', signInData.user.id);
    return NextResponse.json(
      { 
        message: 'Login successful', 
        user: signInData.user,
        userData: userData
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('💥 Unexpected error in login route:', error);
    return NextResponse.json(
      { error: 'Failed to log in' },
      { status: 500 }
    );
  }
}

