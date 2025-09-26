import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAuth?: boolean;
  adminOnly?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredAuth = true, 
  adminOnly = false 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requiredAuth && !isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  // If admin access is required but user is not admin
  if (adminOnly && (!user || !user.isAdmin)) {
    return <Redirect to="/auth" />;
  }

  // If user is authenticated but trying to access auth page
  if (!requiredAuth && isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}