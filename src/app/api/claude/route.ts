import { NextResponse } from 'next/server';
import { ClaudeProcessingResult } from '@/lib/claude-service';
import Anthropic from '@anthropic-ai/sdk';

// Claude API endpoint
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.image) {
      return NextResponse.json(
        { error: 'Image data is required' }, 
        { status: 400 }
      );
    }
    
    // Call Claude API with the image
    const claudeResponse = await callClaudeAPI(data.image);
    
    return NextResponse.json(claudeResponse);
  } catch (error) {
    console.error('Claude processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process image with Claude AI' }, 
      { status: 500 }
    );
  }
}

// Function to call Claude API using the Anthropic SDK
async function callClaudeAPI(imageData: string): Promise<ClaudeProcessingResult> {
  // Initialize the Anthropic client with your API key
  const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || '',
  });
  
  // Clean the image data by removing the data URL prefix if present
  const cleanedImageData = imageData.replace(/^data:image\/\w+;base64,/, '');
  
  // Calculate original token size (approximate)
  const originalSizeBytes = Buffer.from(cleanedImageData, 'base64').length;
  const originalTokensEstimate = Math.ceil(originalSizeBytes / 3);
  console.log(`Original image size: ${originalSizeBytes} bytes, ~${originalTokensEstimate} tokens`);
  
  // Optimize the image before sending to Claude
  const optimizedImageData = await optimizeImage(cleanedImageData);
  
  // Calculate optimized token size (approximate)
  const optimizedSizeBytes = Buffer.from(optimizedImageData, 'base64').length;
  const optimizedTokensEstimate = Math.ceil(optimizedSizeBytes / 3);
  console.log(`Optimized image size: ${optimizedSizeBytes} bytes, ~${optimizedTokensEstimate} tokens`);
  console.log(`Reduction: ${Math.round((1 - optimizedSizeBytes/originalSizeBytes) * 100)}%`);
  
  // Create a message with the Anthropic client
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please analyze this school supply list image and extract the following information: school name, school year, teacher name, and all supply items. If there are multiple grade lists, please identify each grade and its associated items separately. Format your response as a JSON object with the following structure: { "schoolName": string, "year": string, "teacherName": string, "gradeLists": [{ "grade": string, "supplyItems": [{ "name": string, "quantity": number, "originalText": string }] }] }. If this is not a school supply list image, please respond with { "error": "This does not appear to be a school supply list." }'
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: optimizedImageData
            }
          }
        ]
      }
    ]
  });
  
  // Log actual token usage from the API response
  console.log('Claude API token usage:', {
    input_tokens: message.usage?.input_tokens,
    output_tokens: message.usage?.output_tokens,
    total_tokens: message.usage?.input_tokens + message.usage?.output_tokens
  });
  
  // Parse Claude's response to extract the JSON
  try {
    // Extract the JSON from Claude's response
    const content = message.content[0].text;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                      content.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      const parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // Validate if this is a proper supply list
      if (parsedResponse.error) {
        // Claude already identified this is not a supply list
        return {
          error: parsedResponse.error,
          isValidSupplyList: false
        };
      }
      
      // Additional validation - check if we have any supply items
      const hasSupplyItems = parsedResponse.gradeLists && 
                            parsedResponse.gradeLists.some(list => 
                              list.supplyItems && 
                              Array.isArray(list.supplyItems) && 
                              list.supplyItems.length > 0
                            );
      
      if (!hasSupplyItems) {
        return {
          error: "No supply items were found in this image. Please upload a valid school supply list.",
          isValidSupplyList: false
        };
      }
      
      // If we reach here, it's a valid supply list
      return {
        ...parsedResponse,
        isValidSupplyList: true
      };
    } else {
      throw new Error('Could not extract JSON from Claude response');
    }
  } catch (error) {
    console.error('Error parsing Claude response:', error);
    return {
      error: 'Failed to parse the image. Please try again with a clearer image of a school supply list.',
      isValidSupplyList: false
    };
  }
}

// Function to optimize the image
async function optimizeImage(base64Data: string): Promise<string> {
  try {
    // Import Sharp dynamically to avoid server-side issues
    const sharp = (await import('sharp')).default;
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Target dimensions optimized for text readability
    const targetWidth = 600; // Good balance for text readability
    
    // Process the image - convert to WebP for optimal compression
    let optimizedBuffer = await sharp(buffer)
      .resize({
        width: targetWidth,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ 
        quality: 50,  // WebP can use higher quality settings while maintaining good compression
        lossless: false,
        nearLossless: true, // Better for text
        smartSubsample: true // Better color accuracy at smaller sizes
      })
      .toBuffer();
    
    // Check if WebP optimization actually reduced the size
    if (optimizedBuffer.length >= buffer.length) {
      console.log('WebP optimization did not reduce size, trying JPEG...');
      
      // Try JPEG as fallback with more aggressive settings
      optimizedBuffer = await sharp(buffer)
        .resize({
          width: targetWidth,
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: 50,
          progressive: true,
          optimizeScans: true
        })
        .toBuffer();
        
      // If JPEG also doesn't help, use original
      if (optimizedBuffer.length >= buffer.length) {
        console.log('Optimization increased size, using original image');
        return base64Data;
      }
    }
    
    // Convert back to base64
    return optimizedBuffer.toString('base64');
  } catch (error) {
    console.error('Image optimization error:', error);
    // Return original data if optimization fails
    return base64Data;
  }
} 