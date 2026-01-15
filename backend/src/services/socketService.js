const socketIo = require('socket.io');

let io;

const initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Allow all origins for development
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join a room specific to an order
        socket.on('join_tracking', (orderId) => {
            console.log(`Socket ${socket.id} joining tracking for order: ${orderId}`);
            socket.join(`order_${orderId}`);
        });

        // Leave a room
        socket.on('leave_tracking', (orderId) => {
            console.log(`Socket ${socket.id} leaving tracking for order: ${orderId}`);
            socket.leave(`order_${orderId}`);
        });

        // Handle location updates from delivery partner
        socket.on('update_location', (data) => {
            // data should contain: { orderId, latitude, longitude, heading, speed }
            const { orderId, latitude, longitude } = data;

            console.log(`Location update for order ${orderId}:`, latitude, longitude);

            // Broadcast to everyone in the order room (including the sender, though usually sender updates local state)
            // using to() sends to everyone in room EXCEPT sender. using io.to() sends to everyone.
            // We'll use socket.to() to avoid echo if sender manages own state, or io.to() if we want authoritative state.
            // Let's use socket.to() for now.
            socket.to(`order_${orderId}`).emit('location_updated', data);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = {
    initializeSocket,
    getIo
};
