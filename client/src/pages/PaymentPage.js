import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  AppBar,
  Toolbar,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Card,
  CardContent,
  IconButton,
  useTheme,
  Alert,
  Snackbar,
  Stack,
  alpha,
  CircularProgress,
  Divider,
  useMediaQuery,
} from "@mui/material";
import {
  AccountBalanceWallet as WalletIcon,
  LocalAtm as CashIcon,
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  LocalShipping as ShippingIcon,
  Support as SupportIcon,
  VerifiedUser as VerifiedUserIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingCart as ShoppingCartIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  LocalOffer as LocalOfferIcon,
  QrCode as QrCodeIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { Collapse, Badge, Chip } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createPaymentOrder, verifyPayment } from "../services/api";

const PaymentPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { cart, getCartTotal } = useCart();
  const { user, token } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState("online");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAmountDetails, setShowAmountDetails] = useState(false);
  const [onlineSubMethod, setOnlineSubMethod] = useState("upi");
  const [couponApplied, setCouponApplied] = useState(false);

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 5000 ? 0 : 200;
  const discount = couponApplied ? 50 : 0;
  const total = subtotal + deliveryFee - discount;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      if (paymentMethod === "cod") {
        // Handle COD directly
        proceedToOrderCreation("cod");
        return;
      }

      // Handle Online Payment (Razorpay)
      // 0. CHECK CONFIGURATION
      const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_SW7KyLnf7PikYM";
      
      if (!razorpayKey || razorpayKey === "rzp_test_PLACEHOLDER") {
        console.error("Razorpay key is missing or invalid");
        setSnackbar({
          open: true,
          message:
            "Payment system configuration error (Missing Key). Please contact support.",
          severity: "error",
        });
        setIsProcessing(false);
        return;
      }

      const res = await loadRazorpayScript();

      if (!res) {
        alert(
          "Razorpay SDK failed to load. Please check your internet connection.",
        );
        setSnackbar({
          open: true,
          message: "Razorpay SDK failed to load. Are you online?",
          severity: "error",
        });
        setIsProcessing(false);
        return;
      }

      // 1. Create Order on Backend
      const order = await createPaymentOrder(total, token);

      if (!order || !order.id) {
        setSnackbar({
          open: true,
          message: "Server error. Are you online?",
          severity: "error",
        });
        setIsProcessing(false);
        return;
      }

      // 2. Initialize Razorpay Options
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "Agrokart",
        description: "Fertilizer Purchase",
        order_id: order.id,
        handler: async function (response) {
          // 3. Verify Payment
          try {
            const verification = await verifyPayment(
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              token,
            );

            if (verification.status === "success") {
              proceedToOrderCreation("online");
            } else {
              setSnackbar({
                open: true,
                message: "Payment verification failed",
                severity: "error",
              });
              setIsProcessing(false);
            }
          } catch (error) {
            console.error("Verification Error:", error);
            setSnackbar({
              open: true,
              message: "Payment verification failed",
              severity: "error",
            });
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        notes: {
          app: "Agrokart Mobile",
          user_id: user?.id || "",
        },
        theme: {
          color: "#16A34A",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
          confirm_close: true,
          escape: false,
          animation: true,
          backdropclose: false,
        },
      };

      try {
        if (window.RazorpayCheckout) {
          // Native Cordova plugin is available
          // Set up event listeners for Native plugin to receive the FULL response object
          window.RazorpayCheckout.on('payment.success', async function (successResponse) {
            try {
              const verification = await verifyPayment(
                {
                  razorpay_order_id: successResponse.razorpay_order_id,
                  razorpay_payment_id: successResponse.razorpay_payment_id,
                  razorpay_signature: successResponse.razorpay_signature,
                },
                token,
              );

              if (verification.status === "success") {
                proceedToOrderCreation("online");
              } else {
                setSnackbar({
                  open: true,
                  message: "Payment verification failed",
                  severity: "error",
                });
                setIsProcessing(false);
              }
            } catch (error) {
              console.error("Verification Error:", error);
              setSnackbar({
                open: true,
                message: "Payment verification failed",
                severity: "error",
              });
              setIsProcessing(false);
            }
          });

          window.RazorpayCheckout.on('payment.cancel', function(errorResponse) {
            console.error("Razorpay Native Payment Failed:", errorResponse);
            setSnackbar({
              open: true,
              message:
                (errorResponse && errorResponse.description) || "Payment Failed. Please try again.",
              severity: "error",
            });
            setIsProcessing(false);
          });

          // Open checkout (do not pass callbacks here or it overrides the full response)
          window.RazorpayCheckout.open(options);
        } else {
          // Web SDK fallback
          const paymentObject = new window.Razorpay(options);

          // Handle Razorpay modal close and failures
          paymentObject.on("payment.failed", function (response) {
            console.error("Razorpay Web Payment Failed:", response.error);
            setSnackbar({
              open: true,
              message:
                response.error.description || "Payment Failed. Please try again.",
              severity: "error",
            });
            setIsProcessing(false);
          });

          paymentObject.open();
        }
      } catch (razorpayError) {
        console.error("Razorpay Initialization Error:", razorpayError);
        setSnackbar({
          open: true,
          message: "Failed to initialize payment gateway. Please try again.",
          severity: "error",
        });
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Payment Error:", error);
      // Ensure we don't show a generic alert, use Snackbar
      setSnackbar({
        open: true,
        message: error.message || "Payment processing failed",
        severity: "error",
      });
      setIsProcessing(false);
    }
  };

  const proceedToOrderCreation = (method) => {
    // Store payment info for OrderConfirmationPage
    localStorage.setItem("paymentMethod", method);

    // We don't clear the cart here; OrderConfirmationPage handles the actual API call to create the internal order
    // and then clears the cart.
    // NOTE: Ideally, the verification backend step should also create the order to ensure atomicity,
    // but keeping with the existing architecture where OrderConfirmationPage creates the order.

    localStorage.setItem("orderCartItems", JSON.stringify(cart));

    setPaymentSuccess(true);
    setTimeout(() => {
      navigate("/order-confirmation");
    }, 1500);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const features = [
    {
      icon: <SecurityIcon color="primary" />,
      title: "Secure Payment",
      description: "Your payment information is encrypted and secure",
    },
    {
      icon: <ShippingIcon color="primary" />,
      title: "Fast Delivery",
      description: "Get your fertilizers delivered to your farm",
    },
    {
      icon: <SupportIcon color="primary" />,
      title: "24/7 Support",
      description: "Our team is always here to help you",
    },
  ];

  // Show payment success screen
  if (paymentSuccess) {
    return (
      <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", py: 4 }}>
        <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
          <CheckCircleIcon
            sx={{ fontSize: 80, color: "success.main", mb: 2 }}
          />
          <Typography variant="h4" gutterBottom color="success.main">
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Processing your order and redirecting to confirmation page...
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <CircularProgress color="primary" />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#F5F7F5",
        minHeight: "100vh",
        pb: { xs: "220px", md: "150px" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 1. Header (Green Theme) */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#116730", color: "white" }}>
        <Toolbar sx={{ px: 2, display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 1, color: "white" }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1.2 }}>
                Secure Checkout
              </Typography>
              <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5, opacity: 0.9 }}>
                <CheckCircleIcon sx={{ fontSize: 12 }} /> 100% Secure Payments
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ px: { xs: 2, md: 3 }, pt: 3 }}>
        {/* 2. Amount Payable Card */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: "1px solid #E0E0E0",
            bgcolor: "white"
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowAmountDetails(!showAmountDetails)}>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight="500">Amount Payable</Typography>
              <Typography variant="h5" fontWeight="800">₹{total.toFixed(2)}</Typography>
            </Box>
            <Typography variant="body2" fontWeight="700" color="#2E7D32" sx={{ display: "flex", alignItems: "center" }}>
              View Details {showAmountDetails ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </Typography>
          </Box>
          <Collapse in={showAmountDetails}>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Item Total</Typography>
                <Typography variant="body2" fontWeight="600">₹{subtotal}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Delivery Fee</Typography>
                <Typography variant="body2" fontWeight="600" color={deliveryFee === 0 ? "#2E7D32" : "inherit"}>
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                </Typography>
              </Box>
              {couponApplied && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="#2E7D32">Discount (AGRO50)</Typography>
                  <Typography variant="body2" fontWeight="600" color="#2E7D32">-₹50</Typography>
                </Box>
              )}
            </Stack>
          </Collapse>
        </Paper>

        <Typography variant="subtitle1" fontWeight="800" mb={1.5} color="#1A202C">
          Select Payment Method
        </Typography>

        {/* 3. Payment Method Section */}
        <Box sx={{ mb: 3 }}>
          {/* Pay Online Card */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: paymentMethod === "online" ? "2px solid #2E7D32" : "1px solid #E0E0E0",
              bgcolor: "white",
              mb: 2,
              overflow: "hidden"
            }}
          >
            <Box
              onClick={() => setPaymentMethod("online")}
              sx={{
                p: 2,
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                cursor: "pointer",
                bgcolor: paymentMethod === "online" ? "#FAFCFA" : "white"
              }}
            >
              <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", mt: 0.5 }}>
                <CreditCardIcon sx={{ color: "white", fontSize: 24 }} />
              </Box>
              <Box flex={1}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle1" fontWeight="800" color="#1A202C">Pay Online</Typography>
                  <Chip label="Recommended" size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: "bold", bgcolor: "#E6F4EA", color: "#2E7D32" }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Pay securely using UPI, Cards or Netbanking
                </Typography>
                
                {/* Visual Icons Row */}
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  {["UPI", "VISA", "MC", "RuPay", "Netbank"].map((lbl, i) => (
                    <Box key={i} sx={{ border: "1px solid #E0E0E0", borderRadius: 1, px: 1, py: 0.2, fontSize: "0.65rem", fontWeight: "bold", color: "#1A202C", bgcolor: "white" }}>
                      {lbl}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box>
                {paymentMethod === "online" ? (
                  <CheckCircleIcon sx={{ color: "#2E7D32" }} />
                ) : (
                  <Box sx={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #E0E0E0" }} />
                )}
              </Box>
            </Box>


          </Paper>

          {/* Cash on Delivery Card */}
          <Paper
            elevation={0}
            onClick={() => setPaymentMethod("cod")}
            sx={{
              p: 2,
              borderRadius: 2,
              border: paymentMethod === "cod" ? "2px solid #2E7D32" : "1px solid #E0E0E0",
              bgcolor: paymentMethod === "cod" ? "#FAFCFA" : "white",
              display: "flex",
              alignItems: "center",
              gap: 2,
              cursor: "pointer"
            }}
          >
            <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: "#FFEBE0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CashIcon sx={{ color: "#E05D26", fontSize: 24 }} />
            </Box>
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="800" color="#1A202C">Cash on Delivery</Typography>
              <Typography variant="body2" color="text.secondary">Pay cash when your order is delivered</Typography>
            </Box>
            <Box>
              <Radio checked={paymentMethod === "cod"} color="success" sx={{ p: 0 }} />
            </Box>
          </Paper>
        </Box>

        {/* 4. Trust & Security Notice */}
        <Box sx={{ display: "flex", gap: 1.5, bgcolor: "#FFF9E6", p: 2, borderRadius: 2, mb: 3 }}>
          <SecurityIcon sx={{ color: "#B8860B", mt: 0.5 }} />
          <Box>
            <Typography variant="body2" color="#8B6508">Your payment information is encrypted and secure.</Typography>
            <Typography variant="body2" color="#8B6508">We do not store your card or UPI details.</Typography>
          </Box>
        </Box>

        {/* 5. Features Strip */}
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1, mb: 3, "::-webkit-scrollbar": { display: "none" } }}>
          <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #E0E0E0", borderRadius: 2, display: "flex", alignItems: "center", gap: 1, minWidth: "160px" }}>
            <VerifiedUserIcon color="success" />
            <Box>
              <Typography variant="caption" fontWeight="800" display="block">Secure Payment</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem" }}>256-bit SSL encryption</Typography>
            </Box>
          </Paper>
          <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #E0E0E0", borderRadius: 2, display: "flex", alignItems: "center", gap: 1, minWidth: "160px" }}>
            <ShippingIcon color="success" />
            <Box>
              <Typography variant="caption" fontWeight="800" display="block">Fast Delivery</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem" }}>On time, every time</Typography>
            </Box>
          </Paper>
          <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #E0E0E0", borderRadius: 2, display: "flex", alignItems: "center", gap: 1, minWidth: "160px" }}>
            <SupportIcon color="success" />
            <Box>
              <Typography variant="caption" fontWeight="800" display="block">24/7 Support</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem" }}>We're here to help</Typography>
            </Box>
          </Paper>
        </Box>

        {/* 6. Offers & Discounts */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="800" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocalOfferIcon color="success" fontSize="small" /> Offers & Discounts
            </Typography>
            <Typography variant="caption" fontWeight="700" color="#2E7D32" sx={{ cursor: "pointer", display: "flex", alignItems: "center" }} onClick={() => setSnackbar({ open: true, message: "No other offers available right now.", severity: "info" })}>
              View all offers <KeyboardArrowDownIcon sx={{ transform: "rotate(-90deg)", fontSize: 16 }} />
            </Typography>
          </Box>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #E0E0E0", borderRadius: 2, bgcolor: "#FAFCFA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 40, height: 40, border: "1px dashed #2E7D32", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LocalOfferIcon sx={{ color: "#2E7D32", fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="700">Get ₹50 off on online payments</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Use code: <Chip label="AGRO50" size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: "bold", bgcolor: "#E6F4EA", color: "#2E7D32" }} />
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="subtitle2"
              fontWeight="800"
              color={couponApplied ? "error.main" : "#2E7D32"}
              sx={{ cursor: "pointer" }}
              onClick={() => {
                if (!couponApplied) {
                  setCouponApplied(true);
                  setSnackbar({ open: true, message: "Coupon applied successfully!", severity: "success" });
                } else {
                  setCouponApplied(false);
                  setSnackbar({ open: true, message: "Coupon removed.", severity: "info" });
                }
              }}
            >
              {couponApplied ? "Remove" : "Apply"}
            </Typography>
          </Paper>
        </Box>
      </Container>

      {/* 7. Bottom Sticky Action Bar */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          pb: { xs: 12, md: 2 },
          bgcolor: "white",
          borderTop: "1px solid #E0E0E0",
          boxShadow: "0 -8px 24px rgba(0,0,0,0.1)",
          zIndex: 100,
        }}
      >
        <Container maxWidth="md" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 0 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Total Amount</Typography>
            <Typography variant="h6" fontWeight="900" color="#1A202C" sx={{ lineHeight: 1 }}>₹{total.toFixed(2)}</Typography>
            <Typography variant="caption" fontWeight="600" color="text.secondary">
              You saved <span style={{ color: "#2E7D32" }}>₹{discount.toFixed(2)}</span>
            </Typography>
          </Box>
          <Button
            variant="contained"
            disabled={isProcessing}
            onClick={handlePayment}
            sx={{
              bgcolor: "#2E7D32",
              color: "white",
              borderRadius: 2,
              px: { xs: 3, md: 6 },
              py: 1.5,
              textTransform: "none",
              display: "flex",
              flexDirection: "column",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#1B5E20",
                boxShadow: "none"
              },
              "&.Mui-disabled": {
                bgcolor: "#E0E0E0",
                color: "#9E9E9E",
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isProcessing ? <CircularProgress size={16} color="inherit" /> : <LockIcon sx={{ fontSize: 16 }} />}
              <Typography variant="subtitle1" fontWeight="800">
                {isProcessing ? "Processing..." : `Pay ₹${total.toFixed(2)} Securely`}
              </Typography>
            </Box>
            {!isProcessing && (
              <Typography variant="caption" sx={{ fontSize: "0.6rem", opacity: 0.9, display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <CheckCircleIcon sx={{ fontSize: 10 }} /> 100% Secure Payment
              </Typography>
            )}
          </Button>
        </Container>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: "100px" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentPage;
