const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: 'cleto-reyes-secret',
    resave: false,
    saveUninitialized: false
  })
);

app.use('/', shopRoutes);
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor en http://localhost:' + PORT);
});
