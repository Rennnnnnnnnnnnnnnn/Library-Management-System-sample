import bcrypt from "bcrypt";
import db from "./src/db.js"

import dotenv from "dotenv";

dotenv.config();

const seedAdmin = async () => {
  try {
    // hash password
    const hashedPassword = await bcrypt.hash("password", 10);

    // insert admin user
    await db.query(
      `INSERT INTO staff_accounts (name, email, password)
       VALUES (?, ?, ?)`,
      [
        "admin",
        //password: password
        "admin@email.com",
        hashedPassword
      ]
    );

    console.log("✅ Admin user created successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
};

seedAdmin();