import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Calendar, ExternalLink, RefreshCw, Settings, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { TimetableEntry } from '../types/timetable';

interface GoogleCalendarSyncProps {
  timetableData: TimetableEntry[];
  onSyncComplete?: (syncedEvents: any[]) => void;
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

interface SyncSettings {
  autoSync: boolean;
  syncInterval: number;
  includeLocation: boolean;
  includeDescription: boolean;
  reminderMinutes: number;
  colorId: string;
  defaultCalendar: string;
}

const GoogleCalendarSync: React.FC<GoogleCalendarSyncProps> = ({
  timetableData,
  onSyncComplete
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncedEvents, setSyncedEvents] = useState<GoogleCalendarEvent[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [settings, setSettings] = useState<SyncSettings>({
    autoSync: false,
    syncInterval: 30,
    includeLocation: true,
    includeDescription: true,
    reminderMinutes: 15,
    colorId: '1',
    defaultCalendar: 'primary'
  });
  const [availableCalendars, setAvailableCalendars] = useState<any[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');

  const { toast } = useToast();

  // Google Calendar API configuration
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id';
  const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'your-google-api-key';
  const SCOPES = ['https://www.googleapis.com/auth/calendar'];

  // Initialize Google API
  useEffect(() => {
    const loadGoogleAPI = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', initClient);
      };
      document.head.appendChild(script);
    };

    const initClient = () => {
      window.gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        scope: SCOPES.join(' '),
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
      }).then(() => {
        const authInstance = window.gapi.auth2.getAuthInstance();
        setIsAuthenticated(authInstance.isSignedIn.get());
        
        authInstance.isSignedIn.listen((isSignedIn: boolean) => {
          setIsAuthenticated(isSignedIn);
          if (isSignedIn) {
            loadUserCalendars();
          }
        });
      }).catch((error: any) => {
        console.error('Error initializing Google API:', error);
        toast({
          title: 'Authentication Error',
          description: 'Failed to initialize Google Calendar API',
          variant: 'destructive'
        });
      });
    };

    loadGoogleAPI();
  }, [GOOGLE_CLIENT_ID, GOOGLE_API_KEY, toast]);

  // Load user calendars
  const loadUserCalendars = useCallback(async () => {
    try {
      const response = await window.gapi.client.calendar.calendarList.list();
      const calendars = response.result.items || [];
      setAvailableCalendars(calendars);
      
      if (calendars.length > 0) {
        setSettings(prev => ({
          ...prev,
          defaultCalendar: calendars[0].id || 'primary'
        }));
      }
    } catch (error) {
      console.error('Error loading calendars:', error);
      toast({
        title: 'Calendar Error',
        description: 'Failed to load your calendars',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Authenticate with Google
  const handleAuthenticate = async () => {
    try {
      setIsLoading(true);
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      await loadUserCalendars();
      toast({
        title: 'Authentication Successful',
        description: 'Connected to Google Calendar successfully'
      });
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: 'Authentication Failed',
        description: 'Failed to connect to Google Calendar',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      setSyncedEvents([]);
      setConflicts([]);
      setLastSyncTime(null);
      setSyncStatus('idle');
      toast({
        title: 'Signed Out',
        description: 'Disconnected from Google Calendar'
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Check for calendar conflicts
  const checkConflicts = useCallback(async (events: TimetableEntry[]) => {
    const conflicts: any[] = [];
    
    try {
      const timeMin = new Date();
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 30); // Check next 30 days

      const response = await window.gapi.client.calendar.events.list({
        calendarId: settings.defaultCalendar,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const existingEvents = response.result.items || [];

      for (const timetableEvent of events) {
        const eventStart = new Date(timetableEvent.startTime);
        const eventEnd = new Date(timetableEvent.endTime);

        for (const existingEvent of existingEvents) {
          const existingStart = new Date(existingEvent.start.dateTime || existingEvent.start.date);
          const existingEnd = new Date(existingEvent.end.dateTime || existingEvent.end.date);

          // Check for time overlap
          if (eventStart < existingEnd && eventEnd > existingStart) {
            conflicts.push({
              timetableEvent,
              existingEvent,
              conflictType: 'time_overlap'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }

    return conflicts;
  }, [settings.defaultCalendar]);

  // Create Google Calendar event
  const createCalendarEvent = useCallback(async (event: TimetableEntry): Promise<GoogleCalendarEvent | null> => {
    try {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);

      const eventData: any = {
        summary: `${event.subject} - ${event.faculty}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
          useDefault: false,
          overrides: [
            {
              method: 'popup',
              minutes: settings.reminderMinutes
            }
          ]
        },
        colorId: settings.colorId
      };

      if (settings.includeLocation && event.room) {
        eventData.location = event.room;
      }

      if (settings.includeDescription) {
        eventData.description = `Subject: ${event.subject}\nFaculty: ${event.faculty}\nRoom: ${event.room}\nDay: ${event.day}`;
      }

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: settings.defaultCalendar,
        resource: eventData
      });

      return response.result;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }, [settings]);

  // Sync timetable to Google Calendar
  const handleSync = async () => {
    if (!isAuthenticated || timetableData.length === 0) {
      toast({
        title: 'Sync Error',
        description: 'Please authenticate and ensure you have timetable data',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      setSyncStatus('syncing');
      setSyncProgress(0);

      // Check for conflicts first
      const conflicts = await checkConflicts(timetableData);
      setConflicts(conflicts);

      if (conflicts.length > 0) {
        toast({
          title: 'Conflicts Detected',
          description: `${conflicts.length} conflicts found. Review before syncing.`,
          variant: 'destructive'
        });
        setSyncStatus('error');
        return;
      }

      const createdEvents: GoogleCalendarEvent[] = [];
      const totalEvents = timetableData.length;

      for (let i = 0; i < timetableData.length; i++) {
        const event = timetableData[i];
        const createdEvent = await createCalendarEvent(event);
        
        if (createdEvent) {
          createdEvents.push(createdEvent);
        }

        setSyncProgress(((i + 1) / totalEvents) * 100);
      }

      setSyncedEvents(createdEvents);
      setLastSyncTime(new Date());
      setSyncStatus('completed');

      toast({
        title: 'Sync Completed',
        description: `Successfully synced ${createdEvents.length} events to Google Calendar`
      });

      onSyncComplete?.(createdEvents);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync timetable to Google Calendar',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-sync functionality
  useEffect(() => {
    if (!settings.autoSync || !isAuthenticated) return;

    const interval = setInterval(() => {
      handleSync();
    }, settings.syncInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [settings.autoSync, settings.syncInterval, isAuthenticated]);

  // Resolve conflicts
  const resolveConflict = async (conflict: any, action: 'skip' | 'replace' | 'merge') => {
    try {
      if (action === 'replace') {
        // Delete existing event and create new one
        await window.gapi.client.calendar.events.delete({
          calendarId: settings.defaultCalendar,
          eventId: conflict.existingEvent.id
        });
        
        const newEvent = await createCalendarEvent(conflict.timetableEvent);
        if (newEvent) {
          setSyncedEvents(prev => [...prev, newEvent]);
        }
      } else if (action === 'merge') {
        // Update existing event with timetable data
        const updatedEvent = {
          ...conflict.existingEvent,
          summary: `${conflict.timetableEvent.subject} - ${conflict.timetableEvent.faculty}`,
          description: `Subject: ${conflict.timetableEvent.subject}\nFaculty: ${conflict.timetableEvent.faculty}\nRoom: ${conflict.timetableEvent.room}`
        };

        await window.gapi.client.calendar.events.update({
          calendarId: settings.defaultCalendar,
          eventId: conflict.existingEvent.id,
          resource: updatedEvent
        });
      }

      // Remove resolved conflict
      setConflicts(prev => prev.filter(c => c !== conflict));
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve conflict',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Sync
          </CardTitle>
          <CardDescription>
            Sync your timetable with Google Calendar for seamless scheduling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {isAuthenticated ? 'Connected to Google Calendar' : 'Not Connected'}
              </span>
            </div>
            {isAuthenticated ? (
              <Button variant="outline" onClick={handleSignOut} disabled={isLoading}>
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleAuthenticate} disabled={isLoading}>
                {isLoading ? 'Connecting...' : 'Connect to Google Calendar'}
              </Button>
            )}
          </div>

          {/* Sync Status */}
          {isAuthenticated && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sync Status</span>
                <Badge variant={syncStatus === 'completed' ? 'default' : syncStatus === 'error' ? 'destructive' : 'secondary'}>
                  {syncStatus === 'syncing' ? 'Syncing...' : 
                   syncStatus === 'completed' ? 'Completed' : 
                   syncStatus === 'error' ? 'Error' : 'Ready'}
                </Badge>
              </div>
              
              {syncStatus === 'syncing' && (
                <Progress value={syncProgress} className="w-full" />
              )}
              
              {lastSyncTime && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last synced: {lastSyncTime.toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Sync Settings */}
          {isAuthenticated && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-sync" className="text-sm font-medium">
                  Auto Sync
                </Label>
                <Switch
                  id="auto-sync"
                  checked={settings.autoSync}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSync: checked }))}
                />
              </div>

              {settings.autoSync && (
                <div className="space-y-2">
                  <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                  <Input
                    id="sync-interval"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.syncInterval}
                    onChange={(e) => setSettings(prev => ({ ...prev, syncInterval: parseInt(e.target.value) }))}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reminder-minutes">Reminder (minutes)</Label>
                  <Input
                    id="reminder-minutes"
                    type="number"
                    min="0"
                    max="1440"
                    value={settings.reminderMinutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, reminderMinutes: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calendar-select">Calendar</Label>
                  <Select
                    value={settings.defaultCalendar}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, defaultCalendar: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCalendars.map((calendar) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          {calendar.summary}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Event Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-location"
                      checked={settings.includeLocation}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeLocation: checked }))}
                    />
                    <Label htmlFor="include-location">Include room location</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-description"
                      checked={settings.includeDescription}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeDescription: checked }))}
                    />
                    <Label htmlFor="include-description">Include detailed description</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Button */}
          {isAuthenticated && (
            <Button 
              onClick={handleSync} 
              disabled={isLoading || timetableData.length === 0}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Sync to Google Calendar
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Conflicts Display */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Conflicts Found ({conflicts.length})
            </CardTitle>
            <CardDescription>
              Resolve conflicts before syncing to avoid duplicate events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conflicts.map((conflict, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{conflict.timetableEvent.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(conflict.timetableEvent.startTime).toLocaleString()} - 
                        {new Date(conflict.timetableEvent.endTime).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="destructive">Conflict</Badge>
                  </div>
                  
                  <div className="text-sm">
                    <p><strong>Existing Event:</strong> {conflict.existingEvent.summary}</p>
                    <p><strong>Conflict Type:</strong> {conflict.conflictType}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveConflict(conflict, 'skip')}
                    >
                      Skip
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveConflict(conflict, 'replace')}
                    >
                      Replace
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveConflict(conflict, 'merge')}
                    >
                      Merge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Synced Events Summary */}
      {syncedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Synced Events ({syncedEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncedEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{event.summary}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.start.dateTime).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`https://calendar.google.com/calendar/event?eid=${event.id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {syncedEvents.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  And {syncedEvents.length - 5} more events...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleCalendarSync; 