const https = require('https');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Add this line
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

// Set a higher payload size limit
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors()); // Add this line

// SQLite Database Connection
const db = new sqlite3.Database('database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Create your table if not exists
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo INTEGER,
        produto TEXT,
        atual INTEGER,
        codigo_de_barras INTEGER,
        codigo_de_barras_sec INTEGER
      )
    `);
  }
});
// API endpoint to save data to the database
app.post('/api/saveData', (req, res) => {
  const items = req.body;

  // Assuming items is an array
  if (!Array.isArray(items)) {
    return res.status(400).send('Invalid data format. Expecting an array of items.');
  }

  // Assuming each item has the same structure as your previous code
  const values = items.map(item => [
    item.codigo,
    item.produto,
    item.atual,
    item.codigo_de_barras,
    item.codigo_de_barras_sec
  ]);

  const placeholders = Array.from({ length: items.length }, () => '(?, ?, ?, ?, ?)').join(', ');

  db.run(
    `INSERT INTO products (codigo, produto, atual, codigo_de_barras, codigo_de_barras_sec) VALUES ${placeholders}`,
    values.flat(),
    (err) => {
      if (err) {
        console.error('Error inserting data:', err);
        res.status(500).send('Error inserting data into the database.');
      } else {
        console.log('Data inserted into the database.');
        res.status(200).send('Data inserted into the database.');
      }
    }
  );
});

app.post('/api/registerInventory', (req, res) => {
  const { codigo, codigo_de_barras, produto, quantidade_contada } = req.body;

  const query = `
      INSERT INTO inventory_compaction (codigo, codigo_de_barras, produto, quantidade_contada)
      VALUES (?, ?, ?, ?)
  `;

  db.run(query, [codigo, codigo_de_barras, produto, quantidade_contada], (err) => {
      if (err) {
          console.error('Error registering inventory:', err);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          res.json({ message: 'Inventory registered successfully' });
      }
  });
});

app.get('/api/inventoryCompaction', (req, res) => {
  const query = 'SELECT * FROM inventory_compaction';

  db.all(query, (err, rows) => {
      if (err) {
          console.error('Error fetching inventory compaction items:', err);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          res.json(rows);
      }
  });
});

app.get('/api/totalQuantityCounted/:codigo', (req, res) => {
  const codigo = req.params.codigo;
  console.log('Received codigo:', codigo); // Log the received codigo

  const query = `
      SELECT SUM(quantidade_contada) as totalQuantityCounted
      FROM inventory_compaction
      WHERE codigo = ?
  `;

  db.get(query, [codigo], (err, row) => {
      if (err) {
          console.error('Error fetching total quantity counted:', err);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          const totalQuantityCounted = row ? row.totalQuantityCounted : 0;
          res.json({ totalQuantityCounted });
      }
  });
});

app.get('/api/searchProduct', (req, res) => {
  const productCode = req.query.code;

  console.log('Searching for product with code:', productCode);

  const query = `
      SELECT * FROM products
      WHERE codigo = ? OR codigo_de_barras = ? OR codigo_de_barras_sec = ?
  `;

  db.get(query, [productCode, productCode, productCode], (err, row) => {
      if (err) {
          console.error('Error searching for product:', err);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          console.log('Product found:', row);
          res.json(row);
      }
  });
});

// Fetch all products
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products';
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(rows);
    }
  });
});

// Fetch all inventory items with the sum of quantities counted for each product code
app.get('/api/inventory', (req, res) => {
  const query = `
    SELECT codigo, codigo_de_barras, produto, SUM(quantidade_contada) as totalQuantityCounted, data_hora
    FROM inventory_compaction
    GROUP BY codigo
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error fetching inventory items:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(rows);
    }
  });
});

// Update inventory quantity for a specific product at a given date and time
app.put('/api/updateInventoryQuantity/:codigo/:data_hora', (req, res) => {
  const codigo = req.params.codigo;
  const data_hora = req.params.data_hora;
  const { quantidade_contada } = req.body;

  const updateQuery = `
      UPDATE inventory_compaction
      SET quantidade_contada = ?
      WHERE codigo = ? AND data_hora = ?;
  `;

  db.run(updateQuery, [quantidade_contada, codigo, data_hora], (err) => {
      if (err) {
          console.error('Error updating inventory quantity:', err);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          console.log('Inventory quantity updated successfully');
          res.json({ message: 'Inventory quantity updated successfully' });
      }
  });
});

// Add this endpoint to delete all data from both tables
app.delete('/api/deleteAllData', (req, res) => {
  // Delete all data from inventory_compaction table
  const deleteInventoryQuery = `
      DELETE FROM inventory_compaction;
  `;

  db.run(deleteInventoryQuery, err => {
      if (err) {
          console.error('Error deleting all data from inventory:', err);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          // Delete all data from products table (assuming there's a 'products' table)
          const deleteProductsQuery = `
              DELETE FROM products;
          `;

          db.run(deleteProductsQuery, err => {
              if (err) {
                  console.error('Error deleting all data from products:', err);
                  res.status(500).json({ error: 'Internal Server Error' });
              } else {
                  res.json({ success: true, message: 'All data deleted successfully' });
              }
          });
      }
  });
});

app.delete('/api/removeInventoryItem/:codigo/:data_hora', (req, res) => {
  const codigo = req.params.codigo;
  const data_hora = req.params.data_hora;

  const deleteQuery = `
      DELETE FROM inventory_compaction
      WHERE codigo = ? AND data_hora = ?;
  `;

  db.run(deleteQuery, [codigo, data_hora], (err) => {
      if (err) {
          console.error('Error removing inventory item:', err);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          console.log('Inventory item removed successfully');
          res.json({ message: 'Inventory item removed successfully' });
      }
  });
});

https.createServer(options, app).listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});