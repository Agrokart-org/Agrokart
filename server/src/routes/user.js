const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.id).get();
    if (!userDoc.exists) {
      // Fallback: search by email if token matched but ID changed
      if (req.user.email) {
        const snapshot = await db
          .collection("users")
          .where("email", "==", req.user.email)
          .get();
        if (!snapshot.empty) {
          const u = snapshot.docs[0];
          return res.json({ _id: u.id, id: u.id, ...u.data() });
        }
      }
      return res.status(404).json({ msg: "User not found" });
    }
    const user = { _id: userDoc.id, id: userDoc.id, ...userDoc.data() };
    delete user.password;
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  const { name, email } = req.body;

  try {
    const userRef = db.collection("users").doc(req.user.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ msg: "User not found" });
    }

    const currentData = userDoc.data();
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (req.body.address) {
      updateData.address = {
        ...(currentData.address || {}),
        ...req.body.address,
      };
      // Ensure coordinates are set correctly if provided
      if (req.body.address.coordinates) {
        updateData.address.coordinates = {
          type: "Point",
          coordinates: req.body.address.coordinates,
        };
      }
    }

    await userRef.update(updateData);
    const updatedDoc = await userRef.get();
    res.json({ _id: updatedDoc.id, id: updatedDoc.id, ...updatedDoc.data() });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
