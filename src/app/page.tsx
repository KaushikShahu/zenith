"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Calendar,
  Users,
  BookOpen,
  Lightbulb,
  Code,
  MessageSquare,
  GraduationCap,
  Heart,
  MapPin,
  Clock,
  ChevronLeft,
  Pause,
  Play,
  FileText,
  Shield,
  Crown,
  TrendingUp,
  Award,
  Star,
  Zap,
  Mail,
  Linkedin,
  Github,
  User
} from "lucide-react";
import { ZenithLogo } from "@/components/ZenithLogo";
import ClubLogo from "@/components/ClubLogo";
import { UniversalLoader } from "@/components/UniversalLoader";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/UniversalLoader";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import SafeAvatar from "@/components/SafeAvatar";
import { Footer } from "@/components/NewFooter";
import TeamShowcase from "@/components/TeamShowcase";

// Icon mapping for clubs
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code: Code,
  MessageSquare: MessageSquare,
  GraduationCap: GraduationCap,
  Heart: Heart,
};

// Club color mapping for text display
const getClubTextColor = (clubName: string) => {
  const clubColors: Record<string, string> = {
    'Ascend': 'text-zenith-primary',    // Blue for ASCEND
    'Aster': 'text-pink-500',     // Pink for ASTER  
    'Achievers': 'text-purple-500', // Purple for ACHIEVERS
    'Artovert': 'text-green-500', // Green for Artovert
  };
  
  // Find the club by checking if the name contains the key
  for (const [key, color] of Object.entries(clubColors)) {
    if (clubName.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  
  // Default to brand color if not found
  return 'text-zenith-brand';
};

interface Club {
  id: string;
  name: string;
  type: string;
  description: string;
  color: string;
  icon: string;
  member_count: number;
  upcoming_events: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  event_date: string;
  event_time: string;
  location: string;
  club_id: string;
  club_name: string;
  club_color: string;
  organizer_name: string;
  organizer_club_name?: string;
  organizer_club_color?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  tags: string[];
  club_id: string;
  club_name: string;
  club_color: string;
  author_name: string;
  author_club_name?: string;
  author_club_color?: string;
}

interface HomeStats {
  totalClubs: number;
  totalMembers: number;
  eventsConducted: number;
  monthlyEvents: number;
  totalPosts: number;
}

interface Leadership {
  coordinator: { 
    name: string;
    photo?: string;
    email?: string;
  } | null;
  coCoordinator: { 
    name: string;
    photo?: string;
    email?: string;
  } | null;
  secretary: { 
    name: string;
    photo?: string;
    email?: string;
  } | null;
  treasurer: { 
    name: string;
    photo?: string;
    email?: string;
  } | null;
  innovationHead: { 
    name: string;
    photo?: string;
    email?: string;
  } | null;
  media: { 
    name: string;
    photo?: string;
    email?: string;
  } | null;
}

interface HomeData {
  stats: HomeStats;
  clubs: Club[];
  upcomingEvents: Event[];
  pastEvents: Event[];
  recentPosts: Post[];
  leadership?: Leadership;
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Carousel images data - Configuration for hero slideshow
  const carouselImages = [
    {
      id: 1,
      url: "images/community.jpg",
      title: "Welcome to Zenith Forum",
      subtitle: "DRIVEN BY PASSION, BUILT FOR EXCELLENCE",
      description: "Join our vibrant college community and discover your potential"
    },
    {
      id: 2,
      url:"images/yashsarthak.jpg",
      title: "Specialized Clubs",
      subtitle: "Find Your Passion",
      description: "Explore our diverse range of clubs and activities"
    },
    {
      id: 3,
      url:"images/yash.jpg",
      title: "Events & Workshops",
      subtitle: "Learn & Grow Together",
      description: "Participate in exciting events and skill-building workshops"
    },
    {
      id: 4,
      url: "images/team.jpeg",
      title: "Founding Team",
      subtitle: "Transform Ideas into Reality",
      description: "Collaborate on projects and bring your innovations to life"
    }
  ];

  // Carousel auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, carouselImages.length]);

  // Carousel navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };



  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await fetch("/api/home/stats");
        if (!response.ok) throw new Error("Failed to fetch home data");
        const data = await response.json();
        setHomeData(data);
      } catch (err) {
        setError("Failed to load data");
        console.error("Home data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Show loading while checking auth or fetching data
  if (isLoading || loading) {
    return <UniversalLoader message="Loading Zenith community..." />;
  }

  // If user is authenticated, don't show landing page (will redirect)
  if (user) {
    return null;
  }

  if (error || !homeData) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zenith-primary mb-4">
            Unable to load data
          </h1>
          <p className="text-zenith-secondary mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-zenith-accent text-white rounded-lg hover:bg-zenith-accent transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, clubs, upcomingEvents, recentPosts, leadership } = homeData;

  // ============================================================================
  // MAIN LANDING PAGE COMPONENT - ZENITH FORUM HOMEPAGE
  // ============================================================================
  return (
    <div className="min-h-screen bg-zenith-main transition-colors duration-300">
      {/* ===== FLOATING COMPONENTS ===== */}
      
      {/* Theme Toggle Button - Fixed positioning for accessibility */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      {/* Unified Header - Currently commented out */}
      {/* <UnifiedHeader showNavigation={true} /> */}

      {/* ===== HERO SECTION - IMAGE CAROUSEL ===== */}
      {/* Full-width carousel showcasing college events and activities */}
      <section className="relative h-96 md:h-[500px] lg:h-[600px] overflow-hidden">
        
        <div className="relative w-full h-full">
          {/* Carousel slides with smooth transitions and animations */}
          {carouselImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: currentSlide === index ? 1 : 0,
                scale: currentSlide === index ? 1 : 1.1 
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="relative z-10 hidden md:flex items-end justify-center h-full pb-12">
                  <div className="text-center text-white px-6 max-w-5xl mx-auto">
                    <motion.h1
                      initial={{ y: 30, opacity: 0 }}
                      animate={currentSlide === index ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 text-white drop-shadow-2xl"
                    >
                      {image.title}
                    </motion.h1>
                    <motion.h2
                      initial={{ y: 30, opacity: 0 }}
                      animate={currentSlide === index ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 text-yellow-300 drop-shadow-lg"
                    >
                      {image.subtitle}
                    </motion.h2>
                    <motion.p
                      initial={{ y: 30, opacity: 0 }}
                      animate={currentSlide === index ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="text-base md:text-lg mb-6 text-white/95 drop-shadow-lg max-w-2xl mx-auto"
                    >
                      {image.description}
                    </motion.p>
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={currentSlide === index ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                      className="flex flex-col sm:flex-row gap-3 justify-center"
                    >
                      <Link
                        href="/register"
                        className="bg-zenith-accent hover:bg-zenith-accent/90 text-white px-6 py-3 rounded-lg text-base font-semibold transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Get Started
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </Link>
                      <Link
                        href="#clubs"
                        className="glass text-white hover:bg-white/25 px-6 py-3 rounded-lg text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Explore Clubs
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Carousel Navigation Controls */}
        {/* Previous/Next arrows for manual navigation */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 glass hover:bg-black/50 text-white p-3 rounded-full transition-all duration-300"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 glass hover:bg-black/50 text-white p-3 rounded-full transition-all duration-300"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Auto-play toggle control */}
        <button
          onClick={toggleAutoPlay}
          className="absolute top-4 right-4 z-20 glass hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300"
          aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        {/* Slide indicator dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? 'bg-zenith-card scale-125'
                  : 'bg-zenith-card/60 hover:bg-zenith-card/80 hover:scale-110'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>
      
      {/* ===== MAIN CONTENT BODY STARTS HERE ===== */}
      
      {/* HERO TEXT SECTION - Welcome message and primary CTAs */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">{/* Further reduced since parent has more padding */}
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          > 
            <h1 className="text-5xl md:text-7xl font-bold text-zenith-primary mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ZENITH
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-primary mb-8 max-w-3xl mx-auto leading-relaxed">
              <span className="bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent"> 
              DRIVEN BY PASSION, BUILT FOR EXCELLENCE
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-blue-900 bg-clip-text text-transparent">
              A Initiative driven by the students, For the students
              </span>
            </p>  
          </motion.div>
        </div>
      </section>

      {/* ABOUT ZENITH SECTION - Platform description and features */}
      <section className="py-20 bg-zenith-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h2 className="text-4xl font-bold text-zenith-brand mb-6">
                What is Zenith?
              </h2>
              <p className="text-lg text-zenith-secondary mb-6 leading-relaxed">
                Zenith Forum embodies excellence; it&apos;s a platform that fosters curiosity, nurtures talent, and inspires the pursuit of excellence. At Zenith, imagination finds its highest peak. Built for the students, by the students; it&apos;s where ideas spark, skills grow, and connections turn into opportunities. Here, you don&apos;t just attend college—you experience it. Join Zenith today, and be part of the journey.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-zenith-hover rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-zenith-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zenith-primary">
                      Community Driven
                    </h3>
                    <p className="text-sm text-zenith-muted">
                      Built by students, for students
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-zenith-hover rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-zenith-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zenith-primary">
                      Skill Development
                    </h3>
                    <p className="text-sm text-zenith-muted">
                      Learn and grow with expert guidance
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-zenith-hover rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-zenith-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zenith-primary">
                      Innovation Hub
                    </h3>
                    <p className="text-sm text-zenith-muted">
                      Where ideas come to life
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-zenith-hover rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-zenith-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zenith-primary">
                      Regular Events
                    </h3>
                    <p className="text-sm text-zenith-muted">
                      Workshops, competitions, and more
                    </p>
                  </div>
                </div>
              </div>
              {/* <div className="mt-8">
                <Link href="/founding-team">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center px-6 py-3 bg-zenith-accent text-white font-medium rounded-lg hover:bg-zenith-accent/90 transition-colors duration-200"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Meet Our Founding Team
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </motion.button>
                </Link>
              </div> */}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="relative"
            >
              <div className="bg-gradient-to-br  from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <div className="text-center">
                  <ZenithLogo size="xl" className="mb-6" />
                  <p className="text-lg opacity-90 mb-6">
                    &quot;Excellence is not a destination, it&apos;s a journey
                    of continuous growth and learning.&quot;
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">
                        {stats.totalMembers}+
                      </div>
                      <div className="text-sm opacity-80">Active Members</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {stats.monthlyEvents}+
                      </div>
                      <div className="text-sm opacity-80">Monthly Events</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATISTICS SECTION - Key metrics display */}
      <section className="py-16 bg-zenith-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="text-center">
              <div className="text-3xl font-bold stat-clubs">
                {stats.totalClubs}
              </div>
              <div className="text-sm text-zenith-muted">
                Specialized Clubs
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold stat-members">
                {stats.totalMembers}
              </div>
              <div className="text-sm text-zenith-muted">
                Active Members
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold stat-events">
                {stats.eventsConducted}
              </div>
              <div className="text-sm text-zenith-muted">
                Events Conducted
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold stat-posts">
                {stats.totalPosts}
              </div>
              <div className="text-sm text-zenith-muted">
                Forum Posts
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* ===== FACULTY MENTORS SECTION ===== */}
      {/* <section className="py-16 bg-zenith-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-zenith-primary mb-4">Faculty Mentors</h2>
            <p className="text-xl text-zenith-secondary">
              Our dedicated faculty members who guide and support our journey
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 justify-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-zenith-card rounded-3xl p-8 shadow-xl border border-zenith-border text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[480px]"
            >
              <div className="relative mb-8">
                <div className="w-44 h-56 mx-auto rounded-lg overflow-hidden shadow-lg">
                  <img 
                    src="/manoj_sir.jpg"
                    alt="Manoj's avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-3 -right-3 bg-purple-600 text-white p-3 rounded-full shadow-lg">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-zenith-primary">
                  Dr. Manoj V. Bramhe
                </h3>
                <div className="inline-block bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Head of Department
                </div>
                <br />  
                <div className="text-sm text-zenith-muted bg-zenith-main px-3 py-1 rounded-full inline-block">
                  Computer Science and Engineering
                </div>
                <p className="text-base text-zenith-muted leading-relaxed mt-4">
                  Leading the Computer Science and Engineering department with expertise and vision
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-zenith-card rounded-3xl p-8 shadow-xl border border-zenith-border text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[480px]"
            >
              <div className="relative mb-8">
                <div className="w-44 h-56 mx-auto rounded-lg overflow-hidden shadow-lg">
                  <img 
                    src="/vaibhav_sir.jpg"
                    alt="Vaibhav's avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-3 -right-3 bg-primary-brand text-white p-3 rounded-full shadow-lg">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-zenith-primary">  
                Mr. Vaibhav V. Deshpande
                </h3>
                <div className="inline-block bg-primary-brand text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Faculty Mentor
                </div>
                <br />  
                <div className="text-sm text-zenith-muted bg-zenith-main px-3 py-1 rounded-full inline-block">
                  Computer Science and Engineering
                </div>
                <p className="text-base text-zenith-muted leading-relaxed mt-4">
                  Mentoring students and fostering academic excellence
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section> */}

      {/* ===== ZENITH LEADERSHIP TEAM CAROUSEL SECTION ===== */}
      <section className="py-16 bg-zenith-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-zenith-primary mb-4">Zenith Leadership Team</h2>
            <p className="text-xl text-zenith-secondary">
              Meet the dedicated leaders who guide Zenith Forum across different academic years
            </p>
          </motion.div>
          
          {/* Team Showcase Carousel */}
          <TeamShowcase 
            teamType="committee" 
            teamId="8f28c85b-1315-4583-923a-a827f9507a00"
            showYearNavigation={true}
            autoPlay={true}
            className="leadership-carousel"
          />
        </div>
      </section>

  {/* CLUBS SHOWCASE SECTION - Featured clubs with descriptions */}
      <section
        id="clubs"
        className="py-20 bg-zenith-main"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-zenith-brand mb-4">
              Our Specialized Clubs
            </h2>
            <p className="text-xl text-zenith-secondary max-w-2xl mx-auto">
              Choose your path and join like-minded peers in your area of
              interest
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {clubs.map((club, index) => {
              const IconComponent = iconMap[club.icon] || Code;
              return (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className="bg-zenith-card rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                >
                  <div
                    className={`bg-gradient-to-r ${club.color} p-6 text-white`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-zenith-card/20 rounded-xl flex items-center justify-center">
                          <ClubLogo 
                            clubId={club.id}
                            clubName={club.name}
                            size="lg"
                            fallbackIcon={club.icon}
                            className="text-white"
                          />
                        </div>
                        <div>
                          <h3 className={`text-2xl font-bold ${getClubTextColor(club.name)}`}>{club.name}</h3>
                          <p className={`text-white/80 ${getClubTextColor(club.name)}`}>{club.type}</p>
                        </div>
                      </div>
                      {/* <div className="text-right">
                        <p className={`text-2xl font-bold ${getClubTextColor(club.name)}`}>
                          {club.member_count}
                        </p>
                        <p className={`text-sm font-bold ${getClubTextColor(club.name)}`}>members</p>
                      </div> */}
                    </div>
                  </div>
                  <div className="p-6">
                    {/* <h3 className={`text-2xl font-bold mb-3 ${getClubTextColor(club.name)}`}>
                      {club.name}
                    </h3> */}
                    <p className="text-zenith-secondary mb-6 leading-relaxed">
                      {club.description}
                    </p>
                    <div className="flex justify-between items-center">
                      {/* <div className="text-sm text-zenith-muted">
                        {club.upcoming_events} upcoming events
                      </div> */}
                      <Link
                        href={`/homeclub/${club.id}`}
                        className="inline-flex items-center text-zenith-accent hover:text-zenith-accent font-semibold transition-colors"
                      >
                        Learn More
                        <ChevronRight className="ml-1 w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* EVENT CALENDAR SECTION - Latest events and workshops */}
      <section id="events" className="py-20 bg-zenith-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-zenith-brand mb-4">
              Event Calendar
            </h2>
            <p className="text-xl text-zenith-secondary">
              A comprehensive look at the events and workshops driving student growth
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="bg-zenith-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-zenith cursor-pointer"
                onClick={() => {
                  if (!user) {
                    router.push('/login?redirect=' + encodeURIComponent(`/clubs/${event.club_id}/events/${event.id}`));
                  } else {
                    router.push(`/clubs/${event.club_id}/events/${event.id}`);
                  }
                }}
              >
                <div className={`bg-gradient-to-r ${event.club_color} p-4`}>
                  <div className="flex justify-between items-center text-white">
                    <span className="text-sm font-medium">
                      {event.club_name}
                    </span>
                    <span className="text-xs bg-zenith-card/20 px-2 py-1 rounded">
                      {new Date(event.event_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-zenith-primary mb-2">
                    {event.title}
                  </h3>
                  <p className="text-zenith-secondary mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="space-y-2 text-sm text-zenith-muted">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {event.event_time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <div>
                        <div>Organized by {event.organizer_name}</div>
                        {event.organizer_club_name && (
                          <div className="text-xs text-zenith-accent">
                            from {event.organizer_club_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/events"
              className="inline-flex items-center text-zenith-accent hover:text-zenith-accent font-semibold text-lg"
            >
              View All Events
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* RECENT POSTS SECTION - Latest forum posts and discussions */}
      <section className="py-20 bg-zenith-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-zenith-brand mb-4">
              Latest Posts
            </h2>
            <p className="text-xl text-zenith-secondary">
              Discover insights and discussions from our community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recentPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="bg-zenith-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-zenith cursor-pointer"
                onClick={() => {
                  if (!user) {
                    router.push('/login?redirect=' + encodeURIComponent(`/clubs/${post.club_id}/posts/${post.id}`));
                  } else {
                    router.push(`/clubs/${post.club_id}/posts/${post.id}`);
                  }
                }}
              >
                <div className={`bg-gradient-to-r ${post.club_color} p-4`}>
                  <div className="flex justify-between items-center text-white">
                    <span className="text-sm font-medium">
                      {post.club_name}
                    </span>
                    <span className="text-xs bg-zenith-card/20 px-2 py-1 rounded">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-zenith-primary mb-2">
                    {post.title}
                  </h3>
                  <p className="text-zenith-secondary mb-4 line-clamp-3">
                    {post.content?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-zenith-muted">
                      <div>By {post.author_name}</div>
                      {post.author_club_name && (
                        <div className="text-xs text-zenith-accent">
                          from {post.author_club_name}
                        </div>
                      )}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-1">
                        {post.tags.slice(0, 2).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-block bg-zenith-hover text-zenith-accent px-2 py-1 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/clubs"
              className="inline-flex items-center text-zenith-accent hover:text-zenith-accent font-semibold text-lg"
            >
              View All Posts
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      

      {/* CALL-TO-ACTION SECTION - Final conversion section */}
      <section className="py-20 bg-zenith-accent">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Reach Your Zenith?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of students who are already part of our growing
              community. Your journey to excellence starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-zenith-card text-zenith-accent hover:bg-zenith-section px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center"
              >
                Join Zenith Today
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#clubs"
                className="border-2 border-white text-white hover:bg-zenith-card hover:text-zenith-accent px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Explore Clubs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-zenith-section backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-zenith-primary">
                {stats.totalClubs}
              </div>
              <div className="text-sm text-zenith-secondary">
                Specialized Clubs
              </div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-zenith-primary">
                {stats.totalMembers}
              </div>
              <div className="text-sm text-zenith-secondary">
                Active Members
              </div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-zenith-primary">
                {stats.eventsConducted}
              </div>
              <div className="text-sm text-zenith-secondary">
                Events Conducted
              </div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-zenith-primary">
                {stats.totalPosts}
              </div>
              <div className="text-sm text-zenith-secondary">
                Posts
              </div>
            </div>
          </motion.div>
        </div>
      </section>
            {/* Developer Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zenith-primary mb-4">Meet the Developers</h2>
            <p className="text-lg text-zenith-secondary max-w-2xl mx-auto">
              The talented team behind Zenith Forum, building innovative solutions for the campus community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Developer 1
            <div className="bg-zenith-card rounded-2xl p-6 shadow-xl border border-zenith-border overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-zenith-primary mb-2">Atharva Naitam</h3>
                  <p className="text-blue-600 font-medium mb-3">Lead Developer</p>
                  <p className="text-zenith-secondary mb-4">
                    Full-stack developer with expertise in React, Next.js, and PostgreSQL. 
                    Passionate about creating meaningful user experiences. He also serves as the Innovation Head at Zenith Forum.
                  </p>
                  <div className="flex space-x-4 justify-center md:justify-start">
                    <a href="https://github.com/Vanesor" className="text-zenith-muted hover:text-blue-600 transition-colors">
                      <Github className="w-5 h-5" />
                    </a>
                    <a href="https://in.linkedin.com/in/atharva-naitam-b896521b4" className="text-zenith-muted hover:text-blue-600 transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a href="mailto:naitamatharva14@gmail.com" className="text-zenith-muted hover:text-blue-600 transition-colors">
                      <Mail className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div> */}
            {/* Developer 1: Atharva Naitam (Updated) */}
            <div className="bg-zenith-card rounded-2xl p-6 shadow-xl border border-zenith-border overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/images/atharva.png" 
                    alt="Atharva Naitam" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-zenith-primary mb-2">Atharva Naitam</h3>
                  <p className="text-blue-600 font-medium mb-3">Software Engineer | AI/ML Developer</p>
                  <p className="text-zenith-secondary mb-4">
                    A highly motivated Software Engineering student with a robust passion for AI/ML and building intelligent systems. His expertise spans across AI frameworks like LangChain and TensorFlow, full-stack development with React, and decentralized technologies .As the Innovation Head and a Founding Member, he played a pivotal role in establishing the Zenith Forum.
                  </p>
                  <div className="flex space-x-4 justify-center md:justify-start">
                    <a href="https://github.com/Vanesor" className="text-zenith-muted hover:text-blue-600 transition-colors" aria-label="GitHub Profile">
                      <Github className="w-5 h-5" />
                    </a>
                    <a href="https://in.linkedin.com/in/atharva-naitam-b896521b4" className="text-zenith-muted hover:text-blue-600 transition-colors" aria-label="LinkedIn Profile">
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a href="mailto:atharvanaitam14@gmail.com" className="text-zenith-muted hover:text-blue-600 transition-colors" aria-label="Send Email">
                      <Mail className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Developer 2: Ayush Kshirsagar (Updated) */}
            <div className="bg-zenith-card rounded-2xl p-6 shadow-xl border border-zenith-border overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/images/ayush.png" 
                    alt="Ayush Kshirsagar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-zenith-primary mb-2">Ayush Kshirsagar</h3>
                  <p className="text-purple-600 font-medium mb-3">Data Scientist & Full Stack Developer </p>
                  <p className="text-zenith-secondary mb-4">
                    A passionate developer skilled in building AI-powered solutions and responsive web applications. His experience includes training machine learning models and developing real-time gesture interpretation and translation systems using Python and OpenCV. He also serves as the Co-Coordinator for the Ascend Club at Zenith Forum.
                  </p>
                  <div className="flex space-x-4 justify-center md:justify-start">
                    <a href="https://github.com/08Ayush" target="_blank" rel="noopener noreferrer" className="text-zenith-muted hover:text-purple-600 transition-colors" aria-label="GitHub Profile">
                      <Github className="w-5 h-5" />
                    </a>
                    <a href="https://linkedin.com/in/ayush-kshirsagar-37766a257" target="_blank" rel="noopener noreferrer" className="text-zenith-muted hover:text-purple-600 transition-colors" aria-label="LinkedIn Profile">
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a href="mailto:ayushkshirsagar28@gmail.com" className="text-zenith-muted hover:text-purple-600 transition-colors" aria-label="Send Email">
                      <Mail className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <br /><br />
      <Footer></Footer>
    </div>
  );
}

// ============================================================================
// END OF LANDING PAGE COMPONENT
// ============================================================================
