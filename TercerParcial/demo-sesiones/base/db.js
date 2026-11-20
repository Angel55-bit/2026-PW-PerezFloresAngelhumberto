// Conexión a MySQL. Lee los datos de tu archivo .env.
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

function crearPool(nombreBD = process.env.DB_NAME || 'demo_sesiones') {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'pelon_2812',
    database: 'demo_sesiones',
    charset: 'utf8mb4',
    connectionLimit: 5,
  });
}

module.exports = { crearPool };
