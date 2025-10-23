// Date utility functions with error handling

export const formatDate = (dateString: string | Date | null | undefined): string => {
  try {
    if (!dateString) {
      return 'Không xác định';
    }
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Không xác định';
    }
    
    return date.toLocaleDateString('vi-VN');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Không xác định';
  }
};

export const formatDateTime = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Không xác định';
    }
    
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Không xác định';
  }
};

export const formatTime = (dateString: string | Date | null | undefined): string => {
  try {
    if (!dateString) {
      // console.warn('Date string is null or undefined:', dateString);
      return 'Vừa xong';
    }
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Vừa xong';
    }
    
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Vừa xong';
  }
};

export const formatRelativeTime = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Vừa xong';
    }
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    
    return formatDate(date);
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Vừa xong';
  }
};
