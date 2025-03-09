// src/components/SchoolInfoDisplay.tsx
'use client';

import { SchoolInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, School, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const SchoolInfoDisplay: React.FC = () => {
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
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">
            {schoolInfo.schoolName || 'School List'}
          </CardTitle>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Basic info always visible */}
        <div className="flex items-center mt-2">
          {schoolInfo.grade && (
            <div className="flex items-center mr-4">
              <Badge variant="secondary" className="flex gap-1 items-center">
                <School className="h-3 w-3" />
                {schoolInfo.grade}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Additional info when expanded */}
        {expanded && (
          <div className="mt-3 pt-3 border-t">
            {schoolInfo.teacherName && (
              <div className="flex items-center mt-2">
                <Badge variant="outline" className="flex gap-1 items-center">
                  <User className="h-3 w-3" />
                  Teacher: {schoolInfo.teacherName}
                </Badge>
              </div>
            )}
            
            {schoolInfo.year && (
              <div className="flex items-center mt-2">
                <Badge variant="outline" className="flex gap-1 items-center">
                  <Calendar className="h-3 w-3" />
                  Year: {schoolInfo.year}
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SchoolInfoDisplay;