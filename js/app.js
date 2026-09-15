/**
 * App Controller & Khởi chạy ứng dụng Hôm Nay Ăn Gì
 */

document.addEventListener('DOMContentLoaded', () => {
  // Áp dụng Theme đã lưu
  if (window.store.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Khởi tạo hệ thống Toast thông báo
  window.showToast = function(message, duration = 2500) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none px-4 w-full max-w-sm';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto flex items-center space-x-2';
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Kích hoạt animation hiện
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // Khởi tạo UI
  const ui = new window.UIRenderer(window.store, window.apiService);
  window.ui = ui;
  ui.init();

  // Đăng ký nhận thông báo thay đổi dữ liệu từ Store
  window.store.subscribe(() => {
    ui.renderHeader();
    ui.renderCurrentView();
  });

  // Kiểm tra nếu chưa chọn vai trò -> Hiển thị Setup Modal
  if (!window.store.role) {
    ui.openSetupModal();
  } else {
    // Nếu đã có GAS URL thì thử đồng bộ ngầm lần đầu
    if (window.store.gasUrl) {
      window.apiService.syncNow(true);
    }
  }

  // Đăng ký Service Worker cho PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('[PWA] Service Worker registered with scope:', reg.scope))
        .catch((err) => console.warn('[PWA] Service Worker registration failed:', err));
    });
  }
});
