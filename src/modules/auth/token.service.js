const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');

const crypto = require('crypto');
const prisma = require('../../infrastructure/database/prismaClient');

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: '1h'
  });
};

const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Refresh token valid for 7 days

  return await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const generatePasswordResetToken = async (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Valid for 1 hour

  return await prisma.passwordResetToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });
};

const verifyPasswordResetToken = async (token) => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return null;
  }

  return resetToken;
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken
};
