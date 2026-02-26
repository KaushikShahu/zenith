"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Star,
  Share2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Tag,
  User,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { UniversalLoader } from '@/components/UniversalLoader';
import CreateEventModal from '@/components/events/CreateEventModal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isToday, parseISO, isAfter, isBefore } from 'date-fns';

// Helper functions
const getEventStatus = (event: Event): 'past' | 'ongoing' | 'upcoming' => {
  const now = new Date();
  const eventDate = event.event_date ? parseISO(event.event_date) : parseISO(event.start_time);
  const eventTime = event.event_time || '00:00:00';
  const [hours, minutes] = eventTime.split(':').map(Number);
  const eventDateTime = new Date(eventDate);
  eventDateTime.setHours(hours, minutes);
  
  // Add 2 hours for event duration if no end time
  const eventEndTime = event.end_time ? parseISO(event.end_time) : new Date(eventDateTime.getTime() + 2 * 60 * 60 * 1000);
  
  if (isBefore(eventEndTime, now)) {
    return 'past';
  } else if (isBefore(eventDateTime, now) && isAfter(eventEndTime, now)) {
    return 'ongoing';
  } else {
    return 'upcoming';
  }
};

const getStatusColor = (status: string, isDot: boolean = false) => {
  const dotClasses = {
    'past': 'bg-zenith-muted',
    'ongoing': 'bg-yellow-400', 
    'upcoming': 'bg-green-400',
    'published': 'bg-green-400',
    'draft': 'bg-yellow-400',
    'cancelled': 'bg-red-400'
  };
  
  const badgeClasses = {
    'past': 'bg-zenith-section text-zenith-muted border-zenith-border',
    'ongoing': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'upcoming': 'bg-green-100 text-green-700 border-green-200',
    'published': 'bg-green-100 text-green-800 border-green-200',
    'draft': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'cancelled': 'bg-red-100 text-red-800 border-red-200'
  };
  
  return isDot ? dotClasses[status as keyof typeof dotClasses] || 'bg-zenith-muted' : 
                 badgeClasses[status as keyof typeof badgeClasses] || 'bg-zenith-section text-zenith-muted border-zenith-border';
};

const getClubColorHelper = (clubId: string, clubs: Club[]) => {
  const club = clubs.find(c => c.id === clubId);
  if (!club) return 'bg-zenith-muted';
  
  // Map database colors to Tailwind classes
  const colorMap: Record<string, string> = {
    'blue': 'bg-blue-500',
    'purple': 'bg-purple-500', 
    'orange': 'bg-orange-500',
    'green': 'bg-green-500',
    'red': 'bg-red-500',
    'yellow': 'bg-yellow-500',
    'indigo': 'bg-indigo-500',
    'pink': 'bg-pink-500',
    'teal': 'bg-teal-500',
    'cyan': 'bg-cyan-500'
  };
  
  return colorMap[club.color] || 'bg-zenith-muted';
};

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  event_date: string;
  event_time: string;
  location?: string;
  club_id: string;
  club_name: string;
  creator_id: string;
  creator_name: string;
  max_attendees?: number;
  attendees_count: number;
  category: string;
  status: 'past' | 'ongoing' | 'upcoming' | 'draft' | 'published' | 'cancelled';
  featured_image?: string;
  tags: string[];
  is_attending?: boolean;
  created_at: string;
  updated_at: string;
}

interface Club {
  id: string;
  name: string;
  type: string;
  color: string;
}

// Calendar View Component
interface CalendarViewProps {
  events: Event[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  setShowDayDetails: (show: boolean) => void;
  clubs: Club[];
}

function CalendarView({ 
  events, 
  currentDate, 
  setCurrentDate, 
  selectedDate, 
  setSelectedDate, 
  setShowDayDetails, 
  clubs 
}: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      try {
        let eventDate: Date;
        
        if (event.event_date) {
          eventDate = parseISO(event.event_date);
        } else if (event.start_time) {
          eventDate = parseISO(event.start_time);
        } else {
          return false;
        }
        
        return isSameDay(eventDate, date);
      } catch (error) {
        console.error('Error parsing event date:', error);
        return false;
      }
    });
  };

  const getClubColor = (clubId: string) => {
    return getClubColorHelper(clubId, clubs);
  };

  const handleDayClick = (date: Date) => {
    const dayEvents = getEventsForDay(date);
    if (dayEvents.length > 0) {
      setSelectedDate(date);
      setShowDayDetails(true);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <Card className="zenith-bg-card border zenith-border">
      <CardHeader className="zenith-bg-section border-b zenith-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="zenith-text-primary">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <p className="zenith-text-secondary text-sm mt-1">
              Click on a day with events to see details
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="zenith-bg-card zenith-border hover:zenith-bg-hover"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="zenith-bg-card zenith-border hover:zenith-bg-hover"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Calendar Flex */}
        <div className="flex flex-col">
          {/* Day Headers */}
          <div className="flex">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="flex-1 p-4 text-center border-b zenith-border zenith-bg-section">
                <span className="text-sm font-medium zenith-text-primary">{day}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar Weeks */}
          {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex">
              {calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, dayIndex) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                
                return (
                  <div
                    key={dayIndex}
                    onClick={() => handleDayClick(day)}
                    className={`flex-1 min-h-[120px] p-2 border-b border-r zenith-border cursor-pointer transition-colors ${
                      isCurrentMonth ? 'zenith-bg-card hover:zenith-bg-hover' : 'zenith-bg-section opacity-70'
                    } ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
                  >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isCurrentMonth 
                      ? isTodayDate 
                        ? 'text-blue-600 font-bold' 
                        : 'zenith-text-primary'
                      : 'zenith-text-muted'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs zenith-text-secondary">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                
                {/* Event Dots */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => {
                    const eventStatus = getEventStatus(event);
                    return (
                      <div
                        key={eventIndex}
                        className={`flex items-center gap-1`}
                        title={`${event.title} (${eventStatus})`}
                      >
                        <div className={`w-2 h-2 rounded-full ${getClubColor(event.club_id)}`} />
                        {/* <div className={`w-1 h-1 rounded-full ${getStatusColor(eventStatus, true)}`} /> */}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-xs zenith-text-muted">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="p-4 border-t zenith-border zenith-bg-section">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium zenith-text-primary">Club Colors</h4>
            {/*
            <div className="flex items-center gap-4 text-xs zenith-text-secondary">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>Upcoming</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span>Ongoing</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-zenith-muted" />
                <span>Past</span>
              </div>
            </div>
            */}
          </div>
          <div className="flex flex-wrap gap-4">
            {clubs.map(club => (
              <div key={club.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getClubColor(club.id)}`} />
                <span className="text-sm zenith-text-secondary">{club.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedClub, setSelectedClub] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [permissions, setPermissions] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);

  // Helper function for club colors
  const getClubColor = (clubId: string) => {
    return getClubColorHelper(clubId, clubs);
  };

  // Fetch events
  useEffect(() => {
    fetchEvents();
    fetchClubs();
    checkPermissions();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []); // API returns events in 'data' property
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs');
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const checkPermissions = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/events/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const toggleAttendance = async (eventId: string, isAttending: boolean) => {
    if (!user) {
      showToast({
        title: "Authentication Required",
        message: "Please sign in to register for events.",
        type: "error"
      });
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/attend`, {
        method: isAttending ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setEvents(prev => prev.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                is_attending: !isAttending,
                attendees_count: isAttending ? event.attendees_count - 1 : event.attendees_count + 1
              } 
            : event
        ));
        
        showToast({
          title: isAttending ? "Left Event" : "Joined Event",
          message: isAttending ? "You have left the event." : "You have joined the event!",
          type: "success"
        });
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
      showToast({
        title: "Error",
        message: "Failed to update attendance. Please try again.",
        type: "error"
      });
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.club_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesClub = selectedClub === 'all' || event.club_id === selectedClub;
    
    return matchesSearch && matchesCategory && matchesClub;
  });

  // Get unique categories
  const categories = Array.from(new Set(events.map(event => event.category))).filter(Boolean);

  // Format date
  const formatDate = (event: Event) => {
    try {
      let date: Date;
      
      if (event.event_date && event.event_time) {
        // Use event_date and event_time from database
        const [hours, minutes] = event.event_time.split(':').map(Number);
        date = parseISO(event.event_date);
        date.setHours(hours, minutes);
      } else if (event.start_time) {
        // Fallback to start_time
        date = parseISO(event.start_time);
      } else {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-zenith-section text-zenith-muted border-zenith-border';
    }
  };

  if (loading) {
    return (
      <UniversalLoader 
        fullScreen={true}
        message="Loading events..."
        size="lg"
        variant="default"
      />
    );
  }

  return (
    <div className="min-h-screen bg-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">
                Event Calendar
              </h1>
              <p className="text-lg text-secondary">
                Discover exciting events happening in your community
              </p>
            </div>
            
            {permissions?.canCreate && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Cards
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-card border border-custom">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">Total Events</p>
                  <p className="text-2xl font-bold text-primary">{events.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-custom">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">Attending</p>
                  <p className="text-2xl font-bold text-primary">
                    {events.filter(e => e.is_attending).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-custom">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">This Month</p>
                  <p className="text-2xl font-bold text-primary">
                    {events.filter(e => new Date(e.start_time).getMonth() === new Date().getMonth()).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-custom">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">Categories</p>
                  <p className="text-2xl font-bold text-primary">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        */}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-card border border-custom">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    icon={<Search />}
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                  {/*
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="min-w-[160px] px-3 py-2 border border-zenith-border rounded-lg bg-zenith-card text-zenith-primary"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  */}

                  <select
                    value={selectedClub}
                    onChange={(e) => setSelectedClub(e.target.value)}
                    className="min-w-[160px] px-3 py-2 border border-zenith-border rounded-lg bg-zenith-card text-zenith-primary"
                  >
                    <option value="all">All Clubs</option>
                    {clubs.map(club => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex rounded-lg border border-custom">
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`px-3 py-2 rounded-l-lg ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'zenith-bg-card zenith-text-secondary hover:zenith-bg-hover'}`}
                    >
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Calendar
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 rounded-r-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'zenith-bg-card zenith-text-secondary hover:zenith-bg-hover'}`}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Events Grid/List/Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {viewMode === 'calendar' ? (
            <CalendarView 
              events={filteredEvents}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              setShowDayDetails={setShowDayDetails}
              clubs={clubs}
            />
          ) : filteredEvents.length === 0 ? (
            <Card className="bg-card border border-custom">
              <CardContent className="p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted mb-4" />
                <h3 className="text-lg font-medium text-primary mb-2">
                  No events found
                </h3>
                <p className="text-secondary mb-6">
                  {searchTerm || selectedCategory !== 'all' || selectedClub !== 'all'
                    ? "Try adjusting your search criteria"
                    : "No events are currently available. Check back later!"}
                </p>
                {permissions?.canCreate && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Event
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                        className="zenith-bg-card zenith-border hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => router.push(`/events/${event.id}`)}
                      >
                    {/* List View Event Card */}
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-4 h-4 rounded-full ${getClubColor(event.club_id)}`} />
                            <h3 className="text-lg font-semibold zenith-text-primary">{event.title}</h3>
                            {/*
                            <Badge className={`${getStatusColor(getEventStatus(event))} border text-xs`}>
                              {getEventStatus(event)}
                            </Badge>
                            */}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm zenith-text-secondary mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(event)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{event.club_name}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                          
                          <p className="zenith-text-secondary line-clamp-2 mb-4">
                            {event.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {event.tags?.slice(0, 3).map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs zenith-text-secondary">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{event.max_attendees || 0}+ Participants</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={() => {
          setShowCreateModal(false);
          fetchEvents(); // Refresh events list
        }}
      />

      {/* Day Details Modal */}
      {showDayDetails && selectedDate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          onClick={() => setShowDayDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-zenith-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-zenith-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zenith-border bg-zenith-accent">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-zenith-primary">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </h2>
                  <p className="text-zenith-secondary">
                    {events.filter(event => {
                      try {
                        let eventDate: Date;
                        if (event.event_date) {
                          eventDate = parseISO(event.event_date);
                        } else if (event.start_time) {
                          eventDate = parseISO(event.start_time);
                        } else {
                          return false;
                        }
                        return isSameDay(eventDate, selectedDate);
                      } catch {
                        return false;
                      }
                    }).length} events
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDayDetails(false)}
                  className="rounded-full p-2 h-auto text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-accent"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto bg-zenith-card">
              <div className="space-y-4">
                {events
                  .filter(event => {
                    try {
                      let eventDate: Date;
                      if (event.event_date) {
                        eventDate = parseISO(event.event_date);
                      } else if (event.start_time) {
                        eventDate = parseISO(event.start_time);
                      } else {
                        return false;
                      }
                      return isSameDay(eventDate, selectedDate);
                    } catch {
                      return false;
                    }
                  })
                  .map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="zenith-bg-section rounded-lg p-4 border zenith-border cursor-pointer hover:bg-zenith-hover transition-colors"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-4 h-4 rounded-full ${getClubColor(event.club_id)} mt-1`} />
                        <div className="flex-1">
                          <h3 className="font-semibold zenith-text-primary mb-1">
                            {event.title}
                          </h3>
                          <p className="zenith-text-secondary text-sm mb-2">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm zenith-text-muted">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {event.event_time ? event.event_time.slice(0, 5) : 
                                 event.start_time ? format(parseISO(event.start_time), 'h:mm a') : 
                                 'Time TBA'}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{event.max_attendees}+ Participants</span>
                            </div>
                          </div>
                        </div>
                        {/*
                        <Badge className={`${getStatusColor(getEventStatus(event))} border`}>
                          {getEventStatus(event)}
                        </Badge>
                        */}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* ZenChatbot */}
    </div>
  );
}
