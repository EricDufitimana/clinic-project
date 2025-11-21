import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { getAuthenticatedUser } from '@/utils/auth/get-authenticated-user'

export async function GET() {
  try {
    // Get authenticated user
    const result = await getAuthenticatedUser('id, role', true)
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    const { userData } = result

    // Only doctors can view medical description stats
    if (userData.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get total medical descriptions count
    const { count: totalRecords, error: totalError } = await supabase
      .from('medical_descriptions')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error fetching total medical descriptions:', totalError)
    }

    // Get medical descriptions created this week
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoISO = weekAgo.toISOString()

    const { count: thisWeek, error: weekError } = await supabase
      .from('medical_descriptions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgoISO)

    if (weekError) {
      console.error('Error fetching this week medical descriptions:', weekError)
    }

    const stats = {
      totalRecords: totalRecords || 0,
      thisWeek: thisWeek || 0,
    }

    return NextResponse.json({ stats }, { status: 200 })
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/medical-descriptions/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

