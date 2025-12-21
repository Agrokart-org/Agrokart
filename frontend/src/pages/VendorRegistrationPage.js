import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  IconButton,
  Autocomplete
} from '@mui/material';
import {
  Business as BusinessIcon,
  CloudUpload as UploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { vendorRegister, vendorUploadDocuments } from '../services/api';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import RegistrationSuccessModal from '../components/RegistrationSuccessModal';
import { locationData } from '../data/locationData';
import { indianBanks } from '../data/bankData';

const steps = ['Business Details', 'Service Areas', 'Bank Details', 'Documents'];

const businessTypes = [
  'fertilizer_supplier',
  'seed_supplier',
  'equipment_supplier',
  'general_agriculture'
];

const VendorRegistrationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRole, updateUser, setIsAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  useEffect(() => {
    console.log('📄 VendorRegistrationPage mounted at path:', window.location.pathname);
  }, []);

  // Get initial form data from location state if available
  const initialFormData = location.state ? {
    // Personal Details
    name: location.state.name || '',
    email: location.state.email || '',
    password: '',
    confirmPassword: '',
    phone: location.state.phone || '',

    // Business Details
    businessName: '',
    businessType: '',
    gstNumber: '',

    // Service Areas
    serviceAreas: [{ state: '', districts: [], pincodes: [] }],

    // Bank Details
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      bankName: ''
    },

    // Documents
    documents: {
      gstCertificate: null,
      businessLicense: null,
      panCard: null,
      addressProof: null
    }
  } : {
    // Personal Details
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',

    // Business Details
    businessName: '',
    businessType: '',
    gstNumber: '',

    // Service Areas
    serviceAreas: [{ state: '', districts: [], pincodes: [] }],

    // Bank Details
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      bankName: ''
    },

    // Documents
    documents: {
      gstCertificate: null,
      businessLicense: null,
      panCard: null,
      addressProof: null
    }
  };

  // Log if we received data from previous page
  useEffect(() => {
    if (location.state) {
      const { email, name, phone } = location.state;
      if (email || name || phone) {
        console.log('📝 Pre-filled data from previous page:', { email, name, phone });
      }
    }
  }, [location.state]);

  const [formData, setFormData] = useState(initialFormData);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleServiceAreaChange = (index, field, value) => {
    const newServiceAreas = [...formData.serviceAreas];
    if (field === 'districts' || field === 'pincodes') {
      newServiceAreas[index][field] = value.split(',').map(item => item.trim());
    } else {
      newServiceAreas[index][field] = value;
    }
    setFormData(prev => ({ ...prev, serviceAreas: newServiceAreas }));
  };

  const addServiceArea = () => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: [...prev.serviceAreas, { state: '', districts: [], pincodes: [] }]
    }));
  };

  const removeServiceArea = (index) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (field, file) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file
      }
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return formData.name && formData.email && formData.password &&
          formData.confirmPassword && formData.phone && formData.businessName &&
          formData.businessType && formData.password === formData.confirmPassword;
      case 1:
        // Relax validation: require only state; districts/pincodes optional
        return formData.serviceAreas.every(area => area.state);
      case 2:
        // Relax validation: require account number and IFSC only for now
        return formData.bankDetails.accountNumber && formData.bankDetails.ifscCode;
      case 3:
        // Enforce all documents to be mandatory
        return formData.documents.gstCertificate &&
          formData.documents.businessLicense &&
          formData.documents.panCard &&
          formData.documents.addressProof;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      setError('');
    } else {
      setError('Please fill all required fields');
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const handleContinueToLogin = () => {
    setShowSuccessModal(false);
    navigate('/vendor/login');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Starting vendor registration process with Firebase + backend...');

      // Step 1: Ensure a Firebase account exists for this vendor
      let firebaseUid = null;
      let firebaseIdToken = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;
        firebaseUid = user.uid;
        firebaseIdToken = await user.getIdToken();
        console.log('✅ Firebase user created for vendor:', firebaseUid);
      } catch (firebaseError) {
        console.warn('⚠️ Firebase sign-up for vendor failed or user exists:', firebaseError?.code || firebaseError?.message);

        // Handle existing user case (Account exists, try to login and add role)
        if (firebaseError.code === 'auth/email-already-in-use') {
          try {
            console.log('🔄 Email in use. Attempting to sign in with provided credentials...');
            const userCredential = await signInWithEmailAndPassword(
              auth,
              formData.email,
              formData.password
            );
            const user = userCredential.user;
            firebaseUid = user.uid;
            firebaseIdToken = await user.getIdToken();
            console.log('✅ Signed in existing user successfully for vendor registration:', firebaseUid);
          } catch (loginError) {
            console.error('❌ Failed to sign in existing user:', loginError);
            if (loginError.code === 'auth/wrong-password') {
              throw new Error('An account with this email exists, but the password provided is incorrect. Please correct it or log in first.');
            }
            throw new Error('This email is already registered. Please log in to your existing account to become a vendor.');
          }
        } else if (auth.currentUser) {
          firebaseUid = auth.currentUser.uid;
          firebaseIdToken = await auth.currentUser.getIdToken();
          console.log('ℹ️ Using existing Firebase session for vendor:', firebaseUid);
        } else {
          throw new Error(firebaseError?.message || 'Failed to create Firebase account');
        }
      }

      // Step 2: Register vendor in backend with firebaseUid
      const registrationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        businessName: formData.businessName,
        businessType: formData.businessType,
        gstNumber: formData.gstNumber,
        serviceAreas: formData.serviceAreas,
        bankDetails: formData.bankDetails,
        role: 'vendor',
        firebaseUid
      };

      console.log('📤 Registering vendor with backend (firebaseUid attached)');
      const response = await vendorRegister(registrationData);
      console.log('✅ Vendor backend registration successful:', response);

      // Update profile with displayName
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: formData.name
          });
          console.log('✅ Firebase profile updated with name');
        } catch (profileError) {
          console.warn('⚠️ Firebase profile update failed:', profileError);
        }
      }

      // Step 3: Upload documents if any (use Firebase token for auth if needed)
      const authToken = response.token || response.user?.token || firebaseIdToken;

      const formDataObj = new FormData();
      Object.keys(formData.documents).forEach(key => {
        if (formData.documents[key]) {
          console.log(`📎 Adding document: ${key}`, formData.documents[key].name);
          formDataObj.append(key, formData.documents[key]);
        }
      });

      if (Object.keys(formData.documents).some(key => formData.documents[key]) && authToken) {
        console.log('📤 Uploading vendor documents...');
        try {
          await vendorUploadDocuments(formDataObj, authToken);
          console.log('✅ Vendor documents uploaded successfully');
        } catch (docError) {
          console.warn('⚠️ Vendor document upload failed:', docError.message);
          // Continue anyway - documents can be uploaded later
        }
      }

      // Step 4: Sign out explicitly to prevent auto-login
      // The user must login manually after registration
      await signOut(auth);

      console.log('✅ Vendor registration complete. User signed out for manual login.');

      // Store user strictly for success modal display
      setRegisteredUser({
        name: formData.name,
        email: formData.email,
        role: 'vendor'
      });

      setSuccess('Vendor registration successful! Please log in to continue.');
      setShowSuccessModal(true);

      // Store user for success modal
      setRegisteredUser({
        name: formData.name,
        email: formData.email,
        role: 'vendor'
      });

      setSuccess('Vendor registration successful!');
      setShowSuccessModal(true);

    } catch (error) {
      console.error('🚨 Vendor registration error:', error);
      setError(error.message || 'Vendor registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Business Name"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Business Type</InputLabel>
                <Select
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                >
                  {businessTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GST Number"
                value={formData.gstNumber}
                onChange={(e) => handleInputChange('gstNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                error={formData.password !== formData.confirmPassword}
                helperText={formData.password !== formData.confirmPassword ? 'Passwords do not match' : ''}
              />
            </Grid>
          </Grid>
        );

      case 1: // Service Areas
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Service Areas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Specify the areas where you provide your services
              </Typography>
            </Grid>

            {formData.serviceAreas.map((area, index) => {
              // Helper to get districts based on selected state
              const availableDistricts = area.state && locationData[area.state]
                ? Object.keys(locationData[area.state])
                : [];

              // Helper to get pincodes based on selected districts
              const availablePincodes = area.districts.reduce((acc, district) => {
                if (area.state && locationData[area.state] && locationData[area.state][district]) {
                  return [...acc, ...locationData[area.state][district]];
                }
                return acc;
              }, []).sort();

              return (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ p: 3, mb: 2, border: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Service Area {index + 1}</Typography>
                      {formData.serviceAreas.length > 1 && (
                        <IconButton onClick={() => removeServiceArea(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Autocomplete
                          value={area.state}
                          options={Object.keys(locationData)}
                          onChange={(_, newValue) => {
                            const newServiceAreas = [...formData.serviceAreas];
                            newServiceAreas[index].state = newValue;
                            newServiceAreas[index].districts = []; // Reset districts
                            newServiceAreas[index].pincodes = [];  // Reset pincodes
                            setFormData(prev => ({ ...prev, serviceAreas: newServiceAreas }));
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="State"
                              required
                              placeholder="Select State"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Autocomplete
                          disabled={!area.state}
                          value={area.districts[0] || null}
                          options={availableDistricts}
                          onChange={(_, newValue) => {
                            const newServiceAreas = [...formData.serviceAreas];
                            newServiceAreas[index].districts = newValue ? [newValue] : [];

                            // Reset pincode since district changed
                            newServiceAreas[index].pincodes = [];

                            setFormData(prev => ({ ...prev, serviceAreas: newServiceAreas }));
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="District"
                              required
                              placeholder="Select District"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Autocomplete
                          disabled={area.districts.length === 0}
                          value={area.pincodes[0] || null}
                          options={availablePincodes}
                          onChange={(_, newValue) => {
                            const newServiceAreas = [...formData.serviceAreas];
                            newServiceAreas[index].pincodes = newValue ? [newValue] : [];
                            setFormData(prev => ({ ...prev, serviceAreas: newServiceAreas }));
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Pin Code"
                              required
                              placeholder="Select Pin Code"
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              );
            })}

            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addServiceArea}
                sx={{ mt: 2 }}
              >
                Add Another Service Area
              </Button>
            </Grid>
          </Grid>
        );

      case 2: // Bank Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Bank Details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Provide your bank account details for payments
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Account Holder Name"
                value={formData.bankDetails.accountHolderName}
                onChange={(e) => handleInputChange('bankDetails', {
                  ...formData.bankDetails,
                  accountHolderName: e.target.value
                })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                value={formData.bankDetails.bankName}
                options={indianBanks}
                freeSolo
                onChange={(event, newValue) => {
                  handleInputChange('bankDetails', {
                    ...formData.bankDetails,
                    bankName: newValue
                  });
                }}
                onInputChange={(event, newInputValue) => {
                  handleInputChange('bankDetails', {
                    ...formData.bankDetails,
                    bankName: newInputValue
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Bank Name"
                    required
                    placeholder="Select or type Bank Name"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Account Number"
                value={formData.bankDetails.accountNumber}
                onChange={(e) => handleInputChange('bankDetails', {
                  ...formData.bankDetails,
                  accountNumber: e.target.value
                })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IFSC Code"
                value={formData.bankDetails.ifscCode}
                onChange={(e) => handleInputChange('bankDetails', {
                  ...formData.bankDetails,
                  ifscCode: e.target.value
                })}
                required
              />
            </Grid>
          </Grid>
        );

      case 3: // Documents
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Document Upload
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload required business documents for verification
              </Typography>
            </Grid>

            {Object.keys(formData.documents).map((docType) => (
              <Grid item xs={12} md={6} key={docType}>
                <Paper sx={{ p: 3, textAlign: 'center', border: '2px dashed #e0e0e0' }}>
                  <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {docType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} <span style={{ color: 'red' }}>*</span>
                  </Typography>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(docType, e.target.files[0])}
                    style={{ display: 'none' }}
                    id={`upload-${docType}`}
                  />
                  <label htmlFor={`upload-${docType}`}>
                    <Button variant="outlined" component="span" sx={{ mt: 1 }}>
                      Choose File
                    </Button>
                  </label>
                  {formData.documents[docType] && (
                    <Chip
                      label={formData.documents[docType].name}
                      color="success"
                      sx={{ mt: 1, display: 'block' }}
                    />
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        );

      default:
        return <Typography>Step content for step {step}</Typography>;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <BusinessIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Vendor Registration
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !validateStep(activeStep)}
            >
              {loading ? 'Registering...' : 'Complete Registration'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!validateStep(activeStep)}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>

      {/* Registration Success Modal */}
      <RegistrationSuccessModal
        open={showSuccessModal}
        onClose={handleSuccessModalClose}
        onContinueToLogin={handleContinueToLogin}
        userRole="vendor"
        userName={registeredUser?.name}
        userEmail={registeredUser?.email}
      />
    </Container>
  );
};

export default VendorRegistrationPage;
