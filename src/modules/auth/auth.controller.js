const prisma = require('../../infrastructure/database/prismaClient');
const { signupSchema, loginSchema } = require('./auth.validation');
const { hashPassword, comparePassword } = require('./password.service');
const { generateToken, generateRefreshToken } = require('./token.service');
const AppError = require('../../utils/AppError');
const { generateCsrfToken } = require('../../middleware/csrf');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 1 * 60 * 60 * 1000 // 1 hour for access token
};

const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
};

const signup = async (req, res, next) => {
  try {
    const validatedData = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return next(new AppError('Email already in use', {
        code: 'VALIDATION_ERROR',
        statusCode: 400
      }));
    }

    const passwordHash = await hashPassword(validatedData.password);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email: validatedData.email,
          passwordHash,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: 'CUSTOMER'
        }
      });
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return next(new AppError('Email already in use', {
          code: 'VALIDATION_ERROR',
          statusCode: 400
        }));
      }
      throw error;
    }

    const token = generateToken(user.id, user.role);
    const refreshTokenRecord = await generateRefreshToken(user.id);

    res.cookie('token', token, cookieOptions);
    res.cookie('refreshToken', refreshTokenRecord.token, refreshCookieOptions);

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return next(new AppError('Validation failed', {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors
      }));
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user || user.status !== 'ACTIVE') {
      return next(new AppError('Invalid email or password', {
        code: 'UNAUTHORIZED',
        statusCode: 401
      }));
    }

    const isValid = await comparePassword(
      validatedData.password,
      user.passwordHash
    );

    if (!isValid) {
      return next(new AppError('Invalid email or password', {
        code: 'UNAUTHORIZED',
        statusCode: 401
      }));
    }

    const token = generateToken(user.id, user.role);
    const refreshTokenRecord = await generateRefreshToken(user.id);

    res.cookie('token', token, cookieOptions);
    res.cookie('refreshToken', refreshTokenRecord.token, refreshCookieOptions);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return next(new AppError('Validation failed', {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors
      }));
    }
    next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.status(200).json({ success: true, data: null });
};

const me = (req, res) => {
  const { passwordHash, ...userWithoutPassword } = req.user;
  res.status(200).json({ success: true, data: userWithoutPassword });
};

const getCsrfToken = (req, res) => {
  const token = generateCsrfToken();
  
  res.cookie('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.status(200).json({ success: true, data: { csrfToken: token } });
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return next(new AppError('Refresh token missing', { code: 'UNAUTHORIZED', statusCode: 401 }));
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date() || tokenRecord.revokedAt) {
      return next(new AppError('Invalid or expired refresh token', { code: 'UNAUTHORIZED', statusCode: 401 }));
    }

    if (tokenRecord.user.status !== 'ACTIVE') {
      return next(new AppError('User inactive', { code: 'UNAUTHORIZED', statusCode: 401 }));
    }

    const token = generateToken(tokenRecord.userId, tokenRecord.user.role);
    res.cookie('token', token, cookieOptions);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  me,
  getCsrfToken,
  refresh
};
