"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Crown,
  Shield,
  Star,
  Code,
  GraduationCap,
  Heart,
  MapPin,
  Clock,
  ArrowLeft,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { ZenithLogo } from "@/components/ZenithLogo";
import ClubLogo from "@/components/ClubLogo";
import UserAvatar from "@/components/UserAvatar";
import { PageLoader } from "@/components/UniversalLoader";
import ThemeToggle from "@/components/ui/ThemeToggle";
import TeamShowcase from "@/components/TeamShowcase";

interface ClubData {
  club: {
    id: string;
    name: string;
    type: string;
    description: string;
    long_description: string;
    icon: string;
    color: string;
    memberCount: number;
    evenrtCount: number;
    postCount: number;
    coordinator?: { 
      name: string;
      email?: string;
      avatar?: string;
      profile_image_url?: string;
    } | null;
    co_coordinator?: { 
      name: string;
      email?: string;
      avatar?: string;
      profile_image_url?: string;
    } | null;
    secretary?: { 
      name: string;
      email?: string;
      avatar?: string;
      profile_image_url?: string;
    } | null;
    media?: { 
      name: string;
      email?: string;
      avatar?: string;
      profile_image_url?: string;
    } | null;
  };
  events: Array<{
    id: string;
    title: string;
    event_date: string;
    location: string;
    description?: string;
    max_attendees: number;
    banner_image_url?: string;
    status?: 'upcoming' | 'ongoing' | 'completed';
  }>;
  pastEvents: Array<{
    id: string;
    title: string;
    event_date: string;
    location: string;
    description?: string;
    banner_image_url?: string;
    gallery_images?: string[];
  }>;
  posts: Array<{
    id: string;
    title: string;
    excerpt: string;
    created_at: string;
    author_name: string;
    like_count?: number;
    comment_count?: number;
    view_count?: number;
  }>;
}

// Icon mapping for clubs
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code: Code,
  MessageSquare: MessageSquare,
  GraduationCap: GraduationCap,
  Heart: Heart,
};

export default function PublicClubPage() {
  const params = useParams();
  const router = useRouter();
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Get club-specific gallery images
  const getClubGalleryImages = (clubId: string) => {
    const baseImages = [
      {
        id: 1,
        url: `https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80`,
        title: "Club Activities",
        description: "Our members actively participating in workshops and events"
      },
      {
        id: 2,
        url: `https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80`,
        title: "Team Collaboration", 
        description: "Working together on innovative projects and solutions"
      },
      {
        id: 3,
        url: `https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80`,
        title: "Innovation Hub",
        description: "Creating and implementing groundbreaking ideas"
      },
      {
        id: 4,
        url: `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80`,
        title: "Community Events",
        description: "Engaging with the broader college community"
      }
    ];

    // Try to load club-specific images from the public/carousel folder
    // In a real app, you would check if files exist and load them dynamically
    const clubSpecificImages = [
      {
        id: 1,
        url: `/carousel/${clubId.toLowerCase()}/1.png`,
        title: `${clubId.toUpperCase()} Workshop`,
        description: "Interactive learning session with industry experts",
        fallback: baseImages[0].url
      },
      {
        id: 2,
        url: `/carousel/${clubId.toLowerCase()}/2.png`,
        title: `${clubId.toUpperCase()} Project Demo`,
        description: "Student presentations and project showcases",
        fallback: baseImages[1].url
      },
      {
        id: 3,
        url: `/carousel/${clubId.toLowerCase()}/3.png`,
        title: `${clubId.toUpperCase()} Competition`,
        description: "Competitive coding and innovation challenges",
        fallback: baseImages[2].url
      }
    ];

    return clubSpecificImages;
  };

  // Club gallery images (now dynamic based on clubId)
  const [clubGallery, setClubGallery] = useState<any[]>([]);

  // Carousel auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % clubGallery.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, clubGallery.length]);

  // Carousel navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % clubGallery.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + clubGallery.length) % clubGallery.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  useEffect(() => {
    const fetchClubData = async () => {
      if (!params.clubId) return;
      
      try {
        setLoading(true);
        
        // Set club-specific gallery images
        const galleryImages = getClubGalleryImages(params.clubId as string);
        setClubGallery(galleryImages);
        
        // Fetch club data without authentication
        const response = await fetch(`/api/clubs/${params.clubId}/public`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch club data: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        setClubData(data);
        setError(null);
      } catch (err) {
        console.error("Club data fetch error:", err);
        setError(`Failed to load club data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchClubData();
  }, [params.clubId]);

  if (loading) {
    return <PageLoader />;
  }

  if (error || !clubData) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zenith-primary mb-4">
            Club not found
          </h1>
          <p className="text-zenith-secondary mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-zenith-accent text-white rounded-lg hover:bg-zenith-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { club, events, pastEvents = [], posts } = clubData;
  const IconComponent = iconMap[club.icon] || Code;

  // Separate upcoming and past events
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.event_date);
    const now = new Date();
    return eventDate >= now || event.status === 'upcoming';
  });

  const completedEvents = events.filter(event => {
    const eventDate = new Date(event.event_date);
    const now = new Date();
    return eventDate < now || event.status === 'completed';
  });

  return (
    <div className="min-h-screen bg-zenith-main">
      {/* Header */}
      <header className="shadow-sm border-b border-zenith-border bg-zenith-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-zenith-muted hover:text-zenith-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Club Hero Section */}
      <section className="bg-zenith-section py-16 relative hero-section border-b border-zenith-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-center mb-6"
            >
              <div className="w-32 h-32 bg-zenith-card rounded-2xl flex items-center justify-center mr-6 shadow-lg border border-zenith-border">
                <ClubLogo 
                  clubId={club.id}
                  clubName={club.name}
                  size="xl"
                  fallbackIcon={club.icon}
                  className="text-zenith-primary scale-150"
                />
              </div>
              <div className="text-left">
                <h1 className="text-zenith-primary text-4xl md:text-6xl font-bold mb-2">{club.name}</h1>
                <p className="text-zenith-secondary text-xl">{club.type}</p>
              </div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-zenith-secondary text-xl max-w-3xl mx-auto mb-8"
            >
              {club.description}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-center justify-center space-x-8 text-zenith-primary"
            >
              <div className="text-center">
                <div className="text-3xl font-bold">{club.memberCount}+</div>
                <div className="text-sm text-zenith-muted">Active Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{club.eventCount}</div>
                <div className="text-sm text-zenith-muted">Events Conducted</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{club.postCount}</div>
                <div className="text-sm text-zenith-muted">Recent Posts</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Image Carousel */}
      <section className="py-16 bg-zenith-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-zenith-primary mb-4">Club Gallery</h2>
            <p className="text-xl text-zenith-secondary">
              Explore our activities, events, and community moments
            </p>
          </motion.div>

          <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative w-full h-full">
              {clubGallery.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: currentSlide === index ? 1 : 0,
                    scale: currentSlide === index ? 1 : 1.05 
                  }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  className={`absolute inset-0 w-full h-full ${
                    currentSlide === index ? 'z-10' : 'z-0'
                  }`}
                >
                  <div
                    className="w-full h-full bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${image.url})` }}
                  >
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="relative z-10 flex items-end h-full p-8">
                      <div className="text-white">
                        <motion.h3
                          initial={{ y: 20, opacity: 0 }}
                          animate={currentSlide === index ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className="text-2xl md:text-3xl font-bold mb-2"
                        >
                          {image.title}
                        </motion.h3>
                        <motion.p
                          initial={{ y: 20, opacity: 0 }}
                          animate={currentSlide === index ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                          className="text-lg opacity-90"
                        >
                          {image.description}
                        </motion.p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Auto-play toggle */}
            <button
              onClick={toggleAutoPlay}
              className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-colors"
              aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
            >
              {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
              {clubGallery.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    currentSlide === index
                      ? 'bg-white'
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Club Leadership Team Carousel */}
      <section className="py-16 bg-zenith-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-zenith-primary mb-4">{club.name} Leadership Team</h2>
            <p className="text-xl text-zenith-secondary">
              Meet the coordinators and leaders who guide {club.name} across different academic years
            </p>
          </motion.div>

          <TeamShowcase 
            teamType="club"
            teamId={club.id}
            showYearNavigation={true}
            autoPlay={true}
            className="leadership-carousel"
          />
        </div>
      </section>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="py-16 bg-zenith-main">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-zenith-primary mb-4">Upcoming Events</h2>
              <p className="text-xl text-zenith-secondary">
                Don't miss out on these exciting opportunities
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.slice(0, 6).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link href={`/events/${event.id}`} className="block bg-zenith-card rounded-xl shadow-lg border border-zenith-border hover:shadow-xl hover:border-zenith-accent transition-all duration-300 overflow-hidden group h-full">
                    {event.banner_image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={event.banner_image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 right-4">
                          <div className="bg-zenith-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
                            Upcoming
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-zenith-primary mb-3 group-hover:text-zenith-accent transition-colors">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-zenith-secondary mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <div className="space-y-2 text-sm text-zenith-muted">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-zenith-accent" />
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-zenith-accent" />
                          {new Date(event.event_date).toLocaleTimeString()}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-zenith-accent" />
                          {event.location}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-zenith-accent" />
                          {event.max_attendees} Participants
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Past Events */}
      {(completedEvents.length > 0 || pastEvents.length > 0) && (
        <section className="py-16 bg-zenith-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-zenith-primary mb-4">Past Events</h2>
              <p className="text-xl text-zenith-secondary">
                Explore our successful events and memorable moments
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Show completed regular events */}
              {completedEvents.slice(0, 3).map((event, index) => (
                <motion.div
                  key={`completed-${event.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link href={`/events/${event.id}`} className="block bg-zenith-card rounded-xl shadow-lg border border-zenith-border hover:shadow-xl hover:border-zenith-accent transition-all duration-300 overflow-hidden group h-full">
                    {event.banner_image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={event.banner_image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-zenith-primary mb-3 group-hover:text-zenith-accent transition-colors">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-zenith-secondary mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <div className="space-y-2 text-sm text-zenith-muted">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          {event.location}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-gray-500" />
                          {event.max_attendees} Participants
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}

              {/* Show past events from pastEvents array */}
              {pastEvents.slice(0, 3).map((event, index) => (
                <motion.div
                  key={`past-${event.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: (completedEvents.length + index) * 0.1 }}
                >
                  <Link href={`/events/${event.id}`} className="block bg-zenith-card rounded-xl shadow-lg border border-zenith-border hover:shadow-xl hover:border-zenith-accent transition-all duration-300 overflow-hidden group h-full">
                    {event.banner_image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={event.banner_image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-zenith-primary mb-3 group-hover:text-zenith-accent transition-colors">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-zenith-secondary mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <div className="space-y-2 text-sm text-zenith-muted">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {posts.length > 0 && (
        <section className="py-16 bg-zenith-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-zenith-primary mb-4">Recent Updates</h2>
              <p className="text-xl text-zenith-secondary">
                Stay updated with our latest news and announcements
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {posts.slice(0, 4).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-zenith-card rounded-xl shadow-lg p-6 border border-zenith-border hover:shadow-xl transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-zenith-primary mb-3">
                    {post.title}
                  </h3>
                  <p className="text-zenith-secondary mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-zenith-muted">
                                        <span>By {post.author_name}</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
      <br />
      <section className="py-16 bg-zenith">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-zenith-primary mb-6">About {club.name}</h2>
              <div className="prose prose-lg text-zenith-secondary">
                <p className="leading-relaxed whitespace-pre-line">
                  {club.long_description || club.description}
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`bg-gradient-to-br ${club.color} rounded-2xl p-8`}
            >
                {/* align logo to right */}
              <div className="flex flex-col items-center text-center">
                <ClubLogo
                  clubId={club.id}
                  clubName={club.name}
                  size="xl"
                  fallbackIcon={club.icon}
                  className="text-white dark:text-white mb-6 scale-125"
                />
                <h3 className="text-2xl font-bold mb-4 zenith-primary">Join Our Community</h3>
                <p className="text-lg opacity-90 mb-6 zenith-secondary">
                  Be part of something bigger. Connect, learn, and grow with like-minded peers.
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center bg-white dark:bg-white text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2 text-gray-700" />
                  Sign Up to Join
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
    
  );
}
