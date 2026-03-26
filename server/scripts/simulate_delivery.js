const io = require('socket.io-client');

const socket = io('http://localhost:5000');

const orderId = '2024-889';

const simulationPath = [
    { lat: 18.5204, lng: 73.8567 },
    { lat: 18.5210, lng: 73.8570 },
    { lat: 18.5215, lng: 73.8575 },
    { lat: 18.5220, lng: 73.8580 },
    { lat: 18.5225, lng: 73.8585 },
    { lat: 18.5230, lng: 73.8590 },
    { lat: 18.5235, lng: 73.8595 },
    { lat: 18.5240, lng: 73.8600 },
    { lat: 18.5245, lng: 73.8605 },
    { lat: 18.5250, lng: 73.8610 },
];

socket.on('connect', () => {
    console.log('Connected to server as Simulation Bot');

    // Partner might join tracking too, or just emit.
    // In my server implementation:
    // socket.on('update_location', (data) => { socket.to(`order_${orderId}`).emit(...) })
    // So receiver must be in room. Sender just emits.

    let index = 0;
    setInterval(() => {
        if (index >= simulationPath.length) index = 0;

        const loc = simulationPath[index];
        const data = {
            orderId: orderId,
            latitude: loc.lat,
            longitude: loc.lng,
            heading: 0,
            speed: 40
        };

        socket.emit('update_location', data);
        console.log(`Emitted location: ${loc.lat}, ${loc.lng}`);
        index++;
    }, 2000);
});

socket.on('disconnect', () => {
    console.log('Disconnected');
});
