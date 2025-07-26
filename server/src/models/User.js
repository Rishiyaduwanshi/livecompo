import User from './schemas/user.schema.js';

class UserModel {
  static async create(userData) {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      return await User.findById(id).select('-password');
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      return await User.findOne({ email });
    } catch (error) {
      throw error;
    }
  }

  static async update(id, userData) {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { $set: userData },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const user = await User.findByIdAndDelete(id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async updateRefreshToken(id, refreshToken) {
    try {
      await User.findByIdAndUpdate(id, { refreshToken });
    } catch (error) {
      throw error;
    }
  }
}

export default UserModel;