import React, { useState, useEffect } from 'react';

export const AuthNotificationToast = () => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const handleAuthNotice = (event) => {
      const msg = event.detail?.message || "Authentication token is required.";
      setNotification({
        message: msg,
        id: Date.now()
      });
    };

    window.addEventListener("auth:token_required", handleAuthNotice);
    return () => {
      window.removeEventListener("auth:token_required", handleAuthNotice);
    };
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification]);

  if (!notification) return null;

  return (
    <div className="global-auth-toast" role="alert">
      <div className="toast-content">
        <span className="toast-icon">⚠️</span>
        <div className="toast-text">
          <strong>Authentication Required</strong>
          <p>{notification.message}</p>
        </div>
      </div>
      <div className="toast-actions">
        <button
          type="button"
          className="toast-login-btn"
          onClick={() => {
            setNotification(null);
            window.location.href = "/login";
          }}
        >
          Sign In →
        </button>
        <button
          type="button"
          className="toast-close-btn"
          onClick={() => setNotification(null)}
          title="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default AuthNotificationToast;
