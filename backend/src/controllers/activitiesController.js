import db from "../db.js";

export const getAccountDetails = async (req, res) => {
    const { student_number } = req.params;

    try {
        const result = await db.query(
            `
      SELECT 
        name,
        course,
        year_and_section
      FROM accounts
      WHERE student_number = $1
      `,
            [student_number]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Account not found",
            });
        }

        const student = result.rows[0];

        res.json({
            name: student.name,
            year_section: `${student.course} - ${student.year_and_section}`,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Database query failed",
        });
    }
};

export const getItemDetails = async (req, res) => {
    const { item_id } = req.params;

    try {
        // 🔹 1. CHECK BOOKS
        const bookResult = await db.query(
            `
      SELECT 
        item_id,
        title,
        author,
        type,
        'Book' AS category
      FROM books
      WHERE item_id = $1
      `,
            [item_id]
        );

        if (bookResult.rows.length > 0) {
            return res.json(bookResult.rows[0]);
        }

        // 🔹 2. CHECK ACADEMIC PAPERS
        const paperResult = await db.query(
            `
      SELECT 
        item_id,
        title,
        author,
        academic_year,
        course,
        type,
        'Academic Paper' AS category
      FROM academic_papers
      WHERE item_id = $1
      `,
            [item_id]
        );

        if (paperResult.rows.length > 0) {
            return res.json(paperResult.rows[0]);
        }

        return res.status(404).json({ error: "Item not found" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

export const addActivity = async (req, res) => {
    const {
        student_number,
        activity_type,
        item_id,
        category,
        item_condition,
        return_status,
    } = req.body;

    console.log("asdasd ", req.body)

    const conn = await db.connect();

    try {
        await conn.query("BEGIN");

        // 🔹 1. Insert activity
        const actResult = await conn.query(
            `INSERT INTO activities (activity_type, student_number, activity_time)
       VALUES ($1, $2, NOW())
       RETURNING act_id`,
            [activity_type, student_number]
        );

        const activityId = actResult.rows[0].act_id;

        // 🔹 BORROW
        if (activity_type === "Borrowed Item") {
            if (!item_id) {
                throw new Error("Item ID is required");
            }

            if (!category) {
                throw new Error("Item category is required");
            }

            let itemRows;

            if (category === "Book") {
                itemRows = await conn.query(
                    `SELECT * FROM books WHERE item_id = $1`,
                    [item_id]
                );
            } else if (category === "Academic Paper") {
                itemRows = await conn.query(
                    `SELECT * FROM academic_papers WHERE item_id = $1`,
                    [item_id]
                );
            } else {
                throw new Error("Invalid item category");
            }

            if (itemRows.rows.length === 0) {
                throw new Error(`${category} not found`);
            }

            const item = itemRows.rows[0];

            if (item.status === "Checked Out")
                throw new Error(`${category} currently is borrowed`);
            if (item.status === "Archived")
                throw new Error(`${category} currently is archived`);
            if (item.status === "Disposed")
                throw new Error(`${category} is Disposed`);

            const randomDays = Math.floor(Math.random() * 6) + 2;

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + randomDays);
            dueDate.setHours(0, 0, 0, 0);

            await conn.query(
                `INSERT INTO transactions
          (item_id, student_number, borrow_date, due_date, status, item_condition, act_id)
         VALUES
          ($1, $2, NOW(), $3, 'Pending Return', 'N/A', $4)`,
                [item_id, student_number, dueDate, activityId]
            );

            if (category === "Book") {
                await conn.query(
                    `UPDATE books SET status = 'Checked Out' WHERE item_id = $1`,
                    [item_id]
                );
            } else {
                await conn.query(
                    `UPDATE academic_papers SET status = 'Checked Out' WHERE item_id = $1`,
                    [item_id]
                );
            }
        }

        // 🔹 RETURN
        else if (activity_type === "Returned Item") {
            if (!item_id || !category) {
                throw new Error("Item ID and category are required for return");
            }

            const transactionRows = await conn.query(
                `SELECT * FROM transactions 
         WHERE item_id = $1 AND status = 'Pending Return'`,
                [item_id]
            );

            if (transactionRows.rows.length === 0) {
                throw new Error("No pending transaction found for this item!");
            }

            await conn.query(
                `UPDATE transactions
         SET return_date = NOW(),
             status = $1,
             item_condition = $2,
             return_act_id = $3
         WHERE item_id = $4
           AND status = 'Pending Return'`,
                [return_status, item_condition, activityId, item_id]
            );

            if (category === "Book") {
                await conn.query(
                    `UPDATE books SET status = 'Available' WHERE item_id = $1`,
                    [item_id]
                );
            } else {
                await conn.query(
                    `UPDATE academic_papers SET status = 'Available' WHERE item_id = $1`,
                    [item_id]
                );
            }
        }

        // 🔹 LOG ONLY
        else if (activity_type === "Used Library") {
            // nothing extra
        }

        await conn.query("COMMIT");

        res.json({
            message: `${activity_type} recorded successfully`,
            act_id: activityId,
        });

    } catch (err) {
        await conn.query("ROLLBACK");
        console.error(err);
        res.status(400).json({ error: err.message || "Activity failed" });
    } finally {
        conn.release();
    }
};

// GET ACTIVITIES
export const getActivities = async (req, res) => {
    const { page = 0, limit = 10, searchTerm, filters, startDate, endDate } = req.query;

    const currentPage = parseInt(page, 10) || 0;
    const pageSize = parseInt(limit, 10) || 10;
    const offset = currentPage * pageSize;

    try {
        let whereClauses = [];
        let values = [];
        let paramIndex = 1;

        // 🔹 SEARCH
        if (searchTerm) {
            whereClauses.push(`
                (
                    a.name ILIKE $${paramIndex}
                    OR a.student_number::TEXT ILIKE $${paramIndex}

                    OR b.item_id::TEXT ILIKE $${paramIndex}
                    OR p.item_id::TEXT ILIKE $${paramIndex}

                    OR b.title ILIKE $${paramIndex}
                    OR p.title ILIKE $${paramIndex}
                )
            `);

            values.push(`%${searchTerm}%`);
            paramIndex += 1;
        }

        if (startDate) {
            whereClauses.push(`act.activity_time >= $${paramIndex++}`);
            values.push(startDate);
        }

        if (endDate) {
            whereClauses.push(`act.activity_time <= $${paramIndex++}`);
            values.push(`${endDate} 23:59:59`);
        }

        // 🔹 FILTERS
        if (filters) {
            const filterArr = filters.split(";").filter(Boolean);

            if (filterArr.length > 0) {
                const placeholders = filterArr
                    .map(() => `$${paramIndex++}`)
                    .join(",");

                whereClauses.push(`act.activity_type IN (${placeholders})`);
                values.push(...filterArr);
            }
        }

        // 🔹 WHERE BUILD
        let where = "WHERE 1=1";

        if (whereClauses.length > 0) {
            where += ` AND (${whereClauses.join(" AND ")})`;
        }

        // 🔹 COUNT QUERY
        const countQuery = `
                SELECT COUNT(*) AS total

                FROM activities act

                LEFT JOIN accounts a
                    ON act.student_number = a.student_number

                LEFT JOIN transactions t
                    ON (
                    (act.activity_type = 'Borrowed Item' AND t.act_id = act.act_id)
                    OR
                    (act.activity_type = 'Returned Item' AND t.return_act_id = act.act_id)
                    )

                LEFT JOIN books b
                    ON t.item_id = b.item_id

                LEFT JOIN academic_papers p
                    ON t.item_id = p.item_id

                ${where}
                `;

        const countResult = await db.query(countQuery, values);
        const total = parseInt(countResult.rows[0].total, 10);

        // 🔹 MAIN QUERY
        const dataQuery = `
      SELECT 
        act.act_id,
        act.activity_type,
        act.activity_time,

        a.course,
        a.email,
        a.name,
        a.student_number,
        a.year_and_section,

        t.item_id,
        t.item_condition,

        COALESCE(b.title, p.title) AS item_name

      FROM activities act

      LEFT JOIN accounts a
        ON act.student_number = a.student_number

      LEFT JOIN transactions t
        ON (
          (act.activity_type = 'Borrowed Item' AND t.act_id = act.act_id)
          OR
          (act.activity_type = 'Returned Item' AND t.return_act_id = act.act_id)
        )

      LEFT JOIN books b
        ON t.item_id = b.item_id

      LEFT JOIN academic_papers p
        ON t.item_id = p.item_id

      ${where}

      ORDER BY act.activity_time DESC
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

// GET ITEM STATUS FOR RETURNING
export const getBorrowedItemDetails = async (req, res) => {
    const { item_id } = req.params;

    try {
        let item;

        // =========================
        // 1. GET ITEM DETAILS
        // =========================

        const bookRows = await db.query(
            `SELECT item_id, title, author, type, 'Book' AS category
             FROM books
             WHERE item_id = $1`,
            [item_id]
        );

        if (bookRows.rows.length > 0) {
            item = bookRows.rows[0];
        } else {
            const paperRows = await db.query(
                `SELECT item_id, title, author, academic_year, course, type,
                        'Academic Paper' AS category
                 FROM academic_papers
                 WHERE item_id = $1`,
                [item_id]
            );

            if (paperRows.rows.length > 0) {
                item = paperRows.rows[0];
            }
        }

        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }

        // =========================
        // 2. GET LATEST TRANSACTION
        // =========================

        const transRows = await db.query(
            `SELECT borrow_date, due_date, return_date, status
             FROM transactions
             WHERE item_id = $1
             ORDER BY transaction_id DESC
             LIMIT 1`,
            [item_id]
        );

        const tx = transRows.rows.length > 0 ? transRows.rows[0] : null;

        item.transaction = tx;

        // =========================
        // 3. COMPUTE RETURN STATUS
        // =========================

        let return_status;

        if (tx) {
            if (tx.status !== "Pending Return") {
                return res.status(400).json({
                    error: "No pending transaction for this item."
                });
            }

            const dueDate = new Date(tx.due_date);
            const returnDate = new Date();

            dueDate.setHours(0, 0, 0, 0);
            returnDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor(
                (returnDate - dueDate) / (1000 * 60 * 60 * 24)
            );

            if (diffDays < 0) {
                const d = Math.abs(diffDays);
                return_status = `Returned Early (${d} day${d === 1 ? "" : "s"} early)`;
            } else if (diffDays === 0) {
                return_status = "Returned On Time";
            } else {
                return_status = `Returned Late (${diffDays} day${diffDays === 1 ? "" : "s"} late)`;
            }
        }

        item.return_status = return_status;

        // =========================
        // 4. RESPONSE
        // =========================

        return res.json(item);

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Database error"
        });
    }
};

// DELETE ACTIVITY
export const deleteActivity = async (req, res) => {
    const { act_id } = req.params;

    const client = await db.connect();

    async function recomputeItemStatus(client, item_id) {
        const result = await client.query(
            `SELECT COUNT(*)::int AS active_borrows
             FROM transactions
             WHERE item_id = $1
             AND status = 'Pending Return'`,
            [item_id]
        );

        const status =
            result.rows[0].active_borrows > 0
                ? "Checked Out"
                : "Available";

        await client.query(
            `UPDATE books
             SET status = $1
             WHERE item_id = $2`,
            [status, item_id]
        );

        await client.query(
            `UPDATE academic_papers
             SET status = $1
             WHERE item_id = $2`,
            [status, item_id]
        );
    }

    try {
        await client.query("BEGIN");

        // =========================
        // 1. GET ACTIVITY
        // =========================
        const activityRes = await client.query(
            `SELECT * FROM activities WHERE act_id = $1`,
            [act_id]
        );

        if (activityRes.rows.length === 0) {
            throw new Error("Activity not found");
        }

        const activity = activityRes.rows[0];
        const activity_type = activity.activity_type;

        // =========================
        // USED LIBRARY
        // =========================
        if (activity_type === "Used Library") {

            await client.query(
                `DELETE FROM activities WHERE act_id = $1`,
                [act_id]
            );
        }

        // =========================
        // BORROWED ITEM
        // =========================
        else if (activity_type === "Borrowed Item") {

            const txRes = await client.query(
                `SELECT * FROM transactions WHERE act_id = $1`,
                [act_id]
            );

            if (txRes.rows.length === 0) {
                throw new Error("Transaction not found");
            }

            const tx = txRes.rows[0];
            const item_id = tx.item_id;
            const returnActId = tx.return_act_id;

            // 1. delete return activity FIRST (fix for orphan issue)
            if (returnActId) {
                await client.query(
                    `DELETE FROM activities WHERE act_id = $1`,
                    [returnActId]
                );
            }

            // 2. delete return transaction (if it exists)
            await client.query(
                `DELETE FROM transactions WHERE return_act_id = $1`,
                [act_id]
            );

            // 3. delete borrow transaction
            await client.query(
                `DELETE FROM transactions WHERE act_id = $1`,
                [act_id]
            );

            // 4. delete borrow activity
            await client.query(
                `DELETE FROM activities WHERE act_id = $1`,
                [act_id]
            );

            await recomputeItemStatus(client, item_id);
        }

        // =========================
        // RETURNED ITEM
        // =========================
        else if (activity_type === "Returned Item") {

            const txRes = await client.query(
                `SELECT * FROM transactions WHERE return_act_id = $1`,
                [act_id]
            );

            if (txRes.rows.length === 0) {
                throw new Error("Transaction not found");
            }

            const tx = txRes.rows[0];
            const item_id = tx.item_id;

            // 1. revert transaction state
            await client.query(
                `UPDATE transactions
                 SET status = 'Pending Return',
                     return_date = NULL,
                     return_act_id = NULL,
                     item_condition = 'N/A'
                 WHERE return_act_id = $1`,
                [act_id]
            );

            // 2. delete return activity
            await client.query(
                `DELETE FROM activities WHERE act_id = $1`,
                [act_id]
            );

            await recomputeItemStatus(client, item_id);
        }

        // =========================
        // COMMIT
        // =========================
        await client.query("COMMIT");
        res.json({ message: "Activity deleted successfully" });

    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};


export const editActivity = async (req, res) => {
    const { act_id } = req.params;
    const {
        activity_type: newType,
        item_id,
        item_category,
        item_condition
    } = req.body;

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // =========================
        // 1. FETCH ORIGINAL
        // =========================
        const actRes = await client.query(
            `SELECT * FROM activities WHERE act_id = $1`,
            [act_id]
        );

        if (actRes.rows.length === 0) throw new Error("Activity not found");

        const original = actRes.rows[0];
        const originalType = original.activity_type;
        const student = original.student_number;

        // =========================
        // HELPERS
        // =========================
        const getItem = async (id, category) => {
            if (category === "Book") {
                return await client.query(`SELECT * FROM books WHERE item_id = $1`, [id]);
            } else {
                return await client.query(`SELECT * FROM academic_papers WHERE item_id = $1`, [id]);
            }
        };

        const setItemStatus = async (id, category, status) => {
            if (category === "Book") {
                await client.query(`UPDATE books SET status = $1 WHERE item_id = $2`, [status, id]);
            } else {
                await client.query(`UPDATE academic_papers SET status = $1 WHERE item_id = $2`, [status, id]);
            }
        };

        // =========================
        // 2. ORIGINAL TXN
        // =========================
        let originalTxn = null;

        if (originalType === "Borrowed Item") {
            const res = await client.query(
                `SELECT * FROM transactions WHERE act_id = $1 FOR UPDATE`,
                [act_id]
            );
            if (res.rows.length === 0) throw new Error("Borrow transaction missing");
            originalTxn = res.rows[0];
        }

        if (originalType === "Returned Item") {
            const res = await client.query(
                `SELECT * FROM transactions WHERE return_act_id = $1 FOR UPDATE`,
                [act_id]
            );
            if (res.rows.length === 0) throw new Error("Return transaction missing");
            originalTxn = res.rows[0];
        }

        // =========================
        // 3. SAME TYPE EDITS
        // =========================
        if (newType === originalType) {

            if (newType === "Borrowed Item") {

                if (originalTxn.status === "Returned") {
                    throw new Error("Cannot edit completed borrow");
                }

                if (item_id && item_id !== originalTxn.item_id) {

                    await setItemStatus(originalTxn.item_id, item_category, "Available");

                    const newItem = await getItem(item_id, item_category);

                    if (newItem.rows.length === 0) throw new Error("New item not found");
                    if (newItem.rows[0].status === "Checked Out") {
                        throw new Error("New item already borrowed");
                    }

                    await client.query(
                        `UPDATE transactions SET item_id = $1 WHERE act_id = $2`,
                        [item_id, act_id]
                    );

                    await setItemStatus(item_id, item_category, "Checked Out");
                }
            }

            else if (newType === "Returned Item") {

                if (!item_id || !item_category) {
                    throw new Error("Item required for return edit");
                }

                if (item_id === originalTxn.item_id) {
                    if (item_condition) {
                        await client.query(
                            `UPDATE transactions SET item_condition = $1 WHERE return_act_id = $2`,
                            [item_condition, act_id]
                        );
                    }
                } else {

                    await client.query(
                        `UPDATE transactions
                         SET return_date = NULL,
                             status = 'Pending Return',
                             item_condition = 'N/A',
                             return_act_id = NULL
                         WHERE return_act_id = $1`,
                        [act_id]
                    );

                    await setItemStatus(originalTxn.item_id, item_category, "Checked Out");

                    const newTxnRes = await client.query(
                        `SELECT * FROM transactions
                         WHERE item_id = $1
                         AND student_number = $2
                         AND status = 'Pending Return'
                         FOR UPDATE`,
                        [item_id, student]
                    );

                    if (newTxnRes.rows.length === 0) {
                        throw new Error("Target item has no pending borrow");
                    }

                    const newTxn = newTxnRes.rows[0];

                    await client.query(
                        `UPDATE transactions
                         SET return_date = NOW(),
                             status = 'Returned',
                             item_condition = $1,
                             return_act_id = $2
                         WHERE transaction_id = $3`,
                        [item_condition || "N/A", act_id, newTxn.transaction_id]
                    );

                    await setItemStatus(item_id, item_category, "Available");
                }
            }
        }

        // =========================
        // 4. TYPE TRANSITIONS
        // =========================
        else {

            // BORROW → USED
            if (originalType === "Borrowed Item" && newType === "Used Library") {

                if (originalTxn.status === "Returned") {
                    throw new Error("Cannot undo completed borrow");
                }

                await setItemStatus(originalTxn.item_id, item_category, "Available");

                await client.query(
                    `DELETE FROM transactions WHERE act_id = $1`,
                    [act_id]
                );
            }

            // BORROW → RETURN
            else if (originalType === "Borrowed Item" && newType === "Returned Item") {

                if (originalTxn.status === "Returned") {
                    throw new Error("Already returned");
                }

                await client.query(
                    `UPDATE transactions
                     SET return_date = NOW(),
                         status = 'Returned',
                         item_condition = $1,
                         return_act_id = $2
                     WHERE act_id = $3`,
                    [item_condition || "N/A", act_id, act_id]
                );

                await setItemStatus(originalTxn.item_id, item_category, "Available");
            }

            // USED → BORROW
            else if (originalType === "Used Library" && newType === "Borrowed Item") {

                const item = await getItem(item_id, item_category);

                if (item.rows.length === 0) throw new Error("Item not found");
                if (item.rows[0].status === "Checked Out") {
                    throw new Error("Item already borrowed");
                }

                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 3);

                await client.query(
                    `INSERT INTO transactions
                     (item_id, student_number, borrow_date, due_date, status, item_condition, act_id)
                     VALUES ($1, $2, NOW(), $3, 'Pending Return', 'N/A', $4)`,
                    [item_id, student, dueDate, act_id]
                );

                await setItemStatus(item_id, item_category, "Checked Out");
            }

            // USED → RETURN
            else if (originalType === "Used Library" && newType === "Returned Item") {

                const txnRes = await client.query(
                    `SELECT * FROM transactions
                     WHERE item_id = $1
                     AND student_number = $2
                     AND status = 'Pending Return'
                     FOR UPDATE`,
                    [item_id, student]
                );

                if (txnRes.rows.length === 0) {
                    throw new Error("Item currently is NOT checked out!");
                }

                await client.query(
                    `UPDATE transactions
                     SET return_date = NOW(),
                         status = 'Returned',
                         item_condition = $1,
                         return_act_id = $2
                     WHERE transaction_id = $3`,
                    [item_condition || "N/A", act_id, txnRes.rows[0].transaction_id]
                );

                await setItemStatus(item_id, item_category, "Available");
            }

            // RETURN → USED
            else if (originalType === "Returned Item" && newType === "Used Library") {

                await client.query(
                    `UPDATE transactions
                     SET return_date = NULL,
                         status = 'Pending Return',
                         item_condition = 'N/A',
                         return_act_id = NULL
                     WHERE return_act_id = $1`,
                    [act_id]
                );

                await setItemStatus(originalTxn.item_id, item_category, "Checked Out");
            }

            // RETURN → BORROW
            else if (originalType === "Returned Item" && newType === "Borrowed Item") {

                const item = await getItem(originalTxn.item_id, item_category);

                if (item.rows[0].status === "Checked Out") {
                    throw new Error("Cannot revert, item already borrowed again");
                }

                await client.query(
                    `UPDATE transactions
                     SET return_date = NULL,
                         status = 'Pending Return',
                         item_condition = 'N/A',
                         return_act_id = NULL
                     WHERE return_act_id = $1`,
                    [act_id]
                );

                await setItemStatus(originalTxn.item_id, item_category, "Checked Out");
            }

            else {
                throw new Error("Invalid transition");
            }
        }

        // =========================
        // 5. UPDATE ACTIVITY
        // =========================
        await client.query(
            `UPDATE activities SET activity_type = $1 WHERE act_id = $2`,
            [newType, act_id]
        );

        await client.query("COMMIT");

        res.json({ message: "Activity updated successfully" });

    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};


// DOWNLOAD ACTIVITIES 
export const downloadActivities = async (req, res) => {
    const { filters, searchTerm } = req.query;

    try {
        let whereClauses = [];
        let values = [];
        let paramIndex = 1;

        // FILTERS (same logic as getActivities)
        if (filters) {
            const parsed = filters.split(";").filter(Boolean);

            if (parsed.length > 0) {
                whereClauses.push(
                    `activity_type = ANY($${paramIndex})`
                );
                values.push(parsed);
                paramIndex++;
            }
        }

        // SEARCH
        if (searchTerm) {
            whereClauses.push(
                `(student_number::text ILIKE $${paramIndex} OR activity_type ILIKE $${paramIndex})`
            );
            values.push(`%${searchTerm}%`);
            paramIndex++;
        }

        let where = "WHERE 1=1";
        if (whereClauses.length > 0) {
            where += ` AND (${whereClauses.join(" AND ")})`;
        }

        const result = await db.query(
            `
            SELECT 
                a.act_id,
                a.student_number,
                acc.name,
                acc.course,
                acc.year_and_section,
                a.activity_type,
                a.activity_time
            FROM activities a
            LEFT JOIN accounts acc
                ON a.student_number = acc.student_number
            ${where}
            ORDER BY a.activity_time DESC
            `,
            values
        );

        res.json({ rows: result.rows });

    } catch (err) {
        console.error("Download activities error:", err);
        res.status(500).json({ error: "Database query failed" });
    }
};