import { useAuth } from "@/contexts/AuthContext";

export const useAdminGuard = () => {
  const { user, userRoles } = useAuth();
  
  // Mock admin check - in real app, this would check actual roles
  const isAdmin = () => {
    // For demo purposes, consider users with specific emails as admin
    const adminEmails = ['admin@dosagezen.com', 'test@admin.com'];
    
    // Or check if user has admin role
    const hasAdminRole = userRoles?.some(role => role.role === 'admin');
    
    // Mock check - if email contains 'admin' or has admin role
    const isAdminUser = user?.email?.includes('admin') || 
                       adminEmails.includes(user?.email || '') ||
                       hasAdminRole;
    
    return isAdminUser || false;
  };
  
  return { isAdmin: isAdmin() };
};