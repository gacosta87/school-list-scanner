
// Interface for the supply item
export interface SupplyItem {
  name: string;
  quantity: number;
  originalText: string;
}

// Interface for grade-specific lists
export interface GradeList {
  grade: string;
  supplyItems: SupplyItem[];
}

// Interface for Claude AI response
export interface ClaudeProcessingResult {
  schoolName: string | null;
  year: string | null;
  teacherName: string | null;
  gradeLists: GradeList[];
  rawText: string;
}

// Main function to process captured image with Claude AI
export const processSupplyListWithClaude = async (imageData: string): Promise<ClaudeProcessingResult> => {
  try {
    // Call Claude AI API with the image data
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error processing image with Claude:', error);
    throw new Error('Failed to process the image with Claude AI. Please try again.');
  }
};

// Helper function to extract the default grade list when only one grade is present
export const getDefaultGradeList = (result: ClaudeProcessingResult): GradeList | null => {
  if (result.gradeLists && result.gradeLists.length > 0) {
    return result.gradeLists[0];
  }
  return null;
};

// Helper function to convert Claude result to the format expected by the rest of the app
export const convertToAppFormat = (claudeResult: ClaudeProcessingResult, selectedGradeIndex = 0): any => {
  // Get the selected grade list or the first one if not specified
  const gradeList = claudeResult.gradeLists[selectedGradeIndex] || claudeResult.gradeLists[0];
  
  return {
    schoolName: claudeResult.schoolName,
    grade: gradeList?.grade || null,
    teacherName: claudeResult.teacherName,
    year: claudeResult.year,
    supplyItems: gradeList?.supplyItems || [],
    rawText: claudeResult.rawText
  };
}; 