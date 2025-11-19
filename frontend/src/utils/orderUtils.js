import { CONFIG } from '../constants/config';

export class OrderUtils {
  static getValidStatuses() {
    return CONFIG.ORDER_STATUS ? Object.values(CONFIG.ORDER_STATUS) : ['pending', 'preparing', 'ready', 'completed'];
  }

  static isValidStatus(status) {
    return this.getValidStatuses().includes(status);
  }

  static normalizeTableNumber(tableNumber) {
    if (!tableNumber) return '';
    return tableNumber.toString().toUpperCase().replace(/^T/, 'T');
  }

  static isTableMatch(orderTable, targetTable) {
    const normalizedOrderTable = this.normalizeTableNumber(orderTable);
    const normalizedTargetTable = this.normalizeTableNumber(targetTable);
    return normalizedOrderTable === normalizedTargetTable;
  }

  static sortOrdersByDate(orders, descending = true) {
    return orders.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.timestamp || 0);
      const dateB = new Date(b.createdAt || b.timestamp || 0);
      return descending ? dateB - dateA : dateA - dateB;
    });
  }
}