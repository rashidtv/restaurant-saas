import { CONFIG } from '../constants/config';

class CustomerService {
  constructor() {
    this.storageKey = CONFIG.STORAGE_KEYS.CUSTOMER;
    this.pointsKey = CONFIG.STORAGE_KEYS.POINTS;
  }

  // Customer Management
  saveCustomer(customerData) {
    try {
      const customer = {
        ...customerData,
        id: customerData.phone, // Use phone as unique ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(customer));
      return customer;
    } catch (error) {
      console.error('Error saving customer:', error);
      throw new Error('Failed to save customer data');
    }
  }

  getCustomer() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading customer:', error);
      this.clearCustomer();
      return null;
    }
  }

  updateCustomer(updates) {
    try {
      const current = this.getCustomer();
      if (!current) return null;

      const updated = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer data');
    }
  }

  clearCustomer() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.pointsKey);
  }

  // Points Management
  savePoints(points) {
    try {
      localStorage.setItem(this.pointsKey, points.toString());
      return points;
    } catch (error) {
      console.error('Error saving points:', error);
      throw new Error('Failed to save points');
    }
  }

  getPoints() {
    try {
      const points = localStorage.getItem(this.pointsKey);
      return points ? parseInt(points) : 0;
    } catch (error) {
      console.error('Error loading points:', error);
      return 0;
    }
  }

  addPoints(pointsToAdd) {
    try {
      const currentPoints = this.getPoints();
      const newPoints = currentPoints + pointsToAdd;
      this.savePoints(newPoints);
      return newPoints;
    } catch (error) {
      console.error('Error adding points:', error);
      throw new Error('Failed to add points');
    }
  }
}

export const customerService = new CustomerService();