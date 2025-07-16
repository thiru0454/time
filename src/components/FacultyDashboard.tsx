import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, BookOpen, Users, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Subject, Faculty } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

interface FacultyAssignment {
  id: string;
  faculty_id: string;
  subject_id: string;
  section_id: string;
  created_at: string;
  subject: Subject;
  faculty: Faculty;
}

interface RescheduleRequest {
  id: string;
  faculty_id: string;
  subject_id: string;
  current_day: string;
  current_time_slot: string;
  requested_day: string;
  requested_time_slot: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  subject: Subject;
}

interface FacultyDashboardProps {
  facultyId: string;
  faculty: Faculty;
}

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ facultyId, faculty }) => {
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [personalTimetable, setPersonalTimetable] = useState<any>({});
  const [workloadStats, setWorkloadStats] = useState({
    totalHours: 0,
    maxHours: 0,
    utilization: 0,
    subjectsCount: 0,
    sectionsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const timeSlots = [
    '9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00', '12:00 to 12:55',
    '1:55 to 2:50', '2:50 to 3:45', '3:55 to 4:50'
  ];

  useEffect(() => {
    fetchFacultyData();
  }, [facultyId]);

  const fetchFacultyData = async () => {
    try {
      setLoading(true);

      // Fetch faculty assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('subject_assignments')
        .select(`
          *,
          subject:subjects(*),
          faculty:faculty(*)
        `)
        .eq('faculty_id', facultyId);

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

      // Fetch reschedule requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('reschedule_requests')
        .select(`
          *,
          subject:subjects(*)
        `)
        .eq('faculty_id', facultyId)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setRescheduleRequests(requestsData || []);

      // Calculate workload stats
      const totalHours = assignmentsData?.reduce((sum, assignment) => {
        return sum + (assignment.subject?.hours_per_week || 0);
      }, 0) || 0;

      const maxHours = faculty.max_hours_per_week || 20;
      const utilization = maxHours > 0 ? (totalHours / maxHours) * 100 : 0;

      setWorkloadStats({
        totalHours,
        maxHours,
        utilization,
        subjectsCount: assignmentsData?.length || 0,
        sectionsCount: new Set(assignmentsData?.map(a => a.section_id)).size
      });

      // Generate personal timetable
      generatePersonalTimetable(assignmentsData || []);

    } catch (error) {
      console.error('Error fetching faculty data:', error);
      toast({
        title: "Error",
        description: "Failed to load faculty dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalTimetable = (assignments: FacultyAssignment[]) => {
    const timetable: any = {};
    days.forEach(day => {
      timetable[day] = {};
      timeSlots.forEach(slot => {
        timetable[day][slot] = null;
      });
    });

    // This would be populated with actual timetable data
    // For now, we'll create a mock timetable based on assignments
    assignments.forEach(assignment => {
      const subject = assignment.subject;
      const hoursPerWeek = subject.hours_per_week || 1;
      
      // Distribute hours across the week
      for (let i = 0; i < hoursPerWeek; i++) {
        const day = days[i % days.length];
        const slot = timeSlots[i % timeSlots.length];
        
        if (!timetable[day][slot]) {
          timetable[day][slot] = {
            subject: subject.name,
            subjectCode: subject.code,
            abbreviation: subject.abbreviation,
            type: subject.subject_type,
            section: assignment.section_id
          };
        }
      }
    });

    setPersonalTimetable(timetable);
  };

  const createRescheduleRequest = async (
    subjectId: string,
    currentDay: string,
    currentTimeSlot: string,
    requestedDay: string,
    requestedTimeSlot: string,
    reason: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('reschedule_requests')
        .insert([{
          faculty_id: facultyId,
          subject_id: subjectId,
          current_day: currentDay,
          current_time_slot: currentTimeSlot,
          requested_day: requestedDay,
          requested_time_slot: requestedTimeSlot,
          reason,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your reschedule request has been submitted for review",
        duration: 4000
      });

      // Refresh data
      fetchFacultyData();

    } catch (error: any) {
      console.error('Error creating reschedule request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit reschedule request",
        variant: "destructive"
      });
    }
  };

  const getAssignmentSummary = () => {
    if (assignments.length === 0) {
      return "No assignments found";
    }

    const summary = assignments.map(assignment => {
      const subject = assignment.subject;
      const hours = subject.hours_per_week || 1;
      return `${subject.code} for ${subject.name}, ${hours} hours/week`;
    }).join('; ');

    return summary;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={faculty.avatar_url} />
          <AvatarFallback className="text-lg font-semibold">
            {faculty.name?.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{faculty.name}</h1>
          <p className="text-gray-600">{faculty.email}</p>
          <p className="text-sm text-gray-500">{faculty.department_id}</p>
        </div>
      </div>

      {/* Assignment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Assignment Summary</span>
          </CardTitle>
          <CardDescription>
            Your current teaching assignments and workload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                {getAssignmentSummary()}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{workloadStats.totalHours}</div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{workloadStats.subjectsCount}</div>
                <div className="text-sm text-gray-600">Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{workloadStats.sectionsCount}</div>
                <div className="text-sm text-gray-600">Sections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{workloadStats.utilization.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Utilization</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Workload Progress</span>
                <span>{workloadStats.totalHours}/{workloadStats.maxHours} hours</span>
              </div>
              <Progress value={workloadStats.utilization} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="timetable" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timetable">Personal Timetable</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="requests">Reschedule Requests</TabsTrigger>
        </TabsList>

        {/* Personal Timetable Tab */}
        <TabsContent value="timetable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Your Weekly Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-2 text-left font-medium">Time</th>
                      {days.map(day => (
                        <th key={day} className="border border-gray-200 p-2 text-center font-medium">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((timeSlot, index) => (
                      <tr key={timeSlot}>
                        <td className="border border-gray-200 p-2 text-sm font-medium bg-gray-50">
                          {timeSlot}
                        </td>
                        {days.map(day => {
                          const assignment = personalTimetable[day]?.[timeSlot];
                          return (
                            <td key={day} className="border border-gray-200 p-2 text-center">
                              {assignment ? (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-blue-600">
                                    {assignment.abbreviation || assignment.subjectCode}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {assignment.subject}
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {assignment.type}
                                  </Badge>
                                </div>
                              ) : (
                                <div className="text-gray-400 text-xs">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Current Assignments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.map(assignment => {
                  const subject = assignment.subject;
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{subject.name}</div>
                        <div className="text-sm text-gray-600">
                          Code: {subject.code} | Type: {subject.type} | Hours: {subject.hours_per_week}
                        </div>
                        <div className="text-xs text-gray-500">
                          Section: {assignment.section_id}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="secondary">
                          {subject.abbreviation || 'N/A'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Open reschedule request dialog
                            toast({
                              title: "Feature",
                              description: "Reschedule request feature coming soon",
                              duration: 3000
                            });
                          }}
                        >
                          Request Change
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reschedule Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Reschedule Requests</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rescheduleRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No reschedule requests found
                  </div>
                ) : (
                  rescheduleRequests.map(request => {
                    const subject = request.subject;
                    return (
                      <div key={request.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(request.status)}
                            <span className="font-medium">{subject.name}</span>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-700">Current Schedule</div>
                            <div className="text-gray-600">
                              {request.current_day} {request.current_time_slot}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">Requested Schedule</div>
                            <div className="text-gray-600">
                              {request.requested_day} {request.requested_time_slot}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium text-gray-700">Reason</div>
                          <div className="text-gray-600">{request.reason}</div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Requested on {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacultyDashboard; 