/**
 * Show a temporary toast notification
 * @param message - Text to display
 * @param bg - Background color (default: green)
 * @param duration - Duration in ms (default: 2000)
 */
export const showToast = (message: string, bg = '#28a745', duration = 2000) => {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bg};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
    max-width: 400px;
  `;
  document.body.appendChild(notification);
  setTimeout(() => document.body.removeChild(notification), duration);
};
