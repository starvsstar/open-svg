import { NextResponse } from 'next/server';
import swaggerSpecs from '@/swagger';

export async function GET() {
  return NextResponse.json(swaggerSpecs);
} 