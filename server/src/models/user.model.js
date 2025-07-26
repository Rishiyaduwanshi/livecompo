// This is a placeholder for a database model
// In a real application, you would define a proper schema
// For now, we'll just define a simple in-memory store

class UserModel {
  constructor() {
    this.users = [];
    this.nextId = 1;
  }

  create(userData) {
    const user = {
      id: this.nextId++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  findById(id) {
    return this.users.find(user => user.id === id);
  }

  findByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  update(id, userData) {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return null;
    
    this.users[index] = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date()
    };
    
    return this.users[index];
  }

  delete(id) {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return false;
    
    this.users.splice(index, 1);
    return true;
  }
}

export default new UserModel();