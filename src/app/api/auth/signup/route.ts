import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'

export async function POST(request: NextRequest) {
    try{
        console.log('📝 Signup request received');
        const data = await request.json();
        console.log('📦 Request data:', { 
            email: data.email, 
            hasPassword: !!data.password,
            first_name: data.first_name,
            last_name: data.last_name,
            role: data.role
        });

        const { email, password, first_name, last_name, role } = data;
        
        // Use server client for auth signup
        const supabaseServer = await createClient();
        console.log('🔐 Attempting to create user in Supabase Auth...');
        const { data: signUpData, error: signUpError } = await supabaseServer.auth.signUp({
            email, 
            password, 
        });

        if(signUpError) {
            console.error('❌ Supabase Auth signup error:', signUpError);
            
            // Check if user already exists
            if (signUpError.code === 'user_already_exists' || signUpError.message?.includes('already registered')) {
                console.log('🔍 User already exists in Auth, getting user ID and checking users table...');
                
                // First, get the user from Auth by signing in to get their user_id
                console.log('🔐 Attempting to sign in to get user ID...');
                const { data: signInData, error: signInError } = await supabaseServer.auth.signInWithPassword({
                    email,
                    password,
                });
                
                if (signInError || !signInData.user) {
                    console.error('❌ Could not sign in to get user ID:', signInError);
                    return NextResponse.json(
                        { error: 'User exists in Auth but password is incorrect. Please log in with your existing password.' },
                        { status: 409 }
                    );
                }
                
                const auth_user_id = signInData.user.id;
                const auth_email = signInData.user.email || email;
                
                console.log('✅ Got user ID from Auth:', { user_id: auth_user_id, email: auth_email });
                
                // Check if user exists in users table using the auth user_id
                const supabaseServiceRole = createServiceRoleClient();
                const { data: existingUser, error: checkError } = await supabaseServiceRole
                    .from('users')
                    .select('id, email, user_id')
                    .eq('user_id', auth_user_id)
                    .single();
                
                if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
                    console.error('❌ Error checking users table:', checkError);
                    return NextResponse.json(
                        { error: 'Error checking user existence' },
                        { status: 500 }
                    );
                }
                
                if (existingUser) {
                    console.log('✅ User exists in both Auth and users table');
                    return NextResponse.json(
                        { error: 'User already exists. Please log in instead.' },
                        { status: 409 } // 409 Conflict
                    );
                } else {
                    console.log('⚠️ User exists in Auth but not in users table - attempting to recover...');
                    
                    console.log('💾 Inserting user data into users table to fix inconsistent state...', {
                        user_id: auth_user_id,
                        email: auth_email,
                        first_name,
                        last_name,
                        role
                    });
                    
                    // Insert user into users table
                    const { error: insertError } = await supabaseServiceRole
                        .from('users')
                        .insert({
                            user_id: auth_user_id,
                            email: auth_email,
                            first_name,
                            last_name,
                            role,
                        });
                    
                    if (insertError) {
                        console.error('❌ Error inserting user into users table:', insertError);
                        // Check if it's a duplicate key error (race condition)
                        if (insertError.code === '23505') {
                            console.log('⚠️ User was inserted by another request, returning success');
                            return NextResponse.json(
                                { message: 'Sign up successful', user: signInData.user },
                                { status: 201 }
                            );
                        }
                        return NextResponse.json(
                            { error: insertError.message },
                            { status: 500 }
                        );
                    }
                    
                    console.log('🎉 User successfully added to users table! User ID:', auth_user_id);
                    return NextResponse.json(
                        { message: 'Sign up successful', user: signInData.user },
                        { status: 201 }
                    );
                }
            }
            
            // For other errors, return the original error message
            return NextResponse.json(
                { error: signUpError.message },
                { status: 500 }
            );
        }

        console.log('✅ User created in Auth:', { userId: signUpData.user?.id, email: signUpData.user?.email });

        if (!signUpData.user) {
            console.error('❌ User creation failed - no user object returned');
            return NextResponse.json({error: 'User creation failed'}, {status: 500})
        }

        const auth_user_id = signUpData.user.id;
        const email_address = signUpData.user.email;

        console.log('💾 Inserting user data into users table...', {
            user_id: auth_user_id,
            email: email_address,
            first_name,
            last_name,
            role
        });

        // Use service role client for database insert (bypasses RLS)
        const supabaseServiceRole = createServiceRoleClient();
        const { error: insertError } = await supabaseServiceRole
            .from('users')
            .insert({
                user_id: auth_user_id,
                email: email_address,
                first_name,
                last_name,
                role,
            });

        if (insertError) {
            console.error('❌ Database insert error:', insertError);
            return NextResponse.json(
                { error: insertError.message },
                { status: 500 }
            );
        }

        console.log('🎉 Signup successful! User ID:', auth_user_id);
        return NextResponse.json(
            { message: 'Sign up successful', user: signUpData.user },
            { status: 201 }
        );
    } catch (error) {
        console.error('💥 Unexpected error in signup route:', error);
        return NextResponse.json(
            { error: 'Failed to sign up' },
            { status: 500 }
        );
    }
}