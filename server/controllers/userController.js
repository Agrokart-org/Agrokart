const User = require("../models/User");

const getProfile = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id).select("-password");
    if (!user && req.user.email) {
      user = await User.findOne({ email: req.user.email }).select("-password");
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Profile loaded", data: user });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    let user = await User.findById(req.user.id);
    
    if (!user && req.user.email) {
      user = await User.findOne({ email: req.user.email });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    if (req.body.address) {
      user.address = { ...(user.address && typeof user.address.toObject === 'function' ? user.address.toObject() : user.address || {}), ...req.body.address };
      if (req.body.address.coordinates) {
        user.address.coordinates = { type: "Point", coordinates: req.body.address.coordinates };
        
        // Also update the top-level location field used for geospatial queries
        user.location = {
          type: "Point",
          coordinates: req.body.address.coordinates,
          address: `${req.body.address.street || ''}, ${req.body.address.city || ''}, ${req.body.address.state || ''} ${req.body.address.pincode || ''}`.replace(/^, |^ , | , $/g, '').trim()
        };
      }
    }

    if (req.body.vendorProfile) {
      if (!user.vendorProfile) user.vendorProfile = {};
      if (req.body.vendorProfile.settings) {
        user.vendorProfile.settings = { ...(user.vendorProfile.settings && typeof user.vendorProfile.settings.toObject === 'function' ? user.vendorProfile.settings.toObject() : user.vendorProfile.settings || {}), ...req.body.vendorProfile.settings };
      }
      if (req.body.vendorProfile.notifications) {
        user.vendorProfile.notifications = { ...(user.vendorProfile.notifications && typeof user.vendorProfile.notifications.toObject === 'function' ? user.vendorProfile.notifications.toObject() : user.vendorProfile.notifications || {}), ...req.body.vendorProfile.notifications };
      }
    }

    await user.save();
    
    const updatedUser = await User.findById(user._id).select("-password");
    res.json({ success: true, message: "Profile updated", data: updatedUser });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile };
