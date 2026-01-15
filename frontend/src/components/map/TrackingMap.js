import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Box, Paper, Typography, Avatar, Grid } from '@mui/material';

// Fix for default Leaflet icon issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to create a rotated car icon
const getRotatedCarIcon = (heading = 0) => {
    return L.divIcon({
        className: 'custom-car-marker',
        html: `<div style="transform: rotate(${heading}deg); transition: transform 0.8s linear; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
                 <img src="https://cdn-icons-png.flaticon.com/512/744/744465.png" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" />
               </div>`,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -25]
    });
};

// Helper for Floating Text Labels (Uber Style)
const createTextLabelIcon = (text, isDark = false) => {
    return L.divIcon({
        className: 'custom-label-marker',
        html: `<div style="
            background: ${isDark ? 'black' : 'white'}; 
            color: ${isDark ? 'white' : 'black'}; 
            padding: 8px 12px; 
            border-radius: 4px; 
            font-weight: bold; 
            font-family: sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
        ">
            ${text}
        </div>`,
        iconSize: ['auto', 'auto'], // Fit content
        iconAnchor: [60, 50] // Offset to float nicely
    });
};

// Component to recenter map when position changes
const RecenterAutomatically = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        // Ensure lat/lng are valid numbers
        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            map.flyTo([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);
    return null;
};

const TrackingMap = ({
    deliveryLocation,
    pickupLocation,
    dropoffLocation,
    partnerDetails
}) => {
    // Default center (e.g., India)
    const defaultCenter = [20.5937, 78.9629];

    // Helper to validate coordinates
    const isValidCoord = (loc) => loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' && !isNaN(loc.lat) && !isNaN(loc.lng);

    // Initial center validation
    const mapCenter = isValidCoord(deliveryLocation)
        ? [deliveryLocation.lat, deliveryLocation.lng]
        : defaultCenter;

    return (
        <Box sx={{ height: '100%', width: '100%', position: 'relative', bgcolor: '#f0f0f0' }}>
            <style>
                {`
                    .custom-car-marker, .custom-label-marker {
                        background: transparent;
                        border: none;
                    }
                `}
            </style>
            <MapContainer
                center={mapCenter}
                zoom={16} // Closer zoom for street view
                style={{ height: '100%', width: '100%', borderRadius: '16px' }}
                scrollWheelZoom={true}
            >
                {/* Light Theme Tiles (Voyager - Clean & Premium) */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Route Line (Solid Black) */}
                {isValidCoord(deliveryLocation) && isValidCoord(dropoffLocation) && (
                    <Polyline
                        positions={[
                            [deliveryLocation.lat, deliveryLocation.lng],
                            [dropoffLocation.lat, dropoffLocation.lng]
                        ]}
                        pathOptions={{
                            color: 'black',
                            weight: 5,
                            opacity: 0.9,
                            lineCap: 'square'
                        }}
                    />
                )}

                {/* Delivery Partner Marker + Time Label */}
                {isValidCoord(deliveryLocation) && (
                    <>
                        <Marker
                            position={[deliveryLocation.lat, deliveryLocation.lng]}
                            icon={getRotatedCarIcon(deliveryLocation.heading || 0)}
                        >
                            <Popup>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    {partnerDetails?.name || 'Delivery Partner'}
                                </Typography>
                            </Popup>
                        </Marker>
                        {/* Floating "Time Away" Label anchored to car */}
                        <Marker
                            position={[deliveryLocation.lat, deliveryLocation.lng]}
                            icon={createTextLabelIcon('1 min away')}
                            zIndexOffset={1000} // Ensure on top
                        />
                        <RecenterAutomatically lat={deliveryLocation.lat} lng={deliveryLocation.lng} />
                    </>
                )}

                {/* Pickup Location Label */}
                {isValidCoord(pickupLocation) && (
                    <Marker
                        position={[pickupLocation.lat, pickupLocation.lng]}
                        icon={createTextLabelIcon('Pickup spot', false)}
                    >
                        <Popup>Pickup Location</Popup>
                    </Marker>
                )}
            </MapContainer>

            {/* Delivery Partner Overlay Card - Bottom Left */}
            {partnerDetails && (
                <Paper
                    elevation={3}
                    sx={{
                        position: 'absolute',
                        bottom: 24,
                        left: 24,
                        zIndex: 1000,
                        p: 2,
                        borderRadius: 3,
                        background: 'white',
                        minWidth: 280,
                        maxWidth: 320,
                        border: '1px solid #eee'
                    }}
                >
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <Avatar
                                src={partnerDetails.photo || "https://mui.com/static/images/avatar/1.jpg"}
                                sx={{ width: 60, height: 60, border: '2px solid #eee' }}
                            />
                        </Grid>
                        <Grid item xs>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#000' }}>
                                {partnerDetails.name || 'Rahul Kumar'}
                            </Typography>

                            <Box sx={{ mt: 0.5 }}>
                                <Typography variant="body2" sx={{ color: '#555', display: 'block' }}>
                                    Vehicle: <span style={{ color: '#000', fontWeight: 'bold' }}>{partnerDetails.vehicleNumber || 'MH12 AB 1234'}</span>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#555', display: 'block' }}>
                                    Contact: <span style={{ color: '#000', fontWeight: 'bold' }}>{partnerDetails.phone || '9876543210'}</span>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item>
                            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="h6">📞</Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </Box>
    );
};

export default TrackingMap;
