
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataDashboard from "@/components/DataDashboard";
import { ArrowRight, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground page-transition animate-fade-in">
        <div className="container mx-auto px-4 py-8">

          {/* Data Dashboard */}
          <div className="animate-slide-up fade-hover">
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
            <Card className="mt-8 p-6 shadow-lg border-0 bg-background/80 dark:bg-background/90 backdrop-blur-sm text-center animate-scale-in card-hover animate-fade-in fade-hover">
              <div className="flex items-center justify-center gap-4 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 animate-pulse-slow fade-hover" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 fade-hover">Setup Complete!</h3>
                  <p className="text-gray-600 dark:text-gray-300 fade-hover">Ready to manage your timetable</p>
                </div>
              </div>
              <Button
                onClick={handleProceed}
                size="lg"
                className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 btn-animate animate-bounce-in fade-hover"
              >
                <span className="mr-3">Proceed to Timetable Management</span>
                <ArrowRight size={20} className="icon-bounce fade-hover" />
              </Button>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Index;
