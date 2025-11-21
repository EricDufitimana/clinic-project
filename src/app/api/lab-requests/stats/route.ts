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

    // Only nurses and doctors can view lab request stats
    if (userData.role !== 'nurse' && userData.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get total lab requests count
    const { count: totalRequests, error: totalError } = await supabase
      .from('lab_requests')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error fetching total lab requests:', totalError)
    }

    // Get completed lab requests count (all time)
    const { count: completed, error: completedError } = await supabase
      .from('lab_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    if (completedError) {
      console.error('Error fetching completed lab requests:', completedError)
    }

    // Get pending lab requests count
    const { count: pending, error: pendingError } = await supabase
      .from('lab_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (pendingError) {
      console.error('Error fetching pending lab requests:', pendingError)
    }

    // Get completed lab requests today
    // Check for requests that were completed today (status = completed and updated_at is today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()
    const tomorrowISO = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()

    // First, try to get completed requests that were updated today
    const { data: completedTodayData, error: completedTodayError } = await supabase
      .from('lab_requests')
      .select('id, status, updated_at')
      .eq('status', 'completed')
      .gte('updated_at', todayISO)
      .lt('updated_at', tomorrowISO)

    if (completedTodayError) {
      console.error('Error fetching completed lab requests today:', completedTodayError)
    }

    // If no updated_at field or it doesn't work, fallback to checking created_at for completed requests
    // This is a fallback in case updated_at doesn't exist or isn't reliable
    let completedToday = completedTodayData?.length || 0
    
    // If we got 0 from updated_at, try created_at as fallback
    if (completedToday === 0) {
      const { count: completedTodayCount, error: completedTodayFallbackError } = await supabase
        .from('lab_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', todayISO)
        .lt('created_at', tomorrowISO)

      if (!completedTodayFallbackError && completedTodayCount) {
        completedToday = completedTodayCount
      }
    }

    // Calculate completion rate percentage
    const completionRate = totalRequests && totalRequests > 0
      ? Math.round((completed || 0) / totalRequests * 100)
      : 0

    // Calculate percentage change for completed today (compared to yesterday)
    // For simplicity, we'll calculate based on recent trend
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayISO = yesterday.toISOString()
    const dayBeforeISO = new Date(yesterday.getTime() - 24 * 60 * 60 * 1000).toISOString()

    const { data: completedYesterdayData, error: yesterdayError } = await supabase
      .from('lab_requests')
      .select('id, status, updated_at')
      .eq('status', 'completed')
      .gte('updated_at', yesterdayISO)
      .lt('updated_at', todayISO)

    const completedYesterday = completedYesterdayData?.length || 0

    // Calculate percentage change
    let completedTodayChange = '0%'
    if (completedYesterday > 0) {
      const change = ((completedToday - completedYesterday) / completedYesterday) * 100
      completedTodayChange = change > 0 ? `+${Math.round(change)}%` : `${Math.round(change)}%`
    } else if (completedToday > 0) {
      completedTodayChange = '+100%'
    }

    const stats = {
      totalRequests: totalRequests || 0,
      completed: completed || 0,
      pending: pending || 0,
      completedToday: completedToday,
      completionRate: completionRate,
      completedTodayChange: completedTodayChange,
    }

    return NextResponse.json({ stats }, { status: 200 })
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/lab-requests/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

