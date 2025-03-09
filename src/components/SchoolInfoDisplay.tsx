// src/components/SchoolInfoDisplay.tsx
'use client';

import { SchoolInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronDown, ChevronUp, School, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface SchoolInfoDisplayProps {
  enhancedGradeDisplay?: boolean;
  sticky?: boolean;
}

const SchoolInfoDisplay: React.FC<SchoolInfoDisplayProps> = ({ 
  enhancedGradeDisplay = false,
  sticky = false
}) => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  
  useEffect(() => {
    // Load school info from local storage
    const storedInfo = localStorage.getItem('schoolInfo');
    if (storedInfo) {
      try {
        setSchoolInfo(JSON.parse(storedInfo));
      } catch (e) {
        console.error('Error parsing school info:', e);
      }
    }
  }, []);
  
  if (!schoolInfo || (!schoolInfo.schoolName && !schoolInfo.grade)) {
    return null;
  }
  
  return (
    <Card className={`mb-4 ${sticky ? 'sticky top-0 z-10' : ''}`}>
      <CardHeader className="py-2 px-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg mb-0">
              {schoolInfo.schoolName || 'School List'}
            </CardTitle>
            
            {schoolInfo.grade && enhancedGradeDisplay && (
              <div className="text-sm text-gray-500 mt-0.5">
                Grade {schoolInfo.grade}
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>
      
      {/* Only show CardContent when expanded or when grade needs to be shown in non-enhanced mode */}
      {(expanded || (schoolInfo.grade && !enhancedGradeDisplay)) && (
        <CardContent className="py-2 px-4">
          {/* Basic info when not using enhanced grade display */}
          {schoolInfo.grade && !enhancedGradeDisplay && (
            <div className="flex items-center mt-1">
              <div className="flex items-center mr-4">
                <Badge variant="secondary" className="flex gap-1 items-center">
                  <School className="h-3 w-3" />
                  {schoolInfo.grade}
                </Badge>
              </div>
            </div>
          )}
          
          {/* Additional info when expanded */}
          {expanded && (
            <div className={`${!enhancedGradeDisplay ? 'mt-3 pt-3 border-t' : ''}`}>
              {schoolInfo.teacherName && (
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="flex gap-1 items-center">
                    <User className="h-3 w-3" />
                    Teacher: {schoolInfo.teacherName}
                  </Badge>
                </div>
              )}
              
              {schoolInfo.year && (
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="flex gap-1 items-center">
                    <Calendar className="h-3 w-3" />
                    Year: {schoolInfo.year}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default SchoolInfoDisplay;