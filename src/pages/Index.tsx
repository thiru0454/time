
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataDashboard from "@/components/DataDashboard";
import { ArrowRight, CheckCircle } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [availableData, setAvailableData] = useState(null);

  const handleDataReady = (data: any) => {
    setAvailableData(data);
  };

  const handleProceed = () => {
    if (selectedDepartment && selectedYear && selectedSection) {
      const searchParams = new URLSearchParams({
        department: selectedDepartment,
        year: selectedYear,
        section: selectedSection
      });
      navigate(`/timetable-management?${searchParams.toString()}`);
    }
  };

  const isSetupComplete = selectedDepartment && selectedYear && selectedSection;

  return (
    <div className="min-h-screen bg-background text-foreground page-transition">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 text-shimmer animate-bounce-in">
            SmartTimely
          </h1>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1 animate-slide-up">AI-Powered Academic Scheduler</p>
          <p className="text-gray-600 dark:text-gray-300 text-lg animate-slide-up">Intelligent Timetable Generator for Educational Institutions</p>
        </div>

        {/* Data Dashboard */}
        <div className="animate-slide-up">
          <DataDashboard
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            onDataReady={handleDataReady}
          />
        </div>

        {/* Proceed Button */}
        {isSetupComplete && (
          <Card className="mt-8 p-6 shadow-lg border-0 bg-background/80 dark:bg-background/90 backdrop-blur-sm text-center animate-scale-in card-hover">
            <div className="flex items-center justify-center gap-4 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 animate-pulse-slow" />
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Setup Complete!</h3>
                <p className="text-gray-600 dark:text-gray-300">Ready to manage your timetable</p>
              </div>
            </div>
            
            <Button
              onClick={handleProceed}
              size="lg"
              className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 btn-animate"
            >
              <span className="mr-3">Proceed to Timetable Management</span>
              <ArrowRight size={20} className="icon-bounce" />
            </Button>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-8 p-6 shadow-lg border-0 bg-background/80 dark:bg-background/90 border-indigo-200 dark:border-indigo-700 animate-slide-up card-hover">
          <h4 className="font-medium mb-3 text-indigo-800 dark:text-indigo-200">Getting Started</h4>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200 stagger-animation">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${selectedDepartment ? 'bg-green-500 scale-125' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
              <span>Select your department</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${selectedYear ? 'bg-green-500 scale-125' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
              <span>Choose the academic year</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${selectedSection ? 'bg-green-500 scale-125' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
              <span>Pick the section</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isSetupComplete ? 'bg-green-500 scale-125' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
              <span>Proceed to timetable management</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
