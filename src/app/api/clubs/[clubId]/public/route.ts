import { NextRequest, NextResponse } from "next/server";
import db from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;

    // Get public club details (no authentication required)
    const clubQuery = `
      SELECT 
        c.*,
        coord.name as coordinator_name,
        coord.email as coordinator_email,
        coord.avatar as coordinator_avatar,
        coord.profile_image_url as coordinator_profile_image_url,
        co_coord.name as co_coordinator_name,
        co_coord.email as co_coordinator_email,
        co_coord.avatar as co_coordinator_avatar,
        co_coord.profile_image_url as co_coordinator_profile_image_url,
        secretary.name as secretary_name,
        secretary.email as secretary_email,
        secretary.avatar as secretary_avatar,
        secretary.profile_image_url as secretary_profile_image_url,
        media.name as media_name,
        media.email as media_email,
        media.avatar as media_avatar,
        media.profile_image_url as media_profile_image_url
      FROM clubs c
      LEFT JOIN users coord ON c.coordinator_id = coord.id
      LEFT JOIN users co_coord ON c.co_coordinator_id = co_coord.id
      LEFT JOIN users secretary ON c.secretary_id = secretary.id
      LEFT JOIN users media ON c.media_id = media.id
      WHERE c.id = $1
    `;
    
    const clubResult = await db.query(clubQuery, [clubId]);
    
    if (clubResult.rows.length === 0) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const club = clubResult.rows[0];

    // Get public stats and dynamic content
    const [memberCountResult, eventCountResult, postCountResult, upcomingEventsResult, pastEventsResult, recentPostsResult] = await Promise.all([
      // Get club members count
      db.query('SELECT COUNT(*) as count FROM users WHERE club_id = $1', [clubId]),
      
      // Get events count
      db.query('SELECT COUNT(*) as count FROM events WHERE club_id = $1', [clubId]),
      
      // Get posts count
      db.query('SELECT COUNT(*) as count FROM posts WHERE club_id = $1', [clubId]),
      
      // Get upcoming events (future events)
      db.query(`
        SELECT 
          id, title, description, event_date, location, 
          max_attendees, 
          CASE 
            WHEN event_date >= CURRENT_DATE THEN 'upcoming'
            ELSE 'completed'
          END as status,
          banner_image_url,
          created_at
        FROM events 
        WHERE club_id = $1 AND event_date >= CURRENT_DATE
        ORDER BY event_date ASC 
        LIMIT 10
      `, [clubId]),
      
      // Get past events (limited to 3 most recent)
      db.query(`
        SELECT 
          id, title, description, event_date, location, 
          max_attendees, 
          CASE 
            WHEN event_date >= CURRENT_DATE THEN 'upcoming'
            ELSE 'completed'
          END as status,
          banner_image_url,
          gallery_images, created_at
        FROM events 
        WHERE club_id = $1 AND event_date < CURRENT_DATE
        ORDER BY event_date DESC 
        LIMIT 3
      `, [clubId]),
      
      // Get recent posts (limited to 4 most recent)
      db.query(`
        SELECT 
          p.id, p.title, p.excerpt, p.content, p.created_at, p.view_count,
          COALESCE(u.name, 'Anonymous') as author_name,
          u.avatar as author_avatar,
          u.profile_image_url as author_profile_image_url,
          u.role as author_role,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.club_id = $1 AND p.status = 'published'
        ORDER BY p.created_at DESC 
        LIMIT 4
      `, [clubId])
    ]);

    return NextResponse.json({
      club: {
        ...club,
        memberCount: parseInt(memberCountResult.rows[0].count),
        eventCount: parseInt(eventCountResult.rows[0].count),
        postCount: parseInt(postCountResult.rows[0].count),
        coordinator: club.coordinator_name ? {
          name: club.coordinator_name,
          email: club.coordinator_email,
          avatar: club.coordinator_avatar,
          profile_image_url: club.coordinator_profile_image_url
        } : null,
        co_coordinator: club.co_coordinator_name ? {
          name: club.co_coordinator_name,
          email: club.co_coordinator_email,
          avatar: club.co_coordinator_avatar,
          profile_image_url: club.co_coordinator_profile_image_url
        } : null,
        secretary: club.secretary_name ? {
          name: club.secretary_name,
          email: club.secretary_email,
          avatar: club.secretary_avatar,
          profile_image_url: club.secretary_profile_image_url
        } : null,
        media: club.media_name ? {
          name: club.media_name,
          email: club.media_email,
          avatar: club.media_avatar,
          profile_image_url: club.media_profile_image_url
        } : null
      },
      events: upcomingEventsResult.rows,
      pastEvents: pastEventsResult.rows,
      posts: recentPostsResult.rows
    });

  } catch (error) {
    console.error("Public API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to fetch club details" },
      { status: 500 }
    );
  }
}
