
import React from 'react';
import { Card } from "@/components/ui/card";
import { BarChart3 } from 'lucide-react';
import { GenerationStats } from '@/types/timetable';

interface GenerationStatisticsProps {
  stats: GenerationStats | null;
}

const GenerationStatistics: React.FC<GenerationStatisticsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <Card className="p-4 mb-6 bg-green-50 border border-green-200">
      <div className="flex items-center gap-3 mb-3">
        <BarChart3 className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-green-800">Generation Statistics</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-800">{stats.efficiency}%</p>
          <p className="text-sm text-green-600">Slot Efficiency</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-800">{stats.filledSlots}</p>
          <p className="text-sm text-green-600">Filled Slots</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-800">{Object.keys(stats.facultyUtilization).length}</p>
          <p className="text-sm text-green-600">Faculty Assigned</p>
        </div>
      </div>
    </Card>
  );
};

export default GenerationStatistics;
