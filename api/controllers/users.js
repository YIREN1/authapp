const jwt = require('jsonwebtoken');
const path = require('path');
const EmailService = require('../broker/EmailService');
const AuthyService = require('../broker/AuthyService');
const channelService = require('../services/ChannelService');
const UserService = require('../services/UserService');

const User = require('../models/user');

const jwtSecret = process.env.JWT_SECRET;
const EmailSecret = process.env.EMAIL_CONFIRM_SECRET;

const signToken = user => {
  const jwtUser = user;
  jwtUser.password = undefined;
  return jwt.sign(jwtUser.toJSON(), jwtSecret, {
    expiresIn: 604800, // 1 week in seconds
  });
};

const register = async (req, res) => {
  const { name, email, profileName, password, phone } = req.body;

  // Check if there is a user with the same email
  let foundUser = await User.findOne({ email });
  if (foundUser) {
    return res.status(403).json({ error: 'Email is already in use' });
  }

  // Is there a Google account with the same email?
  foundUser = await User.findOne({
    $or: [{ 'google.email': email }, { 'facebook.email': email }],
  });

  if (foundUser) {
    // Let's merge them?
    foundUser.methods.push('local');
    const localSettings = {
      email,
      password,
    };
    foundUser = Object.assign(foundUser, localSettings);
    await foundUser.save();

    return res
      .status(200)
      .json({ success: true, msg: 'Registration complete' });
  }

  const newUser = new User({
    methods: ['local'],
    name,
    email,
    profileName,
    password,
    confirmed: false,
    phone,
  });

  return User.addUser(newUser, async (err, user) => {
    if (err) {
      console.log(err);
      res.json({ success: false, msg: 'Error: failed to register' });
    } else {
      let channel = await this.channelService.getChannelByName('general');

      if (!channel) {
        channel = await this.channelService.createChannel(
          user.id,
          'general',
          'channel',
          [user.id],
        );
        await UserService.setLastVisitedChannel(user.id, channel.id);
      } else {
        const join = channelService.joinChannel(user.id, channel.id);
        const lastVisit = UserService.setLastVisitedChannel(
          user.id,
          channel.id,
        );
        await Promise.all([join, lastVisit]);
      }

      try {
        EmailService.sendConfirmEmail(user);
      } catch (error) {
        console.error(error);
      }
      console.log('Registration complete');
      res.json({ success: true, msg: 'Registration complete' });
    }
  });
};

const authenticate = (req, res) => {
  const { email } = req.body;
  const { password } = req.body;

  User.getUserByEmail(email, (err, user) => {
    if (err) throw err;
    if (!user) {
      return res.json({ success: false, msg: 'Invalid email or password' });
    }

    if (!user.confirmed) {
      try {
        EmailService.sendConfirmEmail(user);
      } catch (error) {
        console.error(error);
      }
      return res.json({
        success: false,
        msg: 'Please confirm your email to login, resending email',
      });
    }

    return User.comparePassword(password, user.password, (error, isMatch) => {
      if (error) throw err;
      const is2FaEnabled = true;
      if (isMatch) {
        if (is2FaEnabled) {
          // todo: user.settings.is2FaEnabled
          return AuthyService.sendApprovalRequest(user).then(authyToken => {
            return res.json({
              success: true,
              authyToken,
            });
          });
        }
        const token = signToken(user);
        return res.json({
          success: true,
          token: `JWT ${token}`,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            profileName: user.profileName,
          },
        });
      }
      return res.json({ success: false, msg: 'Invalid email/password' });
    });
  });
};

const confirmEmail = async (req, res) => {
  try {
    const {
      user: { id },
    } = jwt.verify(req.params.token, EmailSecret);

    return User.getUserById(id, (err, user) => {
      if (err) throw err;
      if (!user) {
        return res.json({ success: false, msg: 'Invalid email or password' });
      }
      const confirmedUser = user;
      confirmedUser.confirmed = true;
      confirmedUser.save();
      return res.send('Thank you for confirming your email');
    });
  } catch (e) {
    console.error(e);

    return res.send('error verifying email token, maybe expired');
  }
};

const googleAuth = (req, res) => {
  const token = `JWT ${signToken(req.user)}`;
  res.status(200).json({ token });
};

const linkGoogle = (req, res) => {
  res.json({
    success: true,
    methods: req.user.methods,
    message: 'Successfully linked account with Google',
  });
};

const unlinkGoogle = async (req, res) => {
  // Delete Google sub-object
  if (req.user.google) {
    req.user.google = undefined;
  }
  // Remove 'google' from methods array
  const googleStrPos = req.user.methods.indexOf('google');
  if (googleStrPos >= 0) {
    req.user.methods.splice(googleStrPos, 1);
  }
  await req.user.save();

  // Return something?
  res.json({
    success: true,
    methods: req.user.methods,
    message: 'Successfully unlinked account from Google',
  });
};

const getProfile = (req, res) => {
  console.log('I managed to get here!');
  res.json({ success: true });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const reqUser = await User.findOne({ email });

  if (!reqUser) {
    return res.status(404).json({ success: false });
  }

  const token = await signToken(reqUser);

  const data = {
    to: email,
    template: 'forgot-password-email',
    subject: 'Password help has arrived!',
    context: {
      url: `${process.env.BASE_URL}/users/reset-password?token=${token}`,
      name: reqUser.name,
    },
  };
  try {
    EmailService.sendEmailWithTemplate(data);
    return res.json({
      message: 'Kindly check your email for further instructions',
      success: true,
    });
  } catch (e) {
    console.log(e, 'email send failed');
    return res.status(500).json({ success: false });
  }
};

const renderResetPasswordTemplate = (req, res) => {
  try {
    const user = jwt.verify(req.query.token, jwtSecret);

    if (user) {
      return res.sendFile(path.resolve('views/reset-password.html'));
    }
    return res.status(400).json({ message: 'invalid token' });
  } catch (error) {
    console.log(error);
    return res.status(401);
  }
};

const resetPassword = (req, res) => {
  const { user } = req;
  const { newPassword } = req.body;
  if (user) {
    user.password = newPassword;
    return User.updatePassword(user, err => {
      if (err) {
        return res.status(422).send({
          message: err,
        });
      }
      const data = {
        to: user.email,
        template: 'reset-password-email',
        subject: 'Password Reset Confirmation',
        context: {
          name: user.name,
        },
      };

      try {
        EmailService.sendEmailWithTemplate(data);
        return res.json({
          message: 'password reset',
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({ success: false });
      }
    });
  }
  return res.status(400).send({
    message: 'Password reset token is invalid or has expired.',
  });
};

module.exports = {
  register,
  authenticate,
  confirmEmail,
  googleAuth,
  getProfile,
  linkGoogle,
  unlinkGoogle,
  forgotPassword,
  resetPassword,
  renderResetPasswordTemplate,
};
