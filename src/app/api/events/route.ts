import { NextRequest, NextResponse } from "next/server";
import db from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import AuditLogger from "@/lib/audit-logger";

export async function GET(request: NextRequest) {
  try {
    // Check both JWT and NextAuth authentication
    let userId: string | null = null;
    let userRole = 'student';
    
    // First try NextAuth session (for OAuth users)
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user?.email) {
      try {
        const userResult = await db.query(
          'SELECT id, role FROM users WHERE email = $1',
          [nextAuthSession.user.email]
        );
        if (userResult.rows.length > 0) {
          userId = userResult.rows[0].id;
          userRole = userResult.rows[0].role;
        }
      } catch (error) {
        console.error('Error fetching user from NextAuth session:', error);
      }
    }
    
    // If no NextAuth session, try JWT authentication
    if (!userId) {
      const authResult = await verifyAuth(request);
      if (authResult.success && authResult.user) {
        userId = authResult.user.id;
        userRole = authResult.user.role;
      }
    }
    
    // Allow public access to events for now - remove authentication requirement
    console.log('📅 Fetching events - User ID:', userId || 'anonymous');

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const clubId = searchParams.get("clubId");
    
    // Parse limit if present
    const limit = limitParam ? parseInt(limitParam) : undefined;

    try {
      let events;
      
      if (clubId) {
        console.log('📅 Fetching events for club:', clubId);
        const result = await db.query(
          `SELECT e.*, c.name as club_name 
           FROM events e 
           LEFT JOIN clubs c ON e.club_id = c.id 
           WHERE e.club_id = $1 
           ORDER BY e.event_date ASC`,
          [clubId]
        );
        events = result.rows;
      } else {
        console.log('📅 Fetching all events');
        const result = await db.query(
          `SELECT e.*, c.name as club_name 
           FROM events e 
           LEFT JOIN clubs c ON e.club_id = c.id 
           ORDER BY e.event_date ASC`
        );
        events = result.rows;
      }

      // Apply limit if specified
      if (limit && events.length > limit) {
        events = events.slice(0, limit);
      }

      console.log('✅ Found', events.length, 'events');
      
      return NextResponse.json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (dbError) {
      console.error("Database Error:", dbError instanceof Error ? dbError.message : "Unknown database error");
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify who is making the request
    const authResult = await verifyAuth(request);

    if (!authResult.success) {
    return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
    );
    }

    const userId = authResult.user!.id;
    const userRole = authResult.user!.role;

    // 2. Check Permissions: Allow 'media' and 'media_head' roles alongside others
    const allowedRoles = ["admin", "coordinator", "co_coordinator", "secretary", "media", "media_head"];
    if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
        { error: "Forbidden: You do not have permission to create events" },
        { status: 403 }
    );
    }

    const body = await request.json();
    // 3. Destructure the incoming data - notice we now accept event_time and gallery_images
    const {
      title,
      description,
      event_date,
      event_time, // NEW: Time is separate from date in your DB
      location,
      club_id,
      max_attendees,
      status,
      image_url,
      banner_image_url,
      gallery_images // NEW: Array of image URLs
    } = body;

    // 4. Validate that we have the bare minimum data for the DB constraints (NOT NULL columns)
    if (!title || !event_date || !event_time || !location || !club_id) {
    return NextResponse.json(
        { error: "Missing required fields: title, event_date, event_time, location, and club_id are required" },
        { status: 400 }
    );
    }

    // 5. Logic Check: Ensure users can only post for their own club (unless Admin)
    if (userRole !== "admin") {
    const userResult = await db.query('SELECT club_id FROM users WHERE id = $1', [userId]);
    const userClubId = userResult.rows[0]?.club_id
    if (userClubId !== club_id) {
        return NextResponse.json(
        { error: "Forbidden: You can only create events for your own club" },
        { status: 403 }
        );
    }
    }

    try {
      const eventId = require('crypto').randomUUID();

      // 6. The SQL Query: This is the critical part that maps to your 'events' table
      const result = await db.query(`
          INSERT INTO events (
          id, title, description, event_date, event_time, location, club_id, created_by,
          max_attendees, status, image_url, banner_image_url, gallery_images,
          created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
          RETURNING *
      `, [
          eventId,
          title,
          description || '',
          event_date,
          event_time,
          location,
          club_id,
          userId,
          max_attendees || null,
          status || 'upcoming',
          image_url || null,
          banner_image_url || null,
          // PostgreSQL JSONB needs a stringified JSON array
          gallery_images ? (Array.isArray(gallery_images) ? JSON.stringify(gallery_images) : gallery_images) : '[]'
      ]);

      console.log('✅ Event created successfully:', result.rows[0].id);

      // 7. Audit Logging (Keep existing logging pattern)
      await AuditLogger.logEventAction(
        'create',
        eventId,
        userId,
        undefined,
        {
          title, description, event_date, event_time, location, club_id,
          max_attendees, status: status || 'upcoming',
          image_url, banner_image_url, gallery_images
        },
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        request.headers.get('user-agent') || undefined
      );
   
      return NextResponse.json({
        success: true,
        data: result.rows[0]
      });
    } catch (dbError) {
      console.error("Database Error:", dbError instanceof Error ? dbError.message : "Unknown database error");
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
