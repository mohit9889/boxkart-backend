const prisma = require('../../infrastructure/database/prismaClient');
const { signupSchema, loginSchema } = require('./auth.validation');
const { hashPassword, comparePassword } = require('./password.service');
const { generateToken } = require('./token.service');
const AppError = require('../../utils/AppError');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: 'CUSTOMER'
      }
    });

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
      return next(new AppError('Invalid credentials or inactive account', {
        code: 'UNAUTHORIZED',
        statusCode: 401
      }));
    }

    const isValid = await comparePassword(
      validatedData.password,
      user.passwordHash
    );

    if (!isValid) {
      return next(new AppError('Invalid credentials', {
        code: 'UNAUTHORIZED',
        statusCode: 401
      }));
    }

    const token = generateToken(user.id, user.role);

    res.cookie('token', token, cookieOptions);

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
  res.status(200).json({ success: true, data: null });
};

const me = (req, res) => {
  const { passwordHash, ...userWithoutPassword } = req.user;
  res.status(200).json({ success: true, data: userWithoutPassword });
};

module.exports = {
  signup,
  login,
  logout,
  me
};
