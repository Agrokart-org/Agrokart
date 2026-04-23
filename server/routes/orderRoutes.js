const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder
} = require('../controllers/orderController');

router.post('/', auth, createOrder);
router.get('/my-orders', auth, getMyOrders);
router.get('/:id', auth, getOrderById);
router.patch('/:id/status', auth, updateOrderStatus);
router.post('/:id/cancel', auth, cancelOrder);
router.delete('/:id', auth, deleteOrder);

module.exports = router;
