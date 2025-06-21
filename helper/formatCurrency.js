// helpers/payroll.js
module.exports = {
  calculateOvertime(hours, baseRate) {
    if(hours > 40) {
      return (hours - 40) * baseRate * 1.5;
    }
    return 0;
  },
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
};