import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Construct the path to the data file
    const filePath = path.join(process.cwd(), 'data', 'games_today.json');
    
    // Read the file content
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Parse the JSON data
    const data = JSON.parse(fileContent);
    
    // Return the data as a JSON response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return NextResponse.json({ message: 'Error reading data file' }, { status: 500 });
  }
}
