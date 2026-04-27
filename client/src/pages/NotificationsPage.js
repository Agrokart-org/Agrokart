import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Badge,
  useTheme,
  alpha,
  AppBar,
  Toolbar,
  Button,
} from "@mui/material";
import {
  ArrowBack,
  NotificationsActive,
  ShoppingCart,
  LocalShipping,
  LocalOffer,
  Info,
  CheckCircle,
  DeleteOutline,
  DoneAll,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../context/NotificationProvider";

const NotificationsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, clearNotification } = useNotifications();

  // Sort by timestamp if available, else use ID
  const sortedNotifications = [...notifications].sort((a, b) => {
    const tA = a.timestamp ? new Date(a.timestamp).getTime() : a.id;
    const tB = b.timestamp ? new Date(b.timestamp).getTime() : b.id;
    return tB - tA;
  });

  const getIcon = (type) => {
    switch (type) {
      case "order":
        return <ShoppingCart />;
      case "delivery":
        return <LocalShipping />;
      case "promotion":
      case "offer":
        return <LocalOffer />;
      case "success":
        return <CheckCircle />;
      default:
        return <Info />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case "order":
        return theme.palette.primary.main;
      case "delivery":
        return theme.palette.warning.main;
      case "promotion":
      case "offer":
        return theme.palette.secondary.main;
      case "success":
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) markAsRead(notification.id);
    if (notification.action?.path) {
      navigate(notification.action.path);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F4F7F5", pb: 4 }}>
      {/* Premium Header */}
      <AppBar position="sticky" elevation={0} sx={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)" }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)} sx={{ color: "text.primary" }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1, color: "text.primary", ml: 1 }}>
            Notifications
          </Typography>
          {notifications.some((n) => !n.read) && (
            <Button size="small" onClick={markAllAsRead} startIcon={<DoneAll />} sx={{ textTransform: "none", color: "primary.main", fontWeight: "bold" }}>
              Mark all read
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ px: { xs: 2, sm: 3, md: 5 }, pt: 3, maxWidth: 800, mx: "auto" }}>
        {sortedNotifications.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Avatar
              sx={{
                width: 100, height: 100, mx: "auto", mb: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <NotificationsActive sx={{ fontSize: 50 }} />
            </Avatar>
            <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
              No Notifications Yet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              When you get updates about your orders or offers, they'll show up here.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/products")}
              sx={{ mt: 4, borderRadius: 3, px: 4, py: 1.5, fontWeight: "bold", textTransform: "none" }}
            >
              Start Shopping
            </Button>
          </Box>
        ) : (
          <AnimatePresence>
            {sortedNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                layout
              >
                <Card
                  onClick={() => handleNotificationClick(notif)}
                  sx={{
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: notif.read ? "none" : "0 4px 12px rgba(0,0,0,0.08)",
                    border: notif.read ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent",
                    bgcolor: notif.read ? "#fff" : alpha(theme.palette.primary.main, 0.03),
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 16px rgba(0,0,0,0.1)" },
                  }}
                >
                  <CardContent sx={{ display: "flex", alignItems: "flex-start", gap: 2, p: "16px !important" }}>
                    <Badge color="error" variant="dot" invisible={notif.read}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(getColor(notif.type), 0.1),
                          color: getColor(notif.type),
                          width: 48, height: 48,
                        }}
                      >
                        {getIcon(notif.type)}
                      </Avatar>
                    </Badge>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight={notif.read ? "500" : "800"} color="text.primary" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                        {notif.title}
                      </Typography>
                      <Typography variant="body2" color={notif.read ? "text.secondary" : "text.primary"} sx={{ mb: 1 }}>
                        {notif.body}
                      </Typography>
                      {notif.timestamp && (
                        <Typography variant="caption" color="text.disabled" fontWeight="500">
                          {new Date(notif.timestamp).toLocaleString(undefined, {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </Typography>
                      )}
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notif.id);
                      }}
                      sx={{ color: "text.disabled", "&:hover": { color: "error.main", bgcolor: alpha(theme.palette.error.main, 0.1) } }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </Box>
    </Box>
  );
};

export default NotificationsPage;
