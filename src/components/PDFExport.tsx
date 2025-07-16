import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Settings, Calendar, Users, BookOpen } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Subject, Faculty } from '@/integrations/supabase/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PDFExportProps {
  timetable: any;
  subjects: Subject[];
  faculty: Faculty[];
  departmentName: string;
  yearName: string;
  sectionName: string;
}

interface ExportOptions {
  includeHeader: boolean;
  includeFooter: boolean;
  includeFacultyInfo: boolean;
  includeSubjectDetails: boolean;
  includeRoomAssignments: boolean;
  pageOrientation: 'portrait' | 'landscape';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'color' | 'grayscale' | 'black';
}

const PDFExport: React.FC<PDFExportProps> = ({
  timetable,
  subjects,
  faculty,
  departmentName,
  yearName,
  sectionName
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeHeader: true,
    includeFooter: true,
    includeFacultyInfo: true,
    includeSubjectDetails: true,
    includeRoomAssignments: true,
    pageOrientation: 'landscape',
    fontSize: 'medium',
    colorScheme: 'color'
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const timeSlots = [
    '9:00 to 9:55', '9:55 to 10:50', '11:05 to 12:00', '12:00 to 12:55',
    '1:55 to 2:50', '2:50 to 3:45', '3:55 to 4:50'
  ];

  const generatePDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: exportOptions.pageOrientation,
        unit: 'mm',
        format: 'a4'
      });

      // Set font size based on options
      const fontSize = exportOptions.fontSize === 'small' ? 8 : 
                     exportOptions.fontSize === 'large' ? 12 : 10;

      // Header
      if (exportOptions.includeHeader) {
        addHeader(doc, fontSize);
      }

      // Timetable
      addTimetable(doc, fontSize);

      // Faculty Information
      if (exportOptions.includeFacultyInfo) {
        addFacultyInfo(doc, fontSize);
      }

      // Subject Details
      if (exportOptions.includeSubjectDetails) {
        addSubjectDetails(doc, fontSize);
      }

      // Footer
      if (exportOptions.includeFooter) {
        addFooter(doc, fontSize);
      }

      // Save the PDF
      const fileName = `Timetable_${departmentName}_${yearName}_${sectionName}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Exported",
        description: `Timetable has been exported as ${fileName}`,
        duration: 4000
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const addHeader = (doc: jsPDF, fontSize: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(fontSize + 4);
    doc.setFont('helvetica', 'bold');
    doc.text('ACADEMIC TIMETABLE', pageWidth / 2, 20, { align: 'center' });

    // Subtitle
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.text(`Department: ${departmentName}`, 20, 35);
    doc.text(`Year: ${yearName}`, pageWidth - 60, 35);
    doc.text(`Section: ${sectionName}`, pageWidth - 60, 42);

    // Date
    doc.setFontSize(fontSize - 2);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 42);

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 50, pageWidth - 20, 50);
  };

  const addTimetable = (doc: jsPDF, fontSize: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = exportOptions.includeHeader ? 70 : 20;
    
    // Table headers
    const headers = ['Time', ...days];
    const data: any[][] = [];

    // Add time slots
    timeSlots.forEach((timeSlot, index) => {
      const row = [timeSlot];
      days.forEach(day => {
        const assignment = timetable[day]?.[timeSlot];
        if (assignment) {
          const subject = subjects.find(s => s.name === assignment.subject);
          const faculty = faculty.find(f => f.name === assignment.faculty);
          
          row.push({
            subject: assignment.subject,
            abbreviation: subject?.abbreviation || assignment.subjectCode || 'N/A',
            faculty: assignment.faculty,
            type: assignment.type,
            color: getSubjectTypeColor(assignment.type)
          });
        } else {
          row.push('');
        }
      });
      data.push(row);
    });

    // Create table
    const tableConfig = {
      startY,
      head: [headers],
      body: data,
      styles: {
        fontSize: fontSize - 1,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [70, 130, 180],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      didDrawCell: (data: any) => {
        // Custom cell rendering for subject assignments
        if (data.row.index > 0 && data.column.index > 0) {
          const cellData = data.cell.text[0];
          if (typeof cellData === 'object' && cellData.subject) {
            // Clear the cell
            doc.setFillColor(255, 255, 255);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            
            // Add subject abbreviation
            doc.setFontSize(fontSize - 2);
            doc.setFont('helvetica', 'bold');
            doc.text(cellData.abbreviation, data.cell.x + 2, data.cell.y + 5);
            
            // Add faculty name
            doc.setFontSize(fontSize - 3);
            doc.setFont('helvetica', 'normal');
            doc.text(cellData.faculty, data.cell.x + 2, data.cell.y + 10);
            
            // Add subject type badge
            doc.setFillColor(...getRGBColor(cellData.color));
            doc.rect(data.cell.x + data.cell.width - 8, data.cell.y + 2, 6, 6, 'F');
          }
        }
      }
    };

    (doc as any).autoTable(tableConfig);
  };

  const addFacultyInfo = (doc: jsPDF, fontSize: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(fontSize + 2);
    doc.setFont('helvetica', 'bold');
    doc.text('FACULTY ASSIGNMENTS', 20, startY);

    // Faculty table
    const facultyData = faculty.map(f => [
      f.name,
      f.email || 'N/A',
      f.department_id || 'N/A',
      `${f.max_hours_per_week || 0} hours/week`
    ]);

    (doc as any).autoTable({
      startY: startY + 10,
      head: [['Name', 'Email', 'Department', 'Max Hours']],
      body: facultyData,
      styles: {
        fontSize: fontSize - 1,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [70, 130, 180],
        textColor: [255, 255, 255]
      }
    });
  };

  const addSubjectDetails = (doc: jsPDF, fontSize: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const startY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(fontSize + 2);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT DETAILS', 20, startY);

    // Subject table
    const subjectData = subjects.map(s => [
      s.code,
      s.name,
      s.abbreviation || 'N/A',
      s.subject_type,
      `${s.hours_per_week} hours/week`,
      `${s.credits} credits`
    ]);

    (doc as any).autoTable({
      startY: startY + 10,
      head: [['Code', 'Name', 'Abbreviation', 'Type', 'Hours', 'Credits']],
      body: subjectData,
      styles: {
        fontSize: fontSize - 1,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [70, 130, 180],
        textColor: [255, 255, 255]
      }
    });
  };

  const addFooter = (doc: jsPDF, fontSize: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);

    // Footer text
    doc.setFontSize(fontSize - 2);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by Timetable Management System', 20, pageHeight - 20);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 40, pageHeight - 20);
  };

  const getSubjectTypeColor = (type: string): string => {
    switch (type?.toLowerCase()) {
      case 'theory':
        return '#3B82F6'; // Blue
      case 'practical':
        return '#10B981'; // Green
      case 'lab':
        return '#8B5CF6'; // Purple
      case 'tutorial':
        return '#F59E0B'; // Orange
      default:
        return '#6B7280'; // Gray
    }
  };

  const getRGBColor = (hexColor: string): number[] => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return [r, g, b];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Export Timetable as PDF</span>
          </CardTitle>
          <CardDescription>
            Generate a professional PDF version of the timetable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Export Options</span>
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeHeader"
                      checked={exportOptions.includeHeader}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeHeader: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeHeader">Include Header</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeFooter"
                      checked={exportOptions.includeFooter}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeFooter: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeFooter">Include Footer</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeFacultyInfo"
                      checked={exportOptions.includeFacultyInfo}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeFacultyInfo: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeFacultyInfo">Include Faculty Information</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSubjectDetails"
                      checked={exportOptions.includeSubjectDetails}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeSubjectDetails: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeSubjectDetails">Include Subject Details</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Format Settings</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="orientation">Page Orientation</Label>
                    <Select
                      value={exportOptions.pageOrientation}
                      onValueChange={(value: 'portrait' | 'landscape') =>
                        setExportOptions(prev => ({ ...prev, pageOrientation: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Select
                      value={exportOptions.fontSize}
                      onValueChange={(value: 'small' | 'medium' | 'large') =>
                        setExportOptions(prev => ({ ...prev, fontSize: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="colorScheme">Color Scheme</Label>
                    <Select
                      value={exportOptions.colorScheme}
                      onValueChange={(value: 'color' | 'grayscale' | 'black') =>
                        setExportOptions(prev => ({ ...prev, colorScheme: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="color">Color</SelectItem>
                        <SelectItem value="grayscale">Grayscale</SelectItem>
                        <SelectItem value="black">Black & White</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Preview</span>
              </h3>
              
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="text-sm text-gray-600">
                  <div><strong>Department:</strong> {departmentName}</div>
                  <div><strong>Year:</strong> {yearName}</div>
                  <div><strong>Section:</strong> {sectionName}</div>
                  <div><strong>Subjects:</strong> {subjects.length}</div>
                  <div><strong>Faculty:</strong> {faculty.length}</div>
                  <div><strong>Time Slots:</strong> {timeSlots.length}</div>
                  <div><strong>Days:</strong> {days.length}</div>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-center">
              <Button
                onClick={generatePDF}
                disabled={isExporting}
                className="flex items-center space-x-2"
                size="lg"
              >
                {isExporting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isExporting ? 'Generating PDF...' : 'Export as PDF'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFExport; 