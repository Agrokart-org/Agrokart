import React, { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Rating,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Button,
  Divider,
  LinearProgress,
  Snackbar,
  Alert,
  Fab,
  Slide,
  useTheme,
  alpha,
  Skeleton,
} from "@mui/material";
import {
  Search as SearchIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Verified as VerifiedIcon,
  Groups as GroupsIcon,
  PostAdd as PostAddIcon,
  BookmarkAdded as BookmarkIcon,
  KeyboardArrowRight as ArrowRightIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  EmojiPeople as WorkerIcon,
  Tune as TuneIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

// ──────────────────────────────────────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────────────────────────────────────
const labourers = [
  {
    id: 1,
    name: "Rajesh Kumar",
    avatar: "https://i.pravatar.cc/150?img=12",
    rating: 4.8,
    reviews: 45,
    skills: ["Harvesting", "Planting", "Irrigation"],
    experience: "5 yrs",
    hourlyRate: 150,
    location: "Pune, MH",
    availability: "Available",
    phone: "+91 98765 43210",
    completedJobs: 120,
    verified: true,
  },
  {
    id: 2,
    name: "Suresh Patil",
    avatar: "https://i.pravatar.cc/150?img=33",
    rating: 4.6,
    reviews: 32,
    skills: ["Pesticide Spraying", "Weeding"],
    experience: "3 yrs",
    hourlyRate: 120,
    location: "Nashik, MH",
    availability: "Available",
    phone: "+91 98765 43211",
    completedJobs: 85,
    verified: true,
  },
  {
    id: 3,
    name: "Amit Deshmukh",
    avatar: "https://i.pravatar.cc/150?img=51",
    rating: 4.9,
    reviews: 67,
    skills: ["Tractor Operation", "Land Preparation"],
    experience: "8 yrs",
    hourlyRate: 200,
    location: "Solapur, MH",
    availability: "Busy",
    phone: "+91 98765 43212",
    completedJobs: 200,
    verified: true,
  },
  {
    id: 4,
    name: "Prakash Jadhav",
    avatar: "https://i.pravatar.cc/150?img=68",
    rating: 4.7,
    reviews: 28,
    skills: ["Fertilizer Application", "Soil Testing"],
    experience: "4 yrs",
    hourlyRate: 130,
    location: "Satara, MH",
    availability: "Available",
    phone: "+91 98765 43213",
    completedJobs: 95,
    verified: false,
  },
  {
    id: 5,
    name: "Ganesh Waghmare",
    avatar: "https://i.pravatar.cc/150?img=15",
    rating: 4.5,
    reviews: 19,
    skills: ["Irrigation", "Weeding", "Planting"],
    experience: "2 yrs",
    hourlyRate: 100,
    location: "Kolhapur, MH",
    availability: "Available",
    phone: "+91 98765 43214",
    completedJobs: 42,
    verified: false,
  },
  {
    id: 6,
    name: "Santosh Bhosale",
    avatar: "https://i.pravatar.cc/150?img=22",
    rating: 4.3,
    reviews: 11,
    skills: ["Harvesting", "Pesticide Spraying"],
    experience: "1 yr",
    hourlyRate: 90,
    location: "Aurangabad, MH",
    availability: "Available",
    phone: "+91 98765 43215",
    completedJobs: 18,
    verified: false,
  },
];

const myBookings = [
  {
    id: "BK-001",
    labourerName: "Rajesh Kumar",
    avatar: "https://i.pravatar.cc/150?img=12",
    service: "Harvesting",
    date: "25 Dec 2025",
    duration: "8 hours",
    status: "Confirmed",
    totalCost: 1200,
    statusColor: "#10B981",
  },
  {
    id: "BK-002",
    labourerName: "Amit Deshmukh",
    avatar: "https://i.pravatar.cc/150?img=51",
    service: "Land Preparation",
    date: "28 Dec 2025",
    duration: "6 hours",
    status: "Pending",
    totalCost: 1200,
    statusColor: "#F59E0B",
  },
  {
    id: "BK-003",
    labourerName: "Suresh Patil",
    avatar: "https://i.pravatar.cc/150?img=33",
    service: "Pesticide Spraying",
    date: "20 Dec 2025",
    duration: "4 hours",
    status: "Completed",
    totalCost: 480,
    statusColor: "#6366F1",
  },
];

const skillOptions = [
  "Harvesting",
  "Planting",
  "Irrigation",
  "Pesticide Spraying",
  "Tractor Operation",
  "Weeding",
  "Soil Testing",
  "Fertilizer Application",
  "Land Preparation",
];

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
const AvailabilityDot = ({ available }) => (
  <Box
    sx={{
      width: 10,
      height: 10,
      borderRadius: "50%",
      bgcolor: available ? "#10B981" : "#F59E0B",
      border: "2px solid white",
      position: "absolute",
      bottom: 2,
      right: 2,
      boxShadow: `0 0 0 2px ${available ? "#10B981" : "#F59E0B"}30`,
    }}
  />
);

// ──────────────────────────────────────────────────────────────────────────────
// Components
// ──────────────────────────────────────────────────────────────────────────────

const WorkerCard = ({ worker, onBook }) => {
  const isAvailable = worker.availability === "Available";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      whileTap={{ scale: 0.98 }}
    >
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: 3,
          p: 2,
          mb: 2,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          border: "1px solid #f0f0f0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Availability ribbon */}
        {isAvailable && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              bgcolor: "#10B981",
              color: "white",
              fontSize: "0.6rem",
              fontWeight: 700,
              px: 1,
              py: 0.3,
              borderBottomLeftRadius: 8,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Available
          </Box>
        )}

        {/* Header row */}
        <Box sx={{ display: "flex", gap: 2, mb: 1.5 }}>
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              src={worker.avatar}
              sx={{ width: 58, height: 58, border: "2px solid #e8f5e9" }}
            />
            <AvailabilityDot available={isAvailable} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.2 }}
            >
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {worker.name}
              </Typography>
              {worker.verified && (
                <VerifiedIcon sx={{ fontSize: 15, color: "#1D9BF0" }} />
              )}
            </Box>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
            >
              <StarIcon sx={{ fontSize: 13, color: "#F59E0B" }} />
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.primary"
              >
                {worker.rating}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({worker.reviews} reviews)
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <LocationIcon sx={{ fontSize: 13, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {worker.location}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            <Typography
              variant="h6"
              fontWeight={800}
              color="primary.main"
              lineHeight={1}
            >
              ₹{worker.hourlyRate}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              /hr
            </Typography>
          </Box>
        </Box>

        {/* Skills */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
          {worker.skills.map((s, i) => (
            <Chip
              key={i}
              label={s}
              size="small"
              sx={{
                bgcolor: "#F0FDF4",
                color: "#166534",
                fontSize: "0.65rem",
                fontWeight: 600,
                height: 22,
                border: "1px solid #BBF7D0",
              }}
            />
          ))}
        </Box>

        {/* Stats row */}
        <Box sx={{ display: "flex", gap: 3, mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <WorkIcon sx={{ fontSize: 13, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {worker.experience} exp.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CheckCircleIcon sx={{ fontSize: 13, color: "#10B981" }} />
            <Typography variant="caption" color="text.secondary">
              {worker.completedJobs} jobs done
            </Typography>
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "#25D366",
              color: "#25D366",
              px: 1.5,
              minWidth: 0,
              "&:hover": { borderColor: "#25D366", bgcolor: "#F0FFF4" },
            }}
            href={`https://wa.me/${worker.phone.replace(/\D/g, "")}`}
            startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
          >
            Chat
          </Button>
          <Button
            variant="contained"
            size="small"
            fullWidth
            disabled={!isAvailable}
            onClick={() => onBook(worker)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: isAvailable ? "#2E7D32" : undefined,
              boxShadow: "none",
              "&:hover": { bgcolor: "#1B5E20", boxShadow: "none" },
            }}
          >
            {isAvailable ? "Book Now" : "Busy"}
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
};

const BookingCard = ({ booking }) => (
  <Box
    sx={{
      bgcolor: "white",
      borderRadius: 3,
      p: 2,
      mb: 2,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      border: `1px solid ${alpha(booking.statusColor, 0.25)}`,
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Status stripe */}
    <Box
      sx={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        bgcolor: booking.statusColor,
        borderRadius: "4px 0 0 4px",
      }}
    />

    <Box sx={{ display: "flex", gap: 1.5, ml: 0.5 }}>
      <Avatar
        src={booking.avatar}
        sx={{ width: 44, height: 44, flexShrink: 0 }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {booking.labourerName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {booking.service}
            </Typography>
          </Box>
          <Chip
            label={booking.status}
            size="small"
            sx={{
              bgcolor: alpha(booking.statusColor, 0.1),
              color: booking.statusColor,
              fontWeight: 700,
              fontSize: "0.65rem",
              height: 22,
              ml: 1,
            }}
          />
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CalendarIcon sx={{ fontSize: 12, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {booking.date}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <TimeIcon sx={{ fontSize: 12, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {booking.duration}
              </Typography>
            </Box>
          </Box>
          <Typography variant="subtitle2" fontWeight={800} color="primary.main">
            ₹{booking.totalCost.toLocaleString("en-IN")}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ mt: 0.5, display: "block" }}
        >
          ID: {booking.id}
        </Typography>
      </Box>
    </Box>
  </Box>
);

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────
const LabourManagement = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("hub"); // "hub", 0=find, 1=bookings, 2=post, 3=register
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSkill, setFilterSkill] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [bookingWorker, setBookingWorker] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingHours, setBookingHours] = useState(4);
  const [labourList, setLabourList] = useState(labourers);
  const [snackbar, setSnackbar] = useState({
    open: false,
    msg: "",
    severity: "success",
  });

  // Post job form
  const [jobForm, setJobForm] = useState({
    title: "",
    category: "",
    desc: "",
    date: "",
    duration: "",
    budget: "",
    location: "",
  });

  // Register form
  const [regForm, setRegForm] = useState({
    name: "",
    phone: "",
    location: "",
    skills: [],
    experience: "",
    hourlyRate: "",
  });

  const tabs = [
    { label: "Find", icon: <GroupsIcon sx={{ fontSize: 20 }} /> },
    { label: "Bookings", icon: <BookmarkIcon sx={{ fontSize: 20 }} /> },
    { label: "Post Job", icon: <PostAddIcon sx={{ fontSize: 20 }} /> },
    { label: "Register", icon: <WorkerIcon sx={{ fontSize: 20 }} /> },
  ];

  const filteredWorkers = labourList.filter((w) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      w.name.toLowerCase().includes(q) ||
      w.location.toLowerCase().includes(q) ||
      w.skills.some((s) => s.toLowerCase().includes(q));
    const matchesSkill =
      filterSkill === "All" || w.skills.includes(filterSkill);
    return matchesSearch && matchesSkill;
  });

  const handleBook = (worker) => {
    setBookingWorker(worker);
  };

  const handleConfirmBook = () => {
    setSnackbar({
      open: true,
      msg: `Booking confirmed for ${bookingWorker.name}!`,
      severity: "success",
    });
    setBookingWorker(null);
  };

  const handlePostJob = () => {
    if (!jobForm.title || !jobForm.category || !jobForm.location) {
      setSnackbar({
        open: true,
        msg: "Please fill in required fields",
        severity: "error",
      });
      return;
    }
    setSnackbar({
      open: true,
      msg: "Job posted! Workers will contact you soon.",
      severity: "success",
    });
    setJobForm({
      title: "",
      category: "",
      desc: "",
      date: "",
      duration: "",
      budget: "",
      location: "",
    });
  };

  const handleRegister = () => {
    if (!regForm.name || !regForm.phone || !regForm.location) {
      setSnackbar({
        open: true,
        msg: "Please fill name, phone & location",
        severity: "error",
      });
      return;
    }
    const newWorker = {
      id: Date.now(),
      name: regForm.name,
      avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
      rating: 5.0,
      reviews: 0,
      skills: regForm.skills.length > 0 ? regForm.skills : ["General Labor"],
      experience: regForm.experience ? `${regForm.experience} yrs` : "0 yrs",
      hourlyRate: regForm.hourlyRate || 100,
      location: regForm.location,
      availability: "Available",
      phone: regForm.phone,
      completedJobs: 0,
      verified: false,
    };
    setLabourList([newWorker, ...labourList]);
    setSnackbar({
      open: true,
      msg: "Profile registered! Visible to farmers now.",
      severity: "success",
    });
    setRegForm({
      name: "",
      phone: "",
      location: "",
      skills: [],
      experience: "",
      hourlyRate: "",
    });
    setTimeout(() => setActiveTab(0), 1500);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F8FAF8",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: { xs: "100vw", sm: 480 },
        mx: "auto",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* ── HEADER ── */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)",
          pt: 6,
          pb: 2.5,
          px: 2.5,
          position: "sticky",
          top: 0,
          zIndex: 10,
          boxShadow: "0 4px 20px rgba(27,94,32,0.35)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
            {activeTab !== "hub" && (
              <IconButton 
                onClick={() => setActiveTab("hub")} 
                sx={{ color: "white", mr: 1, ml: -1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography
              variant="h5"
              fontWeight={800}
              color="white"
              sx={{ letterSpacing: -0.5 }}
            >
              Labour Hub 👷
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.75)", display: "block", mb: 2, ml: activeTab !== "hub" ? 5 : 0 }}
          >
            Find skilled farm workers near you
          </Typography>

        </motion.div>
      </Box>



      {/* ── CONTENT ── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden", position: "relative" }}>
        <AnimatePresence mode="wait">
          {/* ════════════ HUB VIEW ════════════ */}
          {activeTab === "hub" && (
            <motion.div
              key="hub"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", height: "100%", justifyContent: "center" }}
            >
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="h4" fontWeight="900" sx={{ mb: 1, color: "#1B5E20" }}>
                  Welcome to Labour Hub
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Are you looking to hire farm workers or offer your services?
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={() => setActiveTab(0)}
                sx={{
                  background: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
                  borderRadius: 4,
                  py: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  boxShadow: "0 12px 24px rgba(46,125,50,0.25)",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: "0 16px 32px rgba(46,125,50,0.35)" },
                  transition: "all 0.3s ease"
                }}
              >
                <GroupsIcon sx={{ fontSize: 48, color: "white" }} />
                <Typography variant="h5" fontWeight="800" color="white" textTransform="none">
                  Hire Labour
                </Typography>
                <Typography variant="caption" color="rgba(255,255,255,0.8)" textTransform="none">
                  Find and book skilled agricultural workers
                </Typography>
              </Button>

              <Button
                variant="contained"
                onClick={() => setActiveTab(3)}
                sx={{
                  background: "linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)",
                  borderRadius: 4,
                  py: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  boxShadow: "0 12px 24px rgba(21,101,192,0.25)",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: "0 16px 32px rgba(21,101,192,0.35)" },
                  transition: "all 0.3s ease"
                }}
              >
                <WorkerIcon sx={{ fontSize: 48, color: "white" }} />
                <Typography variant="h5" fontWeight="800" color="white" textTransform="none">
                  Become a Labour
                </Typography>
                <Typography variant="caption" color="rgba(255,255,255,0.8)" textTransform="none">
                  Register your skills and get hired by farmers
                </Typography>
              </Button>
            </motion.div>
          )}

          {/* ════════════ TAB 0: FIND LABOUR ════════════ */}
          {activeTab === 0 && (
            <motion.div
              key="find"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              style={{ padding: "16px" }}
            >
              {/* Search bar */}
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search name, skill, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 3,
                      bgcolor: "white",
                      fontSize: "0.875rem",
                    },
                  }}
                />
                <IconButton
                  onClick={() => setShowFilter(!showFilter)}
                  sx={{
                    bgcolor: showFilter ? "#2E7D32" : "white",
                    color: showFilter ? "white" : "#2E7D32",
                    borderRadius: 2,
                    border: "1px solid #E0E0E0",
                    "&:hover": { bgcolor: showFilter ? "#1B5E20" : "#F1F8E9" },
                  }}
                >
                  <TuneIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>

              {/* Filter row */}
              <AnimatePresence>
                {showFilter && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <Box
                      sx={{
                        bgcolor: "white",
                        borderRadius: 3,
                        p: 1.5,
                        mb: 2,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.secondary"
                        sx={{ mb: 1, display: "block" }}
                      >
                        FILTER BY SKILL
                      </Typography>
                      <Box
                        sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}
                      >
                        {["All", ...skillOptions].map((s) => (
                          <Chip
                            key={s}
                            label={s}
                            size="small"
                            onClick={() => setFilterSkill(s)}
                            sx={{
                              bgcolor:
                                filterSkill === s ? "#2E7D32" : "#F5F5F5",
                              color:
                                filterSkill === s ? "white" : "text.secondary",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                              cursor: "pointer",
                              "&:hover": {
                                bgcolor:
                                  filterSkill === s ? "#1B5E20" : "#E8F5E9",
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result count */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1.5, display: "block", fontWeight: 600 }}
              >
                {filteredWorkers.length} workers found
              </Typography>

              {/* Workers list */}
              {filteredWorkers.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Typography fontSize={40}>😕</Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    color="text.secondary"
                  >
                    No workers found
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Try different filters
                  </Typography>
                </Box>
              ) : (
                filteredWorkers.map((w) => (
                  <WorkerCard key={w.id} worker={w} onBook={handleBook} />
                ))
              )}
            </motion.div>
          )}

          {/* ════════════ TAB 1: MY BOOKINGS ════════════ */}
          {activeTab === 1 && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              style={{ padding: "16px" }}
            >
              {/* Summary pills */}
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                {[
                  { label: "All", count: myBookings.length, color: "#6366F1" },
                  {
                    label: "Confirmed",
                    count: myBookings.filter((b) => b.status === "Confirmed")
                      .length,
                    color: "#10B981",
                  },
                  {
                    label: "Pending",
                    count: myBookings.filter((b) => b.status === "Pending")
                      .length,
                    color: "#F59E0B",
                  },
                ].map((p, i) => (
                  <Box
                    key={i}
                    sx={{
                      flex: 1,
                      bgcolor: alpha(p.color, 0.1),
                      borderRadius: 2.5,
                      p: 1.2,
                      textAlign: "center",
                      border: `1px solid ${alpha(p.color, 0.2)}`,
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{ color: p.color, lineHeight: 1 }}
                    >
                      {p.count}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: p.color, fontSize: "0.65rem", opacity: 0.8 }}
                    >
                      {p.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="text.secondary"
                sx={{
                  mb: 1.5,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontSize: "0.7rem",
                }}
              >
                Recent Bookings
              </Typography>

              {myBookings.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </motion.div>
          )}

          {/* ════════════ TAB 2: POST JOB ════════════ */}
          {activeTab === 2 && (
            <motion.div
              key="post"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              style={{ padding: "16px" }}
            >
              <Box
                sx={{
                  bgcolor: "white",
                  borderRadius: 3,
                  p: 2.5,
                  mb: 2,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 2.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2.5,
                      bgcolor: "#E8F5E9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PostAddIcon sx={{ color: "#2E7D32", fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800}>
                      Post a Job
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Workers near you will apply
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Job Title *"
                    placeholder="e.g., Need harvesting help for 2 acres"
                    fullWidth
                    size="small"
                    value={jobForm.title}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, title: e.target.value })
                    }
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>Category *</InputLabel>
                    <Select
                      value={jobForm.category}
                      label="Category *"
                      onChange={(e) =>
                        setJobForm({ ...jobForm, category: e.target.value })
                      }
                      sx={{ borderRadius: 2.5 }}
                    >
                      {skillOptions.map((s) => (
                        <MenuItem key={s} value={s.toLowerCase()}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Description"
                    placeholder="Describe the work, requirements, crop type..."
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    value={jobForm.desc}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, desc: e.target.value })
                    }
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  />
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Start Date"
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={jobForm.date}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, date: e.target.value })
                      }
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                    <TextField
                      label="Duration"
                      placeholder="e.g. 2 days"
                      size="small"
                      value={jobForm.duration}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, duration: e.target.value })
                      }
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                  </Box>
                  <TextField
                    label="Budget (₹)"
                    placeholder="₹ per hour or per day"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    }}
                    value={jobForm.budget}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, budget: e.target.value })
                    }
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  />
                  <TextField
                    label="Farm Location *"
                    placeholder="Village, Taluka, District"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon sx={{ fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    value={jobForm.location}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, location: e.target.value })
                    }
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handlePostJob}
                    sx={{
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 800,
                      py: 1.5,
                      fontSize: "1rem",
                      bgcolor: "#2E7D32",
                      boxShadow: "0 4px 16px rgba(46,125,50,0.35)",
                      "&:hover": {
                        bgcolor: "#1B5E20",
                        boxShadow: "0 6px 20px rgba(46,125,50,0.45)",
                      },
                    }}
                    startIcon={<AddIcon />}
                  >
                    Post Job
                  </Button>
                </Box>
              </Box>
            </motion.div>
          )}

          {/* ════════════ TAB 3: REGISTER ════════════ */}
          {activeTab === 3 && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              style={{ padding: "16px" }}
            >
              {/* Banner */}
              <Box
                sx={{
                  background: "linear-gradient(135deg, #1B5E20, #43A047)",
                  borderRadius: 3,
                  p: 2.5,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box sx={{ fontSize: 44, lineHeight: 1 }}>👨‍🌾</Box>
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={800}
                    color="white"
                  >
                    Work Nearby
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    Register your profile and get hired by farmers in your
                    village
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                    {["Free", "Trusted", "1000+ Farmers"].map((tag, i) => (
                      <Chip
                        key={i}
                        label={tag}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                          fontSize: "0.6rem",
                          height: 18,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  bgcolor: "white",
                  borderRadius: 3,
                  p: 2.5,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontSize: "0.7rem",
                  }}
                >
                  Your Details
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Full Name *"
                    size="small"
                    fullWidth
                    value={regForm.name}
                    onChange={(e) =>
                      setRegForm({ ...regForm, name: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  />
                  <TextField
                    label="Mobile Number *"
                    size="small"
                    fullWidth
                    value={regForm.phone}
                    onChange={(e) =>
                      setRegForm({ ...regForm, phone: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  />
                  <TextField
                    label="Your Location *"
                    placeholder="Village, Taluka, District"
                    size="small"
                    fullWidth
                    value={regForm.location}
                    onChange={(e) =>
                      setRegForm({ ...regForm, location: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon sx={{ fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Farmers in this area will see your profile"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  />

                  {/* Skills picker */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                      sx={{ mb: 1, display: "block" }}
                    >
                      YOUR SKILLS (tap to select)
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {skillOptions.map((s) => {
                        const selected = regForm.skills.includes(s);
                        return (
                          <Chip
                            key={s}
                            label={s}
                            size="small"
                            onClick={() => {
                              setRegForm({
                                ...regForm,
                                skills: selected
                                  ? regForm.skills.filter((x) => x !== s)
                                  : [...regForm.skills, s],
                              });
                            }}
                            sx={{
                              bgcolor: selected ? "#2E7D32" : "#F5F5F5",
                              color: selected ? "white" : "text.secondary",
                              fontWeight: 600,
                              fontSize: "0.72rem",
                              cursor: "pointer",
                              "&:hover": {
                                bgcolor: selected ? "#1B5E20" : "#E8F5E9",
                                color: selected ? "white" : "#2E7D32",
                              },
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Experience (yrs)"
                      type="number"
                      size="small"
                      value={regForm.experience}
                      onChange={(e) =>
                        setRegForm({ ...regForm, experience: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WorkIcon sx={{ fontSize: 16 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                    <TextField
                      label="Rate per hour"
                      type="number"
                      size="small"
                      value={regForm.hourlyRate}
                      onChange={(e) =>
                        setRegForm({ ...regForm, hourlyRate: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₹</InputAdornment>
                        ),
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleRegister}
                    sx={{
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 800,
                      py: 1.5,
                      fontSize: "1rem",
                      bgcolor: "#2E7D32",
                      boxShadow: "0 4px 16px rgba(46,125,50,0.35)",
                      "&:hover": { bgcolor: "#1B5E20" },
                    }}
                    startIcon={<CheckCircleIcon />}
                  >
                    Register Profile
                  </Button>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* ── BOOKING BOTTOM SHEET ── */}
      <Dialog
        open={!!bookingWorker}
        onClose={() => setBookingWorker(null)}
        fullWidth
        maxWidth="xs"
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
        PaperProps={{
          sx: {
            borderRadius: "20px 20px 0 0",
            m: 0,
            mt: "auto",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: "100%",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
          },
        }}
      >
        {bookingWorker && (
          <>
            {/* Handle */}
            <Box
              sx={{
                width: 40,
                height: 4,
                bgcolor: "#E0E0E0",
                borderRadius: 2,
                mx: "auto",
                mt: 1.5,
                mb: 0.5,
              }}
            />

            <DialogContent sx={{ px: 2.5, pt: 1.5, pb: 0 }}>
              {/* Worker mini-profile */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mb: 2.5,
                  p: 2,
                  bgcolor: "#F1F8E9",
                  borderRadius: 3,
                }}
              >
                <Avatar
                  src={bookingWorker.avatar}
                  sx={{ width: 54, height: 54 }}
                />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {bookingWorker.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {bookingWorker.location}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, mt: 0.3 }}>
                    <StarIcon sx={{ fontSize: 14, color: "#F59E0B" }} />
                    <Typography variant="caption" fontWeight={700}>
                      {bookingWorker.rating} · ₹{bookingWorker.hourlyRate}/hr
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}
              >
                <TextField
                  label="Date of Work"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ mb: 1, display: "block" }}
                  >
                    HOURS NEEDED:{" "}
                    <span style={{ color: "#2E7D32", fontSize: "0.85rem" }}>
                      {bookingHours} hrs
                    </span>
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {[2, 4, 6, 8, 10].map((h) => (
                      <Box
                        key={h}
                        onClick={() => setBookingHours(h)}
                        sx={{
                          flex: 1,
                          py: 0.8,
                          textAlign: "center",
                          borderRadius: 2.5,
                          cursor: "pointer",
                          bgcolor: bookingHours === h ? "#2E7D32" : "#F5F5F5",
                          color:
                            bookingHours === h ? "white" : "text.secondary",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          transition: "all 0.2s",
                        }}
                      >
                        {h}h
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Total */}
                <Box sx={{ bgcolor: "#F1F8E9", borderRadius: 2.5, p: 1.5 }}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      ₹{bookingWorker.hourlyRate} × {bookingHours} hrs
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      fontWeight={800}
                      color="primary.main"
                    >
                      ₹
                      {(bookingWorker.hourlyRate * bookingHours).toLocaleString(
                        "en-IN",
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 2.5, pb: 3, pt: 0, gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setBookingWorker(null)}
                sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700 }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleConfirmBook}
                sx={{
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: "#2E7D32",
                  py: 1.5,
                  boxShadow: "0 4px 16px rgba(46,125,50,0.35)",
                  "&:hover": { bgcolor: "#1B5E20" },
                }}
              >
                Confirm Booking
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── SNACKBAR ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LabourManagement;
