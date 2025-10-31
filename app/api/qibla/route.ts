import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon') || searchParams.get('lng');
  
  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }
  
  try {
    // Check if we have cached Qibla direction for this location
    const { data: cachedDirection, error: cacheError } = await supabase
      .from('qibla_directions')
      .select('*')
      .eq('latitude', parseFloat(lat))
      .eq('longitude', parseFloat(lon))
      .single();
    
    if (cachedDirection && !cacheError) {
      return NextResponse.json({
        direction: cachedDirection.direction_degrees,
        distance: cachedDirection.distance_km,
        cached: true
      });
    }
    
    // If not cached, calculate Qibla direction and cache it
    const qiblaData = calculateQiblaDirection(parseFloat(lat), parseFloat(lon));
    
    // Cache the result
    const { error: insertError } = await supabase
      .from('qibla_directions')
      .insert({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        direction_degrees: qiblaData.direction,
        distance_km: qiblaData.distance
      });
    
    if (insertError) {
      console.error('Error caching Qibla direction:', insertError);
    }
    
    return NextResponse.json({
      ...qiblaData,
      cached: false
    });
  } catch (error) {
    console.error('Qibla API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateQiblaDirection(lat: number, lon: number) {
  // Kaaba coordinates
  const kaabaLat = 21.4225;
  const kaabaLon = 39.8262;
  
  // Convert to radians
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const kaabaLatRad = (kaabaLat * Math.PI) / 180;
  const kaabaLonRad = (kaabaLon * Math.PI) / 180;
  
  // Calculate bearing
  const deltaLon = kaabaLonRad - lonRad;
  const y = Math.sin(deltaLon) * Math.cos(kaabaLatRad);
  const x = Math.cos(latRad) * Math.sin(kaabaLatRad) - 
            Math.sin(latRad) * Math.cos(kaabaLatRad) * Math.cos(deltaLon);
  
  let bearing = Math.atan2(y, x);
  bearing = (bearing * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in kilometers
  const dLat = kaabaLatRad - latRad;
  const dLon = kaabaLonRad - lonRad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latRad) * Math.cos(kaabaLatRad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return {
    direction: Math.round(bearing * 100) / 100,
    distance: Math.round(distance * 100) / 100
  };
}