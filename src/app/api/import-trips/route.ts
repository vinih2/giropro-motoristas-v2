// src/app/api/import-trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Service role client (server-only)
const getServiceRoleClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
};

interface ParsedTrip {
  data: string; // ISO date
  plataforma: string;
  ganho_bruto: number;
  horas: number;
  km: number;
  cidade?: string;
}

// Parse CSV linha por linha
function parseCSV(csvText: string): ParsedTrip[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const trips: ParsedTrip[] = [];
  
  // Detectar formato automaticamente
  const headerLine = lines[0].toLowerCase();
  
  // Uber format: Date,Time,City,Category,Amount,Distance,Duration
  if (headerLine.includes('date') || headerLine.includes('data')) {
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length < 5) continue;
      
      try {
        const date = new Date(parts[0]);
        const amount = parseFloat(parts[4]) || 0;
        const distance = parseFloat(parts[5]) || 0;
        const duration = parseFloat(parts[6]) || 0;
        const hours = duration / 60; // converter minutos para horas
        
        if (!isNaN(amount) && !isNaN(distance)) {
          trips.push({
            data: date.toISOString(),
            plataforma: 'Uber',
            ganho_bruto: amount,
            km: distance,
            horas: Math.max(0.25, hours),
            cidade: parts[2] || undefined,
          });
        }
      } catch (e) {
        console.warn(`Erro ao parsear linha ${i}:`, e);
      }
    }
  }
  
  return trips;
}

// Parse de foto com OCR (usando Tesseract.js ou fallback)
async function parseImageOCR(imageBuffer: Buffer): Promise<ParsedTrip[]> {
  // Para MVP, retornar array vazio
  // Em produção, usar Tesseract.js ou API de visão
  console.log('OCR não implementado no MVP. Use CSV.');
  return [];
}

// Validar trips
function validateTrips(trips: ParsedTrip[]): {
  valid: ParsedTrip[];
  errors: Array<{ index: number; error: string }>;
} {
  const valid: ParsedTrip[] = [];
  const errors: Array<{ index: number; error: string }> = [];
  
  trips.forEach((trip, index) => {
    const errs: string[] = [];
    
    if (isNaN(new Date(trip.data).getTime())) errs.push('Data inválida');
    if (trip.ganho_bruto < 0) errs.push('Ganho não pode ser negativo');
    if (trip.ganho_bruto === 0) errs.push('Ganho zerado');
    if (trip.km < 0.1) errs.push('KM mínimo: 0.1');
    if (trip.horas < 0.1) errs.push('Horas mínima: 0.1');
    if (!trip.plataforma) errs.push('Plataforma obrigatória');
    
    if (errs.length > 0) {
      errors.push({ index, error: errs.join('; ') });
    } else {
      valid.push(trip);
    }
  });
  
  return { valid, errors };
}

// Deduplicate by date + amount + km
function deduplicateTrips(trips: ParsedTrip[], existingTrips: any[]): ParsedTrip[] {
  const existingHashes = new Set(
    existingTrips.map(t => 
      createHash('md5')
        .update(`${t.data.slice(0, 10)}${Math.round(t.ganho_bruto * 100)}${Math.round(t.km * 100)}`)
        .digest('hex')
    )
  );
  
  return trips.filter(trip => {
    const hash = createHash('md5')
      .update(`${trip.data.slice(0, 10)}${Math.round(trip.ganho_bruto * 100)}${Math.round(trip.km * 100)}`)
      .digest('hex');
    return !existingHashes.has(hash);
  });
}

export async function POST(req: NextRequest) {
  try {
    const serviceRole = getServiceRoleClient();
    
    // Get auth
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify token with service role
    const { data: { user }, error: authError } = await serviceRole.auth.admin.getUserById(
      token.split('.')[0] // Extract user_id from JWT (simplified, normally decode JWT properly)
    );
    
    // Better: decode JWT properly
    let userId: string | null = null;
    try {
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = decoded.sub;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Parse form data
    const formData = await req.formData();
    const csvFile = formData.get('csv') as File | null;
    const imageFile = formData.get('image') as File | null;
    const actionType = formData.get('action') as string; // 'preview' or 'import'
    
    let trips: ParsedTrip[] = [];
    
    // Parse CSV
    if (csvFile) {
      const csvText = await csvFile.text();
      trips = parseCSV(csvText);
    }
    
    // Parse Image (TODO: implement OCR)
    if (imageFile && trips.length === 0) {
      const buffer = await imageFile.arrayBuffer();
      trips = await parseImageOCR(Buffer.from(buffer));
    }
    
    if (trips.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma corrida encontrada. Verifique o arquivo CSV.' },
        { status: 400 }
      );
    }
    
    // Validate
    const { valid: validTrips, errors: validationErrors } = validateTrips(trips);
    
    if (validTrips.length === 0) {
      return NextResponse.json(
        {
          error: 'Nenhuma corrida válida encontrada',
          errors: validationErrors,
        },
        { status: 400 }
      );
    }
    
    // PREVIEW mode: just return data
    if (actionType === 'preview') {
      return NextResponse.json({
        preview: true,
        totalTrips: trips.length,
        validTrips: validTrips.length,
        invalidTrips: validationErrors.length,
        errors: validationErrors,
        data: validTrips.slice(0, 5), // mostra primeiros 5
      });
    }
    
    // IMPORT mode: check for duplicates and insert
    if (actionType === 'import') {
      const serviceRole = getServiceRoleClient();
      
      // Get existing trips
      const { data: existingTrips } = await serviceRole
        .from('registros')
        .select('data, ganho_bruto, km')
        .eq('user_id', userId)
        .gte('data', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // últimos 90 dias
      
      // Deduplicate
      const uniqueTrips = deduplicateTrips(validTrips, existingTrips || []);
      
      if (uniqueTrips.length === 0) {
        return NextResponse.json(
          { message: 'Todas as corridas já existem no histórico.' },
          { status: 200 }
        );
      }
      
      // Insert
      const tripsToInsert = uniqueTrips.map(trip => ({
        user_id: userId,
        data: trip.data,
        plataforma: trip.plataforma,
        ganho_bruto: trip.ganho_bruto,
        horas: trip.horas,
        km: trip.km,
        cidade: trip.cidade,
        importado: true, // flag para saber que foi importado
      }));
      
      const { error: insertError, data } = await serviceRole
        .from('registros')
        .insert(tripsToInsert)
        .select();
      
      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { error: 'Erro ao inserir corridas: ' + insertError.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        success: true,
        importedCount: uniqueTrips.length,
        duplicateCount: validTrips.length - uniqueTrips.length,
        message: `${uniqueTrips.length} corridas importadas com sucesso!`,
      });
    }
    
    return NextResponse.json({ error: 'Action inválida' }, { status: 400 });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar importação: ' + String(error) },
      { status: 500 }
    );
  }
}
