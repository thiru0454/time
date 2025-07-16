import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  Users, 
  Building, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  Brain,
  Settings,
  BarChart3,
  Shield,
  Coffee,
  Calendar,
  Target,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Subject, Faculty } from '@/integrations/supabase/types';
import { 
  EnhancedTimetableGenerator as EnhancedGenerator,
  EnhancedGenerationSettings,
  EnhancedTimetableResult
} from '@/utils/enhancedTimetableGenerator';
import { AdvancedSchedulingSettings } from '@/utils/advancedSchedulingEngine';

interface EnhancedTimetableGeneratorProps {
  subjects: Subject[];
  faculty: Faculty[];
  selectedDepartment: string;
  selectedYear: string;
  selectedSection: string;
  onTimetableGenerated: (timetable: any) => void;
}

const EnhancedTimetableGenerator: React.FC<EnhancedTimetableGeneratorProps> = ({
  subjects,
  faculty,
  selectedDepartment,
  selectedYear,
  selectedSection,
  onTimetableGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<EnhancedTimetableResult | null>(null);
  const [settings, setSettings] = useState<EnhancedGenerationSettings>({
    // Advanced Scheduling Settings
    advancedScheduling: {
      enableConflictDetection: true,
      autoResolveConflicts: true,
      maxConflictResolutionAttempts: 100,
      enableRoomAssignment: true,
      prioritizeRoomCapacity: true,
      requireEquipmentMatch: false,
      enableAIOptimization: true,
      optimizeForFacultyPreferences: true,
      optimizeForStudentLoad: true,
      enableRecurringEvents: false,
      defaultRecurrencePattern: 'weekly',
      enableBreakManagement: true,
      minBreakDuration: 15,
      preferredBreakTimes: ['12:00 to 12:55'],
      maxFacultyHoursPerDay: 6,
      maxFacultyHoursPerWeek: 20,
      balanceFacultyWorkload: true,
      maxDailyHours: 7,
      avoidConsecutiveTheory: true,
      prioritizeMorningLabs: false
    },
    
    // Conflict Resolution
    enableRealTimeConflictDetection: true,
    autoResolveConflicts: true,
    conflictResolutionStrategy: 'balanced',
    
    // Faculty Collision Detection
    enableFacultyCollisionDetection: true,
    maxFacultyCollisionsPerDay: 0,
    facultyCollisionPenalty: 50,
    
    // Room Management
    enableSmartRoomAssignment: true,
    roomCapacityThreshold: 80,
    equipmentMatchingRequired: false,
    
    // Time Slot Optimization
    enableAIOptimization: true,
    optimizationAlgorithm: 'genetic',
    maxOptimizationIterations: 1000,
    
    // Break Time Management
    enableBreakTimeManagement: true,
    mandatoryBreakAfterHours: 4,
    preferredBreakTimes: ['12:00 to 12:55', '3:55 to 4:50'],
    
    // Recurring Events
    enableRecurringEvents: false,
    recurringEventPattern: 'weekly',
    
    // Quality Assurance
    enableQualityScoring: true,
    minimumQualityScore: 70,
    qualityMetrics: {
      facultyWorkloadBalance: 25,
      roomUtilization: 20,
      timeSlotEfficiency: 25,
      conflictResolution: 30
    }
  });

  const { toast } = useToast();

  const handleGenerateTimetable = async () => {
    if (subjects.length === 0) {
      toast({
        title: "No Subjects",
        description: "Please add subjects before generating timetable.",
        variant: "destructive"
      });
      return;
    }

    if (faculty.length === 0) {
      toast({
        title: "No Faculty",
        description: "Please add faculty members before generating timetable.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setResult(null);

    // Create enhanced generator
    const generator = new EnhancedGenerator(settings);

    // Mock room data (in real implementation, this would come from database)
    const mockRooms = [
      { roomId: 'room1', roomName: 'Lab 101', capacity: 30, equipment: ['computers', 'projector'], availability: {} },
      { roomId: 'room2', roomName: 'Theory 201', capacity: 60, equipment: ['projector'], availability: {} },
      { roomId: 'room3', roomName: 'Lab 301', capacity: 25, equipment: ['computers', 'equipment'], availability: {} }
    ];

    // Mock break times
    const breakTimes = [
      { startTime: '12:00', endTime: '12:55', duration: 55, type: 'lunch' as const },
      { startTime: '3:55', endTime: '4:50', duration: 55, type: 'short' as const }
    ];

    const steps = [
      { progress: 5, step: "Initializing Advanced Scheduling Engine..." },
      { progress: 15, step: "Detecting Faculty Collisions..." },
      { progress: 25, step: "Analyzing Room Requirements..." },
      { progress: 35, step: "Optimizing Time Slot Distribution..." },
      { progress: 45, step: "Resolving Scheduling Conflicts..." },
      { progress: 55, step: "Applying AI Optimization Algorithms..." },
      { progress: 65, step: "Scheduling Break Times..." },
      { progress: 75, step: "Assigning Rooms Intelligently..." },
      { progress: 85, step: "Calculating Quality Metrics..." },
      { progress: 95, step: "Finalizing Enhanced Timetable..." },
      { progress: 100, step: "Generation Complete!" }
    ];

    try {
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setGenerationProgress(step.progress);
        setCurrentStep(step.step);
      }

      // Generate enhanced timetable
      const enhancedResult = await generator.generateEnhancedTimetable(
        subjects,
        faculty,
        mockRooms,
        breakTimes
      );

      setResult(enhancedResult);
      onTimetableGenerated(enhancedResult.timetable);

      // Show success message
      const qualityScore = enhancedResult.qualityScore;
      const conflictCount = enhancedResult.unresolvedConflicts.length;
      const collisionCount = enhancedResult.facultyCollisions.length;

      if (qualityScore >= 90) {
        toast({
          title: "🎉 Excellent Generation!",
          description: `Quality Score: ${qualityScore}% | Conflicts: ${conflictCount} | Collisions: ${collisionCount}`,
          duration: 5000
        });
      } else if (qualityScore >= 70) {
        toast({
          title: "✅ Good Generation",
          description: `Quality Score: ${qualityScore}% | Conflicts: ${conflictCount} | Collisions: ${collisionCount}`,
          duration: 5000
        });
      } else {
        toast({
          title: "⚠️ Generation Complete",
          description: `Quality Score: ${qualityScore}% | Conflicts: ${conflictCount} | Collisions: ${collisionCount}`,
          variant: "destructive",
          duration: 5000
        });
      }

    } catch (error) {
      console.error('Enhanced generation error:', error);
      toast({
        title: "❌ Generation Failed",
        description: "An error occurred during enhanced timetable generation.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConflictSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
            <Settings className="h-5 w-5" />
            Enhanced Generation Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="conflicts" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
              <TabsTrigger value="conflicts" className="text-gray-800 dark:text-zinc-100">🛡️ Conflicts</TabsTrigger>
              <TabsTrigger value="optimization" className="text-gray-800 dark:text-zinc-100">🤖 AI Optimization</TabsTrigger>
              <TabsTrigger value="rooms" className="text-gray-800 dark:text-zinc-100">🏢 Rooms</TabsTrigger>
              <TabsTrigger value="breaks" className="text-gray-800 dark:text-zinc-100">☕ Breaks</TabsTrigger>
            </TabsList>

            <TabsContent value="conflicts" className="space-y-4 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
                    <Shield className="h-4 w-4" />
                    Real-time Conflict Detection
                  </Label>
                  <Switch
                    checked={settings.enableRealTimeConflictDetection}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, enableRealTimeConflictDetection: checked }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
                    <Zap className="h-4 w-4" />
                    Auto-resolve Conflicts
                  </Label>
                  <Switch
                    checked={settings.autoResolveConflicts}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, autoResolveConflicts: checked }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-800 dark:text-zinc-100">Conflict Resolution Strategy</Label>
                <Select
                  value={settings.conflictResolutionStrategy}
                  onValueChange={(value: 'aggressive' | 'conservative' | 'balanced') => 
                    setSettings(prev => ({ ...prev, conflictResolutionStrategy: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
                    <SelectItem value="aggressive" className="text-gray-800 dark:text-zinc-100">Aggressive (Fast)</SelectItem>
                    <SelectItem value="balanced" className="text-gray-800 dark:text-zinc-100">Balanced (Recommended)</SelectItem>
                    <SelectItem value="conservative" className="text-gray-800 dark:text-zinc-100">Conservative (Thorough)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
                    <Brain className="h-4 w-4" />
                    AI Optimization
                  </Label>
                  <Switch
                    checked={settings.enableAIOptimization}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, enableAIOptimization: checked }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
                    <Target className="h-4 w-4" />
                    Faculty Preferences
                  </Label>
                  <Switch
                    checked={settings.advancedScheduling.optimizeForFacultyPreferences}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        advancedScheduling: { 
                          ...prev.advancedScheduling, 
                          optimizeForFacultyPreferences: checked 
                        } 
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-800 dark:text-zinc-100">Optimization Algorithm</Label>
                <Select
                  value={settings.optimizationAlgorithm}
                  onValueChange={(value: 'genetic' | 'simulated_annealing' | 'greedy') => 
                    setSettings(prev => ({ ...prev, optimizationAlgorithm: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
                    <SelectItem value="genetic" className="text-gray-800 dark:text-zinc-100">Genetic Algorithm</SelectItem>
                    <SelectItem value="simulated_annealing" className="text-gray-800 dark:text-zinc-100">Simulated Annealing</SelectItem>
                    <SelectItem value="greedy" className="text-gray-800 dark:text-zinc-100">Greedy Algorithm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="rooms" className="space-y-4 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
                    <Building className="h-4 w-4" />
                    Smart Room Assignment
                  </Label>
                  <Switch
                    checked={settings.enableSmartRoomAssignment}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, enableSmartRoomAssignment: checked }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
                    <Users className="h-4 w-4" />
                    Equipment Matching
                  </Label>
                  <Switch
                    checked={settings.equipmentMatchingRequired}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, equipmentMatchingRequired: checked }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-800 dark:text-zinc-100">Room Capacity Threshold (%)</Label>
                <Input
                  type="number"
                  value={settings.roomCapacityThreshold}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, roomCapacityThreshold: parseInt(e.target.value) }))
                  }
                  min="50"
                  max="100"
                  className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100"
                />
              </div>
            </TabsContent>

            <TabsContent value="breaks" className="space-y-4 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
                    <Coffee className="h-4 w-4" />
                    Break Time Management
                  </Label>
                  <Switch
                    checked={settings.enableBreakTimeManagement}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, enableBreakTimeManagement: checked }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
                    <Calendar className="h-4 w-4" />
                    Recurring Events
                  </Label>
                  <Switch
                    checked={settings.enableRecurringEvents}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, enableRecurringEvents: checked }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-800 dark:text-zinc-100">Mandatory Break After (Hours)</Label>
                <Input
                  type="number"
                  value={settings.mandatoryBreakAfterHours}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, mandatoryBreakAfterHours: parseInt(e.target.value) }))
                  }
                  min="1"
                  max="8"
                  className="bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generation Button */}
      <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
        <CardContent className="pt-6">
          <Button 
            onClick={handleGenerateTimetable}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Generating Enhanced Timetable...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate Enhanced Timetable
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {isGenerating && (
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800 dark:text-zinc-100">Generation Progress</span>
                <span className="text-sm text-muted-foreground text-gray-800 dark:text-zinc-100">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-gray-800 dark:text-zinc-100">{currentStep}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Quality Score */}
          <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
                <BarChart3 className="h-5 w-5" />
                Generation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold p-2 rounded-lg ${getQualityScoreColor(result.qualityScore)}`}>
                    {result.qualityScore}%
                  </div>
                  <p className="text-sm text-muted-foreground text-gray-800 dark:text-zinc-100 mt-1">Quality Score</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 bg-blue-100 p-2 rounded-lg">
                    {result.stats.filledSlots}/{result.stats.totalSlots}
                  </div>
                  <p className="text-sm text-muted-foreground text-gray-800 dark:text-zinc-100 mt-1">Slots Filled</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 bg-orange-100 p-2 rounded-lg">
                    {result.unresolvedConflicts.length}
                  </div>
                  <p className="text-sm text-muted-foreground text-gray-800 dark:text-zinc-100 mt-1">Conflicts</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 bg-red-100 p-2 rounded-lg">
                    {result.facultyCollisions.length}
                  </div>
                  <p className="text-sm text-muted-foreground text-gray-800 dark:text-zinc-100 mt-1">Collisions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conflicts Display */}
          {result.unresolvedConflicts.length > 0 && (
            <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Unresolved Conflicts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.unresolvedConflicts.map((conflict, index) => (
                    <Alert key={index} className="bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getConflictSeverityColor(conflict.severity)}>
                            {conflict.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                            {conflict.type}
                          </Badge>
                        </div>
                        <p className="font-medium text-gray-800 dark:text-zinc-100">{conflict.description}</p>
                        <p className="text-sm text-muted-foreground text-gray-800 dark:text-zinc-100 mt-1">
                          Suggested: {conflict.suggestedResolution}
                        </p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Faculty Collisions */}
          {result.facultyCollisions.length > 0 && (
            <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
                  <Users className="h-5 w-5 text-red-500" />
                  Faculty Collisions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.facultyCollisions.map((collision, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="destructive" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">COLLISION</Badge>
                        <span className="font-medium text-gray-800 dark:text-zinc-100">{collision.facultyName}</span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-zinc-100">
                        {collision.day} at {collision.timeSlot}
                      </p>
                      <p className="text-xs text-muted-foreground text-gray-800 dark:text-zinc-100">
                        Affected subjects: {collision.conflictingSubjects.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optimization Stats */}
          {result.optimizationStats.algorithm !== 'none' && (
            <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-zinc-100">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  AI Optimization Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {result.optimizationStats.algorithm.toUpperCase()}
                    </div>
                    <p className="text-sm text-muted-foreground text-gray-800 dark:text-zinc-100">Algorithm</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {result.optimizationStats.iterations}
                    </div>
                    <p className="text-sm text-muted-foreground text-gray-800 dark:text-zinc-100">Iterations</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">
                      {result.optimizationStats.improvements}
                    </div>
                    <p className="text-sm text-muted-foreground text-gray-800 dark:text-zinc-100">Improvements</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                      {result.optimizationStats.finalScore}
                    </div>
                    <p className="text-sm text-muted-foreground text-gray-800 dark:text-zinc-100">Final Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedTimetableGenerator; 