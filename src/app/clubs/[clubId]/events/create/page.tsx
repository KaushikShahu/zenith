'use client';

import { useParams } from 'next/navigation';
import EventForm from '@/components/events/EventForm';

export default function CreateEventPage() {
  const params = useParams();
  const clubId = params.clubId as string;

  return (
   <div className="min-h-screen bg-zenith-main py-12 px-4">
     <div className="max-w-4xl mx-auto">
       <EventForm clubId={clubId} />
     </div>
   </div>
  );
}