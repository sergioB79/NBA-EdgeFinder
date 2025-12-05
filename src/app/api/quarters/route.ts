import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'quarters_2025_REG.csv');
    const fileContent = await fs.readFile(filePath, 'utf-8');

    const result = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error reading or parsing CSV file:', error);
    return NextResponse.json({ message: 'Error processing CSV data' }, { status: 500 });
  }
}
