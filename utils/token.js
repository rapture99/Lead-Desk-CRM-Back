const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-access-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';

const publicUser = (user) => ({
  id: user.id, 
  name: user.name,
  email: user.email,
});

const signAccessToken = (user) =>
  jwt.sign(publicUser(user), JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

const signRefreshToken = (user) =>
  jwt.sign(
    { id: user.id, tokenVersion: user.refreshTokenVersion },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );

const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, JWT_REFRESH_SECRET);

module.exports = {
  publicUser,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
