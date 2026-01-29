import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import AuditLogger from "@/lib/audit-logger";
import { verifyAuth } from "@/lib/auth-unified";

interface Props {
  params: { id: string };
}

// GET /api/events/[id] - Get single event
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    
    // Check auth but don't enforce it for GET (public view)
    const authResult = await verifyAuth(request);
    const userId = authResult.success && authResult.user ? authResult.user.id : null;

    const query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.event_date,
        e.event_time as "startTime",
        e.location,
        e.club_id as "clubId",
        e.created_by as "createdBy",
        e.max_attendees as "maxAttendees",
        e.status,
        e.image_url as "imageUrl",
        e.banner_image_url,
        e.gallery_images,
        c.name as "clubName",
        c.color as "clubColor",
        u.name as "organizer",
        COALESCE(attendee_count.count, 0) as "attendeeCount",
        CASE WHEN $1::uuid IS NOT NULL AND user_attending.user_id IS NOT NULL THEN true ELSE false END as "isAttending"
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      JOIN users u ON e.created_by = u.id
      LEFT JOIN (
        SELECT event_id, COUNT(*) as count
        FROM event_attendees
        GROUP BY event_id
      ) attendee_count ON e.id = attendee_count.event_id
      LEFT JOIN event_attendees user_attending ON e.id = user_attending.event_id AND user_attending.user_id = $1::uuid
      WHERE e.id = $2
    `;

    const result = await db.query(query, [userId, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Get the attendees for the event
    const attendeesResult = await db.query(
      `SELECT 
        u.id, 
        u.name, 
        u.avatar as "profileImage",
        u.role
      FROM event_attendees ea
      JOIN users u ON ea.user_id = u.id
      WHERE ea.event_id = $1
      ORDER BY u.name`,
      [id]
    );
    
    const event = result.rows[0];
    event.attendees = attendeesResult.rows;
    
    return NextResponse.json(event);
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update event (only by organizer or managers)
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    const { id } = await params;

    // 1. Check Permissions: Include media and media_head
    const userResult = await db.query('SELECT role, club_id FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];
    const userRole = user.role;
    const userClubId = user.club_id;

    const allowedRoles = ["coordinator", "co_coordinator", "secretary", "media", "media_head", "admin"];

    if (!allowedRoles.includes(userRole)) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // 2. Fetch the existing event to compare changes
    const eventCheckResult = await db.query('SELECT * FROM events WHERE id = $1', [id]);

    if (eventCheckResult.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = eventCheckResult.rows[0];

    // 3. Logic Check: Ensure users only edit events for their club (unless Admin)
    if (userRole !== "admin" && event.club_id !== userClubId) {
      return NextResponse.json(
          { error: "You can only update events for your club" },
          { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      event_date,
      event_time, // Match the POST logic
      location,
      max_attendees,
      status,
      image_url,
      banner_image_url,
      gallery_images
    } = body;

    // 4. Validate required fields
    if (!title || !event_date || !event_time || !location) {
      return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
      );
    }

    // 5. The UPDATE SQL Query: Updating all relevant columns
    const updateQuery = `
      UPDATE events SET
        title = $1,
        description = $2,
        event_date = $3,
        event_time = $4,
        location = $5,
        max_attendees = $6,
        status = $7,
        image_url = $8,
        banner_image_url = $9,
        gallery_images = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      `;

    await db.query(updateQuery, [
      title,
      description,
      event_date,
      event_time,
      location,
      max_attendees || null,
      status || event.status,
      image_url || event.image_url,
      banner_image_url || event.banner_image_url,
      gallery_images ? (Array.isArray(gallery_images) ? JSON.stringify(gallery_images) : gallery_images) : '[]',
      id
    ]);

    // 6. Log the change for audit purposes
    await AuditLogger.logEventAction(
      'update',
      id,
      userId,
      {
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        event_time: event.event_time,
        location: event.location,
        max_attendees: event.max_attendees,
        status: event.status,
        image_url: event.image_url,
        gallery_images: event.gallery_images
      },
      {
        title,
        description,
        event_date,
        event_time,
        location,
        max_attendees,
        status,
        image_url,
        gallery_images
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );
   
    return NextResponse.json({ id, success: true }, { status: 200 });
  } catch (error) {
      console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    const { id } = await params;
    
    // Check if user has permission to delete events
    const userResult = await db.query(
      `SELECT role, club_id FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userRole = userResult.rows[0].role;
    const userClubId = userResult.rows[0].club_id;
    
    const allowedRoles = ["coordinator", "co_coordinator", "secretary", "president", "vice_president", "admin", "media", "media_head"];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    
    // Check if the event exists and belongs to the user's club
    const eventCheck = await db.query(
      `SELECT * FROM events WHERE id = $1`,
      [id]
    );
    
    if (eventCheck.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    const event = eventCheck.rows[0];
    
    // For admin role, they can delete any club's events
    if (userRole !== "admin" && event.club_id !== userClubId) {
      return NextResponse.json(
        { error: "You can only delete events for your club" },
        { status: 403 }
      );
    }
    
    // First, delete from featured_events (to avoid FK constraints)
    await db.query(
      `DELETE FROM featured_events WHERE event_id = $1`,
      [id]
    );

    // Delete from event_registrations
    await db.query(
      `DELETE FROM event_registrations WHERE event_id = $1`,
      [id]
    );

    // Then, delete all attendees
    await db.query(
      `DELETE FROM event_attendees WHERE event_id = $1`,
      [id]
    );
    
    // Finally, delete the event
    await db.query(
      `DELETE FROM events WHERE id = $1`,
      [id]
    );

    // Log audit event for event deletion
    await AuditLogger.logEventAction(
      'delete',
      id,
      userId,
      {
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        event_time: event.event_time,
        location: event.location,
        club_id: event.club_id,
        status: event.status
      },
      undefined, // no new values
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
