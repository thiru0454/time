import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar, Printer, Share2, Mail } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Subject, Faculty } from '@/hooks/useSupabaseData';

interface ExportPanelProps {
  timetable: any;
  selectedDepartment: string;
  selectedYear: string;
  selectedSection: string;
  subjects?: Subject[];
  faculty?: Faculty[];
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  timetable,
  selectedDepartment,
  selectedYear,
  selectedSection,
  subjects = [],
  faculty = []
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const { toast } = useToast();

  // Helper function to get faculty by name
  const getFacultyByName = (facultyName: string) => {
    return faculty.find(f => f.name === facultyName);
  };

  const exportToPDF = async () => {
    if (!timetable) {
      toast({
        title: "No Timetable",
        description: "Please generate a timetable first before exporting.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      // Create enhanced PDF content with faculty details
      const printContent = generateEnhancedPrintableHTML();
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load before printing
        setTimeout(() => {
          printWindow.print();
        }, 1000);
        
        toast({
          title: "Export Successful",
          description: "Enhanced timetable with faculty details has been prepared for printing/PDF export.",
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export timetable. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateEnhancedPrintableHTML = () => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const timeSlots = [
      '9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00',
      '12:00 to 12:55', '1:55 to 2:50', '2:50 to 3:45', '3:55 to 4:50'
    ];
    const periodNumbers = ['1', '2', '3', '4', '5', '6', '7'];

    let tableHTML = `
      <html>
        <head>
          <title>Timetable - ${selectedDepartment} ${selectedYear} ${selectedSection}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 15px; font-size: 12px; }
            .header { text-align: center; margin-bottom: 25px; }
            .college-name { font-size: 20px; font-weight: bold; margin-bottom: 8px; }
            .department-info { font-size: 14px; margin-bottom: 3px; }
            .timetable-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .timetable-table th, .timetable-table td { 
              border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px; 
            }
            .timetable-table th { background-color: #f0f0f0; font-weight: bold; }
            .subject-cell { background-color: #e8f4fd; }
            .lab-cell { background-color: #fff2e8; }
            .break-cell { background-color: #f0f0f0; color: #666; }
            .faculty-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .faculty-table th, .faculty-table td { 
              border: 1px solid #000; padding: 6px; font-size: 9px; text-align: left;
            }
            .faculty-table th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
            .page-break { page-break-after: always; }
            @media print { 
              body { margin: 0; } 
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="college-name">Sona College of Technology</div>
            <div class="department-info">Department: ${selectedDepartment}</div>
            <div class="department-info">Year: ${selectedYear} | Section: ${selectedSection}</div>
            <div style="font-size: 12px; color: #666;">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <!-- Timetable -->
          <table class="timetable-table">
            <thead>
              <tr>
                <th style="width: 80px;">Day</th>
                ${periodNumbers.map((period: string) => `<th>Period ${period}</th>`).join('')}
              </tr>
              <tr>
                <th>Time</th>
                ${timeSlots.map((slot: string) => `<th style="font-size: 8px;">${slot}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
    `;

    days.forEach((day: string) => {
      tableHTML += `<tr><td><strong>${day}</strong></td>`;
      timeSlots.forEach((slot: string) => {
        const entry = timetable?.[day]?.[slot];
        if (entry) {
          const cellClass = entry.type === 'Lab' ? 'lab-cell' : 'subject-cell';
          tableHTML += `<td class="${cellClass}">
            <div style="font-weight: bold; font-size: 9px;">${entry.subjectCode}</div>
            <div style="font-size: 8px; color: #666;">${entry.faculty}</div>
          </td>`;
        } else {
          tableHTML += '<td class="break-cell">-</td>';
        }
      });
      tableHTML += '</tr>';
    });

    tableHTML += `
            </tbody>
          </table>

          <!-- Faculty Details Table -->
          <h3 style="margin-top: 30px; margin-bottom: 15px;">Faculty Assignment Details</h3>
          <table class="faculty-table">
            <thead>
              <tr>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Type</th>
                <th>Hours/Week</th>
                <th>Faculty Name</th>
                <th>Email</th>
                <th>Specialization</th>
              </tr>
            </thead>
            <tbody>
    `;

    subjects.forEach((subject) => {
      // Find faculty assigned to this subject from the timetable
      let assignedFaculty = null;
      Object.values(timetable || {}).forEach((daySlots: any) => {
        Object.values(daySlots || {}).forEach((slot: any) => {
          if (slot && slot.subjectCode === subject.code) {
            assignedFaculty = getFacultyByName(slot.faculty);
          }
        });
      });

      tableHTML += `
        <tr>
          <td>${subject.code}</td>
          <td>${subject.name}</td>
          <td>${subject.subject_type}</td>
          <td style="text-align: center;">${subject.hours_per_week}</td>
          <td>${assignedFaculty ? assignedFaculty.name : 'Not Assigned'}</td>
          <td>${assignedFaculty ? (assignedFaculty.email || 'N/A') : 'N/A'}</td>
          <td>${assignedFaculty && assignedFaculty.specialization ? 
                assignedFaculty.specialization.join(', ') : 'N/A'}</td>
        </tr>
      `;
    });

    tableHTML += `
            </tbody>
          </table>
          
          <!-- Summary Section -->
          <div style="margin-top: 25px; padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
            <h4>Summary</h4>
            <p>Total Subjects: ${subjects.length}</p>
            <p>Total Faculty: ${faculty.length}</p>
            <p>Total Hours per Week: ${subjects.reduce((sum, s) => sum + s.hours_per_week, 0)}</p>
          </div>
        </body>
      </html>
    `;

    return tableHTML;
  };

  const generateCSVContent = () => {
    if (!timetable) return '';

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const timeSlots = [
      '9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00',
      '12:00 to 12:55', '1:55 to 2:50', '2:50 to 3:45', '3:55 to 4:50'
    ];

    let csv = 'Time Slot,' + days.join(',') + '\n';
    
    timeSlots.forEach((slot: string) => {
      let row = `"${slot}",`;
      days.forEach((day: string) => {
        const entry = timetable[day]?.[slot];
        if (entry) {
          row += `"${entry.subject} (${entry.faculty})",`;
        } else {
          row += '"-",';
        }
      });
      csv += row.slice(0, -1) + '\n';
    });

    return csv;
  };

  const exportToExcel = () => {
    if (!timetable) {
      toast({
        title: "No Timetable",
        description: "Please generate a timetable first before exporting.",
        variant: "destructive"
      });
      return;
    }

    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `timetable_${selectedDepartment}_${selectedYear}_${selectedSection}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Timetable exported as CSV file.",
    });
  };

  const shareViaEmail = () => {
    const subject = `Timetable - ${selectedDepartment} ${selectedYear} Section ${selectedSection}`;
    const body = `Please find the timetable for ${selectedDepartment} ${selectedYear} Section ${selectedSection} generated on ${new Date().toLocaleDateString()}.`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  if (!timetable) {
    return (
      <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Export Timetable</h2>
        <p className="text-gray-600 mb-6">No timetable available to export. Please generate a timetable first.</p>
        <Button variant="outline" disabled>
          <Download size={20} className="mr-2" />
          Export Not Available
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Export & Share Timetable
          </h2>
          <p className="text-gray-600">Download or share your generated timetable with complete faculty details</p>
        </div>

        {/* Enhanced Features Notice */}
        <Card className="p-4 mb-6 bg-green-50 border border-green-200">
          <h3 className="font-semibold mb-2 text-green-800">Enhanced Export Features</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Complete faculty assignment details included</li>
            <li>• Professional PDF formatting with college branding</li>
            <li>• Faculty contact information and specializations</li>
            <li>• Summary statistics and course details</li>
          </ul>
        </Card>

        {/* Export Format Selection */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
          <h3 className="font-semibold mb-4 text-gray-800">Select Export Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={exportFormat === 'pdf' ? 'default' : 'outline'}
              onClick={() => setExportFormat('pdf')}
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <FileText size={24} />
              <span>PDF Format</span>
              <span className="text-xs opacity-75">Print-ready document</span>
            </Button>
            
            <Button
              variant={exportFormat === 'excel' ? 'default' : 'outline'}
              onClick={() => setExportFormat('excel')}
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <Download size={24} />
              <span>CSV Format</span>
              <span className="text-xs opacity-75">Spreadsheet compatible</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={shareViaEmail}
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <Mail size={24} />
              <span>Share via Email</span>
              <span className="text-xs opacity-75">Send to stakeholders</span>
            </Button>
          </div>
        </Card>

        {/* Timetable Preview */}
        <Card className="p-4 mb-6 bg-gray-50">
          <h3 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Calendar size={20} />
            Timetable Preview
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex gap-4">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Department: {selectedDepartment}
              </Badge>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Year: {selectedYear}
              </Badge>
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                Section: {selectedSection}
              </Badge>
            </div>
            <p>Generated on: {new Date().toLocaleDateString()}</p>
            <p>Total scheduled slots: {timetable ? Object.values(timetable as Record<string, any>).reduce((count: number, day: Record<string, any>) => 
              count + Object.keys(day || {}).length, 0) : 0}</p>
          </div>
        </Card>

        {/* Export Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={exportFormat === 'pdf' ? exportToPDF : exportToExcel}
            disabled={isExporting}
            size="lg"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isExporting ? (
              <>
                <div className="rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download size={20} className="mr-3" />
                Export as {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
          
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="lg"
            className="px-8 py-4"
          >
            <Printer size={20} className="mr-3" />
            Quick Print
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ExportPanel;
