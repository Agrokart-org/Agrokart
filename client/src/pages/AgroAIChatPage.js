import React, { useState, useEffect, useRef } from "react";
import {
  Container, Box, Typography, Paper, TextField, Button, Avatar, Chip,
  CircularProgress, IconButton, Tooltip, Alert, Grid, useTheme, useMediaQuery,
  Card, CardContent, Divider
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// Icons
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ScienceIcon from "@mui/icons-material/Science";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AgricultureIcon from "@mui/icons-material/Agriculture";

import axios from "axios";

const QUICK_PROMPTS = [
  { label: "🌾 Wheat Fertilizer Dose", msg: "What fertilizer is suitable for wheat in black soil?" },
  { label: "🍂 Yellowing Leaves", msg: "What causes yellowing of wheat leaves?" },
  { label: "💧 Wheat Irrigation", msg: "How much irrigation does wheat need during tillering?" },
  { label: "🧪 DAP vs Urea", msg: "What is the difference between DAP and Urea fertilizers?" },
];

const AgroAIChatPage = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [messages, setMessages] = useState([
    {
      id: "greet-1",
      sender: "bot",
      text: "👋 **Namaskar, Kisan!**\n\nI am **Agro AI**, your conversational Agricultural Knowledge Assistant powered by the **ICAR (Indian Council of Agricultural Research)** knowledge base.\n\nAsk me open-ended questions about crop nutrition, disease treatment, fertilizer properties, irrigation timing, or farming practices.",
      sources: ["ICAR Agricultural Knowledge Base"],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState(null);

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

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Voice Input Toggle
  const handleVoiceToggle = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = i18n.language === "hi" ? "hi-IN" : i18n.language === "mr" ? "mr-IN" : "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

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

  const handleSend = async (queryToSend = null) => {
    const query = queryToSend || input;
    if (!query.trim() || loading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMessage = { id: Date.now().toString(), sender: "user", text: query, time: userTime };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryToSend) setInput("");
    setTimeout(() => scrollToBottom(true), 50);

    // Client-side intent check for greetings and conversational phrases
    const convIntent = classifyConversationalIntent(query);
    if (convIntent) {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: convIntent.answer,
        sources: [],
        engine: convIntent.engine,
        time: userTime
      };
      setMessages((prev) => [...prev, botMessage]);
      return;
    }

    setLoading(true);

    const API_BASE = process.env.REACT_APP_API_URL
      ? `${process.env.REACT_APP_API_URL}/api`
      : "/api";

    try {
      const response = await axios.post(`${API_BASE}/dr-agro/chat`, {
        message: query,
        session_id: sessionId
      });

      if (response.data?.session_id) setSessionId(response.data.session_id);

      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: response.data.answer || "No response received.",
        sources: Array.isArray(response.data.sources) ? response.data.sources : [],
        engine: response.data.engine || "RAG AI Engine",
        time: botTime
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "I am having trouble connecting to the AI knowledge base right now. Please try again shortly.",
          sources: [],
          engine: "Offline Error",
          time: botTime
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([messages[0]]);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8FAF8", pb: 6, pt: 2 }}>
      <Container maxWidth="lg">
        
        {/* Header */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", mb: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <IconButton onClick={() => navigate("/customer/dr-agro")} sx={{ color: "#475569" }}>
                <ArrowBackIcon />
              </IconButton>
              <Avatar sx={{ bgcolor: "#6366F1", width: 44, height: 44, boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
                <SmartToyIcon sx={{ color: "#FFFFFF", fontSize: 24 }} />
              </Avatar>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" fontWeight="800" color="#0F172A">
                    Agro AI Chat
                  </Typography>
                  <Chip
                    icon={<AutoAwesomeIcon sx={{ fontSize: "12px !important", color: "#6366F1 !important" }} />}
                    label="RAG LLM Engine"
                    size="small"
                    sx={{ bgcolor: "#EEF2FF", color: "#4338CA", fontWeight: 700, fontSize: "0.68rem" }}
                  />
                </Box>
                <Typography variant="caption" color="#64748B">
                  Grounded in ICAR (Indian Council of Agricultural Research) Publications & Literature
                </Typography>
              </Box>
            </Box>

            <Tooltip title="Clear Conversation">
              <IconButton onClick={handleClear} sx={{ color: "#64748B" }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Chat Feed */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            height: "560px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            mb: 3
          }}
        >
          <Box
            ref={messagesContainerRef}
            onScroll={handleScroll}
            sx={{ flex: 1, overflowY: "auto", p: 3, display: "flex", flexDirection: "column", gap: 2.5, bgcolor: "#FAFAFA" }}
          >
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: "flex",
                  justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                  gap: 1.5
                }}
              >
                {msg.sender === "bot" && (
                  <Avatar sx={{ bgcolor: "#6366F1", width: 36, height: 36, mt: 0.5 }}>
                    <SmartToyIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />
                  </Avatar>
                )}

                <Box sx={{ maxWidth: { xs: "90%", sm: "80%" } }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: msg.sender === "user" ? "20px 20px 4px 20px" : "4px 20px 20px 20px",
                      bgcolor: msg.sender === "user" ? "#4338CA" : "#FFFFFF",
                      color: msg.sender === "user" ? "#FFFFFF" : "#0F172A",
                      border: msg.sender === "user" ? "none" : "1px solid #E2E8F0",
                      boxShadow: msg.sender === "user" ? "0 4px 12px rgba(67,56,202,0.25)" : "0 2px 8px rgba(0,0,0,0.03)"
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", lineHeight: 1.65, fontSize: "0.92rem" }}>
                      {msg.text}
                    </Typography>
                  </Paper>

                  <Box display="flex" alignItems="center" gap={1} mt={0.6} px={0.5}>
                    <Typography variant="caption" color="#94A3B8" sx={{ fontSize: "0.72rem" }}>
                      {msg.time}
                    </Typography>
                    {msg.sources && msg.sources.length > 0 && (
                      <Chip
                        icon={<MenuBookIcon sx={{ fontSize: "12px !important" }} />}
                        label={msg.sources[0]}
                        size="small"
                        sx={{ height: 18, fontSize: "0.62rem", bgcolor: "#EEF2FF", color: "#4338CA", fontWeight: 700 }}
                      />
                    )}
                  </Box>
                </Box>

                {msg.sender === "user" && (
                  <Avatar sx={{ bgcolor: "#0284C7", width: 36, height: 36, mt: 0.5, fontWeight: 700 }}>
                    F
                  </Avatar>
                )}
              </Box>
            ))}

            {loading && (
              <Box display="flex" alignItems="center" gap={1.5}>
                <Avatar sx={{ bgcolor: "#6366F1", width: 36, height: 36 }}>
                  <SmartToyIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />
                </Avatar>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: "4px 18px 18px 18px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: "#6366F1" }} />
                  <Typography variant="caption" fontWeight="600" color="#475569">
                    Agro AI is searching ICAR documents & generating response...
                  </Typography>
                </Paper>
              </Box>
            )}
            </Box>

          {/* Quick Prompts Bar */}
          <Box sx={{ px: 2, py: 1, bgcolor: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", gap: 1, overflowX: "auto" }}>
            {QUICK_PROMPTS.map((qp, i) => (
              <Chip
                key={i}
                label={qp.label}
                onClick={() => handleSend(qp.msg)}
                clickable
                size="small"
                sx={{
                  bgcolor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "#334155",
                  whiteSpace: "nowrap",
                  "&:hover": { bgcolor: "#EEF2FF", borderColor: "#6366F1", color: "#4338CA" }
                }}
              />
            ))}
          </Box>

          {/* Input Bar */}
          <Box sx={{ p: 2, bgcolor: "#FFFFFF", borderTop: "1px solid #E2E8F0", display: "flex", gap: 1 }}>
            <Tooltip title={isListening ? "Listening..." : "Voice Input"}>
              <IconButton
                onClick={handleVoiceToggle}
                sx={{
                  color: isListening ? "#FFFFFF" : "#64748B",
                  bgcolor: isListening ? "#EF4444" : "#F1F5F9",
                  "&:hover": { bgcolor: isListening ? "#DC2626" : "#E2E8F0" }
                }}
              >
                {isListening ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>

            <TextField
              fullWidth
              size="small"
              placeholder="Ask Agro AI any open-ended question about your crop, soil or farming..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "#F8FAFC",
                  fontSize: "0.9rem"
                }
              }}
            />

            <Button
              variant="contained"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              sx={{
                bgcolor: "#4338CA",
                color: "white",
                borderRadius: 3,
                px: 2.5,
                "&:hover": { bgcolor: "#3730A3" }
              }}
            >
              <SendIcon fontSize="small" />
            </Button>
          </Box>
        </Paper>

      </Container>
    </Box>
  );
};

export default AgroAIChatPage;
