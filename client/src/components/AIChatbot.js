import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Stack,
  Chip,
  useTheme,
  Button,
  Menu,
  MenuItem,
  InputAdornment,
  Tooltip,
  Badge,
  Drawer,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import {
  Close as CloseIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Language as LanguageIcon,
  Refresh as RefreshIcon,
  MenuBook as MenuBookIcon,
  AutoAwesome as AutoAwesomeIcon,
  Agriculture as AgricultureIcon,
  ShoppingCart as CartIcon,
  OpenInNew as OpenInNewIcon,
  Psychology as AIIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useCart } from "../context/CartContext";

// ── Quick Prompt Chips ──────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: "🌾 Wheat Fertilizer", msg: "How much urea and DAP should I apply for 1 acre of wheat crop?" },
  { label: "🧪 Soil pH Fix", msg: "My soil pH is 5.2. How to treat acidic soil for farming?" },
  { label: "🌱 Crop Nutrition", msg: "What is the recommended NPK dosage for paddy rice?" },
  { label: "💧 Irrigation Guide", msg: "What are the critical irrigation stages for wheat crop?" },
  { label: "🪲 Pest Diagnosis", msg: "My paddy leaves are showing yellow patches and hoppers. What is the cure?" },
  { label: "📦 Product Search", msg: "Recommend top fertilizers available on AgroKart" },
];

const GREETING_TEXT = `👋 **Namaskar, Kisan!**

I am **Dr. Agro**, your AI Agricultural Assistant powered by the **ICAR (Indian Council of Agricultural Research)** knowledge base.

Ask me about:
• 🌱 **Fertilizer Dosages** (Urea, DAP, MOP per acre/hectare)
• 🧪 **Soil pH Treatment** (Lime for acidic soil, Gypsum for sodic soil)
• 🌾 **Crop Nutrition Schedules** (Wheat, Rice, Cotton, Sugarcane)
• 💧 **Critical Irrigation Stages**
• 🪲 **Pest & Disease Control**

*Select a quick prompt below or type your question!*`;

// ── Markdown Text Renderer ─────────────────────────────────────────────────────
const RenderMarkdown = ({ text }) => {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];

  lines.forEach((line, index) => {
    // Headers
    if (line.startsWith("## ")) {
      elements.push(
        <Typography key={index} variant="subtitle1" fontWeight={800} sx={{ color: "#1B5E20", mt: 1.5, mb: 0.5, borderBottom: "1px solid #C8E6C9", pb: 0.3 }}>
          {line.replace("## ", "")}
        </Typography>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <Typography key={index} variant="body2" fontWeight={700} sx={{ color: "#2E7D32", mt: 1, mb: 0.3 }}>
          {line.replace("### ", "")}
        </Typography>
      );
    }
    // Blockquote / Notes
    else if (line.startsWith("> ")) {
      elements.push(
        <Box key={index} sx={{ borderLeft: "3px solid #66BB6A", pl: 1.5, my: 1, bgcolor: "#E8F5E9", py: 0.8, borderRadius: "0 6px 6px 0" }}>
          <Typography variant="body2" sx={{ color: "#1B5E20", fontStyle: "italic", fontSize: "0.82rem" }}
            dangerouslySetInnerHTML={{ __html: line.replace("> ", "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
          />
        </Box>
      );
    }
    // Bullet points
    else if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
      const formatted = line.trim().replace(/^([•\-]\s*)/, "");
      elements.push(
        <Box key={index} sx={{ display: "flex", gap: 1, ml: 0.5, my: 0.3 }}>
          <Typography sx={{ color: "#2E7D32", fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.5 }}>•</Typography>
          <Typography variant="body2" sx={{ fontSize: "0.84rem", lineHeight: 1.55 }}
            dangerouslySetInnerHTML={{ __html: formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }}
          />
        </Box>
      );
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      elements.push(
        <Typography key={index} variant="body2" sx={{ ml: 1, my: 0.3, fontSize: "0.84rem" }}
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
        />
      );
    }
    // Regular paragraph
    else if (line.trim() !== "") {
      elements.push(
        <Typography key={index} variant="body2" sx={{ my: 0.4, fontSize: "0.85rem", lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }}
        />
      );
    }
  });

  return <Box>{elements}</Box>;
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AIChatbot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ragStatus, setRagStatus] = useState("unknown"); // "ready", "offline"
  const [copiedId, setCopiedId] = useState(null);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const isUserNearBottom = useRef(true);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      isUserNearBottom.current = scrollHeight - scrollTop - clientHeight < 150;
    }
  };

  const scrollToBottom = (force = false) => {
    if (messagesContainerRef.current && (force || isUserNearBottom.current)) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  // Health-check RAG service on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get("http://localhost:8000/health", { timeout: 3000 });
        if (res.data?.status === "OK") setRagStatus("ready");
        else setRagStatus("offline");
      } catch {
        setRagStatus("offline");
      }
    };
    checkHealth();
  }, []);

  // Initialize conversation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: "greeting",
        sender: "bot",
        text: GREETING_TEXT,
        timestamp: new Date(),
        sources: [],
        engine: "Conversational Assistant",
      }]);
    }
  }, [isOpen, messages.length]);

  const classifyConversationalIntent = (query) => {
    if (!query || typeof query !== "string") return null;
    const cleanQ = query.trim().toLowerCase();
    const cleanText = cleanQ.replace(/[^\w\s]/g, "").trim();
    const normalized = cleanText.replace(/(.)\1{2,}/g, "$1");

    const greetings = new Set([
      "hi", "hii", "hiii", "hello", "helo", "hey", "heyy",
      "namaskar", "namaste", "namaskaar", "namasthe",
      "good morning", "good afternoon", "good evening", "good day", "goodnight", "good night",
      "suprabhat", "shubh prabhat", "greetings"
    ]);

    if (
      greetings.has(normalized) ||
      greetings.has(cleanText) ||
      /^(hi+|hello+|hey+|helo+|namaskar|namaste|good\s+(morning|afternoon|evening|day))\s*$/i.test(cleanText)
    ) {
      return {
        answer: "Hello! 👋 I’m Agro AI. I can help you with crop nutrition, fertilizers, soil health, irrigation, crop diseases, and other farming questions. What would you like to know?",
        sources: [],
        engine: "Conversational Assistant"
      };
    }

    const thanks = new Set([
      "thanks", "thank you", "thank u", "thx", "thankyou",
      "dhanyawad", "dhanyavaad", "many thanks", "thanks a lot", "thank you so much"
    ]);
    if (thanks.has(cleanText) || /^(thanks?|thank\s+you|thx|dhanyawad)\s*$/i.test(cleanText)) {
      return {
        answer: "You're welcome! 🌱 Let me know if you need help with your crop, soil, fertilizer, or farming practices.",
        sources: [],
        engine: "Conversational Assistant"
      };
    }

    const okSet = new Set(["ok", "okay", "kk", "got it", "k", "alright", "sure", "thik hai", "theek hai"]);
    if (okSet.has(cleanText) || /^(ok+|okay|got\s+it|thik\s+hai)\s*$/i.test(cleanText)) {
      return {
        answer: "Great! Let me know whenever you have any farming or crop questions. 🌾",
        sources: [],
        engine: "Conversational Assistant"
      };
    }

    const byeSet = new Set(["bye", "goodbye", "good bye", "see you", "take care", "tc", "alvida", "phir milenge"]);
    if (byeSet.has(cleanText) || /^(bye|good\s*bye|take\s+care|see\s+you)\s*$/i.test(cleanText)) {
      return {
        answer: "Goodbye, Kisan! 🌱 Wishing you a healthy and productive crop.",
        sources: [],
        engine: "Conversational Assistant"
      };
    }

    return null;
  };

  const handleSendMessage = useCallback(async (msgText = inputValue) => {
    if (!msgText.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: msgText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setTimeout(() => scrollToBottom(true), 50);

    const convIntent = classifyConversationalIntent(msgText);
    if (convIntent) {
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: convIntent.answer,
        sources: [],
        engine: convIntent.engine,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    setIsTyping(true);

    try {
      // Call Express proxy endpoint (which forwards to Python RAG)
      const res = await axios.post("/api/dr-agro/chat", {
        message: msgText,
        session_id: sessionId,
      }, { timeout: 15000 });

      if (res.data?.success) {
        if (res.data.session_id) setSessionId(res.data.session_id);

        const botMsg = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: res.data.answer,
          sources: Array.isArray(res.data.sources) ? res.data.sources : [],
          engine: res.data.engine || "RAG AI Engine",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(res.data?.message || "Failed to get answer");
      }
    } catch (err) {
      console.warn("RAG chat error:", err.message);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "I couldn't retrieve verified information for that right now. Please check if the RAG service is running or contact the **Kisan Call Center: 1800-180-1551**.",
        sources: ["System Warning"],
        engine: "Offline Error",
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, sessionId]);

  const handleClearChat = async () => {
    if (sessionId) {
      try { await axios.delete(`http://localhost:8000/session/${sessionId}`); } catch {}
    }
    setSessionId(null);
    setMessages([]);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Hide on auth pages
  const hidePaths = ["/login", "/register", "/admin"];
  if (hidePaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <>
      {/* Slide-in Right Drawer Chat Panel (Does not cover screen awkwardly) */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100vw", sm: 440, md: 480 },
            display: "flex",
            flexDirection: "column",
            bgcolor: "#FAFBF9",
            borderLeft: "1px solid rgba(46,125,50,0.15)",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: "14px 20px",
            background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 40, height: 40 }}>
              <AgricultureIcon sx={{ color: "#A5D6A7" }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} lineHeight={1.1}>
                Dr. Agro AI
              </Typography>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: ragStatus === "ready" ? "#69F0AE" : "#FFA726" }} />
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.7rem", fontWeight: 600 }}>
                  {ragStatus === "ready" ? "RAG + ICAR Knowledge Base Active" : "Local Knowledge Active"}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Clear Conversation">
              <IconButton size="small" onClick={handleClearChat} sx={{ color: "white" }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: "white" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* Message List */}
        <Box
          ref={messagesContainerRef}
          onScroll={handleScroll}
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.8,
            bgcolor: "#F4F7F4",
          }}
        >
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: "flex",
                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                gap: 1,
              }}
            >
              {msg.sender === "bot" && (
                <Avatar sx={{ width: 32, height: 32, bgcolor: "#1B5E20", mt: 0.5 }}>
                  <AgricultureIcon sx={{ fontSize: 16, color: "white" }} />
                </Avatar>
              )}

              <Box sx={{ maxWidth: "84%" }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: "12px 16px",
                    borderRadius: msg.sender === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                    bgcolor: msg.sender === "user" ? "#1B5E20" : "white",
                    color: msg.sender === "user" ? "white" : "#1A2027",
                    border: msg.sender === "user" ? "none" : "1px solid #E2EFE2",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {msg.sender === "user" ? (
                    <Typography variant="body2" sx={{ color: "white", fontSize: "0.88rem" }}>
                      {msg.text}
                    </Typography>
                  ) : (
                    <>
                      <RenderMarkdown text={msg.text} />
                      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
                        <IconButton size="small" onClick={() => copyToClipboard(msg.text, msg.id)} sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}>
                          {copiedId === msg.id ? <CheckIcon fontSize="small" color="success" /> : <CopyIcon fontSize="small" />}
                        </IconButton>
                      </Box>
                    </>
                  )}
                </Paper>

                {/* Sources & Citations */}
                {msg.sender === "bot" && msg.sources?.length > 0 && (
                  <Stack direction="row" spacing={0.6} mt={0.8} flexWrap="wrap" gap={0.4}>
                    {msg.sources.map((src, i) => (
                      <Chip
                        key={i}
                        icon={<MenuBookIcon sx={{ fontSize: "12px !important" }} />}
                        label={src}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          bgcolor: "#E8F5E9",
                          color: "#1B5E20",
                          border: "1px solid #C8E6C9",
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "#1B5E20" }}>
                <AgricultureIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Paper elevation={0} sx={{ p: "10px 14px", borderRadius: "4px 18px 18px 18px", bgcolor: "white", border: "1px solid #E2EFE2" }}>
                <Typography variant="caption" sx={{ color: "#2E7D32", fontWeight: 700 }}>
                  Dr. Agro is analyzing ICAR documents...
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>

        {/* Quick Prompts Bar */}
        <Box sx={{ px: 2, py: 1, bgcolor: "white", borderTop: "1px solid #E2EFE2", display: "flex", gap: 0.8, overflowX: "auto" }}>
          {QUICK_PROMPTS.map((qp, i) => (
            <Chip
              key={i}
              label={qp.label}
              size="small"
              onClick={() => handleSendMessage(qp.msg)}
              clickable
              sx={{
                bgcolor: "#F1F8E9",
                color: "#1B5E20",
                border: "1px solid #C8E6C9",
                fontWeight: 600,
                fontSize: "0.72rem",
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: "#DCEDC8" },
              }}
            />
          ))}
        </Box>

        {/* Input Bar */}
        <Box sx={{ p: 2, bgcolor: "white", borderTop: "1px solid #E2EFE2" }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            size="small"
            multiline
            maxRows={3}
            placeholder="Ask about fertilizer dose, soil pH, crop diseases..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            InputProps={{
              sx: { borderRadius: 3, bgcolor: "#F8FBF8", fontSize: "0.88rem" },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    sx={{ bgcolor: "#1B5E20", color: "white", "&:hover": { bgcolor: "#14532D" }, "&.Mui-disabled": { bgcolor: "#E0E0E0" } }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Drawer>

      {/* Floating Action Button */}
      {!isOpen && (
        <Fab
          onClick={() => setIsOpen(true)}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            bgcolor: "#1B5E20",
            color: "white",
            boxShadow: "0 6px 20px rgba(27,94,32,0.4)",
            "&:hover": { bgcolor: "#14532D" },
            zIndex: 1200,
          }}
        >
          <AgricultureIcon sx={{ fontSize: 28 }} />
        </Fab>
      )}
    </>
  );
};

export default AIChatbot;
