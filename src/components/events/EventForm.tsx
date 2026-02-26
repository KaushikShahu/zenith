'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';

interface EventFormProps {
  initialData?: any;
  clubId: string;
  isEditing?: boolean;
}

export default function EventForm({ initialData, clubId, isEditing = false }: EventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  // Generate a valid UUID for new events to satisfy DB constraints
  // We use a ref so it doesn't change on re-renders
  const tempId = useRef<string>(
    initialData?.id || 
    (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000000')
  ).current;

  // Form State
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    event_date: initialData?.event_date ? new Date(initialData.event_date).toLocaleDateString('en-CA') : '',
    event_time: initialData?.event_time || '',
    location: initialData?.location || '',
    max_attendees: initialData?.max_attendees || '',
    status: initialData?.status || 'upcoming',
    image_url: initialData?.image_url || '',
    banner_image_url: initialData?.banner_image_url || '',
    gallery_images: initialData?.gallery_images || []
  });

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const data = new FormData();
    data.append('image', file);
    // Use the valid UUID (either existing ID or our temp one)
    data.append('eventId', tempId);
    data.append('imageType', type);

    try {
      const token = localStorage.getItem('zenith-token');
      const res = await fetch('/api/events/upload-image', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (!res.ok) throw new Error('Failed to upload image');

      const result = await res.json();
      
      if (type === 'banner') {
        setFormData(prev => ({ ...prev, banner_image_url: result.imageUrl }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          gallery_images: [...(prev.gallery_images as string[]), result.imageUrl] 
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: (prev.gallery_images as string[]).filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/events/${initialData.id}` : '/api/events';
      const method = isEditing ? 'PUT' : 'POST';
      const token = localStorage.getItem('zenith-token');

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          club_id: clubId,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees.toString()) : null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Something went wrong');
      }

      router.push(`/clubs/${clubId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('zenith-token');
      const res = await fetch(`/api/events/${initialData.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete event');
      }

      router.push(`/clubs/${clubId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center text-zenith-secondary hover:text-zenith-primary transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="bg-zenith-card p-8 rounded-xl shadow-lg border border-zenith-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-zenith-primary">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </h2>
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Delete Event
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            {error}
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Image Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zenith-primary">Event Banner</label>
          <div className="relative h-48 w-full bg-zenith-bg rounded-lg border-2 border-dashed border-zenith-border flex flex-col items-center justify-center overflow-hidden group hover:border-zenith-accent transition-colors cursor-pointer"
               onClick={() => bannerInputRef.current?.click()}>
            
            {formData.banner_image_url ? (
              <>
                <img 
                  src={formData.banner_image_url} 
                  alt="Banner" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                   <span className="text-white font-medium">Change Banner</span>
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <ImageIcon className="w-8 h-8 mx-auto text-zenith-muted mb-2" />
                <p className="text-sm text-zenith-muted">Click to upload banner</p>
              </div>
            )}
            
            <input 
              type="file" 
              ref={bannerInputRef}
              className="hidden" 
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'banner')}
              disabled={uploading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zenith-primary">Event Title *</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 bg-zenith-bg border border-zenith-border rounded-lg text-zenith-primary focus:outline-none focus:ring-2 focus:ring-zenith-accent"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zenith-primary">Location *</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 bg-zenith-bg border border-zenith-border rounded-lg text-zenith-primary focus:outline-none focus:ring-2 focus:ring-zenith-accent"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zenith-primary">Date *</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 bg-zenith-bg border border-zenith-border rounded-lg text-zenith-primary focus:outline-none focus:ring-2 focus:ring-zenith-accent [color-scheme:dark]"
              value={formData.event_date}
              onChange={(e) => setFormData({...formData, event_date: e.target.value})}
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zenith-primary">Time *</label>
            <input
              type="time"
              step="1"
              required
              className="w-full px-4 py-2 bg-zenith-bg border border-zenith-border rounded-lg text-zenith-primary focus:outline-none focus:ring-2 focus:ring-zenith-accent [color-scheme:dark]"
              value={formData.event_time}
              onChange={(e) => setFormData({...formData, event_time: e.target.value})}
            />
          </div>

          {/* Max Attendees */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zenith-primary">Participants</label>
            <input
              type="number"
              className="w-full px-4 py-2 bg-zenith-bg border border-zenith-border rounded-lg text-zenith-primary focus:outline-none focus:ring-2 focus:ring-zenith-accent"
              value={formData.max_attendees}
              onChange={(e) => setFormData({...formData, max_attendees: e.target.value})}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zenith-primary">Description</label>
          <textarea
            rows={4}
            className="w-full px-4 py-2 bg-zenith-bg border border-zenith-border rounded-lg text-zenith-primary focus:outline-none focus:ring-2 focus:ring-zenith-accent resize-none"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        {/* Gallery Images */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
             <label className="block text-sm font-medium text-zenith-primary">Gallery Images</label>
             <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-sm text-zenith-accent hover:text-blue-400 flex items-center gap-1"
             >
                <Upload className="w-4 h-4" />
                Add Image
             </button>
             <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'gallery')}
             />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {(formData.gallery_images as string[]).map((img, idx) => (
              <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border border-zenith-border">
                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(idx)}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {uploading && (
                <div className="aspect-video rounded-lg border border-zenith-border bg-zenith-bg flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-zenith-accent" />
                </div>
            )}
            {(formData.gallery_images as string[]).length === 0 && !uploading && (
                <div className="col-span-full py-8 text-center border border-dashed border-zenith-border rounded-lg text-zenith-muted text-sm">
                    No gallery images added yet
                </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-zenith-border">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-zenith-border rounded-lg text-zenith-secondary hover:bg-zenith-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  </div>
  );
}
