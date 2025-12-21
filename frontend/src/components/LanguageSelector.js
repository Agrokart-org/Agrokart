import React from 'react';
import { Box, Menu, MenuItem, Button, Typography, ListItemIcon } from '@mui/material';
import { Translate as TranslateIcon, Check as CheckIcon } from '@mui/icons-material';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const LanguageSelector = () => {
  const { currentLanguage, languages, changeLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (code) => {
    changeLanguage(code);
    handleClose();
  };

  const currentLangInfo = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <Box>
      <Button
        onClick={handleClick}
        startIcon={<TranslateIcon />}
        endIcon={
          <Typography variant="caption" sx={{
            bgcolor: 'primary.light',
            color: 'white',
            px: 0.8,
            py: 0.2,
            borderRadius: 1,
            fontWeight: 'bold',
            ml: 0.5
          }}>
            {currentLanguage.toUpperCase()}
          </Typography>
        }
        sx={{
          color: 'text.primary',
          borderRadius: 2,
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            bgcolor: 'background.subtle',
            borderColor: 'primary.main',
          }
        }}
      >
        <Typography variant="body2" fontWeight="600" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {currentLangInfo.nativeName}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            borderRadius: 3,
            minWidth: 180,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <AnimatePresence>
          {languages.map((lang) => (
            <MenuItem
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              selected={currentLanguage === lang.code}
              sx={{
                py: 1.5,
                px: 2,
                gap: 1.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.main' }
                },
                '&:hover': {
                  bgcolor: 'background.subtle',
                }
              }}
              component={motion.li}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <Typography variant="body2" fontWeight="600">
                  {lang.nativeName}
                </Typography>
                <Typography variant="caption" color={currentLanguage === lang.code ? 'inherit' : 'text.secondary'} sx={{ opacity: 0.8 }}>
                  {lang.name}
                </Typography>
              </Box>
              {currentLanguage === lang.code && (
                <CheckIcon fontSize="small" />
              )}
            </MenuItem>
          ))}
        </AnimatePresence>
      </Menu>
    </Box>
  );
};

export default LanguageSelector;
