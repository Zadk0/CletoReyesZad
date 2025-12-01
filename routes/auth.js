const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { readJson, writeJson } = require('../helpers/fileDb');

// Formulario login
router.get('/login', (req, res) => {
  res.render('login', {
    user: req.session.user || null,
    error: null
  });
});

// Formulario registro
router.get('/register', (req, res) => {
  res.render('register', {
    user: req.session.user || null,
    error: null
  });
});

// Registro
router.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  const users = readJson('users.json');

  if (users.find(u => u.email === email)) {
    return res.render('register', {
      user: null,
      error: 'Ya existe un usuario con ese correo'
    });
  }

  const hash = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now(),
    nombre,
    email,
    passwordHash: hash
  };

  users.push(newUser);
  writeJson('users.json', users);

  req.session.user = newUser;
  res.redirect('/');
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = readJson('users.json');
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.render('login', {
      user: null,
      error: 'Correo o contraseña incorrectos'
    });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.render('login', {
      user: null,
      error: 'Correo o contraseña incorrectos'
    });
  }

  req.session.user = user;
  res.redirect('/');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
