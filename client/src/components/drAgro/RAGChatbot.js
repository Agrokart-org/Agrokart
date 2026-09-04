import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, TextField, Button, Paper, Avatar, Chip,
  CircularProgress, IconButton, Alert, Tooltip
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ScienceIcon from "@mui/icons-material/Science";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import axios from "axios";

const RAGChatbot = ({ mlRecommendation = null, initialQuery = "" }) => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Namaskar, Kisan! 👋\n\nI'm Agro AI, your agricultural knowledge assistant.\n\nI can help you with:\n• Crop nutrition and fertilizer recommendations\n• Soil health and soil pH\n• Crop diseases and pest management\n• Irrigation guidance\n• Fertilizer properties and usage\n• General farming practices\n\nWhat would you like help with?",
      sources: [],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
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
    const userMessage = { sender: "user", text: query, time: userTime };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryToSend) setInput("");
    setTimeout(() => scrollToBottom(true), 50);

    // Client-side intent check for greetings and conversational phrases
    const convIntent = classifyConversationalIntent(query);
    if (convIntent) {
      const botMessage = {
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
        ml_recommendation: mlRecommendation || null
      });

      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const botMessage = {
        sender: "bot",
        text: response.data.answer || "No response received.",
        sources: Array.isArray(response.data.sources) ? response.data.sources : [],
        engine: response.data.engine || "RAG Engine",
        time: botTime
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat API error:", error);
      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I am having trouble connecting to the AI knowledge base right now. Please try again shortly.",
          sources: [],
          time: botTime,
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(46, 125, 50, 0.2)",
        overflow: "hidden",
        bgcolor: "#F9FBF8",
        display: "flex",
        flexDirection: "column",
        height: "600px",
        maxHeight: "75vh"
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "#2E7D32",
          color: "white",
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: "white", color: "#2E7D32" }}>
            <SmartToyIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="700">
              Dr. Agro AI Assistant (RAG)
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85, display: "flex", alignItems: "center", gap: 0.5 }}>
              <AutoAwesomeIcon sx={{ fontSize: 12 }} /> Grounded in ICAR Agricultural Literature
            </Typography>
          </Box>
        </Box>
        {mlRecommendation && (
          <Chip
            icon={<ScienceIcon sx={{ color: "white !important" }} />}
            label="Soil Rec Active"
            size="small"
            sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600 }}
          />
        )}
      </Box>

      {/* Active ML Context Alert Banner */}
      {mlRecommendation && (
        <Alert severity="info" icon={<ScienceIcon />} sx={{ borderRadius: 0, py: 0.5, px: 2, bgcolor: "#E8F5E9", borderBottom: "1px solid #C8E6C9" }}>
          <Typography variant="caption" color="text.secondary" fontWeight="600">
            Current Recommendation Context: <strong>{mlRecommendation}</strong>
          </Typography>
        </Alert>
      )}

      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        onScroll={handleScroll}
        sx={{ flexGrow: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              gap: 1
            }}
          >
            {msg.sender === "bot" && (
              <Avatar sx={{ bgcolor: "#2E7D32", width: 32, height: 32, fontSize: 14, mt: 0.5 }}>
                <SmartToyIcon sx={{ fontSize: 18 }} />
              </Avatar>
            )}
            <Box sx={{ maxWidth: "80%" }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: msg.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  bgcolor: msg.sender === "user" ? "#2E7D32" : "white",
                  color: msg.sender === "user" ? "white" : "text.primary",
                  border: msg.sender === "user" ? "none" : "1px solid rgba(0,0,0,0.08)",
                  boxShadow: msg.sender === "user" ? "0 2px 8px rgba(46,125,50,0.3)" : "0 2px 6px rgba(0,0,0,0.03)"
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
                  {msg.text}
                </Typography>
              </Paper>

              {/* Citations & Metadata */}
              <Box display="flex" alignItems="center" justifyContent={msg.sender === "user" ? "flex-end" : "flex-start"} gap={1} mt={0.5} px={0.5}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                  {msg.time}
                </Typography>

                {msg.sender === "bot" && msg.sources && msg.sources.length > 0 && (
                  <Tooltip title={`Sources: ${msg.sources.join(", ")}`}>
                    <Chip
                      icon={<MenuBookIcon sx={{ fontSize: "10px !important" }} />}
                      label={msg.sources[0]}
                      size="small"
                      sx={{ height: 18, fontSize: "0.65rem", bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 600 }}
                    />
                  </Tooltip>
                )}
              </Box>
            </Box>
            {msg.sender === "user" && (
              <Avatar sx={{ bgcolor: "#1976D2", width: 32, height: 32, fontSize: 14, mt: 0.5 }}>
                <PersonIcon sx={{ fontSize: 18 }} />
              </Avatar>
            )}
          </Box>
        ))}

        {loading && (
          <Box display="flex" alignItems="center" gap={1} p={1}>
            <Avatar sx={{ bgcolor: "#2E7D32", width: 32, height: 32 }}>
              <SmartToyIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: "18px 18px 18px 4px", bgcolor: "white", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} sx={{ color: "#2E7D32" }} />
              <Typography variant="caption" color="text.secondary">
                Searching agricultural documents & generating answer...
              </Typography>
            </Paper>
          </Box>
        )}
        <div ref={chatEndRef} />
      </Box>

      {/* Suggested Quick Questions */}
      <Box sx={{ px: 2, py: 1, bgcolor: "#F0F7F0", borderTop: "1px solid rgba(46,125,50,0.1)", display: "flex", gap: 1, overflowX: "auto" }}>
        {suggestedQuestions.map((q, idx) => (
          <Chip
            key={idx}
            label={q}
            onClick={() => handleSend(q)}
            size="small"
            clickable
            sx={{
              bgcolor: "white",
              border: "1px solid #C8E6C9",
              fontSize: "0.75rem",
              fontWeight: 500,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#E8F5E9" }
            }}
          />
        ))}
      </Box>

      {/* Input Bar */}
      <Box sx={{ p: 2, bgcolor: "white", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Ask a question (e.g. Why split Urea for sandy soil?)..."
          size="small"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          disabled={loading}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              bgcolor: "#FAFBF9"
            }
          }}
        />
        <Button
          variant="contained"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          sx={{
            bgcolor: "#2E7D32",
            borderRadius: 3,
            px: 2.5,
            minWidth: "auto",
            "&:hover": { bgcolor: "#1B5E20" }
          }}
        >
          <SendIcon fontSize="small" />
        </Button>
      </Box>
    </Paper>
  );
};

export default RAGChatbot;
