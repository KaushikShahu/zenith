'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function EventDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const auth = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${id}`);
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) return <div className="p-10 text-center text-zenith-primary">Loading event details...</div>;
  if (!event) return <div className="p-10 text-center text-zenith-primary">Event not found</div>;

  // Check if user has permission to manage (same logic as before)
  const canManage = auth.user && (
    auth.user.role === 'admin' ||
    (auth.user.club_id === event.clubId && ['coordinator', 'co_coordinator', 'media', 'media_head'].includes(auth.user.role))
  );

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('zenith-token');
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete event');
      }

      router.push(`/clubs/${event.clubId}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zenith-main py-10 px-4">
      <div className="max-w-4xl mx-auto bg-zenith-card rounded-2xl shadow-xl overflow-hidden border border-zenith-border">
        {/* Banner */}
        <div className="h-64 bg-zenith-bg relative">
          {event.banner_image_url ? (
            <img src={event.banner_image_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zenith-muted bg-zenith-bg">
              No Banner Image
            </div>
          )}
        </div>

        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-zenith-primary mb-2">{event.title}</h1>
              <p className="text-lg text-zenith-accent font-medium">Organized by {event.clubName}</p>
            </div>
            {canManage && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => router.push(`/clubs/${event.clubId}/events/edit/${event.id}`)} 
                  className="p-2 bg-zenith-bg rounded-full hover:bg-zenith-border transition-colors"
                  title="Edit Event"
                >
                  <Edit className="w-5 h-5 text-zenith-primary" />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-2 bg-zenith-bg rounded-full hover:bg-red-500/20 transition-colors"
                  title="Delete Event"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center space-x-3 text-zenith-secondary">
              <Calendar className="w-5 h-5 text-zenith-accent" />
              <span>{new Date(event.event_date).toLocaleDateString()} at {event.startTime}</span>
            </div>
            <div className="flex items-center space-x-3 text-zenith-secondary">
              <MapPin className="w-5 h-5 text-red-500" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center space-x-3 text-zenith-secondary">
              <Users className="w-5 h-5 text-green-500" />
              <span>{event.attendeeCount} / {event.maxAttendees || '∞'} attending</span>
            </div>
          </div>

          <div className="prose max-w-none text-zenith-secondary mb-10">
            <h2 className="text-xl font-semibold text-zenith-primary mb-3">About this event</h2>
            <p className="whitespace-pre-wrap">{event.description}</p>
          </div>

           {/* Gallery - Displaying from JSONB gallery_images */}
           {event.gallery_images && event.gallery_images.length > 0 && (
             <div>
               <h2 className="text-xl font-semibold text-zenith-primary mb-4">Event Gallery</h2>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 {event.gallery_images.map((img: string, i: number) => (
                   <img key={i} src={img} className="rounded-lg h-40 w-full object-cover shadow-sm border border-zenith-border" alt="Gallery" />
                 ))}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
   );
 }
