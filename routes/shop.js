const express = require('express');
const router = express.Router();
const { readJson, writeJson } = require('../helpers/fileDb');
const { requireLogin } = require('../helpers/authMiddleware');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');

// Página principal
router.get('/', (req, res) => {
  const products = readJson('products.json');
  res.render('index', {
    user: req.session.user || null,
    products
  });
});

// API productos
router.get('/api/products', (req, res) => {
  const products = readJson('products.json');
  res.json(products);
});

// API usuario actual
router.get('/api/me', (req, res) => {
  res.json({
    loggedIn: !!req.session.user,
    user: req.session.user || null
  });
});

// Historial
router.get('/history', requireLogin, (req, res) => {
  const orders = readJson('orders.json').filter(o => o.userId === req.session.user.id);
  res.render('history', {
    user: req.session.user,
    orders
  });
});

// Checkout
router.post('/api/checkout', requireLogin, (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío.' });
  }

  const products = readJson('products.json');
  const orders = readJson('orders.json');

  const detailedItems = items.map(it => {
    const p = products.find(pr => pr.id === it.productId);
    return {
      productId: p.id,
      nombre: p.nombre,
      precio: p.precio,
      cantidad: it.quantity,
      subtotal: p.precio * it.quantity
    };
  });

  const total = detailedItems.reduce((sum, it) => sum + it.subtotal, 0);
  const orderId = uuidv4();
  const fecha = new Date().toISOString();

  const newOrder = {
    id: orderId,
    userId: req.session.user.id,
    items: detailedItems,
    total,
    fecha
  };

  orders.push(newOrder);
  writeJson('orders.json', orders);

  res.json({ ok: true, orderId, total });
});

// Ticket PDF
router.get('/ticket/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  const orders = readJson('orders.json');
  const order = orders.find(o => o.id === id && o.userId === req.session.user.id);
  if (!order) return res.status(404).send('Ticket no encontrado');

  const doc = new PDFDocument();
  res.setHeader('Content-disposition', `attachment; filename=ticket-${id}.pdf`);
  res.setHeader('Content-type', 'application/pdf');

  doc.pipe(res);
  doc.fontSize(20).text('Tienda Cleto Reyes - Ticket de compra', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Cliente: ${req.session.user.nombre}`);
  doc.text(`Email: ${req.session.user.email}`);
  doc.text(`Fecha: ${new Date(order.fecha).toLocaleString('es-MX')}`);
  doc.moveDown();
  doc.text('Productos:', { underline: true });

  order.items.forEach(it => {
    doc.text(`- ${it.nombre} (x${it.cantidad}) - $${it.precio} MXN c/u - Subtotal: $${it.subtotal} MXN`);
  });

  doc.moveDown();
  doc.fontSize(14).text(`Total: $${order.total} MXN`, { align: 'right' });
  doc.end();
});

module.exports = router;
