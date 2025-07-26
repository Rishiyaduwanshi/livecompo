import { BadRequestError, UnauthorizedError } from '../utils/appError.js';
import appResponse from '../utils/appResponse.js';
import UserModel from '../models/User.js';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRY
  });

  const refreshToken = jwt.sign({ id: userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRY
  });

  return { accessToken, refreshToken };
};

// Register a new user
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      throw new BadRequestError('Email, password and name are required');
    }
    
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }
    
    // Create user
    const user = await UserModel.create({
      email,
      password,
      name
    });
    
    // Generate tokens
    const tokens = generateTokens(user._id);
    
    // Update user's refresh token
    await UserModel.updateRefreshToken(user._id, tokens.refreshToken);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    
    appResponse(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }
    
    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Generate tokens
    const tokens = generateTokens(user._id);
    
    // Update user's refresh token
    await UserModel.updateRefreshToken(user._id, tokens.refreshToken);
    
    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    
    appResponse(res, {
      message: 'Login successful',
      data: {
        user: userResponse,
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    
    // Find user
    const user = await UserModel.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    
    // Generate new tokens
    const tokens = generateTokens(user._id);
    
    // Update user's refresh token
    await UserModel.updateRefreshToken(user._id, tokens.refreshToken);
    
    appResponse(res, {
      message: 'Token refreshed successfully',
      data: tokens
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid refresh token'));
    } else {
      next(error);
    }
  }
};

// Logout user
export const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Clear user's refresh token
    await UserModel.updateRefreshToken(userId, null);
    
    appResponse(res, {
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};