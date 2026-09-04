import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  IconButton,
  Link,
  Divider,
  Stack,
} from "@mui/material";
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  Phone,
  Email,
  LocationOn,
  Agriculture,
} from "@mui/icons-material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#111827",
        color: "#F9FAFB",
        pt: 6,
        pb: 4,
        borderTop: "1px solid #1F2937",
        mt: "auto",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={4} justifyContent="space-between">
          {/* Brand & Mission */}
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <Agriculture sx={{ color: "#81C784", fontSize: 28 }} />
              <Typography variant="h6" fontWeight={800} sx={{ color: "white", letterSpacing: -0.5 }}>
                AgroKart
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 2.5, lineHeight: 1.6, maxWidth: 360 }}>
              AgroKart is India's leading digital agricultural platform — delivering genuine fertilizers, high-yield seeds, and crop protection directly from certified suppliers to your farm.
            </Typography>

            <Stack direction="row" spacing={1}>
              {[
                { icon: Facebook, color: "#1877F2" },
                { icon: Instagram, color: "#E4405F" },
                { icon: Twitter, color: "#1DA1F2" },
                { icon: LinkedIn, color: "#0A66C2" },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <IconButton
                    key={i}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.06)",
                      color: "#D1D5DB",
                      "&:hover": { bgcolor: s.color, color: "white" },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Icon fontSize="small" />
                  </IconButton>
                );
              })}
            </Stack>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "white", mb: 2, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 0.8 }}>
              Marketplace
            </Typography>
            <Stack spacing={1.2}>
              {["All Products", "Fertilizers & Urea", "Hybrid Seeds", "Crop Protection", "Micronutrients", "Mandi Rates"].map((item) => (
                <Link
                  key={item}
                  href="/products"
                  underline="hover"
                  sx={{ color: "#9CA3AF", fontSize: "0.86rem", "&:hover": { color: "#81C784" } }}
                >
                  {item}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Services & AI */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "white", mb: 2, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 0.8 }}>
              Farmer Services
            </Typography>
            <Stack spacing={1.2}>
              {["Dr. Agro AI Assistant", "Soil pH Diagnosis", "Labor Hire Services", "Weather Advisory", "Supplier Network"].map((item) => (
                <Link
                  key={item}
                  href="/customer/dr-agro"
                  underline="hover"
                  sx={{ color: "#9CA3AF", fontSize: "0.86rem", "&:hover": { color: "#81C784" } }}
                >
                  {item}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Contact Helpline */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "white", mb: 2, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 0.8 }}>
              Help & Contact
            </Typography>
            <Stack spacing={1.8}>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                <LocationOn sx={{ color: "#81C784", fontSize: 20, mt: 0.2 }} />
                <Typography variant="body2" sx={{ color: "#9CA3AF", fontSize: "0.85rem", lineHeight: 1.4 }}>
                  AgroKart Agri-Tech Hub, Agriculture District, Maharashtra, India - 400001
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                <Phone sx={{ color: "#81C784", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "#9CA3AF", fontSize: "0.85rem" }}>
                  Kisan Toll-Free: 1800-180-1551
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                <Email sx={{ color: "#81C784", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "#9CA3AF", fontSize: "0.85rem" }}>
                  support@agrokart.com
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: "#1F2937" }} />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: "#6B7280" }}>
            © {new Date().getFullYear()} AgroKart Agri-Tech Solutions Ltd. All rights reserved. Grounded in ICAR Agricultural Standards.
          </Typography>
          <Stack direction="row" spacing={3}>
            {["Privacy Policy", "Terms of Service", "Seller Guidelines"].map((legal) => (
              <Link key={legal} href="#" underline="hover" sx={{ color: "#6B7280", fontSize: "0.78rem", "&:hover": { color: "#9CA3AF" } }}>
                {legal}
              </Link>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
