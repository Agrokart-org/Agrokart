const { db } = require("../config/firebase");

const getProfile = async (req, res, next) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.id).get();
    if (!userDoc.exists) {
      if (req.user.email) {
        const snapshot = await db.collection("users").where("email", "==", req.user.email).get();
        if (!snapshot.empty) {
          const u = snapshot.docs[0];
          return res.json({ success: true, message: "Profile loaded", data: { _id: u.id, id: u.id, ...u.data() } });
        }
      }
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const user = { _id: userDoc.id, id: userDoc.id, ...userDoc.data() };
    delete user.password;
    res.json({ success: true, message: "Profile loaded", data: user });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const userRef = db.collection("users").doc(req.user.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentData = userDoc.data();
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (req.body.address) {
      updateData.address = { ...(currentData.address || {}), ...req.body.address };
      if (req.body.address.coordinates) {
        updateData.address.coordinates = { type: "Point", coordinates: req.body.address.coordinates };
      }
    }

    await userRef.update(updateData);
    const updatedDoc = await userRef.get();
    res.json({ success: true, message: "Profile updated", data: { _id: updatedDoc.id, id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile };
