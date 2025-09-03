import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Redirect to login
    setLocation("/login");
    return null;
  }

  // If user is authenticated but shouldn't be (like on login/signup pages)
  if (!requireAuth && isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return <>{children}</>;
}

// Convenience component for pages that require authentication
export function RequireAuth({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

// Convenience component for pages that should redirect if authenticated (login/signup)
export function RequireGuest({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
}
