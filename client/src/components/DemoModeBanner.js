import React from "react";
import {
  Box,
  Chip,
  Button,
  Stack,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Visibility as DemoIcon,
  SwapHoriz as SwitchIcon,
  ExitToApp as ExitIcon,
  Person as CustomerIcon,
  Store as VendorIcon,
  LocalShipping as DeliveryIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DemoModeBanner = ({ sx = {} }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isGuest, guestRole, exitGuestMode, continueAsGuest } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  if (!isGuest) return null;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSwitchModule = (targetRole) => {
    handleMenuClose();
    continueAsGuest(targetRole);
    if (targetRole === "vendor") {
      navigate("/vendor/dashboard");
    } else if (targetRole === "delivery_partner") {
      navigate("/delivery/dashboard");
    } else {
      navigate("/customer/dashboard");
    }
  };

  const handleExitDemo = () => {
    handleMenuClose();
    exitGuestMode();
    navigate("/role-selection");
  };

  const roleLabels = {
    customer: "Customer / Farmer",
    vendor: "Vendor Portal",
    delivery_partner: "Delivery Partner",
  };

  const currentRoleLabel = roleLabels[guestRole] || "Preview";

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: alpha(theme.palette.warning.main, 0.08),
        borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
        px: { xs: 1.5, sm: 3 },
        py: 0.8,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1,
        zIndex: 1100,
        ...sx,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Chip
          icon={<DemoIcon sx={{ fontSize: 16 }} />}
          label="Demo Mode"
          size="small"
          color="warning"
          sx={{
            fontWeight: 700,
            fontSize: "0.75rem",
            height: 24,
            boxShadow: `0 2px 6px ${alpha(theme.palette.warning.main, 0.3)}`,
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            display: { xs: "none", sm: "inline" },
          }}
        >
          Exploring as <strong>{currentRoleLabel}</strong> • Recruiter Preview
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1}>
        <Button
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<SwitchIcon />}
          onClick={handleMenuOpen}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.75rem",
            py: 0.3,
            px: 1.2,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          Switch Module
        </Button>

        <Button
          size="small"
          variant="text"
          color="inherit"
          startIcon={<ExitIcon sx={{ fontSize: 16 }} />}
          onClick={handleExitDemo}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.75rem",
            py: 0.3,
            px: 1,
            color: "text.secondary",
            "&:hover": { color: "text.primary" },
          }}
        >
          Exit Demo
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 4,
            sx: { borderRadius: 2, minWidth: 200, mt: 0.5 },
          }}
        >
          <MenuItem
            selected={guestRole === "customer"}
            onClick={() => handleSwitchModule("customer")}
          >
            <ListItemIcon>
              <CustomerIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="Customer / Farmer" secondary="Shop & Advisory" />
          </MenuItem>
          <MenuItem
            selected={guestRole === "vendor"}
            onClick={() => handleSwitchModule("vendor")}
          >
            <ListItemIcon>
              <VendorIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText primary="Vendor Portal" secondary="Orders & Inventory" />
          </MenuItem>
          <MenuItem
            selected={guestRole === "delivery_partner"}
            onClick={() => handleSwitchModule("delivery_partner")}
          >
            <ListItemIcon>
              <DeliveryIcon fontSize="small" color="info" />
            </ListItemIcon>
            <ListItemText primary="Delivery Partner" secondary="Rides & Routing" />
          </MenuItem>
        </Menu>
      </Stack>
    </Box>
  );
};

export default DemoModeBanner;
