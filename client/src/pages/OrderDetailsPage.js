import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  Avatar,
  Divider,
  IconButton,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as DeliveredIcon,
  CheckCircle,
  Schedule as PendingIcon,
  Cancel as CancelledIcon,
  Inventory as PackedIcon,
  LocalShippingOutlined as OutForDeliveryIcon,
  HomeOutlined as DeliveredHomeIcon,
  Receipt as OrderIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CreditCard as PaymentIcon,
  HelpOutline as HelpIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import { styled } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import { getOrderById } from "../services/api";
import LiveTrackingMap from "../components/map/LiveTrackingMap";
import { useSocket } from "../context/SocketContext";
import { DEMO_MODE, getDeviceGPS } from "../config/demoConfig";
import AgrokartLogo from "../components/AgrokartLogo";

// Custom Animated Connector for Stepper
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient( 95deg,${theme.palette.secondary.main} 0%,${theme.palette.primary.main} 50%,${theme.palette.success.main} 100%)`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient( 95deg,${theme.palette.secondary.main} 0%,${theme.palette.primary.main} 50%,${theme.palette.success.main} 100%)`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.grey[800] : "#eaeaf0",
    borderRadius: 1,
  },
}));

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { token } = useAuth();
  const socket = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tracking State
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState("Calculating...");
  const billRef = React.useRef(null);

  // DEMO_MODE positions
  const [demoPickup, setDemoPickup] = useState(null);
  const [demoCustomer, setDemoCustomer] = useState(null);

  // DEMO_MODE: use device GPS for map positions
  useEffect(() => {
    if (!DEMO_MODE) return;
    const init = async () => {
      const [pickup, customer] = await Promise.all([
        getDeviceGPS(100),
        getDeviceGPS(80),
      ]);
      setDemoPickup(pickup);
      setDemoCustomer(customer);
    };
    init();
  }, []);

  const handleDownload = async () => {
    try {
      const element = billRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10; // Top margin

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pdfWidth,
        (canvas.height * pdfWidth) / canvas.width,
      );
      pdf.save(`Invoice-${order._id || "order"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Real-time tracking via Socket.IO
  useEffect(() => {
    if (!socket || !order) return;
    const isTrackable = [
      "shipped",
      "out_for_delivery",
      "confirmed",
      "processing",
    ].includes(order.status || order.orderStatus);
    if (!isTrackable) return;

    const trackingOrderId = order._id;
    socket.emit("join_tracking", trackingOrderId);

    const handleLocation = (data) => {
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);
      const heading = parseFloat(data.heading) || 0;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setDriverLocation({ lat, lng, heading });
        setEta(`${Math.max(1, Math.round(Math.random() * 8 + 5))} mins`);
      }
    };

    socket.on("location_updated", handleLocation);

    return () => {
      socket.off("location_updated", handleLocation);
      socket.emit("leave_tracking", trackingOrderId);
    };
  }, [socket, order]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const response = await getOrderById(orderId, token);
        setOrder(response.data || response);
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId, token]);

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return theme.palette.success.main;
      case "cancelled":
        return theme.palette.error.main;
      case "shipped":
        return theme.palette.primary.main;
      case "processing":
        return theme.palette.info.main;
      default:
        return theme.palette.warning.main;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "delivered":
        return alpha(theme.palette.success.main, 0.1);
      case "cancelled":
        return alpha(theme.palette.error.main, 0.1);
      case "shipped":
        return alpha(theme.palette.primary.main, 0.1);
      case "processing":
        return alpha(theme.palette.info.main, 0.1);
      default:
        return alpha(theme.palette.warning.main, 0.1);
    }
  };

  const getTrackingSteps = (status) => {
    const actualStatus = status || "pending";
    const baseSteps = [
      { label: "Placed", icon: <OrderIcon />, date: order?.createdAt },
      { label: "Confirmed", icon: <CheckCircle /> },
      { label: "Shipped", icon: <ShippingIcon /> },
      { label: "Delivered", icon: <DeliveredIcon /> },
    ];

    let activeIndex = 0;
    if (actualStatus === "confirmed" || actualStatus === "processing") activeIndex = 1;
    if (actualStatus === "shipped" || actualStatus === "out_for_delivery") activeIndex = 2;
    if (actualStatus === "delivered") activeIndex = 4; // All done

    return baseSteps.map((step, index) => ({
      ...step,
      completed: index < activeIndex,
      active: index === activeIndex,
    }));
  };

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{ color: theme.palette.primary.main }}
        />
      </Box>
    );

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{ color: theme.palette.primary.main }}
        />
      </Box>
    );

  if (!order) return null;

  const statusColor = getStatusColor(order.status || order.orderStatus);
  const statusBg = getStatusBg(order.status || order.orderStatus);

  return (
    <Container
      maxWidth="md"
      sx={{
        py: { xs: 2, md: 4 },
        px: { xs: 2, md: 3 },
        pb: { xs: 10, md: 12 },
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton
          onClick={() => navigate("/my-orders")}
          sx={{ bgcolor: "white", boxShadow: 1 }}
        >
          <BackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="800" sx={{ flexGrow: 1 }}>
          Order Details
        </Typography>

        {["confirmed", "shipped", "out_for_delivery", "delivered"].includes(
          order.status || order.orderStatus,
        ) && (
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            size="small"
            sx={{ bgcolor: "white" }}
          >
            Invoice
          </Button>
        )}
      </Stack>

      {/* Main Content */}
      <Stack
        spacing={3}
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Status Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: statusBg,
            border: `1px solid ${alpha(statusColor, 0.2)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              fontWeight="600"
            >
              ORDER ID
            </Typography>
            <Typography variant="h6" fontWeight="800">
              #{order.trackingNumber || order._id?.slice(-8).toUpperCase()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                dateStyle: "long",
              })}
            </Typography>
          </Box>
          <Chip
            label={(
              order.status ||
              order.orderStatus ||
              "Pending"
            ).toUpperCase()}
            sx={{
              bgcolor: statusColor,
              color: "white",
              fontWeight: "bold",
              borderRadius: 2,
              px: 1,
              height: 32,
            }}
          />
        </Paper>

        {/* Delivery PIN Banner */}
        {["confirmed", "shipped", "out_for_delivery"].includes(
          order.status || order.orderStatus,
        ) &&
          order.deliveryPin && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `1px dashed ${theme.palette.primary.main}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography
                  variant="subtitle2"
                  color="primary.main"
                  fontWeight="bold"
                >
                  DELIVERY PIN
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Share this PIN with the delivery partner to receive your order
                </Typography>
              </Box>
              <Typography
                variant="h3"
                color="primary.main"
                fontWeight="800"
                sx={{ letterSpacing: 4 }}
              >
                {order.deliveryPin}
              </Typography>
            </Paper>
          )}

        {/* Tracking Timeline */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 4 }}>
            Order Status
          </Typography>
          <Stepper
            alternativeLabel
            activeStep={(() => {
              const s = order.orderStatus || order.status || "pending";
              if (s === "delivered") return 4;
              if (s === "shipped" || s === "out_for_delivery") return 2;
              if (s === "confirmed" || s === "processing") return 1;
              return 0;
            })()}
            connector={<ColorlibConnector />}
          >
            {getTrackingSteps(order.orderStatus || order.status).map((step) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconComponent={() => (
                    <Avatar
                      sx={{
                        bgcolor:
                          step.completed || step.active
                            ? theme.palette.primary.main
                            : theme.palette.grey[200],
                        color:
                          step.completed || step.active
                            ? "white"
                            : theme.palette.grey[500],
                        width: 40,
                        height: 40,
                      }}
                    >
                      {step.icon}
                    </Avatar>
                  )}
                >
                  <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                    {step.label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Live Tracking Map + Track Button */}
        {["confirmed", "shipped", "out_for_delivery", "processing"].includes(
          order.status || order.orderStatus,
        ) && (
          <>
            <Paper
              elevation={0}
              sx={{
                height: 300,
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              }}
            >
              <LiveTrackingMap
                riderPosition={driverLocation}
                pickupPosition={
                  DEMO_MODE && demoPickup
                    ? demoPickup
                    : {
                        lat:
                          order.deliveryAddress?.coordinates
                            ?.coordinates?.[1] || 18.5204,
                        lng:
                          order.deliveryAddress?.coordinates
                            ?.coordinates?.[0] || 73.8567,
                      }
                }
                customerPosition={
                  DEMO_MODE && demoCustomer
                    ? demoCustomer
                    : {
                        lat:
                          order.deliveryAddress?.coordinates
                            ?.coordinates?.[1] || 18.525,
                        lng:
                          order.deliveryAddress?.coordinates
                            ?.coordinates?.[0] || 73.861,
                      }
                }
                riderName="Delivery Partner"
                followRider={true}
              />
            </Paper>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => navigate(`/track/${order._id}`)}
              sx={{
                borderRadius: 3,
                py: 1.5,
                fontWeight: 700,
                background: "linear-gradient(135deg, #2E7D32, #43A047)",
                boxShadow: "0 4px 16px rgba(46,125,50,0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1B5E20, #2E7D32)",
                },
              }}
              startIcon={<ShippingIcon />}
            >
              🗺️ Track Order Live
            </Button>
          </>
        )}

        {/* Items */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Items ordered
          </Typography>
          <Stack spacing={3}>
            {order.items?.map((item, index) => (
              <Box key={index} sx={{ display: "flex", gap: 2 }}>
                <Avatar
                  src={item.product?.images?.[0] || "/placeholder.png"}
                  variant="rounded"
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 3,
                    bgcolor: "#f5f5f5",
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.product?.name || item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {item.quantity} &bull;{" "}
                    {item.product?.unit || "Unit"}
                  </Typography>
                  <Typography
                    variant="h6"
                    color="primary.main"
                    fontWeight="bold"
                    sx={{ mt: 1 }}
                  >
                    ₹{item.price * item.quantity}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* Delivery & Payment Info */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                borderRadius: 4,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              }}
            >
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                  }}
                >
                  <LocationIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Delivery Address
                  </Typography>
                  <Typography variant="body1" fontWeight="600" sx={{ mt: 0.5 }}>
                    {order.deliveryAddress?.street}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.deliveryAddress?.city},{" "}
                    {order.deliveryAddress?.state} -{" "}
                    {order.deliveryAddress?.pincode}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                borderRadius: 4,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              }}
            >
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: "secondary.main",
                  }}
                >
                  <PaymentIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Payment Info
                  </Typography>
                  <Typography variant="body1" fontWeight="600" sx={{ mt: 0.5 }}>
                    {order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : "Online Payment"}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight="800"
                    sx={{ mt: 0.5, color: "success.main" }}
                  >
                    Total: ₹{order.totalAmount}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Help Section */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: "#f8f9fa",
            border: "1px dashed #ced4da",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            cursor: "pointer",
          }}
          onClick={() => window.open("mailto:support@agrokart.com")}
        >
          <HelpIcon color="action" />
          <Typography variant="body2" fontWeight="600" color="text.secondary">
            Need help with this order? Contact Support
          </Typography>
        </Paper>
      </Stack>

      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <Paper
          ref={billRef}
          sx={{
            width: "210mm",
            minHeight: "297mm",
            p: 8,
            bgcolor: "white",
            color: "black",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 4,
            }}
          >
            <Box>
              <Box
                sx={{
                  mb: 2,
                  transform: "scale(1.5)",
                  transformOrigin: "top left",
                }}
              >
                <AgrokartLogo variant="full" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Premium Agricultural Products
              </Typography>
              <Typography variant="body2" color="text.secondary">
                📧 support@agrokart.com | 📞 1800-XXX-XXXX
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: theme.palette.primary.main,
                }}
              >
                INVOICE
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Invoice #:{" "}
                {order.trackingNumber || order._id?.slice(-8).toUpperCase()}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Date:{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  dateStyle: "long",
                })}
              </Typography>
            </Box>
          </Box>

          <Divider
            sx={{
              mb: 4,
              borderColor: theme.palette.primary.main,
              borderBottomWidth: 2,
            }}
          />

          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={6}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 1, color: "text.secondary" }}
              >
                Bill To:
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {order.user?.name || "Customer"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.user?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.user?.phone}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 1, color: "text.secondary" }}
              >
                Ship To:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {order.deliveryAddress?.address ||
                  order.deliveryAddress?.street}
              </Typography>
              <Typography variant="body2">
                {order.deliveryAddress?.city}, {order.deliveryAddress?.state}
              </Typography>
              <Typography variant="body2">
                PIN: {order.deliveryAddress?.pincode}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                bgcolor: theme.palette.primary.main,
                color: "white",
                p: 1.5,
                borderRadius: 1,
              }}
            >
              <Box sx={{ flex: 4, pl: 1, fontWeight: 600 }}>Product</Box>
              <Box sx={{ flex: 1, textAlign: "center", fontWeight: 600 }}>
                Qty
              </Box>
              <Box sx={{ flex: 2, textAlign: "right", fontWeight: 600 }}>
                Price
              </Box>
              <Box sx={{ flex: 2, textAlign: "right", pr: 1, fontWeight: 600 }}>
                Total
              </Box>
            </Box>
            {order.items?.map((item, index) => (
              <Box
                key={index}
                sx={{ display: "flex", p: 1.5, borderBottom: "1px solid #eee" }}
              >
                <Box sx={{ flex: 4, pl: 1 }}>
                  <Typography variant="body2" fontWeight="600">
                    {item.product?.name || item.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.product?.unit || "Unit"}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: "center" }}>{item.quantity}</Box>
                <Box sx={{ flex: 2, textAlign: "right" }}>₹{item.price}</Box>
                <Box
                  sx={{ flex: 2, textAlign: "right", pr: 1, fontWeight: 600 }}
                >
                  ₹{(item.price * item.quantity).toFixed(2)}
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 6 }}>
            <Box sx={{ width: "40%" }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2" fontWeight="600">
                  ₹{order.totalAmount.toFixed(2)}
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Delivery Fee:</Typography>
                <Typography variant="body2" color="success.main">
                  FREE
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6" fontWeight="700">
                  Total:
                </Typography>
                <Typography variant="h6" fontWeight="700" color="primary.main">
                  ₹{order.totalAmount.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              textAlign: "center",
              mt: "auto",
              pt: 4,
              borderTop: "1px solid #eee",
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Thank you for your business!
            </Typography>
            <Typography variant="caption" color="text.disabled">
              This is a computer-generated invoice and does not require a
              signature.
            </Typography>
          </Box>
        </Paper>
      </div>
    </Container>
  );
};

export default OrderDetailsPage;
