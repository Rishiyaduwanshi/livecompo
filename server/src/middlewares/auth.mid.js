import { UnauthorizedError } from '../utils/appError.js';
import { config } from '../../config/index.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is missing');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('Authentication token is invalid');
    }
    
    req.user = {
      id: '1',
      email: 'test@example.com',
      role: 'user'
    };
    
    next();
  } catch (error) {
    next(error);
  }
};