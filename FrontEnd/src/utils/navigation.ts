// Navigation utility function
export const navigateTo = (path: string) => {
  console.log('🚀 Navigating to:', path);
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  console.log('✅ Navigation event dispatched');
};

// Get current path
export const getCurrentPath = () => {
  return window.location.pathname;
};

// Extract product ID from URL
export const getProductIdFromPath = (path: string = window.location.pathname): string | null => {
  const pathParts = path.split('/');
  if (pathParts.length >= 3 && pathParts[1] === 'product') {
    return pathParts[2];
  }
  return null;
};
