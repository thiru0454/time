
import React from 'react';
import { Card } from "@/components/ui/card";

interface GenerationProgressProps {
  progress: number;
  isGenerating: boolean;
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  progress,
  isGenerating
}) => {
  if (!isGenerating) return null;

  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
      <div className="flex items-center justify-center gap-4">
        <div className="rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="text-center">
          <p className="font-medium text-gray-800">AI Processing Timetable...</p>
          <div className="w-80 bg-gray-200 rounded-full h-3 mt-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">{progress}% Complete</p>
        </div>
      </div>
    </Card>
  );
};

export default GenerationProgress;
