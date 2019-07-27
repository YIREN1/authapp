const express = require('express');
const path = require('path');
const cors = require('cors');
const passport = require('passport');

require('dotenv').config();
require('./services/mongoService.js');
// require('./broker/SMSService.js');

const app = express();

const users = require('./routes/users');
const reCaptcha = require('./routes/reCaptcha');
const email = require('./routes/email');
const uploads = require('./routes/uploads');

// Port Number
const port = process.env.PORT || 8080;

// CORS Middleware
app.use(cors());

// Set static files
app.use(express.static(path.join(__dirname, 'public')));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());
require('./passport')(passport);

// bodyParser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/users', users);
app.use('/reCaptcha', reCaptcha);
app.use('/email', email);
app.use('/uploads', uploads);

// // Index Route
// app.get('/', (req, res) => {
//   res.send('Invalid Endpoint');
// });

app.get('*', (req, res) => {
  res.sendFile(__dirname, 'public/index.html');
});

// Start Server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});