import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Radio,
  Paper,
} from "@mui/material";

const LanguageDialog = ({ open, onClose }) => {
  const [selectedLang, setSelectedLang] = useState("en");

  const languages = [
    { code: "en", name: "English (US)", native: "English" },
    { code: "hi", name: "Hindi", native: "हिन्दी" },
    { code: "mr", name: "Marathi", native: "मराठी" },
    { code: "te", name: "Telugu", native: "తెలుగు" },
  ];

  const handleSave = () => {
    localStorage.setItem("agrokart_lang", selectedLang);
    onClose();
    // In a real app, this might trigger an i18n change or page reload
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight="900">Select Language</Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <List>
          {languages.map((lang) => (
            <Paper 
              key={lang.code}
              elevation={0} 
              sx={{ 
                border: selectedLang === lang.code ? "2px solid" : "1px solid", 
                borderColor: selectedLang === lang.code ? "primary.main" : "rgba(0,0,0,0.08)", 
                borderRadius: 3, 
                mb: 1,
                cursor: "pointer"
              }}
              onClick={() => setSelectedLang(lang.code)}
            >
              <ListItem>
                <ListItemText 
                  primary={lang.native} 
                  secondary={lang.name} 
                  primaryTypographyProps={{ fontWeight: "800", fontSize: "1.1rem" }} 
                />
                <Radio checked={selectedLang === lang.code} color="primary" />
              </ListItem>
            </Paper>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} sx={{ color: "text.secondary", fontWeight: "700", textTransform: "none" }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 2, fontWeight: "700", textTransform: "none", px: 3 }}>
          Save Preferences
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LanguageDialog;
