import React, { createContext, useContext, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Users, BookOpen, Settings, Eye, EyeOff, Lock, Unlock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Outlet } from 'react-router-dom';
import { getUser } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'faculty' | 'student';

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  department_id?: string;
  faculty_id?: string;
  student_id?: string;
  permissions: string[];
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'timetable' | 'faculty' | 'students' | 'system' | 'reports';
  required_role: UserRole;
}

interface RoleBasedAccessControlProps {
  children: React.ReactNode;
}

interface RBACContextType {
  currentUser: User | null;
  userRole: UserRole;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  canAccess: (resource: string, action: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
}

const RBACContext = createContext<RBACContextType | null>(null);

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within a RoleBasedAccessControl provider');
  }
  return context;
};

// Permission definitions
const PERMISSIONS: Permission[] = [
  // Admin permissions
  { id: 'admin:all', name: 'Full Access', description: 'Complete system access', category: 'system', required_role: 'admin' },
  { id: 'timetable:create', name: 'Create Timetables', description: 'Generate new timetables', category: 'timetable', required_role: 'admin' },
  { id: 'timetable:edit', name: 'Edit Timetables', description: 'Modify existing timetables', category: 'timetable', required_role: 'admin' },
  { id: 'timetable:delete', name: 'Delete Timetables', description: 'Remove timetables', category: 'timetable', required_role: 'admin' },
  { id: 'faculty:manage', name: 'Manage Faculty', description: 'Add, edit, and remove faculty', category: 'faculty', required_role: 'admin' },
  { id: 'students:manage', name: 'Manage Students', description: 'Add, edit, and remove students', category: 'students', required_role: 'admin' },
  { id: 'reports:view', name: 'View Reports', description: 'Access system reports', category: 'reports', required_role: 'admin' },
  { id: 'settings:manage', name: 'Manage Settings', description: 'Configure system settings', category: 'system', required_role: 'admin' },

  // Faculty permissions
  { id: 'timetable:view', name: 'View Timetables', description: 'View assigned timetables', category: 'timetable', required_role: 'faculty' },
  { id: 'timetable:request_changes', name: 'Request Changes', description: 'Submit reschedule requests', category: 'timetable', required_role: 'faculty' },
  { id: 'faculty:view_profile', name: 'View Profile', description: 'View own faculty profile', category: 'faculty', required_role: 'faculty' },
  { id: 'faculty:edit_profile', name: 'Edit Profile', description: 'Update own faculty profile', category: 'faculty', required_role: 'faculty' },
  { id: 'assignments:view', name: 'View Assignments', description: 'View teaching assignments', category: 'faculty', required_role: 'faculty' },
  { id: 'assignments:request', name: 'Request Assignments', description: 'Request new assignments', category: 'faculty', required_role: 'faculty' },

  // Student permissions
  { id: 'timetable:view_student', name: 'View Student Timetable', description: 'View student timetable', category: 'timetable', required_role: 'student' },
  { id: 'student:view_profile', name: 'View Profile', description: 'View own student profile', category: 'students', required_role: 'student' },
  { id: 'student:edit_profile', name: 'Edit Profile', description: 'Update own student profile', category: 'students', required_role: 'student' },
  { id: 'courses:view', name: 'View Courses', description: 'View enrolled courses', category: 'students', required_role: 'student' },
];

// Role-based component wrappers
export const AdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasRole } = useRBAC();
  return hasRole('admin') ? <>{children}</> : null;
};

export const FacultyOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasRole } = useRBAC();
  return hasRole('faculty') ? <>{children}</> : null;
};

export const StudentOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasRole } = useRBAC();
  return hasRole('student') ? <>{children}</> : null;
};

export const RequirePermission: React.FC<{ 
  permission: string; 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, children, fallback }) => {
  const { hasPermission } = useRBAC();
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
};

const RoleBasedAccessControl: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const { data, error } = await getUser();
      if (error || !data?.user) {
        setAuthenticated(false);
        navigate('/auth', { replace: true });
      } else {
        setAuthenticated(true);
      }
      setLoading(false);
    };
    checkAuth();
    // Optionally, listen for auth state changes here
  }, [navigate]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Checking authentication...</div>;
  }

  if (!authenticated) {
    return null;
  }

  return <Outlet />;
};

export { RoleBasedAccessControl };

// Permission Management Component
export const PermissionManager: React.FC = () => {
  const { currentUser, userRole, permissions, hasPermission } = useRBAC();
  const { toast } = useToast();

  const groupedPermissions = PERMISSIONS.reduce((groups, permission) => {
    if (!groups[permission.category]) {
      groups[permission.category] = [];
    }
    groups[permission.category].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  if (!hasPermission('admin:all')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Access Denied</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            You don't have permission to view this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Permission Management</span>
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current User Info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <Avatar>
                <AvatarImage src={currentUser?.avatar_url} />
                <AvatarFallback>
                  {currentUser?.name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{currentUser?.name}</div>
                <div className="text-sm text-gray-600">{currentUser?.email}</div>
                <Badge variant="secondary">{userRole}</Badge>
              </div>
            </div>

            {/* Permissions by Category */}
            <Tabs defaultValue="timetable" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="timetable">Timetable</TabsTrigger>
                <TabsTrigger value="faculty">Faculty</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <div className="grid gap-4">
                    {perms.map(permission => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{permission.name}</div>
                          <div className="text-sm text-gray-600">{permission.description}</div>
                          <Badge variant="outline" className="text-xs">
                            {permission.required_role}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          {hasPermission(permission.id) ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleBasedAccessControl; 