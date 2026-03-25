'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { INR } from '@advantage/shared';
import { MapPin, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '600px' };
const defaultCenter = { lat: 21.2514, lng: 81.6296 }; // Raipur, CG

const markerColors: Record<string, string> = {
  green: '#22c55e',
  orange: '#f97316',
  red: '#ef4444',
  grey: '#9ca3af',
};

export default function MapViewPage() {
  const [markers, setMarkers] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [hoveredAsset, setHoveredAsset] = useState<any>(null);
  const [cityFilter, setCityFilter] = useState('');
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  useEffect(() => {
    const params: any = {};
    if (cityFilter && cityFilter !== 'all') params.city = cityFilter;
    api.get('/assets/map', { params }).then(({ data }) => setMarkers(data.data || []));
  }, [cityFilter]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
  }, []);

  // Fit bounds when markers change
  useEffect(() => {
    if (mapRef && markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((m) => bounds.extend({ lat: m.latitude, lng: m.longitude }));
      mapRef.fitBounds(bounds, 60);
    }
  }, [mapRef, markers]);

  const getMarkerIcon = (color: string) => {
    const fill = markerColors[color] || markerColors.grey;
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: fill,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 10,
    };
  };

  const renderFallbackMap = () => (
    <div className="relative bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg h-[600px] overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p className="text-lg font-medium">Google Maps</p>
          {loadError ? (
            <p className="text-sm text-red-500">Failed to load Google Maps. Check your API key.</p>
          ) : !apiKey ? (
            <p className="text-sm">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to web/.env.local</p>
          ) : (
            <p className="text-sm">Loading map...</p>
          )}
          <p className="text-xs mt-2">{markers.length} assets loaded</p>
        </div>
      </div>
      {/* Fallback marker grid */}
      <div className="absolute inset-4 grid grid-cols-5 gap-2 p-4 overflow-y-auto">
        {markers.slice(0, 40).map((marker) => (
          <button
            key={marker.id}
            onClick={() => setSelectedAsset(marker)}
            className={`relative group flex flex-col items-center justify-center p-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-all ${
              selectedAsset?.id === marker.id ? 'bg-white/70 dark:bg-black/30 ring-2 ring-primary' : ''
            }`}
          >
            {marker.primaryPhotoUrl ? (
              <img src={marker.primaryPhotoUrl} alt={marker.name} className="w-full h-16 object-cover rounded-md" />
            ) : (
              <div className="w-full h-16 bg-white/30 rounded-md flex items-center justify-center">
                <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: markerColors[marker.color] || markerColors.grey }} />
              </div>
            )}
            <span className="text-[9px] mt-1 text-center font-medium leading-tight truncate max-w-full">
              {marker.code}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Map View</h1>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" />Available</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" />Partial</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" />Booked</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400" />Maintenance</span>
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Cities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              <SelectItem value="Raipur">Raipur</SelectItem>
              <SelectItem value="Bhilai">Bhilai</SelectItem>
              <SelectItem value="Durg">Durg</SelectItem>
              <SelectItem value="Bilaspur">Bilaspur</SelectItem>
              <SelectItem value="Korba">Korba</SelectItem>
              <SelectItem value="Rajnandgaon">Rajnandgaon</SelectItem>
              <SelectItem value="Jagdalpur">Jagdalpur</SelectItem>
              <SelectItem value="Ambikapur">Ambikapur</SelectItem>
              <SelectItem value="Raigarh">Raigarh</SelectItem>
              <SelectItem value="Dhamtari">Dhamtari</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0 rounded-lg overflow-hidden">
              {isLoaded && apiKey ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={defaultCenter}
                  zoom={12}
                  onLoad={onMapLoad}
                  options={{
                    streetViewControl: true,
                    mapTypeControl: true,
                    fullscreenControl: true,
                  }}
                >
                  {markers.map((marker) => (
                    <Marker
                      key={marker.id}
                      position={{ lat: marker.latitude, lng: marker.longitude }}
                      icon={getMarkerIcon(marker.color)}
                      title={`${marker.code} - ${marker.name}`}
                      onClick={() => { setHoveredAsset(null); setSelectedAsset(marker); }}
                      onMouseOver={() => { if (selectedAsset?.id !== marker.id) setHoveredAsset(marker); }}
                      onMouseOut={() => setHoveredAsset(null)}
                    />
                  ))}

                  {/* Hover preview with photo */}
                  {hoveredAsset && hoveredAsset.id !== selectedAsset?.id && (
                    <InfoWindow
                      position={{ lat: hoveredAsset.latitude, lng: hoveredAsset.longitude }}
                      options={{ disableAutoPan: true, pixelOffset: new google.maps.Size(0, -10) }}
                    >
                      <div style={{ width: '200px' }}>
                        {hoveredAsset.primaryPhotoUrl ? (
                          <img
                            src={hoveredAsset.primaryPhotoUrl}
                            alt={hoveredAsset.name}
                            style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '120px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>No photo</span>
                          </div>
                        )}
                        <p style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hoveredAsset.name}</p>
                        <p style={{ fontSize: '10px', color: '#6b7280' }}>{hoveredAsset.code} &bull; {INR.format(hoveredAsset.monthlyRate)}/mo</p>
                      </div>
                    </InfoWindow>
                  )}

                  {/* Click info window */}
                  {selectedAsset && (
                    <InfoWindow
                      position={{ lat: selectedAsset.latitude, lng: selectedAsset.longitude }}
                      onCloseClick={() => setSelectedAsset(null)}
                    >
                      <div style={{ padding: '4px', minWidth: '200px' }}>
                        {selectedAsset.primaryPhotoUrl && (
                          <img
                            src={selectedAsset.primaryPhotoUrl}
                            alt={selectedAsset.name}
                            style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '4px', marginBottom: '6px' }}
                          />
                        )}
                        <h3 style={{ fontWeight: 'bold', fontSize: '13px' }}>{selectedAsset.name}</h3>
                        <p style={{ fontSize: '11px', color: '#6b7280' }}>{selectedAsset.code} &bull; {selectedAsset.type?.replace(/_/g, ' ')}</p>
                        <p style={{ fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>{INR.format(selectedAsset.monthlyRate)}/mo</p>
                        <p style={{ fontSize: '11px', marginTop: '2px', color: markerColors[selectedAsset.color] }}>
                          ● {selectedAsset.status?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                renderFallbackMap()
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {selectedAsset ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{selectedAsset.name}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedAsset(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {selectedAsset.primaryPhotoUrl ? (
                  <img src={selectedAsset.primaryPhotoUrl} alt={selectedAsset.name} className="w-full h-40 object-cover rounded-md" />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center rounded-md">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <Badge variant={selectedAsset.color === 'green' ? 'success' : selectedAsset.color === 'orange' ? 'warning' : selectedAsset.color === 'red' ? 'destructive' : 'secondary' as any}>
                  {selectedAsset.status?.replace(/_/g, ' ')}
                </Badge>
                <p><strong>Code:</strong> {selectedAsset.code}</p>
                <p><strong>Type:</strong> {selectedAsset.type?.replace(/_/g, ' ')}</p>
                <p><strong>Rate:</strong> {INR.format(selectedAsset.monthlyRate)}/mo</p>
                <p><strong>Coords:</strong> {selectedAsset.latitude?.toFixed(4)}, {selectedAsset.longitude?.toFixed(4)}</p>
                <Link href={`/dashboard/assets/${selectedAsset.id}`}>
                  <Button className="w-full mt-2" size="sm">View Details</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click a marker to view details</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm">Asset Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total</span><span className="font-medium">{markers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Available</span>
                <span>{markers.filter((m) => m.color === 'green').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-600">Partial</span>
                <span>{markers.filter((m) => m.color === 'orange').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Booked</span>
                <span>{markers.filter((m) => m.color === 'red').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
