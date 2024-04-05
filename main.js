// IIFE
(() => {

    //create map in leaflet and tie it to the div called 'theMap'
    let map = L.map('theMap').setView([42, -60], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Function to fetch flight data from API
    async function fetchFlightData() {
        try {
            const response = await fetch('https://opensky-network.org/api/states/all');
            const data = await response.json();
            // Filter the data to keep only Canadian aircraft
            const canadianAircraft = data.states.filter(aircraft => aircraft[2] === 'Canada');
            return canadianAircraft;
        } catch (error) {
            console.error('Error fetching flight data:', error);
        }
    }

    // Function to update markers on the map
    async function updateMarkers() {
        const aircraftData = await fetchFlightData();

        // Transform the flight data into GeoJSON format
        const geoJsonFeatures = aircraftData.map(aircraft => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [aircraft[5], aircraft[6]]
            },
            properties: {
                direction: aircraft[10], // Direction in degrees
                callsign: aircraft[1], // Aircraft callsign
                altitude: aircraft[7], // Altitude in meters
                velocity: aircraft[9], // Velocity in m/s
                verticalRate: aircraft[11], // Vertical rate in m/s
                flightNumber: aircraft[13], // Flight number
            }
        }));

        // Create a GeoJSON feature collection
        const geoJsonCollection = {
            type: 'FeatureCollection',
            features: geoJsonFeatures
        };

        // Clear existing markers from the map
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Plot markers on the map using the GeoJSON data
        L.geoJSON(geoJsonCollection, {
            pointToLayer: function (feature, latlng) {
                // Use custom plane icon for markers
                const customIcon = L.icon({
                    iconUrl: 'plane.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });
                const marker = L.marker(latlng, { icon: customIcon });

                // Rotate the marker based on the direction of the aircraft
                marker.setRotationAngle(feature.properties.direction || 0);

                // Create popup with data
                const popupContent = `
            <b>Callsign:</b> ${feature.properties.callsign}<br>
            <b>Altitude:</b> ${feature.properties.altitude} meters<br>
            <b>Velocity:</b> ${feature.properties.velocity} m/s<br>
            <b>Vertical Rate:</b> ${feature.properties.verticalRate} m/s <br>
            <b>Flight Number:</b> ${feature.properties.flightNumber || 'N/A'}<br>
        `;

                // Bind popup to marker
                marker.bindPopup(popupContent);

                return marker;
            }
        }).addTo(map);
    }

    // Initial update of markers
    updateMarkers();

    // Refresh every 30 seconds
    setInterval(updateMarkers, 10 * 1000);


})()