import { NotFoundError, BadRequestError } from '../utils/appError.js';
import appResponse from '../utils/appResponse.js';
import UserModel from '../models/user.model.js';

// Get user profile
export const getProfile = (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = UserModel.findById(parseInt(userId));
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    appResponse(res, {
      message: 'User profile retrieved successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;
    
    if (!name && !email) {
      throw new BadRequestError('Nothing to update');
    }
    
    const user = UserModel.findById(parseInt(userId));
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    const updatedUser = UserModel.update(parseInt(userId), { name, email });
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    appResponse(res, {
      message: 'User profile updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// Delete user profile
export const deleteProfile = (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = UserModel.findById(parseInt(userId));
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    const deleted = UserModel.delete(parseInt(userId));
    if (!deleted) {
      throw new BadRequestError('Failed to delete user');
    }
    
    appResponse(res, {
      message: 'User profile deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};