const express = require('express');
const passport = require('passport');

const router = express.Router();

const UsersController = require('../controllers/users');

const passportJWT = passport.authenticate('jwt', { session: false });
const passportGoogle = passport.authenticate('googleToken', { session: false });
// const sms = require('../broker/SMSService.js');

router.get('/confirmation/:token', UsersController.confirmEmail);

// Resigter
router.post('/register', UsersController.register);

// Authenticate
router.post('/authenticate', UsersController.authenticate);

router.post('/oauth/google', passportGoogle, UsersController.googleAuth);

router.get('/status', passportJWT, UsersController.checkAuth);

router.post(
  '/oauth/link/google',
  passportJWT,
  passport.authorize('googleToken', { session: false }),
  UsersController.linkGoogle,
);

// router.get('/2fa', (req, res, next) => {

// });

// router.post('/2fa:token', (req, res, next) => { });

// Profile
router.get('/profile', passportJWT, UsersController.getProfile);

router.post('/signout', passportJWT, UsersController.signout);

module.exports = router;
