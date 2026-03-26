import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  useTheme,
  Stack,
  Chip,
  alpha,
  keyframes,
} from "@mui/material";
import {
  LocalShipping,
  ShoppingCart,
  ArrowForward,
  Agriculture,
  Speed,
  Biotech,
  Nature,
  Insights,
  Groups,
  Star,
  AutoAwesome,
  VerifiedUser,
  SupportAgent,
  WaterDrop,
  Grass,
  Science,
  EmojiNature,
  NorthEast,
  CheckCircle,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useWorkflow } from "../components/WorkflowManager";
import ProductList from "../components/ProductList";

// â”€â”€ Keyframes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-18px) rotate(3deg); }
  66% { transform: translateY(-8px) rotate(-2deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(82,183,136,0.4); }
  50% { transform: scale(1.04); box-shadow: 0 0 0 16px rgba(82,183,136,0); }
`;

const marquee = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const orbFloat = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -40px) scale(1.05); }
  50% { transform: translate(-20px, -60px) scale(0.95); }
  75% { transform: translate(-40px, -20px) scale(1.02); }
`;

// â”€â”€ Static data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const testimonials = [
  {
    id: 1,
    name: "Rajesh Kumar",
    location: "Punjab",
    text: '"Agrokart has completely transformed my farming. Quality fertilizers delivered on time, every time!"',
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    crop: "Wheat Farmer",
  },
  {
    id: 2,
    name: "Priya Sharma",
    location: "Maharashtra",
    text: '"Excellent service and genuine products. My crop yield increased by 30% this season!"',
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    crop: "Sugarcane Farmer",
  },
  {
    id: 3,
    name: "Suresh Patel",
    location: "Gujarat",
    text: '"Fast delivery and expert advice. Highly recommend Agrokart to every farmer!"',
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/68.jpg",
    crop: "Cotton Farmer",
  },
];

const categories = [
  { label: "Nitrogen", icon: <Science sx={{ fontSize: 18 }} /> },
  { label: "Organic", icon: <EmojiNature sx={{ fontSize: 18 }} /> },
  { label: "Irrigation", icon: <WaterDrop sx={{ fontSize: 18 }} /> },
  { label: "Seeds", icon: <Grass sx={{ fontSize: 18 }} /> },
  { label: "Pesticides", icon: <Biotech sx={{ fontSize: 18 }} /> },
  { label: "Micronutrients", icon: <Nature sx={{ fontSize: 18 }} /> },
  { label: "Compost", icon: <Agriculture sx={{ fontSize: 18 }} /> },
  { label: "Soil Health", icon: <Insights sx={{ fontSize: 18 }} /> },
];

const trustItems = [
  {
    icon: <VerifiedUser sx={{ fontSize: 20 }} />,
    label: "ISI Certified Products",
  },
  {
    icon: <LocalShipping sx={{ fontSize: 20 }} />,
    label: "24h Express Delivery",
  },
  {
    icon: <SupportAgent sx={{ fontSize: 20 }} />,
    label: "24/7 Expert Support",
  },
  {
    icon: <CheckCircle sx={{ fontSize: 20 }} />,
    label: "100% Quality Guarantee",
  },
  { icon: <Groups sx={{ fontSize: 20 }} />, label: "10,000+ Happy Farmers" },
  { icon: <Agriculture sx={{ fontSize: 20 }} />, label: "Pan-India Coverage" },
];

// â”€â”€ Stat counter hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const useCounter = (end, duration = 2000, startCounting) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startCounting) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [startCounting, end, duration]);
  return count;
};

// â”€â”€ Stat item component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StatItem = ({ number, suffix, label, icon, color, startCounting }) => {
  const count = useCounter(number, 2000, startCounting);
  return (
    <Box sx={{ textAlign: "center", px: 2 }}>
      <Box
        sx={{
          display: "inline-flex",
          p: 1.5,
          borderRadius: "50%",
          bgcolor: alpha(color, 0.12),
          color,
          mb: 1.5,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h3"
        sx={{ fontWeight: 800, color, lineHeight: 1, mb: 0.5 }}
      >
        {count}
        {suffix}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 500 }}
      >
        {label}
      </Typography>
    </Box>
  );
};

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { transitionTo, WORKFLOW_STEPS } = useWorkflow();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    // Trigger entrance animations
    const t = setTimeout(() => setIsVisible(true), 100);

    // Auto-rotate testimonials
    const iv = setInterval(
      () => setCurrentTestimonial((p) => (p + 1) % testimonials.length),
      5000,
    );

    // IntersectionObserver for stats
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 },
    );
    if (statsRef.current) observer.observe(statsRef.current);

    return () => {
      clearTimeout(t);
      clearInterval(iv);
      observer.disconnect();
    };
  }, []);

  const isDark = theme.palette.mode === "dark";

  // â”€â”€ Colour helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const green = {
    main: "#2D6A4F",
    mid: "#52B788",
    light: "#95D5B2",
    pale: "#D8F3DC",
  };
  const gold = "#FFD166";

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      {/* â•â• 1. HERO â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Box
        sx={{
          width: "100vw",
          position: "relative",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
          minHeight: { xs: "88vh", md: "92vh" },
          background: isDark
            ? `linear-gradient(135deg, #0a1f14 0%, #0d2b1c 40%, #112d22 100%)`
            : `linear-gradient(135deg, ${green.main} 0%, #1B4332 40%, #081C15 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Mesh orbs */}
        {[
          { c: "#52B788", s: 420, t: "10%", l: "-8%", d: "8s" },
          { c: "#74C69D", s: 300, t: "60%", l: "70%", d: "11s" },
          { c: "#40916C", s: 250, t: "5%", l: "55%", d: "13s" },
        ].map((o, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: o.s,
              height: o.s,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${alpha(o.c, 0.25)} 0%, transparent 70%)`,
              top: o.t,
              left: o.l,
              animation: `${orbFloat} ${o.d} ease-in-out infinite`,
              animationDelay: `${i * 2}s`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Grain texture overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            pointerEvents: "none",
          }}
        />

        <Container
          maxWidth="lg"
          sx={{ position: "relative", zIndex: 2, py: { xs: 8, md: 0 } }}
        >
          <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
            {/* Left copy */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "none" : "translateY(40px)",
                  transition: "all 0.9s cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                {/* Badge */}
                <Chip
                  icon={<AutoAwesome sx={{ fontSize: "16px !important" }} />}
                  label="Trusted by 10,000+ Farmers Across India"
                  sx={{
                    mb: 3,
                    bgcolor: alpha("#fff", 0.1),
                    color: "#fff",
                    fontWeight: 600,
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    "& .MuiChip-icon": { color: gold },
                  }}
                />

                {/* Headline */}
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 900,
                    color: "#fff",
                    fontSize: { xs: "2.6rem", sm: "3.5rem", md: "4.8rem" },
                    lineHeight: 1.08,
                    letterSpacing: "-0.03em",
                    mb: 2,
                  }}
                >
                  Grow More,
                  <Box component="br" />
                  <Box
                    component="span"
                    sx={{
                      background: `linear-gradient(90deg, ${green.light} 0%, ${gold} 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Spend Less.
                  </Box>
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    mb: 4.5,
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.82)",
                    lineHeight: 1.65,
                    fontSize: { xs: "1.05rem", md: "1.2rem" },
                    maxWidth: 480,
                  }}
                >
                  Premium fertilizers &amp; agri solutions, delivered to your
                  farm within 24 hours. Empower your harvest with
                  precision-grade products.
                </Typography>

                {/* CTAs */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ mb: 5 }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<ShoppingCart />}
                    onClick={() => transitionTo(WORKFLOW_STEPS.BROWSE_PRODUCTS)}
                    sx={{
                      background: `linear-gradient(135deg, ${green.mid} 0%, #40916C 100%)`,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "1rem",
                      px: 3.5,
                      py: 1.6,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${alpha(green.mid, 0.45)}`,
                      animation: `${pulse} 3s ease-in-out infinite`,
                      textTransform: "none",
                      "&:hover": {
                        background: `linear-gradient(135deg, #74C69D 0%, ${green.mid} 100%)`,
                        transform: "translateY(-3px)",
                        boxShadow: `0 14px 40px ${alpha(green.mid, 0.55)}`,
                        animation: "none",
                      },
                      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  >
                    Shop Now
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    endIcon={<NorthEast />}
                    onClick={() => navigate("/products")}
                    sx={{
                      borderColor: "rgba(255,255,255,0.45)",
                      color: "#fff",
                      fontWeight: 600,
                      px: 3.5,
                      py: 1.6,
                      borderRadius: 3,
                      backdropFilter: "blur(8px)",
                      textTransform: "none",
                      borderWidth: 1.5,
                      "&:hover": {
                        borderColor: "#fff",
                        bgcolor: alpha("#fff", 0.1),
                        transform: "translateY(-3px)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    Explore Catalog
                  </Button>
                </Stack>

                {/* Mini stats */}
                <Stack direction="row" spacing={4}>
                  {[
                    ["10K+", "Farmers"],
                    ["24h", "Delivery"],
                    ["100%", "Quality"],
                  ].map(([n, l]) => (
                    <Box key={l}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: "1.5rem",
                          color: gold,
                          lineHeight: 1,
                        }}
                      >
                        {n}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255,255,255,0.65)",
                          fontWeight: 500,
                        }}
                      >
                        {l}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>

            {/* Right visual card */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "none" : "translateX(60px)",
                  transition: "all 1.1s cubic-bezier(0.22,1,0.36,1) 0.2s",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
                    borderRadius: 6,
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    p: { xs: 3, md: 4 },
                    minHeight: { xs: 260, md: 420 },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Top badge */}
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{
                      bgcolor: alpha("#fff", 0.1),
                      borderRadius: 3,
                      px: 2,
                      py: 1.2,
                      alignSelf: "flex-start",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "#52B788",
                        boxShadow: `0 0 8px #52B788`,
                        animation: `${pulse} 2s infinite`,
                      }}
                    />
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                      }}
                    >
                      Live Orders Processing
                    </Typography>
                  </Stack>

                  {/* Central icon */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flex: 1,
                      py: 3,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: alpha("#fff", 0.12),
                        borderRadius: "50%",
                        p: 4,
                        border: "2px solid rgba(255,255,255,0.2)",
                        animation: `${float} 5s ease-in-out infinite`,
                      }}
                    >
                      <Agriculture
                        sx={{
                          color: green.light,
                          fontSize: { xs: 60, md: 90 },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Bottom mini cards */}
                  <Grid container spacing={1.5}>
                    {[
                      { label: "Orders Today", val: "1,240+", c: green.light },
                      { label: "Satisfaction", val: "99.9%", c: gold },
                      { label: "Products", val: "500+", c: "#74C69D" },
                    ].map((item) => (
                      <Grid item xs={4} key={item.label}>
                        <Box
                          sx={{
                            bgcolor: alpha("#fff", 0.08),
                            borderRadius: 2,
                            p: 1.5,
                            textAlign: "center",
                            border: "1px solid rgba(255,255,255,0.12)",
                          }}
                        >
                          <Typography
                            sx={{
                              color: item.c,
                              fontWeight: 800,
                              fontSize: "1.1rem",
                              lineHeight: 1,
                            }}
                          >
                            {item.val}
                          </Typography>
                          <Typography
                            sx={{
                              color: "rgba(255,255,255,0.6)",
                              fontSize: "0.68rem",
                              mt: 0.3,
                            }}
                          >
                            {item.label}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Scroll chevron */}
        <Box
          sx={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 46,
              borderRadius: 14,
              border: "2px solid rgba(255,255,255,0.35)",
              display: "flex",
              justifyContent: "center",
              pt: 1,
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 10,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.7)",
                animation: `${float} 1.4s ease-in-out infinite`,
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* â•â• 2. CATEGORY STRIP â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          py: 2,
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              overflowX: "auto",
              pb: 0.5,
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {categories.map((cat, i) => (
              <Chip
                key={i}
                icon={cat.icon}
                label={cat.label}
                clickable
                onClick={() => transitionTo(WORKFLOW_STEPS.BROWSE_PRODUCTS)}
                sx={{
                  flexShrink: 0,
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  bgcolor: alpha(green.main, 0.07),
                  color: theme.palette.text.primary,
                  border: `1px solid ${alpha(green.main, 0.18)}`,
                  "&:hover": {
                    bgcolor: alpha(green.main, 0.15),
                    borderColor: green.mid,
                    color: green.main,
                  },
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      {/* â•â• 3. FEATURED PRODUCTS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: "background.default" }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            mb={5}
            spacing={2}
          >
            <Box>
              <Chip
                label="âœ¦ Top Picks"
                size="small"
                sx={{
                  mb: 1,
                  bgcolor: alpha(green.main, 0.1),
                  color: green.main,
                  fontWeight: 700,
                }}
              />
              <Typography
                variant="h3"
                sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                Featured Products
              </Typography>
              <Typography variant="body1" color="text.secondary" mt={0.5}>
                Premium fertilizers for every crop &amp; season
              </Typography>
            </Box>
            <Button
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => transitionTo(WORKFLOW_STEPS.BROWSE_PRODUCTS)}
              sx={{
                flexShrink: 0,
                fontWeight: 600,
                borderRadius: 3,
                textTransform: "none",
                borderColor: alpha(green.main, 0.4),
                color: green.main,
                "&:hover": { bgcolor: alpha(green.main, 0.07) },
              }}
            >
              View All
            </Button>
          </Stack>
          <ProductList />
        </Container>
      </Box>

      {/* â•â• 4. BENTO FEATURES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Box
        sx={{
          py: { xs: 6, md: 9 },
          bgcolor: isDark ? alpha("#0a1f14", 0.6) : alpha(green.pale, 0.35),
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Chip
              label="âœ¦ Why Agrokart"
              size="small"
              sx={{
                mb: 1.5,
                bgcolor: alpha(green.main, 0.1),
                color: green.main,
                fontWeight: 700,
              }}
            />
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, letterSpacing: "-0.02em", mb: 1.5 }}
            >
              Built for{" "}
              <Box
                component="span"
                sx={{
                  background: `linear-gradient(135deg, ${green.main}, ${green.mid})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                India's Farmers
              </Box>
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 520, mx: "auto", fontWeight: 400 }}
            >
              Everything you need â€” from soil analysis to doorstep delivery.
            </Typography>
          </Box>

          {/* Bento grid */}
          <Grid container spacing={2.5}>
            {/* Large card */}
            {[
              {
                icon: <Biotech sx={{ fontSize: 44 }} />,
                title: "AI-Powered Recommendations",
                desc: "Get personalised product suggestions based on your soil type, crop, and weather.",
                color: green.main,
                span: { xs: 12, md: 6 },
                tall: true,
              },
              {
                icon: <LocalShipping sx={{ fontSize: 44 }} />,
                title: "24h Doorstep Delivery",
                desc: "Order before noon â€” get it by tomorrow. Real-time tracking included.",
                color: "#0077B6",
                span: { xs: 12, sm: 6, md: 3 },
                tall: false,
              },
              {
                icon: <Nature sx={{ fontSize: 44 }} />,
                title: "Certified Organic",
                desc: "Every product is ISI/NPOP certified. Safe for soil and environment.",
                color: "#2D6A4F",
                span: { xs: 12, sm: 6, md: 3 },
                tall: false,
              },
              {
                icon: <SupportAgent sx={{ fontSize: 44 }} />,
                title: "Expert Agri Support",
                desc: "Chat with agronomists 24/7 for crop care guidance at no extra cost.",
                color: "#6200EA",
                span: { xs: 12, sm: 6, md: 4 },
                tall: false,
              },
              {
                icon: <Insights sx={{ fontSize: 44 }} />,
                title: "Yield Insights",
                desc: "Track fertilizer usage and get seasonal crop health analytics.",
                color: "#FF6D00",
                span: { xs: 12, sm: 6, md: 4 },
                tall: false,
              },
              {
                icon: <VerifiedUser sx={{ fontSize: 44 }} />,
                title: "Quality Guarantee",
                desc: "100% authentic products with easy returns if anything falls short.",
                color: "#D62828",
                span: { xs: 12, sm: 12, md: 4 },
                tall: false,
              },
            ].map((f, i) => (
              <Grid
                item
                xs={f.span.xs}
                sm={f.span.sm || 12}
                md={f.span.md}
                key={i}
              >
                <Card
                  sx={{
                    height: { xs: "auto", md: f.tall ? 380 : 200 },
                    borderRadius: 4,
                    overflow: "hidden",
                    position: "relative",
                    cursor: "pointer",
                    border: `1px solid ${alpha(f.color, 0.12)}`,
                    transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: `0 24px 48px ${alpha(f.color, 0.18)}`,
                      "& .bento-bg": { opacity: 0.12 },
                      "& .bento-icon": {
                        transform: "scale(1.15) rotate(6deg)",
                      },
                    },
                  }}
                >
                  <Box
                    className="bento-bg"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background: `radial-gradient(circle at top left, ${f.color}, transparent 70%)`,
                      opacity: 0.05,
                      transition: "opacity 0.35s ease",
                    }}
                  />
                  <CardContent
                    sx={{
                      p: 3.5,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <Box
                      className="bento-icon"
                      sx={{
                        display: "inline-flex",
                        p: 1.5,
                        borderRadius: 2.5,
                        bgcolor: alpha(f.color, 0.1),
                        color: f.color,
                        width: "fit-content",
                        transition: "transform 0.35s ease",
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Box mt={f.tall ? "auto" : 1.5}>
                      <Typography
                        variant={f.tall ? "h4" : "h6"}
                        sx={{ fontWeight: 700, mb: 0.75 }}
                      >
                        {f.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.65 }}
                      >
                        {f.desc}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* â•â• 5. ANIMATED STATS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Box
        ref={statsRef}
        sx={{ py: { xs: 6, md: 8 }, bgcolor: "background.paper" }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {[
              {
                number: 10000,
                suffix: "+",
                label: "Happy Farmers",
                icon: <Groups sx={{ fontSize: 28 }} />,
                color: green.main,
              },
              {
                number: 50000,
                suffix: "+",
                label: "Orders Delivered",
                icon: <LocalShipping sx={{ fontSize: 28 }} />,
                color: "#0077B6",
              },
              {
                number: 24,
                suffix: "h",
                label: "Average Delivery",
                icon: <Speed sx={{ fontSize: 28 }} />,
                color: "#FF6D00",
              },
              {
                number: 99,
                suffix: "%",
                label: "Customer Satisfaction",
                icon: <Star sx={{ fontSize: 28 }} />,
                color: "#FFD166",
              },
            ].map((s, i) => (
              <Grid item xs={6} md={3} key={i}>
                <StatItem {...s} startCounting={statsVisible} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* â•â• 6. TESTIMONIALS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Box
        sx={{
          py: { xs: 6, md: 9 },
          bgcolor: isDark ? alpha("#0a1f14", 0.4) : alpha(green.pale, 0.25),
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" mb={5}>
            <Chip
              label="âœ¦ Farmer Stories"
              size="small"
              sx={{
                mb: 1.5,
                bgcolor: alpha(green.main, 0.1),
                color: green.main,
                fontWeight: 700,
              }}
            />
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              What Our Farmers Say
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {testimonials.map((t, i) => (
              <Grid item xs={12} md={4} key={t.id}>
                <Card
                  onClick={() => setCurrentTestimonial(i)}
                  sx={{
                    height: "100%",
                    borderRadius: 4,
                    p: 0.5,
                    cursor: "pointer",
                    border: `2px solid ${i === currentTestimonial ? green.mid : alpha(theme.palette.divider, 0.5)}`,
                    background:
                      i === currentTestimonial
                        ? isDark
                          ? `linear-gradient(135deg, ${alpha(green.main, 0.2)}, ${alpha(green.mid, 0.1)})`
                          : `linear-gradient(135deg, ${alpha(green.pale, 0.8)}, ${alpha("#fff", 0.9)})`
                        : "background.paper",
                    transition: "all 0.4s ease",
                    animation:
                      i === currentTestimonial
                        ? `${slideUp} 0.5s ease`
                        : "none",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 16px 40px ${alpha(green.main, 0.12)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={0.5} mb={2}>
                      {[...Array(t.rating)].map((_, j) => (
                        <Star key={j} sx={{ color: "#FFD166", fontSize: 18 }} />
                      ))}
                    </Stack>
                    <Typography
                      variant="body1"
                      sx={{
                        lineHeight: 1.7,
                        fontStyle: "italic",
                        mb: 2.5,
                        color: "text.primary",
                      }}
                    >
                      {t.text}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 46,
                          height: 46,
                          borderRadius: "50%",
                          background: `url(${t.avatar}) center/cover`,
                          border: `2px solid ${green.mid}`,
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {t.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.crop} Â· {t.location}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Dots */}
          <Stack direction="row" spacing={1} justifyContent="center" mt={4}>
            {testimonials.map((_, i) => (
              <Box
                key={i}
                onClick={() => setCurrentTestimonial(i)}
                sx={{
                  width: i === currentTestimonial ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  cursor: "pointer",
                  bgcolor:
                    i === currentTestimonial
                      ? green.main
                      : alpha(green.main, 0.25),
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      {/* â•â• 7. CTA BAND â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${green.main} 0%, #1B4332 60%, #081C15 100%)`,
          py: { xs: 7, md: 10 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow orb */}
        <Box
          sx={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${alpha(green.mid, 0.2)} 0%, transparent 70%)`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }}
        />
        <Container
          maxWidth="md"
          sx={{ textAlign: "center", position: "relative", zIndex: 1 }}
        >
          <Chip
            icon={<AutoAwesome />}
            label="Limited Time Offer"
            sx={{
              mb: 3,
              bgcolor: alpha(gold, 0.15),
              color: gold,
              fontWeight: 700,
              border: `1px solid ${alpha(gold, 0.4)}`,
              "& .MuiChip-icon": { color: gold },
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              color: "#fff",
              mb: 2,
              letterSpacing: "-0.02em",
            }}
          >
            Ready to Transform Your Harvest?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.75)",
              mb: 5,
              fontWeight: 400,
              maxWidth: 480,
              mx: "auto",
              lineHeight: 1.65,
            }}
          >
            Join thousands of farmers who rely on Agrokart for certified,
            affordable agriculture solutions.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<ShoppingCart />}
              onClick={() => transitionTo(WORKFLOW_STEPS.BROWSE_PRODUCTS)}
              sx={{
                background: `linear-gradient(135deg, ${green.mid}, #40916C)`,
                color: "#fff",
                fontWeight: 700,
                px: 4,
                py: 1.7,
                borderRadius: 3,
                fontSize: "1.05rem",
                textTransform: "none",
                boxShadow: `0 8px 32px ${alpha(green.mid, 0.45)}`,
                animation: `${pulse} 3s ease-in-out infinite`,
                "&:hover": {
                  animation: "none",
                  transform: "translateY(-3px)",
                  boxShadow: `0 14px 44px ${alpha(green.mid, 0.55)}`,
                },
                transition: "all 0.3s ease",
              }}
            >
              Start Shopping
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: "rgba(255,255,255,0.45)",
                color: "#fff",
                fontWeight: 600,
                px: 4,
                py: 1.7,
                borderRadius: 3,
                textTransform: "none",
                backdropFilter: "blur(8px)",
                "&:hover": { borderColor: "#fff", bgcolor: alpha("#fff", 0.1) },
              }}
            >
              Contact Us
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* â•â• 8. TRUST MARQUEE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          py: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            animation: `${marquee} 22s linear infinite`,
            width: "max-content",
          }}
        >
          {[...trustItems, ...trustItems].map((item, i) => (
            <Stack
              key={i}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                px: 4,
                color: "text.secondary",
                flexShrink: 0,
                borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              }}
            >
              <Box sx={{ color: green.main, display: "flex" }}>{item.icon}</Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
              >
                {item.label}
              </Typography>
            </Stack>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
