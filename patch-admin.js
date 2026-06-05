const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "client/src/pages/AdminDashboard.js");
let code = fs.readFileSync(filePath, "utf-8");

// 1. Add pending_vendor_approval to getStatusColor
code = code.replace(
  /finding_vendor: "warning",/g,
  `finding_vendor: "warning",
      pending_vendor_approval: "warning",`
);

// 2. Add pending_vendor_approval to Order filter tabs
code = code.replace(
  /<Tab value="pending" label="PENDING" \/>/g,
  `<Tab value="pending" label="PENDING" />
                      <Tab value="pending_vendor_approval" label="AWAITING VENDOR" />`
);

// 3. Update Amount cell in Orders Table to show detailed breakdown
code = code.replace(
  /<TableCell sx=\{\{ fontFamily: "monospace" \}\}>\n\s*₹\{order.totalAmount\}\n\s*<\/TableCell>/g,
  `<TableCell sx={{ fontFamily: "monospace" }}>
                                <Tooltip title={
                                  <Box sx={{ p: 1 }}>
                                    <Typography variant="body2">Subtotal: ₹{order.subtotalAmount || order.totalAmount}</Typography>
                                    <Typography variant="body2">Delivery: ₹{order.deliveryCharge || 0}</Typography>
                                    <Typography variant="body2">Vendor Payout: ₹{order.vendorPayout || order.totalAmount}</Typography>
                                  </Box>
                                }>
                                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography sx={{ color: '#00ff00', fontWeight: 'bold' }}>₹{order.totalAmount}</Typography>
                                    {order.deliveryCharge > 0 && <Typography variant="caption" sx={{ color: '#666' }}>+₹{order.deliveryCharge} Del.</Typography>}
                                  </Box>
                                </Tooltip>
                              </TableCell>`
);

// 4. Update Users Table (Delivery Partner Cash Collection & Vendor Bank status)
code = code.replace(
  /<Chip[\s\S]*?label=\{user\.role\?\.toUpperCase\(\)\}[\s\S]*?\/>/g,
  `<Stack spacing={1}>
                                  <Chip
                                    icon={getRoleIcon(user.role)}
                                    label={user.role?.toUpperCase()}
                                    size="small"
                                    sx={{ color: "#aaa", borderColor: "#444" }}
                                    variant="outlined"
                                  />
                                  {user.role === "delivery_partner" && user.deliveryProfile && (
                                    <Tooltip title={\`Cash Limit: ₹\${user.deliveryProfile.cashCollection?.limit || 5000}\`}>
                                      <Chip 
                                        label={\`Cash: ₹\${user.deliveryProfile.cashCollection?.currentAmount || 0}\`} 
                                        size="small" 
                                        color={(user.deliveryProfile.cashCollection?.currentAmount || 0) >= (user.deliveryProfile.cashCollection?.limit || 5000) ? "error" : "default"}
                                        sx={{ fontSize: "0.6rem", height: 20 }}
                                      />
                                    </Tooltip>
                                  )}
                                  {(user.role === "delivery_partner" || user.role === "vendor") && (
                                    <Tooltip title={(user.role === "vendor" ? user.vendorProfile?.bankDetails?.accountNumber : user.deliveryProfile?.bankDetails?.accountNumber) ? "Bank Linked" : "Bank Not Linked"}>
                                      <Chip 
                                        label={(user.role === "vendor" ? user.vendorProfile?.bankDetails?.accountNumber : user.deliveryProfile?.bankDetails?.accountNumber) ? "Bank \u2713" : "No Bank"} 
                                        size="small" 
                                        color={(user.role === "vendor" ? user.vendorProfile?.bankDetails?.accountNumber : user.deliveryProfile?.bankDetails?.accountNumber) ? "success" : "default"}
                                        sx={{ fontSize: "0.6rem", height: 20 }}
                                      />
                                    </Tooltip>
                                  )}
                                </Stack>`
);

// Replace original single chip since I replaced the start of it above, wait, my regex above might replace the opening of the original chip and leave the closing.
// Let's refine step 4: I will use a more precise regex.

fs.writeFileSync(filePath, code);
console.log("Patched AdminDashboard.js");
