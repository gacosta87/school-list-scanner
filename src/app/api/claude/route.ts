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
            text: 'Please analyze this school supply list image and extract the following information: school name, school year, teacher name, and all supply items. If there are multiple grade lists, please identify each grade and its associated items separately. Format your response as a JSON object with the following structure: { "schoolName": string, "year": string, "teacherName": string, "gradeLists": [{ "grade": string, "supplyItems": [{ "name": string, "quantity": number, "originalText": string }] }] }'
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: cleanedImageData
            }
          }
        ]
      }
    ]
  });
  
  // Parse Claude's response to extract the JSON
  try {
    // Extract the JSON from Claude's response
    const content = message.content[0].text;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                      content.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } else {
      throw new Error('Could not extract JSON from Claude response');
    }
  } catch (error) {
    console.error('Error parsing Claude response:', error);
    throw new Error('Failed to parse Claude response');
  }
} 