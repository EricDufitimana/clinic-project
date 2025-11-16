import { createClient } from '@/utils/supabase/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { User } from '@supabase/supabase-js'

export interface AuthenticatedUserResult {
  authUser: User
  userData: {
    id: string
    role: 'doctor' | 'nurse'
  }
}

export interface AuthenticatedUserError {
  error: string
  status: number
}

/**
 * Gets the authenticated user and their database record
 * @param selectFields - Fields to select from users table (default: 'id, role')
 * @param useServiceRole - Whether to use service role client (default: false)
 * @returns User data or error response
 */
export async function getAuthenticatedUser(
  selectFields: string = 'id, role',
  useServiceRole: boolean = false
): Promise<AuthenticatedUserResult | AuthenticatedUserError> {
  try {
    const supabase = await createClient()
    
    // Get the current authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return {
        error: 'Unauthorized',
        status: 401
      }
    }

    // Fetch user data from database
    const client = useServiceRole ? createServiceRoleClient() : supabase
    const { data: userData, error: userError } = await client
      .from('users')
      .select(selectFields)
      .eq('user_id', authUser.id)
      .single()

    if (userError || !userData) {
      return {
        error: 'User not found',
        status: 404
      }
    }

    // Type guard to ensure userData has the required fields
    if (!('id' in userData) || !('role' in userData)) {
      return {
        error: 'Invalid user data structure',
        status: 500
      }
    }

    return {
      authUser,
      userData: {
        id: userData.id as string,
        role: userData.role as 'doctor' | 'nurse'
      }
    }
  } catch (error) {
    console.error('Error in getAuthenticatedUser:', error)
    return {
      error: 'Internal server error',
      status: 500
    }
  }
}

