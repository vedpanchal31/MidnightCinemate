import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    return toast.success(message, {
      style: {
        background: '#10b981',
        color: '#fff',
        border: '1px solid #059669',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
    });
  },

  error: (message: string) => {
    return toast.error(message, {
      style: {
        background: '#ef4444',
        color: '#fff',
        border: '1px solid #dc2626',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#3b82f6',
        color: '#fff',
        border: '1px solid #2563eb',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#3b82f6',
      },
    });
  },

  info: (message: string) => {
    return toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#6366f1',
        color: '#fff',
        border: '1px solid #4f46e5',
      },
    });
  },

  warning: (message: string) => {
    return toast(message, {
      icon: '🚫',
      style: {
        background: '#E50914',
        color: '#fff',
        border: '1px solid #cc0812',
      },
    });
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  // Custom method for authentication flows
  auth: {
    loginSuccess: () => showToast.success('Welcome back! Login successful.'),
    loginError: (error?: string) => showToast.error(error || 'Login failed. Please try again.'),
    signupSuccess: () => showToast.success('Account created! Please check your email for verification.'),
    signupError: (error?: string) => showToast.error(error || 'Signup failed. Please try again.'),
    otpSent: () => showToast.success('Verification code sent to your email.'),
    otpVerified: () => showToast.success('Email verified successfully!'),
    otpError: (error?: string) => showToast.error(error || 'Invalid verification code.'),
    passwordResetSent: () => showToast.success('Password reset code sent to your email.'),
    passwordResetError: (error?: string) => showToast.error(error || 'Failed to send reset code.'),
  },

  // Custom method for booking flows
  booking: {
    success: () => showToast.success('Booking confirmed! Enjoy the movie.'),
    error: (error?: string) => showToast.error(error || 'Booking failed. Please try again.'),
    seatsReserved: () => showToast.success('Seats reserved for 10 minutes.'),
    paymentSuccess: () => showToast.success('Payment successful!'),
    paymentError: (error?: string) => showToast.error(error || 'Payment failed.'),
  },

  // Custom method for general actions
  action: {
    saved: () => showToast.success('Saved successfully!'),
    updated: () => showToast.success('Updated successfully!'),
    deleted: () => showToast.success('Deleted successfully!'),
    copied: () => showToast.success('Copied to clipboard!'),
    networkError: () => showToast.error('Network error. Please check your connection.'),
    genericError: () => showToast.error('Something went wrong. Please try again.'),
  },
};

export default toast;
