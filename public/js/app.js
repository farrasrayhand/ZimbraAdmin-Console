function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

function dismissToast(btn) {
  const toast = btn.closest('.toast-alert');
  if (toast) {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 300);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const toasts = document.querySelectorAll('.toast-alert');
  toasts.forEach(toast => {
    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  });
});
