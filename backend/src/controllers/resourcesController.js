import db from "../db.js";

// GET RESOURCES
export const getResources = async (req, res) => {
  const { category, page = 1, limit = 10, types, searchTerm } = req.query;
  const offset = (page - 1) * limit;

  try {
    let baseSql = "";
    let params = [];
    let conditions = [];
    let paramIndex = 1;

    // =========================
    // 🔹 BASE QUERY
    // =========================
    if (category === "books") {
      baseSql = `
        SELECT 
          title,
          author,
          type,
          COUNT(*) AS total_copies,
          SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available_copies
        FROM books
      `;
    } else if (category === "academic-papers") {
      baseSql = `
        SELECT *
        FROM academic_papers
      `;
    } else {
      return res.status(400).json({ error: "Invalid category" });
    }

    // =========================
    // 🔹 FILTERS (USED FOR BOTH QUERIES)
    // =========================

    if (searchTerm) {
      if (category === "books") {
        conditions.push(
          `(title ILIKE $${paramIndex}
      OR author ILIKE $${paramIndex}
      OR item_id::text ILIKE $${paramIndex})`
        );

        params.push(`%${searchTerm}%`);
        paramIndex++;
      } else {
        conditions.push(
          `(title ILIKE $${paramIndex} OR author ILIKE $${paramIndex} OR item_id ILIKE $${paramIndex})`
        );
        params.push(`%${searchTerm}%`);
        paramIndex++;
      }
    }

    if (types) {
      const typeArray = Array.isArray(types) ? types : [types];

      if (typeArray.length > 0) {
        const placeholders = typeArray.map(() => `$${paramIndex++}`).join(",");
        conditions.push(`type IN (${placeholders})`);
        params.push(...typeArray);
      }
    }

    // =========================
    // 🔹 APPLY WHERE
    // =========================
    if (conditions.length > 0) {
      baseSql += ` WHERE ` + conditions.join(" AND ");
    }

    // =========================
    // 🔹 GROUP / ORDER / PAGINATION
    // =========================
    let dataSql = baseSql;

    if (category === "books") {
      dataSql += `
        GROUP BY title, author, type
        ORDER BY MIN(item_id) ASC
      `;
    } else {
      dataSql += `
        ORDER BY item_id ASC
      `;
    }

    dataSql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataParams = [...params, Number(limit), Number(offset)];

    const { rows } = await db.query(dataSql, dataParams);

    // =========================
    // 🔹 COUNT QUERY (SAFE + REUSABLE LOGIC)
    // =========================
    let countSql = "";
    let countParams = [];
    let rebuiltConditions = [];
    let tempIndex = 1;

    if (searchTerm) {
      if (category === "books") {
        rebuiltConditions.push(
          `(title ILIKE $${tempIndex} OR author ILIKE $${tempIndex})`
        );
        countParams.push(`%${searchTerm}%`);
        tempIndex++;
      } else {
        rebuiltConditions.push(
          `(title ILIKE $${tempIndex} OR author ILIKE $${tempIndex} OR item_id ILIKE $${tempIndex})`
        );
        countParams.push(`%${searchTerm}%`);
        tempIndex++;
      }
    }

    if (types) {
      const typeArray = Array.isArray(types) ? types : [types];

      if (typeArray.length > 0) {
        const placeholders = typeArray.map(() => `$${tempIndex++}`).join(",");
        rebuiltConditions.push(`type IN (${placeholders})`);
        countParams.push(...typeArray);
      }
    }

    if (category === "books") {
      countSql = `
        SELECT COUNT(*) as count
        FROM (
          SELECT DISTINCT title, author, type
          FROM books
        ) AS distinct_books
      `;
    } else {
      countSql = `SELECT COUNT(*) as count FROM academic_papers`;
    }

    if (rebuiltConditions.length > 0) {
      countSql += ` WHERE ` + rebuiltConditions.join(" AND ");
    }

    const countResult = await db.query(countSql, countParams);

    // =========================
    // 🔹 RESPONSE
    // =========================
    res.json({
      rows,
      total_copies: Number(countResult.rows[0].count),
    });

  } catch (err) {
    console.error("getResources error:", err);
    res.status(500).json({ error: "Database query failed" });
  }
};

// GET BOOK COPIES INFO
export const getBookCopies = async (req, res) => {
  const { title, author } = req.query;

  // Validate input
  if (!title || !author) {
    return res.status(400).json({ error: "Both title and author are required" });
  }

  try {
    const sql = `
      SELECT item_id, status
      FROM books
      WHERE title = $1 AND author = $2
    `;

    const { rows } = await db.query(sql, [title, author]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No copies found for this book" });
    }

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch copies" });
  }
};

//GET DISTINCT TYPES
export const getDistinctTypes = async (req, res) => {
  const { category } = req.query;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  try {
    let sql = "";

    if (category === "books") {
      sql = `SELECT DISTINCT type FROM books WHERE type IS NOT NULL ORDER BY type`;
    } else if (category === "academic-papers") {
      sql = `SELECT DISTINCT type FROM academic_papers WHERE type IS NOT NULL ORDER BY type`;
    } else {
      return res.status(400).json({ error: "Invalid category" });
    }

    const { rows } = await db.query(sql);

    res.json(rows.map(row => row.type));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
};

// ADD RESOURCES
export const addResources = async (req, res) => {
  const { category } = req.body;

  try {
    if (category === "Academic Paper") {
      const {
        item_id,
        title,
        author,
        course,
        academicYear,
        type,
        status,
      } = req.body;

      if (!item_id) return res.status(400).json({ error: "Item ID is required" });
      if (!title) return res.status(400).json({ error: "Title is required" });
      if (!author) return res.status(400).json({ error: "Author is required" });
      if (!academicYear) return res.status(400).json({ error: "Academic Year is required" });
      if (!course) return res.status(400).json({ error: "Course is required" });
      if (!type) return res.status(400).json({ error: "Type is required" });
      if (!status) return res.status(400).json({ error: "Status is required" });

      // 🔹 Check duplicate
      const existing = await db.query(
        `SELECT item_id FROM academic_papers WHERE item_id = $1`,
        [item_id]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "Item ID already exists." });
      }

      // 🔹 Insert
      await db.query(
        `
        INSERT INTO academic_papers 
        (item_id, title, author, academic_year, course, type, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [item_id, title, author, academicYear, course, type, status]
      );

      return res
        .status(201)
        .json({ message: "Academic Paper record added successfully!" });
    }

    if (category === "Book") {
      const { item_id, title, author, type, status } = req.body;

      if (!item_id) return res.status(400).json({ error: "Item ID is required" });
      if (!title) return res.status(400).json({ error: "Title is required" });
      if (!author) return res.status(400).json({ error: "Author is required" });
      if (!type) return res.status(400).json({ error: "Type is required" });
      if (!status) return res.status(400).json({ error: "Status is required" });

      // 🔹 Check duplicate
      const existing = await db.query(
        `SELECT item_id FROM books WHERE item_id = $1`,
        [item_id]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "Item ID already exists." });
      }

      // 🔹 Insert
      await db.query(
        `
        INSERT INTO books 
        (item_id, title, author, type, status)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [item_id, title, author, type, status]
      );

      return res
        .status(201)
        .json({ message: "Book record added successfully!" });
    }

    return res.status(400).json({ error: "Invalid category" });

  } catch (error) {
    console.error("addResources error:", error);
    return res.status(500).json({
      error: "Server error while adding resource",
    });
  }
};

export const updateResource = async (req, res) => {
  const { category } = req.body;

  try {
    if (category === "Book") {
      const { item_id, title, author, type, status } = req.body;

      if (!item_id || !title || !author || !type || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // check exists
      const existing = await db.query(
        `SELECT item_id FROM books WHERE item_id = $1`,
        [item_id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({ error: "Book not found" });
      }

      await db.query(
        `
        UPDATE books
        SET title = $1,
            author = $2,
            type = $3,
            status = $4
        WHERE item_id = $5
        `,
        [title, author, type, status, item_id]
      );

      return res.status(200).json({ message: "Book updated successfully!" });
    }

    if (category === "Academic Paper") {
      const { item_id, title, author, academic_year, course, type, status } = req.body;

      if (!item_id || !title || !author || !academic_year || !course || !type || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existing = await db.query(
        `SELECT item_id FROM academic_papers WHERE item_id = $1`,
        [item_id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({ error: "Academic Paper not found" });
      }

      await db.query(
        `
        UPDATE academic_papers
        SET title = $1,
            author = $2,
            academic_year = $3,
            course = $4,
            type = $5,
            status = $6
        WHERE item_id = $7
        `,
        [title, author, academic_year, course, type, status, item_id]
      );

      return res
        .status(200)
        .json({ message: "Academic Paper updated successfully!" });
    }

    return res.status(400).json({ error: "Invalid category" });

  } catch (err) {
    console.error("Update resource error:", err);
    return res.status(500).json({ error: "Server error while updating resource" });
  }
};

// DELETE RESOURCE 
export const deleteResource = async (req, res) => {
  const { item_id, category } = req.params;

  try {
    // 🔹 Validate category
    let table = "";

    if (category === "books") {
      table = "books";
    } else if (category === "academic-papers") {
      table = "academic_papers";
    } else {
      return res.status(400).json({ error: "Invalid category" });
    }

    // 🔹 Check if resource exists
    const existing = await db.query(
      `SELECT item_id FROM ${table} WHERE item_id = $1`,
      [item_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // 🔹 Delete resource (PostgreSQL safe)
    const result = await db.query(
      `DELETE FROM ${table} WHERE item_id = $1`,
      [item_id]
    );

    return res.status(200).json({
      message: "Resource deleted successfully",
      deleted: result.rowCount,
    });

  } catch (err) {
    console.error("Delete resource error:", err);
    return res.status(500).json({ error: "Database query failed" });
  }
};


// DOWNLOAD RESOURCE 
export const downloadResources = async (req, res) => {
  const { category, types, searchTerm } = req.query;

  try {
    let baseSql = "";
    let params = [];
    let conditions = [];
    let paramIndex = 1;

    // =========================
    // BASE QUERY
    // =========================
    if (category === "books") {
      baseSql = `
        SELECT 
          item_id,
          title,
          author,
          type,
          status
       FROM books
      `;
    } else if (category === "academic-papers") {
      baseSql = `
        SELECT 
          item_id,
          title,
          author,
          type,
          academic_year,
          course,
          status
        FROM academic_papers
      `;
    } else {
      return res.status(400).json({ error: "Invalid category" });
    }

    // =========================
    // FILTERS
    // =========================
    if (searchTerm) {
      conditions.push(
        `(title ILIKE $${paramIndex}
        OR author ILIKE $${paramIndex}
        OR item_id::text ILIKE $${paramIndex})`
      );
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    if (types) {
      const typeArray = Array.isArray(types) ? types : [types];

      if (typeArray.length > 0) {
        const placeholders = typeArray.map(() => `$${paramIndex++}`).join(",");
        conditions.push(`type IN (${placeholders})`);
        params.push(...typeArray);
      }
    }

    // =========================
    // APPLY CONDITIONS
    // =========================
    if (conditions.length > 0) {
      baseSql += ` WHERE ` + conditions.join(" AND ");
    }

    // =========================
    // ORDERING (IMPORTANT FOR EXPORT)
    // =========================
    baseSql += ` ORDER BY item_id ASC`;
const { rows } = await db.query(baseSql, params);

let formattedRows = [];

if (category === "books") {
  formattedRows = rows.map(row => ({
    item_id: row.item_id,
    title: row.title,
    author: row.author,
    type: row.type,
    status: row.status,
  }));
} else {
  formattedRows = rows.map(row => ({
    item_id: row.item_id,
    title: row.title,
    author: row.author,
    type: row.type,
    academic_year: row.academic_year,
    course: row.course,
    status: row.status,
  }));
}

res.json({ rows: formattedRows });

  } catch (err) {
    console.error("exportResources error:", err);
    res.status(500).json({ error: "Database export failed" });
  }
};







