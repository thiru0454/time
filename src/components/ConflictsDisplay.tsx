
import React from 'react';
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ConflictsDisplayProps {
  conflicts: string[];
}

const ConflictsDisplay: React.FC<ConflictsDisplayProps> = ({ conflicts }) => {
  if (conflicts.length === 0) {
    return (
      <Card className="p-4 mb-6 bg-green-50 border border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-800">No Conflicts Detected</h3>
            <p className="text-sm text-green-700">All faculty assignments are conflict-free!</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-6 bg-yellow-50 border border-yellow-200">
      <div className="flex items-center gap-3 mb-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <h3 className="font-semibold text-yellow-800">Scheduling Conflicts Detected</h3>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {conflicts.slice(0, 10).map((conflict, index) => (
          <p key={index} className="text-sm text-yellow-700">• {conflict}</p>
        ))}
        {conflicts.length > 10 && (
          <p className="text-sm text-yellow-600 font-medium">
            ...and {conflicts.length - 10} more conflicts detected
          </p>
        )}
      </div>
      <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
        <strong>Note:</strong> Conflicts have been automatically resolved where possible. 
        Review the generated timetable to ensure all assignments meet your requirements.
      </div>
    </Card>
  );
};

export default ConflictsDisplay;
