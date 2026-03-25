'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import { MapPin } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '500px' };
const defaultCenter = { lat: 21.2514, lng: 81.6296 };

export default function ClientMapPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: apiKey });

  useEffect(() => {
    api.get('/bookings', { params: { limit: 50 } }).then(({ data }) => setBookings(data.data || []));
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
  }, []);

  useEffect(() => {
    if (mapRef && bookings.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bookings.forEach((b) => {
        if (b.asset?.latitude && b.asset?.longitude) {
          bounds.extend({ lat: b.asset.latitude, lng: b.asset.longitude });
        }
      });
      mapRef.fitBounds(bounds, 60);
    }
  }, [mapRef, bookings]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Locations</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0 rounded-lg overflow-hidden">
              {isLoaded && apiKey ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={defaultCenter}
                  zoom={12}
                  onLoad={onMapLoad}
                  options={{ streetViewControl: true, mapTypeControl: true }}
                >
                  {bookings.map((b) =>
                    b.asset?.latitude && b.asset?.longitude ? (
                      <Marker
                        key={b.id}
                        position={{ lat: b.asset.latitude, lng: b.asset.longitude }}
                        icon={{
                          path: google.maps.SymbolPath.CIRCLE,
                          fillColor: b.status === 'CONFIRMED' ? '#22c55e' : '#f97316',
                          fillOpacity: 1,
                          strokeColor: '#fff',
                          strokeWeight: 2,
                          scale: 10,
                        }}
                        title={b.asset.name}
                        onClick={() => setSelected(b)}
                      />
                    ) : null
                  )}
                  {selected && selected.asset && (
                    <InfoWindow
                      position={{ lat: selected.asset.latitude, lng: selected.asset.longitude }}
                      onCloseClick={() => setSelected(null)}
                    >
                      <div className="p-1 min-w-[160px]">
                        <h3 className="font-bold text-sm">{selected.asset.name}</h3>
                        <p className="text-xs text-gray-600">{selected.asset.city}</p>
                        <p className="text-xs mt-1 font-semibold">{INR.format(selected.amount)}</p>
                        <p className="text-xs mt-1">{selected.status}</p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg h-[500px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Your booked locations appear here</p>
                    <p className="text-sm">{bookings.length} active bookings</p>
                    {!apiKey && <p className="text-xs mt-1">Add Google Maps API key to enable map</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="cursor-pointer hover:ring-2 hover:ring-primary transition-all" onClick={() => setSelected(b)}>
              <CardContent className="p-4">
                <p className="font-medium text-sm">{b.asset?.name}</p>
                <p className="text-xs text-muted-foreground">{b.asset?.city}</p>
                <div className="flex justify-between mt-2">
                  <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'secondary' as any} className="text-xs">{b.status}</Badge>
                  <span className="text-xs font-medium">{INR.format(b.amount)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
