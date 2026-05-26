// Format currency in Nepali Rupees
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'रु 0';
  return `रु ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Format date
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  const defaultOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

// Category colors
export const CATEGORY_COLORS = {
  Food: '#F59E0B',
  Shopping: '#8B5CF6',
  Bills: '#EF4444',
  Healthcare: '#10B981',
  Transportation: '#3B82F6',
  Entertainment: '#EC4899',
  Education: '#06B6D4',
  Others: '#6B7280',
};

// Category icons (emoji)
export const CATEGORY_ICONS = {
  Food: '🍔',
  Shopping: '🛍️',
  Bills: '📋',
  Healthcare: '💊',
  Transportation: '🚗',
  Entertainment: '🎮',
  Education: '📚',
  Others: '📦',
};

// Income category colors
export const INCOME_CATEGORY_COLORS = {
  Salary: '#10B981',
  Freelance: '#3B82F6',
  Business: '#8B5CF6',
  Investment: '#F59E0B',
  Gift: '#EC4899',
  Others: '#6B7280',
};

// Month names
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Get days until expiry
export const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return 0;
  const diff = new Date(expiryDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// Truncate text
export const truncate = (str, n = 30) => str?.length > n ? `${str.slice(0, n)}...` : str;

// Validate password strength
export const validatePassword = (password) => {
  const checks = {
    length: password.length >= 6,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
  return { checks, isValid: Object.values(checks).every(Boolean) };
};
