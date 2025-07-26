import { BadRequestError, UnauthorizedError } from '../utils/appError.js';
import appResponse from '../utils/appResponse.js';
import UserModel from '../models/user.model.js';

// Register a new user
export const register = (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      throw new BadRequestError('Email, password and name are required');
    }
    
    // Check if user already exists
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }
    
    // Create user
    const user = UserModel.create({
      email,
      password,
      name
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    appResponse(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }
    
    // Find user
    const user = UserModel.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Check password (in a real app, you would compare hashed passwords)
    if (user.password !== password) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Generate tokens (placeholder for now)
    const accessToken = 'dummy_access_token';
    const refreshToken = 'dummy_refresh_token';
    
    appResponse(res, {
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }
    
    // In a real app, you would verify the refresh token
    // and generate a new access token
    
    const newAccessToken = 'new_dummy_access_token';
    
    appResponse(res, {
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
export const logout = (req, res, next) => {
  try {
    // In a real app, you would invalidate the token
    
    appResponse(res, {
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};