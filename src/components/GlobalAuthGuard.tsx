"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UniversalLoader } from './UniversalLoader';

interface AuthGuardConfig {
  // Public routes that don't require authentication
  publicRoutes: string[];
  // Routes that are public but have auth-protected elements
  mixedRoutes: string[];
  // Routes that require authentication
  protectedRoutes: string[];
  // Role-based access control
  roleBasedRoutes: {
    [key: string]: string[]; // route pattern: required roles
  };
  // Default redirect paths
  redirects: {
    unauthenticated: string;
    unauthorized: string;
    afterLogin: string;
  };
}

const authConfig: AuthGuardConfig = {
  publicRoutes: [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/privacy',
    '/terms',
    '/support',
    '/help',
    '/contact',
    '/clubs', // Public club listing
    '/homeclub/[clubId]', // Public club pages
    '/events', // Public event listing
    '/events/[id]', // Public event details
    '/founding-team', // Public founding team page
    '/loader-demo', // Demo page
  ],
  mixedRoutes: [
    '/clubs/[clubId]', // Club pages - public but some features need auth
  ],
  protectedRoutes: [
    '/dashboard',
    '/profile',
    '/settings',
    '/security',
    '/projects',
    '/projects/[id]',
    '/assignments',
    '/assignments/[id]',
    '/management',
    '/members',
    '/onboarding',
    '/set-password',
    '/setup-2fa',
    '/playground',
    '/chat',
    '/chat/[id]',
    '/clubs/[clubId]/posts/create',
    '/clubs/[clubId]/settings',
    '/clubs/[clubId]/members',
    '/clubs/[clubId]/events/create',
  ],
  roleBasedRoutes: {
    '/admin': ['admin'],
    '/management': ['admin', 'coordinator', 'co_coordinator', 'secretary', 'president', 'vice_president'],
    '/clubs/[clubId]/posts/create': ['admin', 'coordinator', 'co_coordinator', 'committee_member'],
    '/clubs/[clubId]/settings': ['admin', 'coordinator', 'co_coordinator'],
    '/clubs/[clubId]/members': ['admin', 'coordinator', 'co_coordinator', 'committee_member'],
    '/clubs/[clubId]/events/create': ['admin', 'coordinator', 'co_coordinator', 'committee_member'],
  },
  redirects: {
    unauthenticated: '/login',
    unauthorized: '/dashboard',
    afterLogin: '/dashboard',
  },
};

interface GlobalAuthGuardProps {
  children: React.ReactNode;
}

export function GlobalAuthGuard({ children }: GlobalAuthGuardProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  // Check if current path matches a pattern
  const matchesPattern = (path: string, pattern: string): boolean => {
    if (pattern === path) return true;
    
    // Handle dynamic routes like [clubId]
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) return false;
    
    return patternParts.every((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) return true; // Dynamic segment
      return part === pathParts[index];
    });
  };

  // Check if route requires authentication
  const isPublicRoute = (): boolean => {
    return authConfig.publicRoutes.some(route => matchesPattern(pathname, route));
  };

  const isMixedRoute = (): boolean => {
    return authConfig.mixedRoutes.some(route => matchesPattern(pathname, route));
  };

  const isProtectedRoute = (): boolean => {
    return authConfig.protectedRoutes.some(route => matchesPattern(pathname, route));
  };

  // Check role-based access
  const hasRequiredRole = (): boolean => {
    if (!user) return false;
    
    for (const [pattern, requiredRoles] of Object.entries(authConfig.roleBasedRoutes)) {
      if (matchesPattern(pathname, pattern)) {
        return requiredRoles.includes(user.role);
      }
    }
    
    return true; // No specific role required
  };

  useEffect(() => {
    const checkAuth = async () => {
      // Still loading authentication state
      if (isLoading) {
        setLoadingMessage('Authenticating...');
        setIsChecking(true);
        return;
      }

      // Public routes - no auth needed
      if (isPublicRoute()) {
        setIsChecking(false);
        return;
      }

      // Mixed routes - allow access but may show different content
      if (isMixedRoute()) {
        setIsChecking(false);
        return;
      }

      // Protected routes - require authentication
      if (isProtectedRoute() || !isPublicRoute()) {
        if (!user) {
          setLoadingMessage('Redirecting to login...');
          setTimeout(() => {
            router.push(`${authConfig.redirects.unauthenticated}?redirect=${encodeURIComponent(pathname)}`);
          }, 1000);
          return;
        }

        // Check role-based access
        if (!hasRequiredRole()) {
          setLoadingMessage('Access denied. Redirecting...');
          setTimeout(() => {
            router.push(authConfig.redirects.unauthorized);
          }, 1000);
          return;
        }
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [user, isLoading, pathname, router]);

  // Show loader while checking authentication
  if (isChecking || isLoading) {
    return <UniversalLoader message={loadingMessage} />;
  }

  return <>{children}</>;
}

// Hook for components to check auth status
export function useAuthStatus() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  const isPublicRoute = authConfig.publicRoutes.some(route => {
    if (route === pathname) return true;
    const patternParts = route.split('/');
    const pathParts = pathname.split('/');
    if (patternParts.length !== pathParts.length) return false;
    return patternParts.every((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) return true;
      return part === pathParts[index];
    });
  });

  const isMixedRoute = authConfig.mixedRoutes.some(route => {
    if (route === pathname) return true;
    const patternParts = route.split('/');
    const pathParts = pathname.split('/');
    if (patternParts.length !== pathParts.length) return false;
    return patternParts.every((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) return true;
      return part === pathParts[index];
    });
  });

  return {
    isAuthenticated: !!user,
    user,
    isLoading,
    isPublicRoute,
    isMixedRoute,
    requiresAuth: !isPublicRoute && !isMixedRoute,
  };
}

// Component for protecting specific elements within mixed routes
interface ConditionalAuthWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRoles?: string[];
  requireAuth?: boolean;
  loadingMessage?: string;
}

export function ConditionalAuthWrapper({
  children,
  fallback = null,
  requiredRoles = [],
  requireAuth = true,
  loadingMessage = 'Checking permissions...'
}: ConditionalAuthWrapperProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <UniversalLoader message={loadingMessage} fullScreen={false} />;
  }

  if (requireAuth && !user) {
    return <>{fallback}</>;
  }

  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default GlobalAuthGuard;
