import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Zap, Clock, CheckCircle, Target, Brain, RefreshCw, AlertTriangle, BookOpen } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Subject, Faculty } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { GenerationSettings as GenerationSettingsType, FacultyAssignment } from '@/types/timetable';
import { generateIntelligentTimetable } from '@/utils/intelligentTimetableGenerator';
import { MANDATORY_SUBJECTS, createMandatorySubjects, isMandatorySubject, getMandatorySubjectsByYear } from '@/utils/mandatorySubjects';
import { saveTimetable, generateTimetableName } from '@/utils/timetableStorage';
import GenerationSettings from './GenerationSettings';
import GenerationProgress from './GenerationProgress';
import ConflictsDisplay from './ConflictsDisplay';
import GenerationStatistics from './GenerationStatistics';

interface TimetableGeneratorProps {
  subjects: Subject[];
  faculty: Faculty[];
  selectedDepartment: string;
  selectedYear: string;
  selectedSection: string;
  onTimetableGenerated: (timetable: any) => void;
}

const TimetableGenerator: React.FC<TimetableGeneratorProps> = ({
  subjects,
  faculty,
  selectedDepartment,
  selectedYear,
  selectedSection,
  onTimetableGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationSettings, setGenerationSettings] = useState<GenerationSettingsType>({
    avoidConsecutiveTheory: true,
    balanceWorkload: true,
    prioritizeMorningLabs: false,
    enforceBreaks: true,
    maxDailyHours: 7
  });
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [generationStats, setGenerationStats] = useState<any>(null);
  const [facultyAssignments, setFacultyAssignments] = useState<FacultyAssignment[]>([]);
  const [isAddingMandatory, setIsAddingMandatory] = useState(false);
  const [currentYearNumber, setCurrentYearNumber] = useState<number>(1);
  const { toast } = useToast();

  const totalHours = subjects.reduce((sum: number, subject: Subject) => {
    const hours = Number(subject.hours_per_week) || 0;
    return sum + hours;
  }, 0);
  
  const totalFacultyHours = faculty.reduce((sum: number, member: Faculty) => {
    const hours = Number(member.max_hours_per_week) || 0;
    return sum + hours;
  }, 0);

  React.useEffect(() => {
    loadFacultyAssignments();
    getCurrentYearNumber();
  }, [selectedSection, selectedYear]);

  const getCurrentYearNumber = async () => {
    try {
      const { data: yearData, error } = await supabase
        .from('years')
        .select('year_number')
        .eq('id', selectedYear)
        .single();

      if (error) throw error;
      setCurrentYearNumber(yearData.year_number || 1);
    } catch (error) {
      console.error('Error fetching year number:', error);
    }
  };

  const loadFacultyAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('subject_assignments')
        .select('*')
        .eq('section_id', selectedSection);

      if (error) throw error;
      setFacultyAssignments(data || []);
    } catch (error) {
      console.error('Error loading faculty assignments:', error);
    }
  };

  const addMandatorySubjects = async () => {
    if (!selectedDepartment || !selectedYear) {
      toast({
        title: "Selection Required",
        description: "Please select department and year first.",
        variant: "destructive"
      });
      return;
    }

    setIsAddingMandatory(true);

    try {
      // Get year details to determine year number
      const { data: yearData, error: yearError } = await supabase
        .from('years')
        .select('year_number')
        .eq('id', selectedYear)
        .single();

      if (yearError) throw yearError;

      const yearNumber = yearData.year_number;
      console.log('Adding mandatory subjects for year:', yearNumber);
      
      const mandatorySubjects = createMandatorySubjects(selectedDepartment, selectedYear, yearNumber);
      console.log('Mandatory subjects to add:', mandatorySubjects);

      // Check which mandatory subjects already exist
      const existingSubjects = subjects.filter(subject => 
        MANDATORY_SUBJECTS.some(mandatory => 
          (mandatory.name.toLowerCase() === subject.name?.toLowerCase() ||
           mandatory.code.toLowerCase() === subject.code?.toLowerCase()) &&
          subject.department_id === selectedDepartment
        )
      );

      const subjectsToAdd = mandatorySubjects.filter(newSubject =>
        !existingSubjects.some(existing => 
          existing.name?.toLowerCase() === newSubject.name.toLowerCase() ||
          existing.code?.toLowerCase() === newSubject.code.toLowerCase()
        )
      );

      console.log('Subjects to add after filtering:', subjectsToAdd);

      if (subjectsToAdd.length === 0) {
        toast({
          title: "Already Added",
          description: "All mandatory subjects for this year are already present.",
          duration: 3000
        });
        setIsAddingMandatory(false);
        return;
      }

      // Add subjects to database
      const { data, error } = await supabase
        .from('subjects')
        .insert(subjectsToAdd)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Successfully added subjects:', data);

      const expectedMandatory = getMandatorySubjectsByYear(yearNumber);
      
      toast({
        title: "Mandatory Subjects Added",
        description: `Added ${subjectsToAdd.length} mandatory subjects for Year ${yearNumber}. Expected: ${expectedMandatory.map(m => m.name).join(', ')}. They will be automatically scheduled on Saturdays.`,
        duration: 5000
      });

      // Refresh the page to reload subjects
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error adding mandatory subjects:', error);
      toast({
        title: "Error",
        description: `Failed to add mandatory subjects: ${error.message || 'Unknown error'}`,
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setIsAddingMandatory(false);
    }
  };

  async function handleGenerateNewTimetable() {
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
    setConflicts([]);

    // Enhanced generation process with mandatory subject handling
    const progressSteps = [
      { progress: 5, message: "Initializing AI timetable engine..." },
      { progress: 15, message: "Identifying mandatory subjects for Saturday scheduling..." },
      { progress: 25, message: "Analyzing subject requirements and constraints..." },
      { progress: 35, message: "Computing faculty-subject compatibility matrix..." },
      { progress: 45, message: "Scheduling mandatory subjects on Saturday slots..." },
      { progress: 55, message: "Applying constraint satisfaction algorithms..." },
      { progress: 65, message: "Optimizing weekday time slot distributions..." },
      { progress: 75, message: "Balancing faculty workload across days..." },
      { progress: 85, message: "Resolving scheduling conflicts and overlaps..." },
      { progress: 95, message: "Validating timetable integrity with mandatory subjects..." },
      { progress: 100, message: "Timetable generation completed with automatic mandatory scheduling!" }
    ];

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setGenerationProgress(step.progress);
      
      toast({
        title: "AI Processing",
        description: step.message,
        duration: 1000
      });
    }

    console.log('Starting timetable generation with subjects:', subjects.length);
    console.log('Subjects list:', subjects.map(s => ({ name: s.name, type: s.subject_type, mandatory: isMandatorySubject(s) })));

    // Generate timetable with automatic mandatory subject handling
    const result = generateIntelligentTimetable(subjects, faculty, generationSettings, selectedDepartment);
    
    console.log('Generation result:', result);
    
    onTimetableGenerated(result.timetable);
    setConflicts(result.conflicts);
    setGenerationStats(result.stats);

    // Save to DB
    try {
      const departmentName = subjects[0]?.department_id || selectedDepartment;
      const yearName = selectedYear;
      const sectionName = selectedSection;
      const timetableName = generateTimetableName(departmentName, yearName, sectionName);
      await saveTimetable({
        name: timetableName,
        department_id: selectedDepartment,
        year_id: selectedYear,
        section_id: selectedSection,
        timetable_data: result.timetable,
        generation_settings: generationSettings,
        conflicts: result.conflicts,
        stats: result.stats,
        created_by: undefined,
        notes: undefined
      });
      toast({
        title: "Timetable Saved",
        description: "The generated timetable has been saved to the database.",
        duration: 4000
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || 'Failed to save timetable to database.',
        variant: "destructive",
        duration: 4000
      });
    }

    setIsGenerating(false);
    
    const mandatoryCount = subjects.filter(isMandatorySubject).length;
    const saturdaySlots = result.stats.mandatorySlots || 0;
    
    if (result.conflicts.length === 0) {
      toast({
        title: "Perfect Generation!",
        description: `Timetable generated with zero conflicts! ${mandatoryCount} mandatory subjects found, ${saturdaySlots} Saturday slots filled.`,
        duration: 5000
      });
    } else {
      const criticalConflicts = result.conflicts.filter(c => c.includes('CRITICAL')).length;
      toast({
        title: "Generation Complete",
        description: `Timetable generated with ${result.conflicts.length} conflicts (${criticalConflicts} critical). ${mandatoryCount} mandatory subjects, ${saturdaySlots} Saturday slots filled.`,
        variant: criticalConflicts > 0 ? "destructive" : "default",
        duration: 5000
      });
    }
  }

  const mandatorySubjectsCount = subjects.filter(isMandatorySubject).length;
  const expectedMandatoryCount = getMandatorySubjectsByYear(currentYearNumber).length;

  return (
    <div className="space-y-6 pb-10">
      <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Intelligent Timetable Generator
          </h2>
          <p className="text-gray-600">Advanced AI-powered scheduling with automatic mandatory subjects</p>
        </div>

        {/* Enhanced Mandatory Subjects Notice */}
        <Card className={`p-4 mb-6 ${
          mandatorySubjectsCount === expectedMandatoryCount 
            ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' 
            : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className={`h-5 w-5 ${
                mandatorySubjectsCount === expectedMandatoryCount ? 'text-green-600' : 'text-orange-600'
              }`} />
              <div>
                <h3 className={`font-semibold ${
                  mandatorySubjectsCount === expectedMandatoryCount ? 'text-green-800' : 'text-orange-800'
                }`}>
                  Mandatory Subjects Status (Year {currentYearNumber})
                </h3>
                <p className={`text-sm ${
                  mandatorySubjectsCount === expectedMandatoryCount ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {mandatorySubjectsCount > 0 
                    ? `${mandatorySubjectsCount}/${expectedMandatoryCount} mandatory subjects present. ${
                        mandatorySubjectsCount === expectedMandatoryCount 
                          ? 'All will be automatically scheduled on Saturdays.' 
                          : 'Some mandatory subjects are missing!'
                      }`
                    : `0/${expectedMandatoryCount} mandatory subjects found. Add them to enable Saturday scheduling.`
                  }
                </p>
                {expectedMandatoryCount > 0 && (
                  <p className="text-xs mt-1 opacity-75">
                    Expected: {getMandatorySubjectsByYear(currentYearNumber).map(m => 
                      `${m.name}(${m.hours_per_week}h)`
                    ).join(', ')}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={addMandatorySubjects}
              disabled={isAddingMandatory}
              variant="outline"
              size="sm"
              className={`${
                mandatorySubjectsCount === expectedMandatoryCount
                  ? 'border-green-300 text-green-700 hover:bg-green-100'
                  : 'border-orange-300 text-orange-700 hover:bg-orange-100'
              }`}
            >
              {isAddingMandatory ? (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  {mandatorySubjectsCount === expectedMandatoryCount ? 'Refresh' : 'Add Missing'}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Enhanced Conflict Detection Notice */}
        <Card className="p-4 mb-6 bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Enhanced Conflict Detection Active</h3>
              <p className="text-sm text-green-700">
                Faculty scheduling conflicts prevented across all sections. Mandatory subjects prioritized on Saturdays.
              </p>
            </div>
          </div>
        </Card>

        <GenerationSettings 
          settings={generationSettings}
          onSettingsChange={setGenerationSettings}
        />

        {/* Enhanced Pre-generation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Subjects</p>
                <p className="text-2xl font-bold text-blue-800">{subjects.length}</p>
                <p className="text-xs text-blue-600">{mandatorySubjectsCount}/{expectedMandatoryCount} mandatory</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

                      <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Faculty</p>
                <p className="text-2xl font-bold text-green-800">{faculty.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>

                      <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Hours</p>
                <p className="text-2xl font-bold text-purple-800">{totalHours}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

                      <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Capacity</p>
                <p className="text-2xl font-bold text-orange-800">{totalFacultyHours}</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        <GenerationProgress 
          progress={generationProgress}
          isGenerating={isGenerating}
        />

        <ConflictsDisplay conflicts={conflicts} />

        <GenerationStatistics stats={generationStats} />

        {/* Enhanced Generate Button */}
        <div className="text-center mb-8">
          <Button
            onClick={handleGenerateNewTimetable}
            disabled={isGenerating || subjects.length === 0 || faculty.length === 0}
            size="lg"
            className="px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
          >
            {isGenerating ? (
              <>
                <Brain size={24} className="mr-3" />
                Generating Smart Timetable...
              </>
            ) : (
              <>
                <RefreshCw size={24} className="mr-3" />
                Generate Smart Timetable
              </>
            )}
          </Button>
          
          <p className="text-sm text-gray-500 mt-3">
            Powered by AI with automatic mandatory subject scheduling on Saturdays
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TimetableGenerator;
