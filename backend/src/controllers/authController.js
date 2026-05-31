import bcrypt from "bcrypt";
import db from "../db.js";

// LOGIN
export const login = async (req, res) => {
  const { name = "", password = "" } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const result = await db.query(
      "SELECT * FROM staff_accounts WHERE name = $1",
      [name]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // remove password before sending response
    delete user.password;

    return res.json({
      userData: user,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Database query failed",
    });
  }
};