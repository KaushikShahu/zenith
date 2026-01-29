'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EventForm from '@/components/events/EventForm';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;
  const eventId = params.id as string;
  
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem('zenith-token');
        const response = await fetch(`/api/events/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized. Please log in.');
          }
          throw new Error('Failed to fetch event data');
        }
        const data = await response.json();
        
        // Map the API response fields to the form fields if they differ
        const mappedData = {
          ...data,
          // API returns startTime, form expects event_time
          event_time: data.startTime || data.event_time,
          // API returns imageUrl, form expects image_url
          image_url: data.imageUrl || data.image_url,
          // API returns maxAttendees, form expects max_attendees
          max_attendees: data.maxAttendees || data.max_attendees
        };
        
        setEventData(mappedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-xl text-primary">Loading event data...</div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-xl text-red-500">{error || 'Event not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zenith-main py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <EventForm 
          clubId={clubId} 
          initialData={eventData} 
          isEditing={true} 
        />
      </div>
    </div>
  );
}
