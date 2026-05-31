import db from "../db.js";
import supabase from "../../supabase.js";

// GET ACCOUNTS
export const getAccounts = async (req, res) => {
    const { page, limit, filters, searchTerm } = req.query;

    const currentPage = parseInt(page, 10) || 0;
    const pageSize = parseInt(limit, 10) || 10;
    const offset = currentPage * pageSize;

    try {
        let whereClauses = [];
        let values = [];
        let paramIndex = 1;

        // ✅ FILTERS
        if (filters) {
            const parsedFilters = filters.split(";").filter(Boolean);

            parsedFilters.forEach(f => {
                if (f.includes(":")) {
                    const [course, sections] = f.split(":");
                    const sectionArr = sections.split(",");

                    const coursePlaceholder = `$${paramIndex++}`;

                    const sectionPlaceholders = sectionArr
                        .map(() => `$${paramIndex++}`)
                        .join(",");

                    whereClauses.push(
                        `(course = ${coursePlaceholder} AND year_and_section IN (${sectionPlaceholders}))`
                    );

                    values.push(course, ...sectionArr);
                } else {
                    whereClauses.push(`course = $${paramIndex++}`);
                    values.push(f);
                }
            });
        }

        // ✅ SEARCH
        if (searchTerm) {
            whereClauses.push(
                `(name ILIKE $${paramIndex} OR student_number::text ILIKE $${paramIndex})`
            );
            values.push(`%${searchTerm}%`);
            paramIndex++;
        }

        let where = "WHERE 1=1";

        if (whereClauses.length > 0) {
            where += ` AND (${whereClauses.join(" OR ")})`;
        }

        // 🔢 COUNT QUERY
        const countResult = await db.query(
            `SELECT COUNT(*)::int AS total FROM accounts ${where}`,
            values
        );

        const total = countResult.rows[0].total;

        // 📄 PAGINATED QUERY
        const rowsResult = await db.query(
            `SELECT * FROM accounts
             ${where}
             ORDER BY course ASC, year_and_section ASC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            [...values, pageSize, offset]
        );

        res.json({
            rows: rowsResult.rows,
            total
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
};

// GET DISTINCT COURSES, YEAR AND SECTIONS
export const getCoursesWithSections = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                course,
                STRING_AGG(DISTINCT year_and_section, ',' ORDER BY year_and_section ASC) AS sections
            FROM accounts
            GROUP BY course
            ORDER BY course ASC
        `);

        const formatted = result.rows.map(row => ({
            course: row.course,
            sections: row.sections ? row.sections.split(',') : []
        }));

        res.json(formatted);

    } catch (err) {
        console.error("Error fetching courses with sections:", err);
        res.status(500).json({ error: "Database query failed" });
    }
};

// ADD NEW ACCOUNT OLD
export const addAccount = async (req, res) => {
    const {
        name,
        course,
        year_and_section,
        email,
        student_number,
        account_type
    } = req.body;

    // Validation
    if (!name) return res.status(400).json({ error: "Name is required." });
    if (!course) return res.status(400).json({ error: "Course is required." });
    if (!year_and_section) return res.status(400).json({ error: "Year & Section is required." });
    if (!email) return res.status(400).json({ error: "Email is required." });
    if (!student_number) return res.status(400).json({ error: "Student Number is required." });
    if (!account_type) return res.status(400).json({ error: "Account Type is required." });

    try {
        // Check duplicate student number
        const existing = await db.query(
            `SELECT 1 FROM accounts WHERE student_number = $1`,
            [student_number]
        );

        if (existing.rowCount > 0) {
            return res.status(400).json({
                error: "Student Number already exists."
            });
        }

        let profile_picture = null;

        if (req.file) {
            const fileExt = req.file.originalname.split(".").pop();

            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;

            const { error } = await supabase.storage
                .from("profile-pictures")
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                });

            if (error) {
                return res.status(500).json({
                    error: "Image upload failed",
                });
            }

            const { data } = supabase.storage
                .from("profile-pictures")
                .getPublicUrl(fileName);

            profile_picture = data.publicUrl;
        }

        const result = await db.query(
            ` INSERT INTO accounts (
                name,
                course,
                year_and_section,
                email,
                student_number,
                account_type,
                profile_picture
            )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `,
            [
                name,
                course,
                year_and_section,
                email,
                student_number,
                account_type,
                profile_picture
            ]
        );

        return res.status(201).json({
            message: "Account added successfully!",
            account: result.rows[0]
        });

    } catch (err) {
        console.error("Error adding account:", err);

        return res.status(500).json({
            error: "Server error while adding account."
        });
    }
};

// EDIT AN ACCOUNT 
export const editAccount = async (req, res) => {
    const {
        Name,
        Course,
        Year_And_Section,
        Email,
        Account_Type,
        Student_Number
    } = req.body;

    try {
        let profile_picture = null;

        // Upload new image if provided
        if (req.file) {
            const fileExt = req.file.originalname.split(".").pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("profile-pictures")
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                });

            if (uploadError) {
                return res.status(500).json({
                    error: "Image upload failed"
                });
            }

            const { data } = supabase.storage
                .from("profile-pictures")
                .getPublicUrl(fileName);

            profile_picture = data.publicUrl;
        }

        const sql = `
            UPDATE accounts
            SET
                name = $1,
                course = $2,
                year_and_section = $3,
                email = $4,
                account_type = $5,
                profile_picture = COALESCE($6, profile_picture)
            WHERE student_number = $7
        `;

        const values = [
            Name,
            Course,
            Year_And_Section,
            Email,
            Account_Type,
            profile_picture,
            Student_Number
        ];

        const result = await db.query(sql, values);

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Account not found."
            });
        }

        return res.status(200).json({
            message: "Account updated successfully."
        });

    } catch (err) {
        console.error("Edit account error:", err);
        return res.status(500).json({
            error: "Server error while updating account."
        });
    }
};

//  DELETE AN ACCOUNT
export const deleteAccount = async (req, res) => {
    const { student_number } = req.params;

    if (!student_number) {
        return res.status(400).json({
            error: "Student number is required."
        });
    }

    try {
        const result = await db.query(
            `
      DELETE FROM accounts
      WHERE student_number = $1
      RETURNING *
      `,
            [student_number]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Account not found."
            });
        }

        return res.status(200).json({
            message: "Account deleted successfully.",
            deleted: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting account:", err);

        return res.status(500).json({
            error: "Server error while deleting account."
        });
    }
};


// GET ACCOUNT ACTIVITIES
export const getAccountActivitiesByID = async (req, res) => {
    const { student_number } = req.params;
    try {
        const result = await db.query(
            `
            SELECT 
                activities.activity_type,
                activities.activity_time,
                accounts.name,
                accounts.course,
                accounts.year_and_section,
                t.item_id,
                COALESCE(books.title, academic_papers.title) AS title
            FROM activities
            LEFT JOIN accounts 
                ON activities.student_number = accounts.student_number
            LEFT JOIN transactions t
                ON (
                    (activities.Activity_Type = 'Borrowed Item' AND t.act_id = activities.act_id)
                    OR
                    (activities.Activity_Type = 'Returned Item' AND t.return_act_id = activities.act_id)
                )
            LEFT JOIN books 
                ON t.item_id = books.item_id
            LEFT JOIN academic_papers 
                ON t.item_id = academic_papers.item_id
            WHERE activities.student_number = $1
            ORDER BY activities.activity_time DESC
            `,
            [student_number]
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error("Error fetching account history:", err);
        res.status(500).json({ error: "Database query failed." });
    }
};


// DOWNLOAD ACCOUNTS
export const downloadAccounts = async (req, res) => {
    const { filters, searchTerm } = req.query;

    try {
        let whereClauses = [];
        let values = [];
        let paramIndex = 1;

        // ✅ FILTERS (same logic as getAccounts)
        if (filters) {
            const parsedFilters = filters.split(";").filter(Boolean);

            parsedFilters.forEach(f => {
                if (f.includes(":")) {
                    const [course, sections] = f.split(":");
                    const sectionArr = sections.split(",");

                    const coursePlaceholder = `$${paramIndex++}`;

                    const sectionPlaceholders = sectionArr
                        .map(() => `$${paramIndex++}`)
                        .join(",");

                    whereClauses.push(
                        `(course = ${coursePlaceholder} AND year_and_section IN (${sectionPlaceholders}))`
                    );

                    values.push(course, ...sectionArr);
                } else {
                    whereClauses.push(`course = $${paramIndex++}`);
                    values.push(f);
                }
            });
        }

        // ✅ SEARCH (same as getAccounts)
        if (searchTerm) {
            whereClauses.push(
                `(name ILIKE $${paramIndex} OR student_number::text ILIKE $${paramIndex})`
            );
            values.push(`%${searchTerm}%`);
            paramIndex++;
        }

        let where = "WHERE 1=1";

        if (whereClauses.length > 0) {
            where += ` AND (${whereClauses.join(" OR ")})`;
        }

        // 📄 EXPORT QUERY (NO PAGINATION)
        const result = await db.query(
            `SELECT 
                student_number,
                name,
                course,
                year_and_section,
                email,
                account_type
             FROM accounts
             ${where}
             ORDER BY course ASC, year_and_section ASC`,
            values
        );

        res.json({
            rows: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        console.error("Export error:", err);
        res.status(500).json({ error: "Database query failed" });
    }
};




