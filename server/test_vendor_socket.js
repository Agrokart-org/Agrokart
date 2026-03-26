const io = require('socket.io-client');

// Connect to backend
const SOCKET_URL = 'http://localhost:5000';
const socket = io(SOCKET_URL);

// Vendor Details (same as used in UI)
const VENDOR_ID = '69835bd3c3c5d217d4e9613c'; // MongoDB ID from logs
const VENDOR_UID = 'Q2W2Y72X8zWc8MZV0tbFZNbavQD2'; // Firebase UID from logs

console.log('🔌 Connecting to socket server...');

socket.on('connect', () => {
    console.log('✅ Connected with ID:', socket.id);

    // Join BOTH rooms to be sure (mimicking frontend behavior)
    console.log(`✨ Joining room: vendor_${VENDOR_UID}`);
    socket.emit('join_vendor_room', VENDOR_UID);

    console.log(`✨ Joining room: vendor_${VENDOR_ID}`);
    socket.emit('join_vendor_room', VENDOR_ID);

    console.log('👀 Waiting for "new_order_available" event...');
});

socket.on('new_order_available', (data) => {
    console.log('\n🎉🎉🎉 NOTIFICATION RECEIVED! 🎉🎉🎉');
    console.log('📦 Data:', JSON.stringify(data, null, 2));
    console.log('-------------------------------------------');
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected');
});
