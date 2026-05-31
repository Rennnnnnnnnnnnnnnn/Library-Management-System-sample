
import db from "../db.js"; // ✅ pg connection only

// FOR RESOURCES DONUT CHART
export const getResourcesTypes = async (req, res) => {
    const { selectedCategory } = req.params;

    try {
        let query;

        if (selectedCategory === "books") {
            query = `
                SELECT type, COUNT(*)::int AS total
                FROM books
                GROUP BY type
            `;
        } else if (selectedCategory === "academic-papers") {
            query = `
                SELECT type, COUNT(*)::int AS total
                FROM academic_papers
                GROUP BY type
            `;
        } else {
            return res.status(400).json({ error: "Invalid category" });
        }

        const result = await db.query(query);

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};


// FOR SQUARE - TOTAL ACCOUNTS
export const getTotalAccounts = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT COUNT(*) AS total
            FROM accounts
        `);

        res.json({
            total: parseInt(result.rows[0].total, 10)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch total accounts" });
    }
};


// // FOR SQUARE - UNRETURNED ITEMS
export const getTotalCheckedOutItems = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT COUNT(*)::int AS total
            FROM transactions
            WHERE "status" = $1
        `, ["Pending Return"]);

        res.json({
            total: result.rows[0].total
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch total checked-out items" });
    }
};

// FOR SQUARE - TOTAL BOOKS
export const getTotalBooks = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT COUNT(*) AS total
            FROM books
        `);

        res.json({
            total: parseInt(result.rows[0].total, 10)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch total books" });
    }
};

// // FOR MOST BORROWED ITEMS CHART
export const getTopBorrowedItems = async (req, res) => {
    try {
        const result = await db.query(`
      SELECT
        t.item_id,
        COALESCE(b.title, ap.title) as title,
        CASE 
          WHEN b.item_id IS NOT NULL THEN 'Book'
          WHEN ap.item_id IS NOT NULL THEN 'Academic Paper'
          ELSE 'Unknown'
        END AS category,
        COUNT(*)::int AS total_borrows
      FROM transactions t
      LEFT JOIN books b
        ON t.item_id = b.item_id
      LEFT JOIN academic_papers ap
        ON t.item_id = ap.item_id
      GROUP BY
        t.item_id,
        b.item_id,
        ap.item_id,
        b.title,
        ap.title
      ORDER BY total_borrows DESC
      LIMIT 10
    `);

        res.json(result.rows);

    } catch (err) {
        console.error("Top borrowed items error:", err);
        res.status(500).json({ error: "Failed to fetch top borrowed items" });
    }
};

// FOR SQUARE - TOTAL ACADEMIC PAPERS
export const getTotalAcademicPapers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT COUNT(*)::int AS total
            FROM academic_papers
        `);

        res.json({ total: result.rows[0].total });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch total academic papers" });
    }
};

// // FOR ACTIVITY LINE CHART
export const getActivityStats = async (req, res) => {
    try {
        const { types } = req.query;
        const list = types ? types.split(";") : [];

        let query = `
            SELECT
                activity_time::date AS date,
                activity_type,
                COUNT(*)::int AS total
            FROM activities
            WHERE activity_time >= NOW() - INTERVAL '7 days'
        `;

        const params = [];

        if (list.length > 0) {
            query += ` AND activity_type = ANY($1) `;
            params.push(list);
        }

        query += `
            GROUP BY activity_time::date, activity_type
            ORDER BY date ASC
        `;

        const result = await db.query(query, params);

        // 🔥 build last 7 days
        const days = [];
        const base = {};

        for (let i = 7; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);

            const key =
                d.getFullYear() + "-" +
                String(d.getMonth() + 1).padStart(2, "0") + "-" +
                String(d.getDate()).padStart(2, "0");

            days.push(key);
            base[key] = {};
        }

        const allTypes = ["Used Library", "Borrowed Item", "Returned Item"];

        days.forEach(day => {
            allTypes.forEach(type => {
                base[day][type] = 0;
            });
        });

        // fill DB results
        result.rows.forEach(r => {
            const d = new Date(r.date);

            const key =
                d.getFullYear() + "-" +
                String(d.getMonth() + 1).padStart(2, "0") + "-" +
                String(d.getDate()).padStart(2, "0");

            if (base[key]) {
                base[key][r.activity_type] = r.total;
            }
        });

        const datasets = allTypes.map(type => ({
            label: type,
            data: days.map(day => base[day][type]),
            borderColor:
                type === "Borrowed Item"
                    ? "#3b82f6"
                    : type === "Returned Item"
                        ? "#10b981"
                        : "#f59e0b",
            backgroundColor: "transparent",
            tension: 0.4,
            fill: false,
            pointRadius: 4
        }));

        res.json({
            labels: days,
            datasets
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch activity stats" });
    }
};