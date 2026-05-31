import db from "../db.js";

// GET TRANSACTIONS
export const getTransactions = async (req, res) => {
  const { page = 0, limit = 10, filters, searchTerm, startDate, endDate } = req.query;
  const currentPage = parseInt(page, 10) || 0;
  const pageSize = parseInt(limit, 10) || 10;
  const offset = currentPage * pageSize;

  try {
    let whereClauses = [];
    let values = [];
    let paramIndex = 1;

    // 🔹 FILTERS (AND logic between filters)
    if (filters) {
      const parsedFilters = filters.split(";").filter(Boolean);

      parsedFilters.forEach((f) => {
        if (f.includes(":")) {
          const [field, value] = f.split(":");

          if (field === "Status") {
            whereClauses.push(`t.status ILIKE $${paramIndex}`);
            values.push(`%${value}%`);
            paramIndex++;
          } else if (field === "Item_Condition") {
            whereClauses.push(`t.item_condition = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          } else {
            whereClauses.push(`t.${field} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        } else {
          whereClauses.push(`t.status ILIKE $${paramIndex}`);
          values.push(`%${f}%`);
          paramIndex++;
        }
      });
    }

    // 🔹 SEARCH (single OR group)
    if (searchTerm) {
      whereClauses.push(
        `(
      a.student_number::text ILIKE $${paramIndex} OR
      a.name ILIKE $${paramIndex} OR
      a.course ILIKE $${paramIndex} OR
      a.year_and_section ILIKE $${paramIndex} OR
      t.item_id ILIKE $${paramIndex} OR
      b.title ILIKE $${paramIndex} OR
      p.title ILIKE $${paramIndex}
    )`
      );

      values.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // 🔹 DATE FILTERS
    if (startDate) {
      whereClauses.push(`t.borrow_date >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClauses.push(`t.borrow_date <= $${paramIndex}`);
      values.push(`${endDate} 23:59:59`);
      paramIndex++;
    }

    // 🔥 FIX: AND between all filters (NOT OR)
    let where = "";
    if (whereClauses.length > 0) {
      where = "WHERE " + whereClauses.join(" AND ");
    }

    // 🔹 COUNT QUERY
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM transactions t
      LEFT JOIN accounts a ON t.student_number = a.student_number
      LEFT JOIN books b ON t.item_id = b.item_id
      LEFT JOIN academic_papers p ON t.item_id = p.item_id
      ${where}
    `;

    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // 🔹 DATA QUERY
    const dataQuery = `
      SELECT  
        t.*,
        a.name AS account_name,
        a.course,
        a.year_and_section,
        a.student_number,
        b.title AS book_title,
        b.author AS book_author,
        p.title AS paper_title,
        p.author AS paper_author
      FROM transactions t
      LEFT JOIN accounts a ON t.student_number = a.student_number
      LEFT JOIN books b ON t.item_id = b.item_id
      LEFT JOIN academic_papers p ON t.item_id = p.item_id
      ${where}
      ORDER BY t.borrow_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(pageSize, offset);

    const result = await db.query(dataQuery, values);

    res.json({
      rows: result.rows,
      total,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
};

// GET TRANSACTION BY ITEM ID
export const getTransactionByItemId = async (req, res) => {
  const { item_id } = req.params;

  try {
    const result = await db.query(
      `
            SELECT 
                t.student_number,
                a.name,
                a.course,
                a.year_and_section,
                t.borrow_date,
                t.due_date,
                t.status,
                t.item_condition
            FROM transactions t
            LEFT JOIN accounts a
                ON t.student_number = a.student_number
            WHERE t.item_id = $1
            ORDER BY t.borrow_date DESC
            `,
      [item_id]
    );

    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(200).json({
        message: "No transactions for this item."
      });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("Error fetching transaction details:", err);
    res.status(500).json({ error: "Database query failed." });
  }
};

// DOWNLOAD TRANSACTIONS
export const downloadTransactions = async (req, res) => {
  const { filters, searchTerm } = req.query;

  try {
    let whereClauses = [];
    let values = [];
    let paramIndex = 1;

    // =========================
    // FILTERS
    // =========================
    if (filters) {
      const parsedFilters = filters.split(";").filter(Boolean);

      parsedFilters.forEach((f) => {
        if (f.includes(":")) {
          const [field, value] = f.split(":");

          if (field === "Status") {
            whereClauses.push(`t.status ILIKE $${paramIndex}`);
            values.push(`%${value}%`);
          } else if (field === "Item_Condition") {
            whereClauses.push(`t.item_condition = $${paramIndex}`);
            values.push(value);
          } else {
            whereClauses.push(`t.${field} = $${paramIndex}`);
            values.push(value);
          }
          paramIndex++;
        } else {
          whereClauses.push(`t.status ILIKE $${paramIndex}`);
          values.push(`%${f}%`);
          paramIndex++;
        }
      });
    }

    // =========================
    // SEARCH
    // =========================
    if (searchTerm) {
      whereClauses.push(`
        (
          a.student_number::text ILIKE $${paramIndex} OR
          a.name ILIKE $${paramIndex} OR
          a.course ILIKE $${paramIndex} OR
          a.year_and_section ILIKE $${paramIndex} OR
          t.item_id ILIKE $${paramIndex} OR
          b.title ILIKE $${paramIndex} OR
          p.title ILIKE $${paramIndex}
        )
      `);

      values.push(`%${searchTerm}%`);
      paramIndex++;
    }

    const where = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    // =========================
    // EXPORT QUERY (NO PAGINATION)
    // =========================
    const query = `
      SELECT  
        t.student_number,
        a.name AS account_name,
        a.course,
        a.year_and_section,
        t.item_id,
        COALESCE(b.title, p.title) AS item_name,
        t.borrow_date,
        t.due_date,
        t.status,
        t.item_condition
      FROM transactions t
      LEFT JOIN accounts a ON t.student_number = a.student_number
      LEFT JOIN books b ON t.item_id = b.item_id
      LEFT JOIN academic_papers p ON t.item_id = p.item_id
      ${where}
      ORDER BY t.borrow_date DESC
    `;

    const result = await db.query(query, values);

    // =========================
    // NORMALIZE OUTPUT (IMPORTANT)
    // =========================
    const rows = result.rows.map(row => ({
      student_number: row.student_number,
      name: row.account_name,
      course: row.course,
      year_and_section: row.year_and_section,
      item_id: row.item_id,
      item_name: row.item_name,
      borrow_date: row.borrow_date,
      due_date: row.due_date,
      status: row.status,
      item_condition: row.item_condition,
    }));

    res.json({ rows });

  } catch (err) {
    console.error("downloadTransactions error:", err);
    res.status(500).json({ error: "Export failed" });
  }
};