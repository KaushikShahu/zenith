import { NextResponse } from "next/server";
import { db, executeRawSQL, queryRawSQL } from '@/lib/database';

// GET /api/home/stats - Get dashboard statistics
export async function GET() {
  try {
    // Get overall statistics in a single optimized query
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM clubs) as total_clubs,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM events WHERE event_date < CURRENT_DATE) as events_conducted,
        (SELECT COUNT(*) FROM events
          WHERE event_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
          AND event_date < date_trunc('month', CURRENT_DATE)) as monthly_events,
        (SELECT COUNT(*) FROM posts) as total_posts
    `;
    const statsResult = await queryRawSQL(statsQuery);

    // Get club statistics with member counts
    const clubStatsResult = await queryRawSQL(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.description,
        c.color,
        c.icon,
        COUNT(u.id)::INTEGER as member_count,
        COUNT(CASE WHEN e.event_date >= CURRENT_DATE THEN 1 END)::INTEGER as upcoming_events
      FROM clubs c
      LEFT JOIN users u ON c.id = u.club_id
      LEFT JOIN events e ON c.id = e.club_id
      GROUP BY c.id, c.name, c.type, c.description, c.color, c.icon
      ORDER BY member_count DESC
    `);

    // Get upcoming events with club information (limited to 6)
    const upcomingEventsResult = await queryRawSQL(`
      SELECT 
        e.*,
        c.name as club_name,
        c.color as club_color,
        u.name as organizer_name,
        uc.name as organizer_club_name,
        uc.color as organizer_club_color
      FROM events e
      LEFT JOIN clubs c ON e.club_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN clubs uc ON u.club_id = uc.id
      WHERE e.event_date >= CURRENT_DATE
      ORDER BY e.event_date ASC, e.event_time ASC
      LIMIT 6
    `);

    // Get past events with club information (limited to 3, no attendee count)
    const pastEventsResult = await queryRawSQL(`
      SELECT 
        e.*,
        c.name as club_name,
        c.color as club_color,
        u.name as organizer_name,
        uc.name as organizer_club_name,
        uc.color as organizer_club_color
      FROM events e
      LEFT JOIN clubs c ON e.club_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN clubs uc ON u.club_id = uc.id
      WHERE e.event_date < CURRENT_DATE
      ORDER BY e.event_date DESC, e.event_time DESC
      LIMIT 3
    `);

    // Get recent posts with author and club info
    const recentPostsResult = await queryRawSQL(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.created_at,
        p.tags,
        p.club_id,
        c.name as club_name,
        c.color as club_color,
        u.name as author_name,
        u.avatar as author_avatar,
        uc.name as author_club_name,
        uc.color as author_club_color
      FROM posts p
      LEFT JOIN clubs c ON p.club_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN clubs uc ON u.club_id = uc.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT 4
    `);

    // Get leadership team from committee structure (proper leadership)
    const leadershipResult = await queryRawSQL(`
      SELECT 
        cr.name as position,
        u.name,
        COALESCE(u.avatar, u.profile_image_url) as photo,
        u.email,
        u.role,
        cm.status,
        c.name as committee_name,
        cr.hierarchy
      FROM committees c
      JOIN committee_roles cr ON c.id = cr.committee_id
      JOIN committee_members cm ON cr.id = cm.role_id
      JOIN users u ON cm.user_id = u.id
      WHERE c.name = 'Student Executive Committee' 
        AND cm.status = 'active'
        AND cr.name IN ('President', 'Vice President', 'Secretary', 'Treasurer', 'Innovation Head', 'Media Head')
      ORDER BY cr.hierarchy
    `);

    // Format leadership data - map committee roles to expected leadership roles
    const getLeaderByPosition = (position: string) => {
      const member = leadershipResult.rows.find(m => m.position === position);
      return member ? { name: member.name, photo: member.photo, email: member.email } : null;
    };
    
    const leadership = leadershipResult.rows.length > 0 ? {
      coordinator: getLeaderByPosition('President'),
      coCoordinator: getLeaderByPosition('Vice President'),
      secretary: getLeaderByPosition('Secretary'),
      treasurer: getLeaderByPosition('Treasurer'),
      innovationHead: getLeaderByPosition('Innovation Head'),
      media: getLeaderByPosition('Media Head'),
    } : null;

    const stats = {
      totalClubs: parseInt(statsResult.rows[0].total_clubs),
      totalMembers: parseInt(statsResult.rows[0].total_users),
      eventsConducted: parseInt(statsResult.rows[0].events_conducted),
      monthlyEvents: parseInt(statsResult.rows[0].monthly_events),
      totalPosts: parseInt(statsResult.rows[0].total_posts),
    };

    return NextResponse.json({
      success: true,
      stats,
      clubs: clubStatsResult.rows,
      upcomingEvents: upcomingEventsResult.rows,
      pastEvents: pastEventsResult.rows,
      recentPosts: recentPostsResult.rows,
      leadership,
    });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to fetch home statistics" },
      { status: 500 }
    );
  }
}
