const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nmm_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // Required to run schema.sql
});

pool.getConnection()
  .then(conn => {
    console.log('Connected to the MySQL database.');
    initializeDatabase(conn);
  })
  .catch(err => {
    console.error('Error connecting to MySQL database:', err.message);
  });

async function initializeDatabase(conn) {
  const schemaPath = path.join(__dirname, '../../../database/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    try {
      await conn.query(schemaSql);
      console.log('Database tables initialized successfully.');
      await seedDefaultUsers(conn);
    } catch (err) {
      console.error('Error executing schema.sql:', err.message);
    } finally {
      conn.release();
    }
  } else {
    console.error('schema.sql not found at:', schemaPath);
    conn.release();
  }
}

async function seedDefaultUsers(conn) {
  try {
    const [rows] = await conn.query("SELECT count(*) as count FROM users");
    if (rows[0].count === 0) {
      const defaultUsers = [
        ['admin', 'admin123', 'ADMIN', 'System Administrator'],
        ['manager', 'manager123', 'MANAGER', 'Data Manager'],
        ['reviewer', 'reviewer123', 'REVIEWER', 'Match Reviewer'],
        ['approver', 'approver123', 'APPROVER', 'Senior Approver'],
        ['viewer', 'viewer123', 'VIEWER', 'Guest Viewer']
      ];
      for (const u of defaultUsers) {
        await conn.execute("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)", u);
      }
      console.log('Seeded default users for demo.');
    }
  } catch (err) {
    console.error('Error seeding users:', err.message);
  }
}

const query = {
  all: async (sql, params = []) => {
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  get: async (sql, params = []) => {
    const [rows] = await pool.query(sql, params);
    return rows[0];
  },
  run: async (sql, params = []) => {
    const [result] = await pool.execute(sql, params);
    return { id: result.insertId, changes: result.affectedRows };
  },
  exec: async (sql) => {
    await pool.query(sql);
  }
};

module.exports = query;
