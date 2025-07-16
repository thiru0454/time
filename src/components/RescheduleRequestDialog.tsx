import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Subject, Faculty } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

interface RescheduleRequestDialogProps {
  facultyId: string;
  subject: Subject;
  currentDay: string;
  currentTimeSlot: string;
  onRequestSubmitted: () => void;
}

interface ConflictCheck {
  hasConflict: boolean;
  conflictType: 'faculty' | 'room' | 'time' | 'none';
  conflictDescription: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  canAutoApprove: boolean;
}

const RescheduleRequestDialog: React.FC<RescheduleRequestDialogProps> = ({
  facultyId,
  subject,
  currentDay,
  currentTimeSlot,
  onRequestSubmitted
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [requestedDay, setRequestedDay] = useState('');
  const [requestedTimeSlot, setRequestedTimeSlot] = useState('');
  const [reason, setReason] = useState('');
  const [conflictCheck, setConflictCheck] = useState<ConflictCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const timeSlots = [
    '9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00', '12:00 to 12:55',
    '1:55 to 2:50', '2:50 to 3:45', '3:55 to 4:50'
  ];

  useEffect(() => {
    if (requestedDay && requestedTimeSlot) {
      checkForConflicts();
    }
  }, [requestedDay, requestedTimeSlot]);

  const checkForConflicts = async () => {
    if (!requestedDay || !requestedTimeSlot) return;

    setIsChecking(true);
    try {
      // Check if the requested slot is available
      const { data: existingAssignments, error } = await supabase
        .from('subject_assignments')
        .select(`
          *,
          faculty:faculty(*),
          subject:subjects(*)
        `)
        .or(`and(day.eq.${requestedDay},time_slot.eq.${requestedTimeSlot}),and(faculty_id.eq.${facultyId},day.eq.${requestedDay})`);

      if (error) throw error;

      let hasConflict = false;
      let conflictType: 'faculty' | 'room' | 'time' | 'none' = 'none';
      let conflictDescription = '';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let canAutoApprove = true;

      // Check for faculty conflicts (same faculty at same time)
      const facultyConflict = existingAssignments?.find(assignment => 
        assignment.faculty_id === facultyId && 
        assignment.day === requestedDay && 
        assignment.time_slot === requestedTimeSlot
      );

      if (facultyConflict) {
        hasConflict = true;
        conflictType = 'faculty';
        conflictDescription = `You are already assigned to ${facultyConflict.subject?.name} at this time`;
        severity = 'critical';
        canAutoApprove = false;
      }

      // Check for time slot conflicts (any assignment at same time)
      const timeConflict = existingAssignments?.find(assignment => 
        assignment.day === requestedDay && 
        assignment.time_slot === requestedTimeSlot
      );

      if (timeConflict && !facultyConflict) {
        hasConflict = true;
        conflictType = 'time';
        conflictDescription = `Time slot is occupied by ${timeConflict.subject?.name} (${timeConflict.faculty?.name})`;
        severity = 'high';
        canAutoApprove = false;
      }

      // Check for room conflicts (if room assignment exists)
      const roomConflict = existingAssignments?.find(assignment => 
        assignment.day === requestedDay && 
        assignment.time_slot === requestedTimeSlot &&
        assignment.room_id // Assuming room_id exists
      );

      if (roomConflict && !facultyConflict && !timeConflict) {
        hasConflict = true;
        conflictType = 'room';
        conflictDescription = `Room is occupied by ${roomConflict.subject?.name}`;
        severity = 'medium';
        canAutoApprove = true; // Room conflicts can be auto-approved
      }

      // Check for subject type preferences
      const isLabOrPractical = subject.subject_type?.toLowerCase().includes('lab') || 
                              subject.subject_type?.toLowerCase().includes('practical');
      const isMorningSlot = ['9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00'].includes(requestedTimeSlot);
      
      if (isLabOrPractical && !isMorningSlot) {
        hasConflict = true;
        conflictType = 'time';
        conflictDescription = 'Labs and practicals are preferred in morning slots';
        severity = 'low';
        canAutoApprove = true;
      }

      setConflictCheck({
        hasConflict,
        conflictType,
        conflictDescription,
        severity,
        canAutoApprove
      });

    } catch (error) {
      console.error('Error checking conflicts:', error);
      toast({
        title: "Error",
        description: "Failed to check for conflicts",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!requestedDay || !requestedTimeSlot || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine request status based on conflict check
      let status: 'pending' | 'approved' | 'rejected' = 'pending';
      
      if (conflictCheck?.hasConflict) {
        if (conflictCheck.canAutoApprove) {
          status = 'approved';
        } else {
          status = 'pending'; // Requires admin review
        }
      } else {
        status = 'approved'; // No conflicts, auto-approve
      }

      const { data, error } = await supabase
        .from('reschedule_requests')
        .insert([{
          faculty_id: facultyId,
          subject_id: subject.id,
          current_day: currentDay,
          current_time_slot: currentTimeSlot,
          requested_day: requestedDay,
          requested_time_slot: requestedTimeSlot,
          reason: reason.trim(),
          status,
          conflict_type: conflictCheck?.conflictType || 'none',
          conflict_severity: conflictCheck?.severity || 'low',
          conflict_description: conflictCheck?.conflictDescription || ''
        }])
        .select()
        .single();

      if (error) throw error;

      // If auto-approved, update the actual timetable
      if (status === 'approved') {
        await updateTimetableAssignment();
      }

      toast({
        title: status === 'approved' ? "Request Approved" : "Request Submitted",
        description: status === 'approved' 
          ? "Your reschedule request has been automatically approved and applied"
          : "Your reschedule request has been submitted for admin review",
        duration: 4000
      });

      setIsOpen(false);
      onRequestSubmitted();

    } catch (error: any) {
      console.error('Error submitting reschedule request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit reschedule request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTimetableAssignment = async () => {
    try {
      // Update the subject assignment in the timetable
      const { error } = await supabase
        .from('subject_assignments')
        .update({
          day: requestedDay,
          time_slot: requestedTimeSlot
        })
        .eq('faculty_id', facultyId)
        .eq('subject_id', subject.id);

      if (error) throw error;

    } catch (error) {
      console.error('Error updating timetable assignment:', error);
      // Don't show error to user as the request was already created
    }
  };

  const getConflictIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const getConflictColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-green-200 bg-green-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Request Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Reschedule Request</span>
          </DialogTitle>
          <DialogDescription>
            Request to reschedule {subject.name} from {currentDay} {currentTimeSlot}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{subject.name}</span>
                  <Badge variant="secondary">{subject.abbreviation || subject.code}</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Type: {subject.subject_type}</div>
                  <div>Hours: {subject.hours_per_week} per week</div>
                  <div>Current Schedule: {currentDay} {currentTimeSlot}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requested-day">Requested Day</Label>
                <Select value={requestedDay} onValueChange={setRequestedDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requested-time">Requested Time Slot</Label>
                <Select value={requestedTimeSlot} onValueChange={setRequestedTimeSlot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Reschedule</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for this reschedule request..."
                rows={3}
              />
            </div>
          </div>

          {/* Conflict Check */}
          {isChecking && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Checking for conflicts...
              </AlertDescription>
            </Alert>
          )}

          {conflictCheck && (
            <Card className={getConflictColor(conflictCheck.severity)}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getConflictIcon(conflictCheck.severity)}
                  <span>
                    {conflictCheck.hasConflict ? 'Conflict Detected' : 'No Conflicts'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    {conflictCheck.hasConflict ? conflictCheck.conflictDescription : 'The requested time slot is available'}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getConflictColor(conflictCheck.severity)}>
                      {conflictCheck.severity} severity
                    </Badge>
                    {conflictCheck.canAutoApprove && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Auto-approvable
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!requestedDay || !requestedTimeSlot || !reason.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleRequestDialog; 