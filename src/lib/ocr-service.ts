import { createWorker } from 'tesseract.js';
import * as compromise from 'compromise';

// Initialize the OCR worker
const initOCR = async () => {
  const worker = await createWorker();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  return worker;
};

// Main function to process captured image
export const processSupplyListImage = async (imageData) => {
  try {
    // Step 1: Perform OCR on the image
    const worker = await initOCR();
    const { data } = await worker.recognize(imageData);
    await worker.terminate();

    // Step 2: Extract meaningful information from the text
    const extractedData = extractInformation(data.text);
    
    // Step 3: Enhance with NLP
    return enhanceRecognition(extractedData);
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process the image. Please try again.');
  }
};

// Extract various types of information from the OCR text
const extractInformation = (text) => {
  // Initialize results object
  const result = {
    schoolName: null,
    grade: null,
    teacherName: null,
    year: null,
    supplyItems: [],
    rawText: text,
  };

  // Split text into lines for processing
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Extract school name (typically at the top of the document)
  const schoolRegex = /(.*school|.*academy|.*elementary|.*middle|.*high)/i;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const schoolMatch = lines[i].match(schoolRegex);
    if (schoolMatch) {
      result.schoolName = schoolMatch[0].trim();
      break;
    }
  }

  // Extract grade information
  const gradeRegex = /(kindergarten|grade\s*[k0-9]{1,2}|[0-9]{1,2}(st|nd|rd|th)\s*grade)/i;
  const gradeMatch = text.match(gradeRegex);
  if (gradeMatch) {
    result.grade = gradeMatch[0].trim();
  }

  // Extract teacher name if available
  const teacherRegex = /([Mm][rs]\.?\s+[A-Z][a-z]+|[Tt]eacher\s*:\s*([A-Z][a-z]+))/;
  const teacherMatch = text.match(teacherRegex);
  if (teacherMatch) {
    result.teacherName = teacherMatch[0].trim();
  }

  // Extract year if available
  const yearRegex = /20[0-9]{2}(-|\/)20[0-9]{2}|20[0-9]{2}/;
  const yearMatch = text.match(yearRegex);
  if (yearMatch) {
    result.year = yearMatch[0].trim();
  }

  // Process each line to identify supply items
  lines.forEach(line => {
    // Skip lines that are likely headers or not supply items
    if (
      line.toLowerCase().includes('school supply') || 
      line.toLowerCase().includes('grade') ||
      line.toLowerCase().includes('teacher') ||
      line.toLowerCase().includes('year') ||
      line.length < 3
    ) {
      return;
    }

    // Check for common supply item patterns
    // 1. Lines with quantities (e.g., "2 boxes of pencils")
    const quantityMatch = line.match(/^(\d+)\s+(.+)/);
    
    // 2. Lines with bullet points
    const bulletMatch = line.match(/^[•\-\*]\s*(.+)/);
    
    // 3. Lines that mention common school supplies
    const supplyTerms = [
      'pencil', 'pen', 'notebook', 'folder', 'binder', 'paper', 
      'marker', 'crayon', 'scissor', 'glue', 'eraser', 'ruler', 
      'calculator', 'highlighter', 'backpack', 'box', 'tissue',
      'wipe', 'sanitizer', 'book', 'sheet', 'divider'
    ];

    const hasSupplyTerm = supplyTerms.some(term => 
      line.toLowerCase().includes(term)
    );

    // If any pattern matches, add it as a supply item
    if (quantityMatch || bulletMatch || hasSupplyTerm) {
      let itemText = line;
      if (bulletMatch) {
        itemText = bulletMatch[1]; // Extract text after bullet
      }
      
      // Try to parse quantity and item name
      let quantity = 1;
      let name = itemText;
      
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1], 10);
        name = quantityMatch[2];
      }

      result.supplyItems.push({
        name: name.trim(),
        quantity: quantity,
        originalText: line
      });
    }
  });

  return result;
};

// Use additional NLP for better entity recognition
export const enhanceRecognition = (extractedData) => {
  // Use compromise NLP to improve entity recognition
  const doc = compromise(extractedData.rawText);
  
  // Try to extract school names if not already found
  if (!extractedData.schoolName) {
    const orgs = doc.organizations().out('array');
    if (orgs.length > 0) {
      // Check if any organization looks like a school
      const schoolOrg = orgs.find(org => 
        org.toLowerCase().includes('school') || 
        org.toLowerCase().includes('academy') ||
        org.toLowerCase().includes('elementary') ||
        org.toLowerCase().includes('middle') ||
        org.toLowerCase().includes('high')
      );
      
      if (schoolOrg) {
        extractedData.schoolName = schoolOrg;
      }
    }
  }
  
  // Try to extract people's names for teacher
  if (!extractedData.teacherName) {
    const people = doc.people().out('array');
    if (people.length > 0) {
      // Look for names near words like "teacher"
      const teacherContext = extractedData.rawText
        .split('\n')
        .find(line => 
          line.toLowerCase().includes('teacher') && 
          people.some(person => line.includes(person))
        );
      
      if (teacherContext) {
        const teacherName = people.find(person => teacherContext.includes(person));
        if (teacherName) {
          extractedData.teacherName = teacherName;
        }
      } else if (people.length === 1) {
        // If only one person is mentioned, it might be the teacher
        extractedData.teacherName = people[0];
      }
    }
  }
  
  return extractedData;
};

// Generate search terms for the WooCommerce product search
export const generateSearchTerms = (supplyItems) => {
  return supplyItems.map(item => {
    // Clean up the item name for better search results
    let searchTerm = item.name
      .replace(/^\d+\s*x\s*/, '') // Remove leading quantities like "2 x "
      .replace(/\(.*?\)/g, '') // Remove parentheses content
      .trim();
    
    // Extract the core product from longer descriptions
    const coreProduct = identifyCoreProduct(searchTerm);
    
    return {
      originalItem: item,
      searchTerm: coreProduct || searchTerm
    };
  });
};

// Helper function to identify the core product in a longer description
const identifyCoreProduct = (text) => {
  // Common supply items to look for
  const commonSupplies = [
    'notebook', 'pencil', 'pen', 'marker', 'crayon', 'glue stick', 'glue',
    'scissors', 'binder', 'folder', 'paper', 'calculator', 'ruler',
    'eraser', 'highlighter', 'backpack', 'protractor', 'compass',
    'index cards', 'sticky notes', 'tape', 'stapler', 'sharpener'
  ];
  
  // Find the first common supply mentioned
  for (const supply of commonSupplies) {
    if (text.toLowerCase().includes(supply)) {
      // Extract a few words around the main supply item for context
      const words = text.split(/\s+/);
      const supplyIndex = words.findIndex(word => 
        word.toLowerCase().includes(supply)
      );
      
      if (supplyIndex >= 0) {
        // Take a few words before and after for context
        const start = Math.max(0, supplyIndex - 2);
        const end = Math.min(words.length, supplyIndex + 3);
        return words.slice(start, end).join(' ');
      }
      
      return supply;
    }
  }
  
  return null; // No common supply found
};