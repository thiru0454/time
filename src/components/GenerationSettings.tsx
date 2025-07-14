
import React from 'react';
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings } from 'lucide-react';
import { GenerationSettings as GenerationSettingsType } from '@/types/timetable';

interface GenerationSettingsProps {
  settings: GenerationSettingsType;
  onSettingsChange: (settings: GenerationSettingsType) => void;
}

const GenerationSettings: React.FC<GenerationSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const handleSettingChange = (key: keyof GenerationSettingsType, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
      <div className="flex items-center gap-3 mb-4">
        <Settings className="h-6 w-6 text-indigo-600" />
        <h3 className="font-semibold text-gray-800">Smart Generation Settings</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="avoid-consecutive" className="text-sm font-medium">
            Avoid Consecutive Theory Classes
          </Label>
          <Switch
            id="avoid-consecutive"
            checked={settings.avoidConsecutiveTheory}
            onCheckedChange={(checked) => handleSettingChange('avoidConsecutiveTheory', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="balance-workload" className="text-sm font-medium">
            Balance Faculty Workload
          </Label>
          <Switch
            id="balance-workload"
            checked={settings.balanceWorkload}
            onCheckedChange={(checked) => handleSettingChange('balanceWorkload', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="morning-labs" className="text-sm font-medium">
            Prioritize Morning Labs
          </Label>
          <Switch
            id="morning-labs"
            checked={settings.prioritizeMorningLabs}
            onCheckedChange={(checked) => handleSettingChange('prioritizeMorningLabs', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="enforce-breaks" className="text-sm font-medium">
            Enforce Breaks
          </Label>
          <Switch
            id="enforce-breaks"
            checked={settings.enforceBreaks}
            onCheckedChange={(checked) => handleSettingChange('enforceBreaks', checked)}
          />
        </div>
      </div>
    </Card>
  );
};

export default GenerationSettings;
