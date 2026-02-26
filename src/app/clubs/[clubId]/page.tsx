"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Crown,
  Shield,
  Plus,
  Heart,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { useOptionalAuth } from "@/hooks/useAuthGuard";
import UserAvatar from "@/components/UserAvatar";
import ClubLogo from "@/components/ClubLogo";
import { SectionLoader } from "@/components/UniversalLoader";
import { motion } from "framer-motion";

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
    coordinator: { name: string; avatar?: string; profile_image_url?: string } | null;
    co_coordinator: { name: string; avatar?: string; profile_image_url?: string } | null;
    secretary: { name: string; avatar?: string; profile_image_url?: string } | null;
    media: { name: string; avatar?: string; profile_image_url?: string } | null;
  };
  members: Array<{
    id: string;
    name: string;
    role: string;
    avatar?: string;
    profile_image_url?: string;
    joined_at: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    location: string;
    max_attendees?: number;
    attendeeCount?: number;
  }>;
  posts: Array<{
    id: string;
    title: string;
    content: string;
    excerpt: string;
    author: { 
      id: string;
      name: string; 
      avatar?: string;
      profile_image_url?: string;
    } | null;
    likeCount: number;
    commentCount: number;
    viewCount: number;
    created_at: string;
  }>;
}

export default function ClubPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useOptionalAuth();
  const currentClubId = params.clubId as string;
  
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Try to get token from multiple sources
        const zenithToken = localStorage.getItem('zenith-token');
        const nextAuthToken = document.cookie.split('; ').find(row => row.startsWith('next-auth.session-token'))?.split('=')[1];
        const token = zenithToken || nextAuthToken;
        
        const response = await fetch(`/api/clubs/${currentClubId}`, {
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
            ...(token && {
              Authorization: `Bearer ${token}`
            })
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch club data");
        }

        const data = await response.json();
        setClubData(data);

        // Check user permissions
        if (auth.user) {
          // Create a session if needed
          if (auth.user && (!localStorage.getItem('session-created'))) {
            try {
              console.log('Creating session for user:', auth.user.email);
              const sessionResponse = await fetch('/api/auth/create-session', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  ...(token && {
                    Authorization: `Bearer ${token}`
                  })
                },
              });
              
              if (sessionResponse.ok) {
                localStorage.setItem('session-created', 'true');
                console.log('Session created successfully');
              }
            } catch (sessionError) {
              console.error('Error creating session:', sessionError);
            }
          }
          
          const permResponse = await fetch('/api/clubs/permissions', {
            credentials: 'include',
            headers: {
              ...(token && {
                Authorization: `Bearer ${token}`
              })
            },
          });
          
          if (permResponse.ok) {
            const permData = await permResponse.json();
            setUserPermissions(permData.permissions);
            console.log("Permissions data received:", permData.permissions);
          } else {
            console.error("Failed to fetch permissions:", permResponse.status);
          }
        }
      } catch (err) {
        setError("Failed to load club data");
        console.error("Error fetching club data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentClubId) {
      fetchData();
    }
  }, [auth.user, currentClubId]);

  const canCreatePost = () => {
    if (!auth.user) {
      console.log("No authenticated user");
      return false;
    }
    
    // Debug user permissions
    console.log("User Permissions for Create Post:", {
      user: auth.user,
      role: auth.user.role,
      permissions: userPermissions,
    });
    
    // If we have explicit permissions from the API, use those
    if (userPermissions && typeof userPermissions.canCreatePost === 'boolean') {
      console.log(`Using API permission: canCreatePost = ${userPermissions.canCreatePost}`);
      return userPermissions.canCreatePost;
    }
    
    // Fallback: Check if user has a privileged role
    const privilegedRoles = [
      'admin',
      'innovation_head',
      'president',
      'vice_president',
      'secretary',
      'treasurer',
      'outreach_coordinator',
      'media_head',
      'media',
      'co_coordinator',
      'coordinator',
    ];
    
    const userRole = auth.user.role.toLowerCase();
    const hasPrivilegedRole = privilegedRoles.includes(userRole);
    console.log(`Fallback role check: ${userRole} is privileged = ${hasPrivilegedRole}`);
    
    return hasPrivilegedRole;
  };

  const handlePostClick = (postId: string) => {
    router.push(`/clubs/${currentClubId}/posts/${postId}`);
  };

  const handleJoinClub = async () => {
    if (!auth.user || isJoining) return;
    
    try {
      setIsJoining(true);
      
      const response = await fetch(`/api/clubs/${currentClubId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("zenith-token")}`,
        },
      });

      if (response.ok) {
        // Refresh the page to show updated membership status
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to join club');
      }
    } catch (error) {
      console.error('Error joining club:', error);
      alert('Failed to join club');
    } finally {
      setIsJoining(false);
    }
  };

  if (auth.isLoading || loading) {
    return <SectionLoader message="Loading club information..." />;
  }

  if (error || !clubData) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">
            {error || "Club Not Found"}
          </h1>
          <Link
            href="/clubs"
            className="text-zenith-accent hover:no-underline"
          >
            Back to Clubs
          </Link>
        </div>
      </div>
    );
  }

  const { club, members = [], events = [], posts = [] } = clubData;

  // Check if user is already a member of this club or any club
  const isUserMemberOfThisClub = auth.user?.club_id === club.id;
  const hasUserJoinedAnyClub = auth.user?.club_id != null;

  return (
    <div className="min-h-screen bg-zenith-main transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/clubs')}
            className="flex items-center gap-2 text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Clubs
          </button>
        </div>

        {/* Club Header */}
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className={`bg-gradient-to-r ${club.color} p-8 text-primary`}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 bg-card/20 rounded-2xl flex items-center justify-center">
                <ClubLogo 
                  clubId={club.id}
                  clubName={club.name}
                  size="xl"
                  fallbackIcon={club.icon}
                  className="text-primary"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{club.name}</h1>
                <p className="text-xl opacity-90">{club.type}</p>
                <p className="text-lg opacity-80 mt-2">{club.description}</p>
                <div className="flex items-center gap-4 mt-4 text-sm opacity-80">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{club.memberCount} members</span>
                  </div>
                </div>
              </div>
              
              {/* Join Button */}
              {auth.user && (
                <div className="flex flex-col gap-2">
                  {isUserMemberOfThisClub ? (
                    <div className="bg-card/20 px-4 py-2 rounded-lg text-center">
                      <span className="text-sm font-medium">✓ Joined</span>
                    </div>
                  ) : !hasUserJoinedAnyClub ? (
                    <button
                      onClick={() => handleJoinClub()}
                      disabled={isJoining}
                      className="bg-card/20 hover:bg-card/30 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {isJoining ? 'Joining...' : 'Join Club'}
                    </button>
                  ) : (
                    <div className="bg-card/20 px-4 py-2 rounded-lg text-center">
                      <span className="text-sm opacity-70">Already in a club</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

           {/* Events Section */}
           <div className="bg-card rounded-xl p-6 shadow-lg">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                 <Calendar className="w-5 h-5" />
                 Recent Events
               </h2>
               {canCreatePost() && (
                 <button
                  onClick={() => router.push(`/clubs/${club.id}/events/create`)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </button>
              )}
            </div>
            <div className="space-y-4">
              {events.length > 0 ? (
                events.slice(0, 3).map((event) => (
                  <Link 
                    href={`/events/${event.id}`} 
                    key={event.id} 
                    className="block border border-custom rounded-lg p-4 hover:border-blue-500 transition-colors group"
                  >
                    <h3 className="font-semibold text-primary mb-2 group-hover:text-blue-500">{event.title}</h3>
                    <p className="text-secondary text-sm mb-3 line-clamp-2">{event.description}</p>
                    <div className="flex items-center justify-between text-sm text-muted">
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      <span>{event.max_attendees || event.attendeeCount || 0}+ Participants</span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-secondary text-center py-4">No events yet</p>
              )}
            </div>
          </div>

            {/* Posts Section */}
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Posts
                </h2>
                {canCreatePost() && (
                  <button
                    onClick={() => router.push(`/clubs/${club.id}/posts/create`)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create Post
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handlePostClick(post.id)}
                      className="border border-custom rounded-lg p-4 cursor-pointer hover:border-purple-500 transition-colors"
                    >
                      {/* Post Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <ClubLogo 
                          clubId={club.id}
                          clubName={club.name}
                          size="sm"
                          fallbackIcon={club.icon}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary">{club.name}</span>
                            <span className="text-sm text-secondary">•</span>
                            <span className="text-sm text-secondary">
                              by {post.author?.name || "Unknown"}
                            </span>
                          </div>
                          <p className="text-sm text-muted">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <h3 className="font-semibold text-primary mb-2">{post.title}</h3>
                      <p className="text-secondary text-sm mb-3 line-clamp-2">{post?.excerpt == null ? '' : post?.excerpt}</p>
                      
                      <div className="flex items-center justify-between text-sm text-muted">
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-muted mx-auto mb-3" />
                    <p className="text-secondary">No posts yet</p>
                    <p className="text-sm text-muted">Be the first to share something!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leadership Team */}
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-primary mb-4">
                Leadership Team
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <UserAvatar 
                    name={club.coordinator?.name}
                    avatar={club.coordinator?.avatar}
                    profile_image_url={club.coordinator?.profile_image_url}
                    size="sm"
                  />
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-primary">
                      {club.coordinator?.name || "Not assigned"}
                    </p>
                    <p className="text-sm text-secondary">Coordinator</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <UserAvatar 
                    name={club.co_coordinator?.name}
                    avatar={club.co_coordinator?.avatar}
                    profile_image_url={club.co_coordinator?.profile_image_url}
                    size="sm"
                  />
                  <Shield className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-primary">
                      {club.co_coordinator?.name || "Not assigned"}
                    </p>
                    <p className="text-sm text-secondary">Co-Coordinator</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <UserAvatar 
                    name={club.secretary?.name}
                    avatar={club.secretary?.avatar}
                    profile_image_url={club.secretary?.profile_image_url}
                    size="sm"
                  />
                  <FileText className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-primary">
                      {club.secretary?.name || "Not assigned"}
                    </p>
                    <p className="text-sm text-secondary">Secretary</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <UserAvatar 
                    name={club.media?.name}
                    avatar={club.media?.avatar}
                    profile_image_url={club.media?.profile_image_url}
                    size="sm"
                  />
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-primary">
                      {club.media?.name || "Not assigned"}
                    </p>
                    <p className="text-sm text-secondary">Media Head</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
