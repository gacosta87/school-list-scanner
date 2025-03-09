export interface SchoolInfo {
  schoolName: string;
  grade: string;
  teacherName: string;
  location: string;
  type: 'public' | 'private' | 'charter';
  established: number;
  year: number;
  studentCount?: number;
  website?: string;
  contactEmail?: string;
  departments?: string[];
  accreditation?: string;
  description?: string;
}
