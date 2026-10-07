const mysql = require('mysql2/promise');

let pool;

const connectDB = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root123',
      database: process.env.DB_NAME || 'Civica',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const connection = await pool.getConnection();
    console.log(`✅ MySQL Connected: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'Civica'}`);
    connection.release();
    return pool;
  } catch (error) {
    console.error(`❌ MySQL connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
