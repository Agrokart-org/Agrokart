import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Fade,
  Slide,
  useTheme,
  alpha,
  Divider,
  Button,
  Menu,
  MenuItem,
  Badge,
  InputAdornment
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Language as LanguageIcon,
  Refresh as RefreshIcon,
  ShoppingCart,
  Call as CallIcon,
  Mic as MicIcon,
  Navigation as NavigationIcon
} from '@mui/icons-material';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

// Predefined responses in multiple languages
const chatResponses = {
  en: {
    greeting: "Kisan Mitra Bot here! 🌾 How can I help you today?",
    quickReplies: ["Product Info", "Track Order", "Go to Profile", "Expert Advice"],
    responses: {
      "product info": "🌱 We offer premium fertilizers:\n• Urea (₹850)\n• DAP (₹1200)\n• NPK 20:20:20 (₹1100)\nCheck our Products page for more!",
      "delivery": "🚚 Fast & Reliable Delivery across India. Free delivery on orders above ₹1000.",
      "pricing": "💰 Competitive Pricing with Great Offers!",
      "support": "👨‍🌾 Expert Agricultural Support available 24/7.",
      "default": "🤔 I can help with products, delivery, and navigation. Try saying 'Go to Orders'."
    },
    navigation: {
      products: "Navigating to Products page... 🛍️",
      orders: "Taking you to your Orders... 📦",
      profile: "Opening your Profile... 👤",
      cart: "Going to Cart... 🛒",
      dashboard: "Back to Dashboard... 🏠"
    }
  },
  hi: {
    greeting: "किसान मित्र बॉट! 🌾 मैं आपकी किस प्रकार सहायता कर सकता हूं?",
    quickReplies: ["उत्पाद जानकारी", "ऑर्डर ट्रैक करें", "प्रोफाइल पर जाएं", "विशेषज्ञ सलाह"],
    responses: {
      "उत्पाद जानकारी": "🌱 हमारे पास बेहतरीन उर्वरक हैं:\n• यूरिया (₹850)\n• डीएपी (₹1200)\nअधिक जानकारी के लिए उत्पाद पेज देखें!",
      "delivery": "🚚 पूरे भारत में तेज़ डिलीवरी। ₹1000 से ऊपर मुफ्त।",
      "default": "🤔 मैं उत्पादों और नेविगेशन में मदद कर सकता हूं। कहें 'ऑर्डर पर जाएं'।"
    },
    navigation: {
      products: "उत्पाद पेज पर ले जा रहा हूं... 🛍️",
      orders: "आपके ऑर्डर दिखा रहा हूं... 📦",
      profile: "प्रोफाइल खोल रहा हूं... 👤",
      cart: "कार्ट पर ले जा रहा हूं... 🛒",
      dashboard: "डैशबोर्ड पर वापस... 🏠"
    }
  },
  mr: {
    greeting: "शेतकरी मित्र बॉट! 🌾 मी तुम्हाला कशी मदत करू शकतो?",
    quickReplies: ["उत्पादन माहिती", "ऑर्डर ट्रॅक करा", "प्रोफाईल वर जा", "तज्ञ सल्ला"],
    responses: {
      "उत्पादन माहिती": "🌱 आमची प्रीमियम खते:\n• युरिया (₹८५०)\n• डीएपी (₹१२००)\nअधिक माहितीसाठी उत्पादन पेज पहा!",
      "default": "🤔 मी उत्पादने आणि नेव्हिगेशनमध्ये मदत करू शकतो. 'ऑर्डर वर जा' असे म्हणा."
    },
    navigation: {
      products: "उत्पादन पेजवर नेत आहे... 🛍️",
      orders: "तुमच्या ऑर्डर दाखवत आहे... 📦",
      profile: "प्रोफाईल उघडत आहे... 👤",
      cart: "कार्टवर नेत आहे... 🛒",
      dashboard: "डॅशबोर्डवर परत... 🏠"
    }
  }
};

const AIChatbot = () => {
  const theme = useTheme();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatLanguage, setChatLanguage] = useState(language || 'en');
  const [langMenuAnchor, setLangMenuAnchor] = useState(null);
  const messagesEndRef = useRef(null);

  // Drag Controls
  const dragControls = useDragControls();

  // Helper to get current language data safely
  const getCurrentLanguageData = useCallback(() => {
    return chatResponses[chatLanguage] || chatResponses['en'];
  }, [chatLanguage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const languageData = getCurrentLanguageData();
      setMessages([{
        id: Date.now(),
        text: languageData.greeting,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, chatLanguage, messages.length, getCurrentLanguageData]);

  const detectNavigation = (text) => {
    const lowerText = text.toLowerCase();
    const navKeywords = {
      products: ['product', 'shop', 'buy', 'store', 'market', 'उत्पाद', 'उत्पादन', 'खरेदी'],
      orders: ['order', 'track', 'history', 'ऑर्डर', 'मागा'],
      profile: ['profile', 'account', 'user', 'प्रोफाइल', 'प्रोफाईल', 'खाते'],
      cart: ['cart', 'basket', 'bag', 'कार्ट', 'पिशवी'],
      dashboard: ['home', 'main', 'dashboard', 'घर', 'मुख्य']
    };

    const actionKeywords = ['go to', 'navigate', 'open', 'show', 'take me', 'जाएं', 'जा', 'दाखवा', 'खोल'];

    // Check if it's a navigation intent
    const isNavigation = actionKeywords.some(keyword => lowerText.includes(keyword)) ||
      lowerText.length < 20; // Short phrases might be nav commands like "Products"

    if (isNavigation) {
      if (navKeywords.products.some(k => lowerText.includes(k))) return { path: '/products', type: 'products' };
      if (navKeywords.orders.some(k => lowerText.includes(k))) return { path: '/orders', type: 'orders' }; // Assuming generic orders path
      if (navKeywords.profile.some(k => lowerText.includes(k))) return { path: '/profile', type: 'profile' };
      if (navKeywords.cart.some(k => lowerText.includes(k))) return { path: '/cart', type: 'cart' };
      if (navKeywords.dashboard.some(k => lowerText.includes(k))) return { path: '/dashboard', type: 'dashboard' };
    }
    return null;
  };

  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Analyze intent
    const navIntent = detectNavigation(messageText);

    setTimeout(() => {
      let botResponseText = '';
      const languageData = getCurrentLanguageData();

      if (navIntent) {
        // Navigation Response
        botResponseText = languageData.navigation?.[navIntent.type] || `Navigating to ${navIntent.type}...`;

        // Execute Navigation
        setTimeout(() => {
          navigate(navIntent.path);
          setIsOpen(false); // Close chat on navigation
        }, 1500);

      } else {
        // Standard Response Logic
        const responses = languageData.responses || {};
        const lowerInput = messageText.toLowerCase();

        // Simple matching
        const match = Object.keys(responses).find(key => lowerInput.includes(key) && key !== 'default');
        botResponseText = match ? responses[match] : responses.default;
      }

      const botMessage = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  // Hide chatbot on auth pages
  const authPaths = ['/login', '/register', '/otp', '/auth', '/vendor/login', '/delivery/login'];
  if (authPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: { xs: 220, sm: 90 }, right: { xs: 16, sm: 24 }, zIndex: 1300, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              drag
              dragListener={false} // Only drag via controls (header)
              dragControls={dragControls}
              dragMomentum={false}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ transformOrigin: 'bottom right' }}
            >
              <Paper
                elevation={12}
                sx={{
                  width: { xs: '90vw', sm: 360 },
                  height: { xs: '70vh', sm: 500 },
                  borderRadius: '24px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                }}
              >
                {/* Header - DRAGGABLE HANDLE */}
                <Box
                  onPointerDown={(e) => dragControls.start(e)}
                  sx={{
                    background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'white',
                    cursor: 'move', // Visual cue for dragging
                    userSelect: 'none' // Prevent text selection
                  }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: 'white', color: '#2E7D32', width: 36, height: 36 }}>
                      <BotIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="700" lineHeight={1.2}>Kisan Mitra</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Online • AI Assistant</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row">
                    <IconButton size="small" onClick={(e) => setLangMenuAnchor(e.currentTarget)} sx={{ color: 'white' }}>
                      <LanguageIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                </Box>

                {/* Messages */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f7f6' }}>
                  {messages.map((msg) => (
                    <Box key={msg.id} sx={{
                      display: 'flex',
                      justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}>
                      {msg.sender === 'bot' && (
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#2E7D32', mr: 1, mt: 0.5 }}>
                          <BotIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      )}
                      <Paper sx={{
                        p: 1.5,
                        px: 2,
                        borderRadius: '18px',
                        borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '18px',
                        borderTopRightRadius: msg.sender === 'user' ? '4px' : '18px',
                        maxWidth: '75%',
                        bgcolor: msg.sender === 'user' ? '#2E7D32' : 'white',
                        color: msg.sender === 'user' ? 'white' : 'text.primary',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{msg.text}</Typography>
                      </Paper>
                    </Box>
                  ))}
                  {isTyping && (
                    <Box sx={{ display: 'flex', ml: 1, mb: 2 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: '#2E7D32', mr: 1 }}>
                        <BotIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Paper sx={{ p: 1.5, borderRadius: '18px', borderTopLeftRadius: '4px', bgcolor: 'white' }}>
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <Typography variant="caption">typing...</Typography>
                        </motion.div>
                      </Paper>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Quick Replies (Only if empty or just greeting) */}
                {messages.length <= 1 && (
                  <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {getCurrentLanguageData().quickReplies?.map((reply, i) => (
                      <Chip
                        key={i}
                        label={reply}
                        size="small"
                        onClick={() => handleSendMessage(reply)}
                        sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', borderColor: '#c8e6c9' }}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}

                {/* Input */}
                <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    InputProps={{
                      sx: { borderRadius: '24px', bgcolor: '#f5f5f5' },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton color="primary" onClick={() => handleSendMessage()} disabled={!inputValue.trim()}>
                            <SendIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          {!isOpen && (
            <Fab
              onClick={() => setIsOpen(true)}
              sx={{
                bgcolor: '#2E7D32',
                color: 'white',
                width: 64, height: 64,
                boxShadow: '0 8px 24px rgba(46, 125, 50, 0.4)',
                '&:hover': { bgcolor: '#1B5E20' },
              }}
            >
              <ChatIcon fontSize="large" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </Fab>
          )}
        </motion.div>

        {/* Language Menu */}
        <Menu
          anchorEl={langMenuAnchor}
          open={Boolean(langMenuAnchor)}
          onClose={() => setLangMenuAnchor(null)}
          PaperProps={{ sx: { borderRadius: 3, mb: 1 } }}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <MenuItem onClick={() => { setChatLanguage('en'); setLangMenuAnchor(null); }}>🇺🇸 English</MenuItem>
          <MenuItem onClick={() => { setChatLanguage('hi'); setLangMenuAnchor(null); }}>🇮🇳 हिंदी</MenuItem>
          <MenuItem onClick={() => { setChatLanguage('mr'); setLangMenuAnchor(null); }}>🇮🇳 मराठी</MenuItem>
        </Menu>
      </Box>
    </>
  );
};

export default AIChatbot;
