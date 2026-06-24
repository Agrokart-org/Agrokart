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
      user.address = { ...(user.address || {}), ...req.body.address };
      if (req.body.address.coordinates) {
        user.address.coordinates = { type: "Point", coordinates: req.body.address.coordinates };
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
