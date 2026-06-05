const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "client/src/pages/MobileVendorDashboard.js");
let code = fs.readFileSync(filePath, "utf-8");

// 1. Add API imports
code = code.replace(
  /claimVendorOrder,\n  respondToVendorOrder,\n} from "\.\.\/services\/api";/g,
  `claimVendorOrder,\n  respondToVendorOrder,\n  getVendorBankAccount,\n  linkVendorBankAccount,\n} from "../services/api";`
);

// 2. Add AccountBalanceWallet icon
code = code.replace(
  /BarChart as StockIcon,/g,
  `BarChart as StockIcon,\n  AccountBalanceWallet,`
);

// 3. Add states for Wallet inside MobileVendorDashboard right after setValue(0);
const stateCode = `
  // Wallet State
  const [bankDetails, setBankDetails] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({ accountNumber: "", ifscCode: "", accountHolderName: "", bankName: "" });
  const [walletStats, setWalletStats] = useState({ earnings: 0, pending: 0 });

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const data = await getVendorBankAccount(token);
      if (data.isLinked && data.bankDetails) {
        setBankDetails(data.bankDetails);
      }
    } catch (e) {
      console.error("Wallet error:", e);
    }
  };

  const handleLinkBank = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await linkVendorBankAccount(bankForm, token);
      setBankDetails(res.bankDetails);
      setShowBankForm(false);
      setNotification({ open: true, message: "Bank account linked successfully", severity: "success" });
    } catch (e) {
      setNotification({ open: true, message: e.message, severity: "error" });
    }
  };

  useEffect(() => {
    if (value === 4) fetchWalletData(); // Load wallet data when tab opens
  }, [value]);
`;

code = code.replace(/const \[value, setValue\] = useState\(0\);/g, `const [value, setValue] = useState(0);\n${stateCode}`);

// 4. Update earnings in calcTodayDelivered
code = code.replace(
  /let count = 0;\n    let earnings = 0;\n    myOrders.forEach\(\(o\) => {/,
  `let count = 0;
    let earnings = 0;
    let totalPending = 0;
    let totalEarnings = 0;
    myOrders.forEach((o) => {
      // Calculate total wallet stats
      if (o.orderStatus === "delivered") totalEarnings += (o.vendorPayout || o.subtotalAmount || 0);
      else if (["confirmed", "processing", "out_for_delivery"].includes(o.orderStatus)) totalPending += (o.vendorPayout || o.subtotalAmount || 0);
`
);

code = code.replace(
  /setTodayDelivered\(\{ count, earnings \}\);\n  \};/g,
  `setTodayDelivered({ count, earnings });
    setWalletStats({ earnings: totalEarnings, pending: totalPending });
  };`
);

// 5. Add renderWallet
const renderWalletCode = `
  const renderWallet = () => (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountBalanceWallet color="primary" /> My Wallet
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Card elevation={0} sx={{ bgcolor: "success.light", color: "success.dark", borderRadius: 3 }}>
            <CardContent sx={{ p: 2, pb: "16px !important" }}>
              <Typography variant="caption" fontWeight="bold">TOTAL EARNINGS</Typography>
              <Typography variant="h6" fontWeight="bold">₹{walletStats.earnings.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card elevation={0} sx={{ bgcolor: "warning.light", color: "warning.dark", borderRadius: 3 }}>
            <CardContent sx={{ p: 2, pb: "16px !important" }}>
              <Typography variant="caption" fontWeight="bold">PENDING PAYOUTS</Typography>
              <Typography variant="h6" fontWeight="bold">₹{walletStats.pending.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Bank Account Details
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Link your bank account to receive automated payouts for your completed orders.
          </Typography>

          {bankDetails ? (
            <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" fontWeight="bold">{bankDetails.bankName}</Typography>
                <Chip label="Linked" size="small" color="success" icon={<CheckCircle />} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                A/C: ••••{bankDetails.accountNumber.slice(-4)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                IFSC: {bankDetails.ifscCode}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Holder: {bankDetails.accountHolderName}
              </Typography>
            </Box>
          ) : (
            <>
              {!showBankForm ? (
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={() => setShowBankForm(true)}
                  sx={{ borderRadius: 8, textTransform: 'none' }}
                >
                  Link Bank Account
                </Button>
              ) : (
                <Stack spacing={2}>
                  <TextField size="small" label="Account Number" fullWidth value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} />
                  <TextField size="small" label="IFSC Code" fullWidth value={bankForm.ifscCode} onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})} />
                  <TextField size="small" label="Account Holder Name" fullWidth value={bankForm.accountHolderName} onChange={e => setBankForm({...bankForm, accountHolderName: e.target.value})} />
                  <TextField size="small" label="Bank Name" fullWidth value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} />
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" fullWidth onClick={() => setShowBankForm(false)} sx={{ borderRadius: 8 }}>Cancel</Button>
                    <Button variant="contained" fullWidth onClick={handleLinkBank} sx={{ borderRadius: 8 }}>Save</Button>
                  </Stack>
                </Stack>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
`;

code = code.replace(/const renderDashboard = \(\) => \(/g, `${renderWalletCode}\n  const renderDashboard = () => (`);

// 6. Add renderWallet to main content
code = code.replace(
  /\{value === 4 && renderDailyStock\(\)\}/g,
  `{value === 4 && renderWallet()}
        {value === 5 && renderDailyStock()}`
);

// 7. Update drawer nav list to map value 4 -> Wallet and 5 -> Daily Stock
code = code.replace(
  /setValue\(4\)/g,
  `setValue(5)`
);
code = code.replace(
  /value === 4 \? "primary"/g,
  `value === 5 ? "primary"`
);
code = code.replace(
  /selected=\{value === 4\}/g,
  `selected={value === 5}`
);

// Add Wallet to drawer (after profile)
const drawerWalletCode = `
        <ListItemButton
          onClick={() => { setValue(4); setMobileOpen(false); }}
          selected={value === 4}
          sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
        >
          <ListItemIcon>
            <AccountBalanceWallet color={value === 4 ? "primary" : "inherit"} />
          </ListItemIcon>
          <ListItemText primary="Wallet" />
        </ListItemButton>
`;
code = code.replace(/<Divider sx=\{\{ my: 1 \}\} \/>\n        <ListItemButton onClick=\{logout\}/g, `${drawerWalletCode}        <Divider sx={{ my: 1 }} />\n        <ListItemButton onClick={logout}`);

// 8. Update bottom nav
code = code.replace(
  /value=\{value > 4 \? false : value\}/g,
  `value={value > 5 ? false : value}`
);

code = code.replace(
  /<BottomNavigationAction label="Profile" icon=\{<Person \/>\} \/>/g,
  `<BottomNavigationAction label="Profile" icon={<Person />} />
          <BottomNavigationAction label="Wallet" icon={<AccountBalanceWallet />} />`
);

// 9. Fix useEffect for daily stock (value 5 now)
code = code.replace(
  /if \(value === 1 \|\| value === 4\) fetchInventory\(\);/g,
  `if (value === 1 || value === 5) fetchInventory();`
);

fs.writeFileSync(filePath, code);
console.log("Patched MobileVendorDashboard.js");
