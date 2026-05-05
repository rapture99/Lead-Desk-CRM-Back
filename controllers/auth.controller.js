const bcrypt = require('bcryptjs');
const { User } = require('../models');
const {
  publicUser,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/token');

const issueTokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
  user: publicUser(user),
});

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    res.status(201).json(issueTokens(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    const validPassword = user && await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json(issueTokens(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(payload.id);

    if (!user || user.refreshTokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    res.json(issueTokens(user));
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    await req.user.increment('refreshTokenVersion');
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = (req, res) => {
  res.json({ user: publicUser(req.user) });
};
