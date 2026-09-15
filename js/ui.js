/**
 * Giao diện người dùng (UI Renderer & Modals) cho Hôm Nay Ăn Gì
 */

class UIRenderer {
  constructor(store, api) {
    this.store = store;
    this.api = api;
    this.activeTab = 'home';
    this.dishFilter = 'ALL';
    this.dishSearch = '';
  }

  init() {
    this.renderHeader();
    this.renderTabNavigation();
    this.renderCurrentView();
  }

  // Cập nhật thanh tiêu đề trên cùng
  renderHeader() {
    const headerEl = document.getElementById('app-header');
    if (!headerEl) return;

    const roleName = this.store.role === 'FATHER' ? 'Bố 👨' : (this.store.role === 'MOTHER' ? 'Mẹ 👩' : 'Chưa thiết lập');
    const isOnline = this.store.isOnline;
    const isSyncing = this.api.isSyncing;

    // Tính thời gian cập nhật lần cuối
    let lastSyncText = 'Chưa đồng bộ';
    if (this.store.lastSync) {
      const diffSec = Math.floor((Date.now() - new Date(this.store.lastSync).getTime()) / 1000);
      if (diffSec < 20) lastSyncText = 'Vừa cập nhật';
      else if (diffSec < 60) lastSyncText = `${diffSec}s trước`;
      else lastSyncText = `${Math.floor(diffSec / 60)} phút trước`;
    }

    headerEl.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-sm font-bold text-lg">
            🍽️
          </div>
          <div>
            <div class="flex items-center space-x-1.5">
              <h1 class="font-bold text-base text-gray-800 dark:text-gray-100 leading-tight">Hôm Nay Ăn Gì</h1>
              <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${this.store.role === 'MOTHER' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'}">
                ${roleName}
              </span>
            </div>
            <div class="flex items-center space-x-1 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'} inline-block"></span>
              <span>${isOnline ? (this.store.gasUrl ? `Đã cập nhật: ${lastSyncText}` : 'Chế độ Demo/Offline') : 'Mất mạng (Offline)'}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-1">
          <button id="btn-sync-now" title="Đồng bộ ngay" class="p-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 rounded-full hover:bg-orange-50 dark:hover:bg-gray-800 transition">
            <i class="fa-solid fa-arrows-rotate text-sm ${isSyncing ? 'fa-spin text-orange-500' : ''}"></i>
          </button>
          <button id="btn-toggle-theme" title="Đổi giao diện" class="p-2 text-gray-600 dark:text-gray-300 hover:text-amber-500 rounded-full hover:bg-amber-50 dark:hover:bg-gray-800 transition">
            <i class="fa-solid ${this.store.theme === 'dark' ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-500'} text-sm"></i>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-sync-now')?.addEventListener('click', () => {
      this.api.syncNow();
      window.showToast('Đang làm mới dữ liệu...');
    });

    document.getElementById('btn-toggle-theme')?.addEventListener('click', () => {
      this.store.setTheme(this.store.theme === 'dark' ? 'light' : 'dark');
    });
  }

  // Render thanh điều hướng dưới đáy (Bottom Navigation)
  renderTabNavigation() {
    const navEl = document.getElementById('app-navigation');
    if (!navEl) return;

    const tabs = [
      { id: 'home', label: 'Hôm Nay', icon: 'fa-house-chimney' },
      { id: 'schedule', label: 'Lịch Tuần', icon: 'fa-calendar-week' },
      { id: 'dishes', label: 'Kho Món', icon: 'fa-bowl-food' },
      { id: 'settings', label: 'Cài Đặt', icon: 'fa-gear' }
    ];

    navEl.innerHTML = `
      <div class="max-w-md mx-auto flex items-center justify-around py-2 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
        ${tabs.map(tab => `
          <button data-tab="${tab.id}" class="tab-btn flex-1 flex flex-col items-center py-1 transition ${this.activeTab === tab.id ? 'text-orange-500 font-bold' : 'text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200'}">
            <i class="fa-solid ${tab.icon} text-lg mb-1"></i>
            <span class="text-[11px]">${tab.label}</span>
          </button>
        `).join('')}
      </div>
    `;

    navEl.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    this.renderTabNavigation();
    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderCurrentView() {
    const mainEl = document.getElementById('app-main');
    if (!mainEl) return;

    if (this.activeTab === 'home') {
      this.renderHomeView(mainEl);
    } else if (this.activeTab === 'schedule') {
      this.renderScheduleView(mainEl);
    } else if (this.activeTab === 'dishes') {
      this.renderDishesView(mainEl);
    } else if (this.activeTab === 'settings') {
      this.renderSettingsView(mainEl);
    }
  }

  /* =========================================================================
   * MÀN HÌNH 1: TRANG CHỦ (HÔM NAY ĂN GÌ)
   * ========================================================================= */
  renderHomeView(container) {
    const todayStr = this.store.getTodayStr();
    const todayObj = new Date();
    const daysVN = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const formattedDate = `${daysVN[todayObj.getDay()]}, ${todayObj.getDate()} thg ${todayObj.getMonth() + 1}, ${todayObj.getFullYear()}`;

    const mealsConfig = [
      { type: 'SANG', title: 'Bữa Sáng', icon: 'fa-cloud-sun', color: 'from-amber-400 to-orange-400' },
      { type: 'TRUA', title: 'Bữa Trưa', icon: 'fa-sun', color: 'from-orange-500 to-amber-500' },
      { type: 'TOI', title: 'Bữa Tối', icon: 'fa-moon', color: 'from-indigo-500 to-purple-600' }
    ];

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Banner Ngày Hiện Tại -->
        <div class="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
          <div>
            <div class="text-xs font-semibold tracking-wide uppercase text-orange-100">Kế hoạch hôm nay</div>
            <div class="text-lg font-bold mt-0.5">${formattedDate}</div>
          </div>
          <button id="btn-quick-dice-all" title="Gợi ý cả 3 bữa" class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-semibold backdrop-blur-sm transition flex items-center space-x-1.5">
            <i class="fa-solid fa-dice text-sm"></i>
            <span>Bốc cả 3 bữa</span>
          </button>
        </div>

        <!-- 3 KHỐI BỮA ĂN HIỂN THỊ ĐỒNG THỜI (SÁNG - TRƯA - TỐI) -->
        <div class="space-y-4">
          ${mealsConfig.map(meal => this.renderMealCardHtml(todayStr, meal)).join('')}
        </div>

        <!-- NÚT GỬI THỰC ĐƠN HÔM NAY QUA ZALO -->
        <div class="pt-2 pb-4">
          <button id="btn-send-zalo" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 text-sm transition transform active:scale-[0.98]">
            <i class="fa-solid fa-share-nodes text-base"></i>
            <span>Gửi thực đơn hôm nay qua Zalo nhóm</span>
          </button>
        </div>
      </div>
    `;

    this.bindHomeEvents(todayStr);
  }

  // Render HTML của từng khối bữa ăn
  renderMealCardHtml(dateStr, mealConfig) {
    const mealType = mealConfig.type;
    const decision = this.store.getMealDecision(dateStr, mealType);
    const votes = this.store.getMealVotes(dateStr, mealType);
    const isNhuongQuyen = this.store.isNhuongQuyen(dateStr, mealType);
    const isMother = this.store.role === 'MOTHER';
    const isFather = this.store.role === 'FATHER';
    const canChot = isMother || (isFather && isNhuongQuyen);

    let decidedDish = null;
    if (decision && decision.mon_id) {
      decidedDish = this.store.getDishById(decision.mon_id);
    }

    const isDecided = Boolean(decision);

    return `
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 transition-all ${isDecided ? 'meal-card-decided' : 'meal-card-pending'}" data-meal="${mealType}">
        <!-- Header Bữa ăn -->
        <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr ${mealConfig.color} flex items-center justify-center text-white text-xs shadow-sm">
              <i class="fa-solid ${mealConfig.icon}"></i>
            </div>
            <div>
              <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm">${mealConfig.title}</h3>
              <div class="text-[11px] text-gray-400">
                ${isDecided ? 'Đã quyết định thực đơn' : 'Đang mở bình chọn'}
              </div>
            </div>
          </div>

          <div>
            ${isDecided ? `
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                <i class="fa-solid fa-circle-check mr-1 text-[11px]"></i> Đã chốt
              </span>
            ` : `
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                <i class="fa-solid fa-clock mr-1 text-[11px]"></i> Chưa chốt
              </span>
            `}
          </div>
        </div>

        <!-- Trạng thái ĐÃ CHỐT -->
        ${isDecided ? `
          <div class="py-3.5 space-y-2.5">
            <div class="flex items-start justify-between">
              <div>
                <div class="font-bold text-gray-900 dark:text-gray-100 text-base">
                  ${decidedDish ? decidedDish.ten_mon : (decision.ghi_chu_dac_biet || 'Món tự do')}
                </div>
                ${decidedDish && decidedDish.loai_hinh === 'AN_TIEM' ? `
                  <div class="text-xs text-orange-600 dark:text-orange-400 mt-0.5 flex items-center space-x-1.5">
                    <i class="fa-solid fa-store"></i>
                    <span>${decidedDish.ten_quan || 'Ăn tiệm / Gọi ship'}</span>
                  </div>
                ` : ''}
              </div>

              ${decidedDish && decidedDish.so_dien_thoai ? `
                <a href="tel:${decidedDish.so_dien_thoai}" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition">
                  <i class="fa-solid fa-phone"></i>
                  <span>Gọi ship</span>
                </a>
              ` : ''}
            </div>

            <div class="text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-between pt-1">
              <span>Được chốt bởi: <strong class="text-gray-600 dark:text-gray-300">${decision.nguoi_chot === 'ME' ? 'Mẹ' : (decision.nguoi_chot === 'BA' ? 'Ba' : decision.nguoi_chot)}</strong></span>
              
              <!-- Mẹ có quyền Đổi món khác (Hủy chốt) -->
              ${isMother ? `
                <button data-action="cancel-chot" data-meal="${mealType}" class="text-xs text-red-500 hover:text-red-700 font-medium">
                  <i class="fa-solid fa-rotate-left mr-1"></i>Đổi món khác
                </button>
              ` : ''}
            </div>
          </div>
        ` : `
          <!-- Trạng thái CHƯA CHỐT: VÙNG BÌNH CHỌN & THAO TÁC -->
          <div class="py-3 space-y-3">
            <!-- Hiển thị các phiếu Vote hiện tại -->
            <div class="space-y-1.5">
              <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Phiếu bình chọn</div>
              ${votes.length === 0 ? `
                <div class="text-xs text-gray-400 italic py-1">Chưa có ai chọn món cho bữa này.</div>
              ` : `
                <div class="space-y-1">
                  ${votes.map(v => {
                    const dish = this.store.getDishById(v.mon_id);
                    let voterLabel = '';
                    let badgeColor = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                    if (v.nguoi_vote === 'BA') { voterLabel = 'Ba chọn'; badgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'; }
                    else if (v.nguoi_vote === 'ME') { voterLabel = 'Mẹ chọn'; badgeColor = 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'; }
                    else if (v.nguoi_vote === 'CON_DO_BA_CHON') { voterLabel = 'Ba chọn cho Con'; badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'; }
                    else if (v.nguoi_vote === 'CON_DO_ME_CHON') { voterLabel = 'Mẹ chọn cho Con'; badgeColor = 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'; }

                    return `
                      <div class="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                        <span class="font-medium text-gray-800 dark:text-gray-200">${dish ? dish.ten_mon : 'Đã chọn món'}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${badgeColor}">${voterLabel}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>

            <!-- Các nút thao tác Vote cho thiết bị hiện tại -->
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button data-action="vote-self" data-meal="${mealType}" class="py-2 px-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-400 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-center space-x-1.5 transition">
                <i class="fa-solid fa-check text-orange-500"></i>
                <span>${isFather ? 'Ba vote món' : 'Mẹ vote món'}</span>
              </button>
              <button data-action="vote-kid" data-meal="${mealType}" class="py-2 px-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-amber-400 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-center space-x-1.5 transition">
                <i class="fa-solid fa-child text-amber-500"></i>
                <span>Chọn hộ Con trai</span>
              </button>
            </div>

            <!-- CÔNG CỤ 1 CHẠM: XÚC XẮC, HÔM NAY LƯỜI NẤU, ĐỒ CŨ, KHÔNG NẤU -->
            <div class="flex items-center space-x-1.5 pt-1 overflow-x-auto pb-1">
              <button data-action="dice-pick" data-meal="${mealType}" title="Bốc thăm ngẫu nhiên" class="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 text-xs font-semibold flex items-center space-x-1">
                <i class="fa-solid fa-dice text-sm"></i>
                <span>Xúc xắc</span>
              </button>
              <button data-action="lazy-pick" data-meal="${mealType}" title="Hôm nay lười nấu (Ăn tiệm)" class="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 text-xs font-semibold flex items-center space-x-1">
                <i class="fa-solid fa-motorcycle text-sm"></i>
                <span>Lười nấu</span>
              </button>
              <button data-action="leftover-pick" data-meal="${mealType}" title="Ăn đồ cũ / Vét tủ lạnh" class="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-1">
                <i class="fa-solid fa-box-archive text-sm"></i>
                <span>Ăn đồ cũ</span>
              </button>
              <button data-action="skip-pick" data-meal="${mealType}" title="Bữa này không nấu / Đi tiệc" class="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold flex items-center space-x-1">
                <i class="fa-solid fa-champagne-glasses text-sm"></i>
                <span>Đi tiệc</span>
              </button>
            </div>

            <!-- HÀNG NÚT QUYẾT ĐỊNH CHÍNH: CHỐT MÓN & NHƯỢNG QUYỀN -->
            <div class="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center space-x-2">
              ${canChot ? `
                <button data-action="chot-main" data-meal="${mealType}" class="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1.5 transition">
                  <i class="fa-solid fa-gavel"></i>
                  <span>${isFather && isNhuongQuyen ? 'Ba chốt món này (Được nhượng quyền)' : 'Chốt món này'}</span>
                </button>
              ` : `
                <button disabled class="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs font-medium flex items-center justify-center space-x-1 cursor-not-allowed">
                  <i class="fa-solid fa-lock text-xs"></i>
                  <span>Chờ Mẹ chốt món</span>
                </button>
              `}

              ${isMother ? `
                <button data-action="nhuong-quyen" data-meal="${mealType}" data-value="${!isNhuongQuyen}" title="${isNhuongQuyen ? 'Thu hồi quyền chốt' : 'Nhường Ba chọn bữa này'}" class="py-2.5 px-3 rounded-xl border ${isNhuongQuyen ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 text-gray-600 dark:text-gray-300'} text-xs font-semibold flex items-center space-x-1 transition">
                  <i class="fa-solid fa-handshake"></i>
                  <span>${isNhuongQuyen ? 'Đã nhường Ba' : 'Nhường Ba'}</span>
                </button>
              ` : ''}
            </div>
          </div>
        `}
      </div>
    `;
  }

  bindHomeEvents(todayStr) {
    // Bốc cả 3 bữa ngẫu nhiên
    document.getElementById('btn-quick-dice-all')?.addEventListener('click', () => {
      ['SANG', 'TRUA', 'TOI'].forEach(m => {
        const res = this.store.getRandomDish(m, todayStr);
        if (res && res.dish) {
          const voter = this.store.role === 'FATHER' ? 'BA' : 'ME';
          this.api.vote(todayStr, m, voter, res.dish.id);
        }
      });
      window.showToast('Đã xúc xắc đề xuất cho cả 3 bữa!');
    });

    // Nút Gửi Zalo
    document.getElementById('btn-send-zalo')?.addEventListener('click', () => {
      this.handleSendZalo(todayStr);
    });

    // Event Delegation cho các action trên 3 khối bữa ăn
    const mainEl = document.getElementById('app-main');
    if (!mainEl) return;

    mainEl.onclick = (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const meal = btn.getAttribute('data-meal');

      switch (action) {
        case 'vote-self':
          this.openVoteModal(todayStr, meal, false);
          break;
        case 'vote-kid':
          this.openVoteModal(todayStr, meal, true);
          break;
        case 'dice-pick':
          this.handleDicePick(btn, todayStr, meal);
          break;
        case 'lazy-pick':
          this.openLazyModal(todayStr, meal);
          break;
        case 'leftover-pick':
          this.openLeftoverModal(todayStr, meal);
          break;
        case 'skip-pick':
          this.handleSkipMeal(todayStr, meal);
          break;
        case 'chot-main':
          this.openChotModal(todayStr, meal);
          break;
        case 'nhuong-quyen':
          const val = btn.getAttribute('data-value') === 'true';
          this.api.nhuongQuyen(todayStr, meal, val);
          window.showToast(val ? 'Đã nhượng quyền chốt cho Ba bữa này!' : 'Đã thu hồi quyền chốt!');
          break;
        case 'cancel-chot':
          if (confirm('Bạn có chắc muốn hủy chốt để gia đình chọn lại món khác?')) {
            this.api.huyChot(todayStr, meal);
            window.showToast('Đã hủy chốt, mở lại bình chọn.');
          }
          break;
      }
    };
  }

  // Xử lý Xúc xắc 1 chạm theo đúng Quy trình 2
  handleDicePick(buttonEl, dateStr, mealType) {
    const icon = buttonEl.querySelector('i');
    if (icon) icon.classList.add('animate-dice');
    setTimeout(() => { if (icon) icon.classList.remove('animate-dice'); }, 600);

    const result = this.store.getRandomDish(mealType, dateStr, false);

    if (result && result.dish) {
      const voter = this.store.role === 'FATHER' ? 'BA' : 'ME';
      this.api.vote(dateStr, mealType, voter, result.dish.id);
      window.showToast(`Xúc xắc gợi ý: ${result.dish.ten_mon}!`);
    } else if (result && result.exhausted) {
      // Đã hết món mới không trùng trong N ngày -> hỏi người dùng
      if (confirm(`Đã hết món mới cho bữa này (tránh trùng ${this.store.repeatDays} ngày qua)!\nBạn có muốn nới lỏng quy tắc để bốc thăm lại trong toàn bộ kho món không?`)) {
        const relaxedResult = this.store.getRandomDish(mealType, dateStr, true);
        if (relaxedResult && relaxedResult.dish) {
          const voter = this.store.role === 'FATHER' ? 'BA' : 'ME';
          this.api.vote(dateStr, mealType, voter, relaxedResult.dish.id);
          window.showToast(`Đã bốc món nới lỏng: ${relaxedResult.dish.ten_mon}!`);
        }
      }
    } else {
      window.showToast('Chưa có món nào phù hợp trong kho cho bữa này!');
    }
  }

  // Xử lý Gửi Zalo theo đặc tả
  handleSendZalo(todayStr) {
    const todayObj = new Date();
    const daysVN = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = daysVN[todayObj.getDay()];

    const sang = this.store.getMealDecision(todayStr, 'SANG');
    const trua = this.store.getMealDecision(todayStr, 'TRUA');
    const toi = this.store.getMealDecision(todayStr, 'TOI');

    const getMealText = (item) => {
      if (!item) return 'Chưa chốt';
      if (item.mon_id) {
        const d = this.store.getDishById(item.mon_id);
        return d ? d.ten_mon : 'Món đã chọn';
      }
      return item.ghi_chu_dac_biet || 'Không nấu';
    };

    const message = [
      `🍽️ THỰC ĐƠN GIA ĐÌNH (${dayName}, ${todayObj.getDate()}/${todayObj.getMonth() + 1})`,
      `🌅 Sáng: ${getMealText(sang)}`,
      `☀️ Trưa: ${getMealText(trua)}`,
      `🌙 Tối: ${getMealText(toi)}`,
      `Chúc cả nhà ngon miệng! ❤️`
    ].join('\n');

    navigator.clipboard.writeText(message).then(() => {
      window.showToast('Đã sao chép thực đơn! Đang mở Zalo...');
      setTimeout(() => {
        window.open('https://zalo.me', '_blank');
      }, 700);
    }).catch(() => {
      alert(`Nội dung thực đơn:\n\n${message}`);
      window.open('https://zalo.me', '_blank');
    });
  }

  // Modal chọn Vote món
  openVoteModal(dateStr, mealType, isForKid = false) {
    const activeDishes = this.store.getActiveDishes().filter(d => d.bua_an && d.bua_an.includes(mealType));
    const voter = this.store.role === 'FATHER' 
      ? (isForKid ? 'CON_DO_BA_CHON' : 'BA') 
      : (isForKid ? 'CON_DO_ME_CHON' : 'ME');

    const currentVote = this.store.votes.find(v => v.ngay === dateStr && v.bua === mealType && v.nguoi_vote === voter);
    const selectedId = currentVote ? currentVote.mon_id : '';

    const modalHtml = `
      <div id="modal-vote" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop bg-black/40">
        <div class="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 max-h-[85vh] flex flex-col shadow-2xl animate-fade-in">
          <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base">
                ${isForKid ? 'Chọn hộ món cho Con trai' : 'Bình chọn món ăn'}
              </h3>
              <p class="text-xs text-gray-400 mt-0.5">Bữa ${mealType === 'SANG' ? 'Sáng' : (mealType === 'TRUA' ? 'Trưa' : 'Tối')}</p>
            </div>
            <button id="btn-close-modal" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <!-- Danh sách món có thể vote -->
          <div class="overflow-y-auto py-3 space-y-1.5 flex-1 pr-1">
            ${activeDishes.length === 0 ? `
              <div class="text-center py-6 text-gray-400 text-sm">Chưa có món nào được cấu hình cho bữa này.</div>
            ` : activeDishes.map(dish => {
              const delta = this.store.getLastEatenDeltaDays(dish.id, dateStr);
              return `
                <label class="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-orange-50/50 dark:hover:bg-gray-800 cursor-pointer transition">
                  <div class="flex items-center space-x-3">
                    <input type="radio" name="vote_dish" value="${dish.id}" ${dish.id === selectedId ? 'checked' : ''} class="text-orange-500 focus:ring-orange-400 w-4 h-4">
                    <div>
                      <div class="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5">
                        <span>${dish.ten_mon}</span>
                        ${dish.con_thich ? '<span class="text-amber-500 text-xs" title="Món khoái khẩu của con">⭐</span>' : ''}
                      </div>
                      <div class="text-[11px] text-gray-400 flex items-center space-x-2 mt-0.5">
                        <span>${dish.loai_hinh === 'AN_TIEM' ? 'Ăn tiệm' : 'Tự nấu'}</span>
                        ${delta ? `<span class="text-amber-600 dark:text-amber-400 font-medium">Ăn gần nhất: ${delta} ngày trước</span>` : ''}
                      </div>
                    </div>
                  </div>
                </label>
              `;
            }).join('')}
          </div>

          <div class="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center space-x-2">
            ${selectedId ? `
              <button id="btn-cancel-vote" class="py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/50 transition">
                Hủy vote
              </button>
            ` : ''}
            <button id="btn-confirm-vote" class="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/20 transition">
              Xác nhận chọn món
            </button>
          </div>
        </div>
      </div>
    `;

    this.renderModal(modalHtml, (modal) => {
      modal.querySelector('#btn-close-modal')?.addEventListener('click', () => modal.remove());
      modal.querySelector('#btn-cancel-vote')?.addEventListener('click', () => {
        this.api.vote(dateStr, mealType, voter, '');
        modal.remove();
        window.showToast('Đã xóa phiếu bình chọn.');
      });
      modal.querySelector('#btn-confirm-vote')?.addEventListener('click', () => {
        const checked = modal.querySelector('input[name="vote_dish"]:checked');
        if (checked) {
          this.api.vote(dateStr, mealType, voter, checked.value);
          modal.remove();
          window.showToast('Đã lưu bình chọn của bạn!');
        } else {
          window.showToast('Vui lòng chọn một món ăn!');
        }
      });
    });
  }

  // Modal Cơ chế "Hôm nay lười nấu"
  openLazyModal(dateStr, mealType) {
    const lazyDishes = this.store.getLazyDishes();

    const modalHtml = `
      <div id="modal-lazy" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop bg-black/40">
        <div class="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 max-h-[85vh] flex flex-col shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base">🛵 Hôm Nay Lười Nấu</h3>
              <p class="text-xs text-gray-400 mt-0.5">Các quán ăn & món gọi ship quen thuộc của gia đình</p>
            </div>
            <button id="btn-close-lazy" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div class="overflow-y-auto py-3 space-y-2 flex-1 pr-1">
            ${lazyDishes.length === 0 ? `
              <div class="text-center py-6 text-gray-400 text-sm">Chưa có món ăn tiệm nào trong kho.</div>
            ` : lazyDishes.map(dish => `
              <div class="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-orange-50/20 dark:bg-gray-800/50 flex items-center justify-between">
                <div>
                  <div class="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5">
                    <span>${dish.ten_mon}</span>
                    ${dish.con_thich ? '<span class="text-amber-500 text-xs">⭐</span>' : ''}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    ${dish.ten_quan || 'Quán quen'}
                  </div>
                </div>

                <div class="flex items-center space-x-2">
                  ${dish.so_dien_thoai ? `
                    <a href="tel:${dish.so_dien_thoai}" class="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-xs" title="Gọi ship">
                      <i class="fa-solid fa-phone"></i>
                    </a>
                  ` : ''}
                  <button data-pick-dish="${dish.id}" class="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-sm transition">
                    Chọn món này
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.renderModal(modalHtml, (modal) => {
      modal.querySelector('#btn-close-lazy')?.addEventListener('click', () => modal.remove());
      modal.querySelectorAll('button[data-pick-dish]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const dishId = e.currentTarget.getAttribute('data-pick-dish');
          const voter = this.store.role === 'FATHER' ? 'BA' : 'ME';
          this.api.vote(dateStr, mealType, voter, dishId);
          modal.remove();
          window.showToast('Đã chọn món ăn tiệm!');
        });
      });
    });
  }

  // Modal Cơ chế "Ăn đồ cũ / Vét tủ lạnh"
  openLeftoverModal(dateStr, mealType) {
    const modalHtml = `
      <div id="modal-leftover" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop bg-black/40">
        <div class="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl">
          <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base">🍲 Ăn Lại Đồ Cũ / Vét Tủ Lạnh</h3>
          <p class="text-xs text-gray-400 mt-1">Nhập tên món ăn dư thừa hôm trước cần giải quyết:</p>

          <div class="mt-3">
            <input id="input-leftover-name" type="text" placeholder="Ví dụ: Ăn lại thịt kho hôm qua" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>

          <div class="mt-4 flex items-center justify-end space-x-2">
            <button id="btn-cancel-leftover" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              Hủy
            </button>
            <button id="btn-save-leftover" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm">
              Chốt ăn đồ cũ
            </button>
          </div>
        </div>
      </div>
    `;

    this.renderModal(modalHtml, (modal) => {
      modal.querySelector('#btn-cancel-leftover')?.addEventListener('click', () => modal.remove());
      modal.querySelector('#btn-save-leftover')?.addEventListener('click', () => {
        const text = modal.querySelector('#input-leftover-name').value.trim();
        if (!text) {
          window.showToast('Vui lòng nhập tên món cũ!');
          return;
        }
        const choter = this.store.role === 'FATHER' ? 'BA' : 'ME';
        this.api.specialMeal(dateStr, mealType, `Ăn đồ cũ: ${text}`, choter);
        modal.remove();
        window.showToast('Đã chốt bữa ăn đồ cũ!');
      });
    });
  }

  // Bữa này không nấu / Đi tiệc
  handleSkipMeal(dateStr, mealType) {
    if (confirm('Xác nhận bữa này gia đình không nấu (đi tiệc / ăn ngoài tự do)?')) {
      const choter = this.store.role === 'FATHER' ? 'BA' : 'ME';
      this.api.specialMeal(dateStr, mealType, 'Bữa này không nấu / Đi tiệc', choter);
      window.showToast('Đã đánh dấu hoàn tất bữa ăn!');
    }
  }

  // Modal Chốt món chính
  openChotModal(dateStr, mealType) {
    const votes = this.store.getMealVotes(dateStr, mealType);
    const activeDishes = this.store.getActiveDishes().filter(d => d.bua_an && d.bua_an.includes(mealType));
    const choter = this.store.role === 'FATHER' ? 'BA' : 'ME';

    const modalHtml = `
      <div id="modal-chot" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop bg-black/40">
        <div class="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 max-h-[85vh] flex flex-col shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base">🎯 Quyết Định Chốt Món</h3>
              <p class="text-xs text-gray-400 mt-0.5">Bữa ${mealType === 'SANG' ? 'Sáng' : (mealType === 'TRUA' ? 'Trưa' : 'Tối')}</p>
            </div>
            <button id="btn-close-chot" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div class="overflow-y-auto py-3 space-y-3 flex-1 pr-1">
            ${votes.length > 0 ? `
              <div>
                <div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Món được bình chọn nhiều nhất</div>
                <div class="space-y-1.5">
                  ${votes.map(v => {
                    const dish = this.store.getDishById(v.mon_id);
                    if (!dish) return '';
                    return `
                      <button data-chot-dish="${dish.id}" class="w-full text-left p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/50 flex items-center justify-between transition">
                        <div>
                          <span class="font-bold text-sm text-gray-800 dark:text-gray-100">${dish.ten_mon}</span>
                          <div class="text-xs text-emerald-600 dark:text-emerald-400">Được đề xuất bởi phiếu bầu</div>
                        </div>
                        <span class="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg">Chốt món này</span>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}

            <div>
              <div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Hoặc chọn món khác trong kho</div>
              <div class="space-y-1">
                ${activeDishes.map(dish => `
                  <div class="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between text-xs">
                    <span class="font-medium text-gray-800 dark:text-gray-200">${dish.ten_mon}</span>
                    <button data-chot-dish="${dish.id}" class="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-emerald-500 hover:text-white rounded-lg font-semibold transition">
                      Chốt
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderModal(modalHtml, (modal) => {
      modal.querySelector('#btn-close-chot')?.addEventListener('click', () => modal.remove());
      modal.querySelectorAll('button[data-chot-dish]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const dishId = e.currentTarget.getAttribute('data-chot-dish');
          this.api.chotMon(dateStr, mealType, dishId, choter);
          modal.remove();
          window.showToast('Đã chốt món thành công!');
        });
      });
    });
  }

  /* =========================================================================
   * MÀN HÌNH 2: KẾ HOẠCH TUẦN (WEEKLY PLANNER)
   * ========================================================================= */
  renderScheduleView(container) {
    const weekDates = this.store.getCurrentWeekDates();

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Thanh công cụ tuần -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h2 class="font-bold text-base text-gray-800 dark:text-gray-100">Kế Hoạch Tuần Này</h2>
              <p class="text-xs text-gray-400">Từ Thứ Hai đến Chủ Nhật</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button id="btn-shuffle-schedule" class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition">
              <i class="fa-solid fa-shuffle"></i>
              <span>Xáo trộn (T2 - T6)</span>
            </button>
            <button id="btn-copy-last-week" class="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-400 text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition">
              <i class="fa-solid fa-copy text-orange-500"></i>
              <span>Chép tuần trước</span>
            </button>
          </div>
        </div>

        <!-- Danh sách 7 ngày trong tuần -->
        <div class="space-y-3">
          ${weekDates.map(day => {
            const sang = this.store.getMealDecision(day.dateStr, 'SANG');
            const trua = this.store.getMealDecision(day.dateStr, 'TRUA');
            const toi = this.store.getMealDecision(day.dateStr, 'TOI');

            const getTitle = (item) => {
              if (!item) return '<span class="text-gray-400 italic">Chưa chọn</span>';
              if (item.mon_id) {
                const d = this.store.getDishById(item.mon_id);
                return d ? `<strong class="text-gray-800 dark:text-gray-200">${d.ten_mon}</strong>` : 'Món đã chọn';
              }
              return `<span class="text-gray-600 dark:text-gray-300 font-medium">${item.ghi_chu_dac_biet}</span>`;
            };

            return `
              <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border ${day.isWeekend ? 'border-orange-200 dark:border-orange-950/60 bg-orange-50/20' : 'border-gray-100 dark:border-gray-800'}">
                <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800 mb-2.5">
                  <div class="flex items-center space-x-2">
                    <span class="font-bold text-sm text-gray-800 dark:text-gray-100">${day.dayName}</span>
                    <span class="text-xs text-gray-400">(${day.dateStr})</span>
                  </div>
                  ${day.isWeekend ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Cuối tuần (Cố định)</span>' : ''}
                </div>

                <div class="grid grid-cols-3 gap-2 text-xs">
                  <button data-quick-meal="SANG" data-date="${day.dateStr}" class="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-orange-50/60 text-left transition">
                    <div class="text-[10px] text-gray-400 mb-0.5 font-medium">Sáng</div>
                    <div class="truncate">${getTitle(sang)}</div>
                  </button>

                  <button data-quick-meal="TRUA" data-date="${day.dateStr}" class="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-orange-50/60 text-left transition">
                    <div class="text-[10px] text-gray-400 mb-0.5 font-medium">Trưa</div>
                    <div class="truncate">${getTitle(trua)}</div>
                  </button>

                  <button data-quick-meal="TOI" data-date="${day.dateStr}" class="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-orange-50/60 text-left transition">
                    <div class="text-[10px] text-gray-400 mb-0.5 font-medium">Tối</div>
                    <div class="truncate">${getTitle(toi)}</div>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Sự kiện nút Xáo trộn (T2 - T6)
    container.querySelector('#btn-shuffle-schedule')?.addEventListener('click', async () => {
      if (confirm('Xác nhận xáo trộn thực đơn ngẫu nhiên từ Thứ Hai đến Thứ Sáu?\n(Thứ Bảy và Chủ Nhật được giữ nguyên 100%)')) {
        const updated = this.store.shuffleWeekdaySchedule(weekDates);
        await this.api.updateSchedule(updated);
        window.showToast('Đã xáo trộn thực đơn Thứ 2 - Thứ 6!');
        this.renderScheduleView(container);
      }
    });

    // Sự kiện Sao chép tuần trước
    container.querySelector('#btn-copy-last-week')?.addEventListener('click', async () => {
      if (confirm('Sao chép toàn bộ thực đơn 7 ngày của tuần trước sang tuần này?')) {
        const updated = this.store.copyLastWeekSchedule(weekDates);
        await this.api.updateSchedule(updated);
        window.showToast('Đã sao chép thực đơn tuần trước!');
        this.renderScheduleView(container);
      }
    });

    // Sự kiện chạm vào từng bữa để chọn nhanh
    container.querySelectorAll('button[data-quick-meal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const m = e.currentTarget.getAttribute('data-quick-meal');
        const d = e.currentTarget.getAttribute('data-date');
        this.openChotModal(d, m);
      });
    });
  }

  /* =========================================================================
   * MÀN HÌNH 3: KHO MÓN ĂN (DISHES REPOSITORY)
   * ========================================================================= */
  renderDishesView(container) {
    let dishes = this.store.getActiveDishes();
    const deletedCount = this.store.getDeletedDishes().length;

    // Tìm kiếm search-as-you-type
    if (this.dishSearch) {
      const q = this.dishSearch.toLowerCase();
      dishes = dishes.filter(d => d.ten_mon.toLowerCase().includes(q) || (d.ten_quan && d.ten_quan.toLowerCase().includes(q)));
    }

    // Lọc theo tabs
    if (this.dishFilter === 'SANG') dishes = dishes.filter(d => d.bua_an && d.bua_an.includes('SANG'));
    else if (this.dishFilter === 'TRUA') dishes = dishes.filter(d => d.bua_an && d.bua_an.includes('TRUA'));
    else if (this.dishFilter === 'TOI') dishes = dishes.filter(d => d.bua_an && d.bua_an.includes('TOI'));
    else if (this.dishFilter === 'NAU_NHA') dishes = dishes.filter(d => d.loai_hinh === 'NAU_NHA');
    else if (this.dishFilter === 'AN_TIEM') dishes = dishes.filter(d => d.loai_hinh === 'AN_TIEM');
    else if (this.dishFilter === 'CON_THICH') dishes = dishes.filter(d => d.con_thich);

    const filterOptions = [
      { id: 'ALL', label: 'Tất cả' },
      { id: 'SANG', label: 'Sáng' },
      { id: 'TRUA', label: 'Trưa' },
      { id: 'TOI', label: 'Tối' },
      { id: 'NAU_NHA', label: 'Nấu nhà' },
      { id: 'AN_TIEM', label: 'Ăn tiệm' },
      { id: 'CON_THICH', label: 'Con thích ⭐' }
    ];

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Nút Thêm Món Lớn -->
        <button id="btn-add-new-dish" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-md shadow-orange-500/25 flex items-center justify-center space-x-2 text-sm transition transform active:scale-[0.98]">
          <i class="fa-solid fa-plus text-base"></i>
          <span>Thêm món mới vào kho</span>
        </button>

        <!-- Thanh Tìm kiếm -->
        <div class="relative">
          <input id="input-search-dish" type="text" value="${this.dishSearch}" placeholder="Tìm kiếm món ăn, quán quen..." class="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-gray-400 text-sm"></i>
        </div>

        <!-- Bộ lọc đa năng -->
        <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          ${filterOptions.map(f => `
            <button data-filter="${f.id}" class="flex-shrink-0 px-3 py-1.5 rounded-full font-semibold transition ${this.dishFilter === f.id ? 'bg-orange-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}">
              ${f.label}
            </button>
          `).join('')}
        </div>

        <!-- Danh sách thẻ món ăn -->
        <div class="space-y-2.5">
          ${dishes.length === 0 ? `
            <div class="text-center py-10 text-gray-400 text-sm">Không tìm thấy món ăn nào phù hợp.</div>
          ` : dishes.map(dish => {
            const delta = this.store.getLastEatenDeltaDays(dish.id);
            return `
              <div class="bg-white dark:bg-gray-900 rounded-2xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div class="space-y-1">
                  <div class="flex items-center space-x-2">
                    <span class="font-bold text-sm text-gray-800 dark:text-gray-100">${dish.ten_mon}</span>
                    ${dish.con_thich ? '<span class="text-amber-500 text-xs" title="Món khoái khẩu của con">⭐</span>' : ''}
                  </div>

                  <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span class="px-2 py-0.5 rounded font-medium ${dish.loai_hinh === 'AN_TIEM' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}">
                      ${dish.loai_hinh === 'AN_TIEM' ? 'Ăn tiệm' : 'Tự nấu'}
                    </span>
                    
                    ${(dish.bua_an || []).map(b => `
                      <span class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        ${b === 'SANG' ? 'Sáng' : (b === 'TRUA' ? 'Trưa' : 'Tối')}
                      </span>
                    `).join('')}

                    ${delta ? `
                      <span class="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 font-semibold">
                        Lần ăn gần nhất: ${delta} ngày trước
                      </span>
                    ` : ''}
                  </div>

                  ${dish.loai_hinh === 'AN_TIEM' && dish.ten_quan ? `
                    <div class="text-xs text-gray-400 flex items-center space-x-1.5 pt-0.5">
                      <i class="fa-solid fa-location-dot text-[10px]"></i>
                      <span>${dish.ten_quan}</span>
                    </div>
                  ` : ''}
                </div>

                <div class="flex items-center space-x-1">
                  ${dish.so_dien_thoai ? `
                    <a href="tel:${dish.so_dien_thoai}" class="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-xs hover:bg-emerald-100 transition" title="Gọi ship">
                      <i class="fa-solid fa-phone"></i>
                    </a>
                  ` : ''}
                  <button data-edit-dish="${dish.id}" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-xl text-xs transition" title="Sửa món">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button data-delete-dish="${dish.id}" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 rounded-xl text-xs transition" title="Xóa mềm vào thùng rác">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Chân trang: Thùng rác -->
        <div class="pt-4 pb-2 text-center">
          <button id="btn-open-trash" class="text-xs text-gray-500 dark:text-gray-400 hover:text-orange-500 underline">
            <i class="fa-solid fa-trash-can mr-1"></i>Thùng rác / Món đã xóa (${deletedCount})
          </button>
        </div>
      </div>
    `;

    // Sự kiện tìm kiếm
    const searchInput = container.querySelector('#input-search-dish');
    searchInput?.addEventListener('input', (e) => {
      this.dishSearch = e.target.value;
      this.renderDishesView(container);
    });

    // Sự kiện lọc tab
    container.querySelectorAll('button[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.dishFilter = e.currentTarget.getAttribute('data-filter');
        this.renderDishesView(container);
      });
    });

    // Nút thêm món mới
    container.querySelector('#btn-add-new-dish')?.addEventListener('click', () => {
      this.openDishModal(null);
    });

    // Sửa món
    container.querySelectorAll('button[data-edit-dish]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-edit-dish');
        const dish = this.store.getDishById(id);
        if (dish) this.openDishModal(dish);
      });
    });

    // Xóa mềm món
    container.querySelectorAll('button[data-delete-dish]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-delete-dish');
        if (confirm('Chuyển món ăn này vào Thùng rác? (Bạn có thể khôi phục bất kỳ lúc nào)')) {
          this.api.deleteDish(id);
          window.showToast('Đã chuyển món vào thùng rác.');
          this.renderDishesView(container);
        }
      });
    });

    // Mở thùng rác
    container.querySelector('#btn-open-trash')?.addEventListener('click', () => {
      this.openTrashModal();
    });
  }

  // Modal Thêm / Sửa Món Ăn
  openDishModal(dish = null) {
    const isEdit = Boolean(dish);
    const buaAn = dish ? (dish.bua_an || []) : ['TRUA', 'TOI'];

    const modalHtml = `
      <div id="modal-dish" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop bg-black/40">
        <div class="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 max-h-[90vh] flex flex-col shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base">
              ${isEdit ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
            </h3>
            <button id="btn-close-dish-modal" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div class="overflow-y-auto py-3 space-y-3.5 flex-1 pr-1 text-xs">
            <div>
              <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Tên món ăn (*)</label>
              <input id="dish-name" type="text" value="${dish ? dish.ten_mon : ''}" placeholder="Ví dụ: Bò kho bánh mì" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>

            <div>
              <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Phù hợp bữa nào? (chọn nhiều)</label>
              <div class="flex items-center space-x-3">
                <label class="flex items-center space-x-1.5 cursor-pointer">
                  <input type="checkbox" name="dish_bua" value="SANG" ${buaAn.includes('SANG') ? 'checked' : ''} class="w-4 h-4 text-orange-500 rounded focus:ring-orange-400">
                  <span>Bữa Sáng</span>
                </label>
                <label class="flex items-center space-x-1.5 cursor-pointer">
                  <input type="checkbox" name="dish_bua" value="TRUA" ${buaAn.includes('TRUA') ? 'checked' : ''} class="w-4 h-4 text-orange-500 rounded focus:ring-orange-400">
                  <span>Bữa Trưa</span>
                </label>
                <label class="flex items-center space-x-1.5 cursor-pointer">
                  <input type="checkbox" name="dish_bua" value="TOI" ${buaAn.includes('TOI') ? 'checked' : ''} class="w-4 h-4 text-orange-500 rounded focus:ring-orange-400">
                  <span>Bữa Tối</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Loại hình</label>
              <div class="grid grid-cols-2 gap-2">
                <label class="flex items-center justify-center p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer text-xs font-semibold">
                  <input type="radio" name="dish_type" value="NAU_NHA" ${(!dish || dish.loai_hinh === 'NAU_NHA') ? 'checked' : ''} class="mr-2 text-orange-500">
                  <span>Tự nấu tại nhà</span>
                </label>
                <label class="flex items-center justify-center p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer text-xs font-semibold">
                  <input type="radio" name="dish_type" value="AN_TIEM" ${(dish && dish.loai_hinh === 'AN_TIEM') ? 'checked' : ''} class="mr-2 text-orange-500">
                  <span>Ăn tiệm / Ship</span>
                </label>
              </div>
            </div>

            <div id="tiem-fields" class="${(!dish || dish.loai_hinh === 'NAU_NHA') ? 'hidden' : ''} space-y-2.5 p-3 rounded-xl bg-orange-50/50 dark:bg-gray-800/60 border border-orange-100 dark:border-gray-700">
              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Tên quán ăn</label>
                <input id="dish-restaurant" type="text" value="${dish ? dish.ten_quan : ''}" placeholder="Tên quán quen..." class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              </div>
              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Số điện thoại gọi ship</label>
                <input id="dish-phone" type="tel" value="${dish ? dish.so_dien_thoai : ''}" placeholder="09xxxxxxxx" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              </div>
            </div>

            <div class="pt-1">
              <label class="flex items-center space-x-2 cursor-pointer p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                <input id="dish-kid-fav" type="checkbox" ${dish && dish.con_thich ? 'checked' : ''} class="w-4 h-4 text-amber-500 rounded focus:ring-amber-400">
                <span class="font-bold text-amber-800 dark:text-amber-300">⭐ Đánh dấu là Món khoái khẩu của Con trai</span>
              </label>
            </div>
          </div>

          <div class="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end space-x-2">
            <button id="btn-cancel-dish" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              Hủy
            </button>
            <button id="btn-save-dish" class="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20">
              ${isEdit ? 'Lưu thay đổi' : 'Thêm vào kho'}
            </button>
          </div>
        </div>
      </div>
    `;

    this.renderModal(modalHtml, (modal) => {
      modal.querySelector('#btn-close-dish-modal')?.addEventListener('click', () => modal.remove());
      modal.querySelector('#btn-cancel-dish')?.addEventListener('click', () => modal.remove());

      // Toggle ẩn hiện trường quán tiệm
      modal.querySelectorAll('input[name="dish_type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          const isTiem = e.target.value === 'AN_TIEM';
          modal.querySelector('#tiem-fields').classList.toggle('hidden', !isTiem);
        });
      });

      modal.querySelector('#btn-save-dish')?.addEventListener('click', () => {
        const name = modal.querySelector('#dish-name').value.trim();
        if (!name) {
          window.showToast('Vui lòng nhập tên món ăn!');
          return;
        }

        const buaChecked = Array.from(modal.querySelectorAll('input[name="dish_bua"]:checked')).map(cb => cb.value);
        if (buaChecked.length === 0) {
          window.showToast('Vui lòng chọn ít nhất một bữa ăn!');
          return;
        }

        const type = modal.querySelector('input[name="dish_type"]:checked').value;
        const restaurant = modal.querySelector('#dish-restaurant').value.trim();
        const phone = modal.querySelector('#dish-phone').value.trim();
        const kidFav = modal.querySelector('#dish-kid-fav').checked;

        const dishData = {
          id: dish ? dish.id : undefined,
          ten_mon: name,
          bua_an: buaChecked,
          loai_hinh: type,
          ten_quan: type === 'AN_TIEM' ? restaurant : '',
          so_dien_thoai: type === 'AN_TIEM' ? phone : '',
          con_thich: kidFav
        };

        this.api.saveDish(dishData);
        modal.remove();
        window.showToast(isEdit ? 'Đã cập nhật món ăn!' : 'Đã thêm món mới vào kho!');
        this.renderCurrentView();
      });
    });
  }

  // Modal Thùng rác (Khôi phục món)
  openTrashModal() {
    const deletedDishes = this.store.getDeletedDishes();

    const modalHtml = `
      <div id="modal-trash" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop bg-black/40">
        <div class="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 max-h-[85vh] flex flex-col shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base">🗑️ Thùng Rác Món Ăn</h3>
              <p class="text-xs text-gray-400 mt-0.5">Các món đã bị xóa mềm, bạn có thể khôi phục lại</p>
            </div>
            <button id="btn-close-trash" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div class="overflow-y-auto py-3 space-y-2 flex-1 pr-1 text-xs">
            ${deletedDishes.length === 0 ? `
              <div class="text-center py-8 text-gray-400">Thùng rác trống.</div>
            ` : deletedDishes.map(dish => `
              <div class="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
                <div>
                  <span class="font-bold text-gray-800 dark:text-gray-200">${dish.ten_mon}</span>
                  <div class="text-[11px] text-gray-400 mt-0.5">
                    ${dish.loai_hinh === 'AN_TIEM' ? 'Ăn tiệm' : 'Tự nấu'}
                  </div>
                </div>

                <button data-restore-dish="${dish.id}" class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition">
                  <i class="fa-solid fa-rotate-left mr-1"></i>Khôi phục
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.renderModal(modalHtml, (modal) => {
      modal.querySelector('#btn-close-trash')?.addEventListener('click', () => modal.remove());
      modal.querySelectorAll('button[data-restore-dish]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-restore-dish');
          this.api.restoreDish(id);
          window.showToast('Đã khôi phục món ăn!');
          modal.remove();
          this.renderCurrentView();
        });
      });
    });
  }

  /* =========================================================================
   * MÀN HÌNH 4: CÀI ĐẶT (SETTINGS)
   * ========================================================================= */
  renderSettingsView(container) {
    const isFather = this.store.role === 'FATHER';
    const isMother = this.store.role === 'MOTHER';

    container.innerHTML = `
      <div class="space-y-4 text-sm">
        <!-- Đổi Danh Tính Thiết Bị -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
          <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center space-x-2">
            <i class="fa-solid fa-user-gear text-orange-500"></i>
            <span>Danh Tính Thiết Bị Này</span>
          </h3>
          <p class="text-xs text-gray-400">Chọn đúng vai trò để hệ thống cấp quyền chốt món và bình chọn tương ứng:</p>

          <div class="grid grid-cols-2 gap-2.5 pt-1">
            <button id="btn-role-father" class="p-3 rounded-2xl border-2 transition text-left ${isFather ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-700'}">
              <div class="text-2xl mb-1">👨</div>
              <div class="font-bold text-gray-800 dark:text-gray-100">Tôi là Bố</div>
              <div class="text-[11px] text-gray-400 mt-0.5">Bình chọn & đề xuất món</div>
            </button>

            <button id="btn-role-mother" class="p-3 rounded-2xl border-2 transition text-left ${isMother ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30' : 'border-gray-200 dark:border-gray-700'}">
              <div class="text-2xl mb-1">👩</div>
              <div class="font-bold text-gray-800 dark:text-gray-100">Tôi là Mẹ</div>
              <div class="text-[11px] text-gray-400 mt-0.5">Quyền chốt thực đơn chính</div>
            </button>
          </div>
        </div>

        <!-- Cấu hình số ngày tránh ăn trùng -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
          <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center space-x-2">
            <i class="fa-solid fa-repeat text-amber-500"></i>
            <span>Quy Tắc Tránh Ăn Trùng Lặp</span>
          </h3>
          <p class="text-xs text-gray-400">Khi bấm xúc xắc gợi ý món, hệ thống sẽ loại trừ các món đã ăn trong khoảng này:</p>

          <div class="flex items-center space-x-3 pt-1">
            <input id="input-repeat-days" type="number" min="1" max="14" value="${this.store.repeatDays}" class="w-20 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-orange-500">
            <span class="text-xs text-gray-600 dark:text-gray-300 font-medium">ngày gần nhất (Mặc định: 3 ngày)</span>
          </div>
        </div>

        <!-- Cấu hình Google Apps Script Web App URL -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center space-x-2">
              <i class="fa-solid fa-cloud text-blue-500"></i>
              <span>Kết Nối Google Sheets</span>
            </h3>
            <button id="btn-show-guide" class="text-xs text-orange-500 font-semibold hover:underline">
              Xem hướng dẫn 3 bước
            </button>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Web App URL (Apps Script):</label>
            <input id="input-gas-url" type="url" value="${this.store.gasUrl}" placeholder="https://script.google.com/macros/s/.../exec" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>

          <div class="flex items-center space-x-2 pt-1">
            <button id="btn-save-gas-url" class="flex-1 py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition">
              Lưu & Kiểm tra kết nối
            </button>
          </div>
        </div>

        <!-- Dọn dẹp & Reset -->
        <div class="pt-2 text-center">
          <button id="btn-reset-cache" class="text-xs text-red-500 hover:text-red-700 underline font-medium">
            Xóa bộ nhớ đệm (Reset dữ liệu local)
          </button>
        </div>
      </div>
    `;

    // Sự kiện đổi danh tính
    container.querySelector('#btn-role-father')?.addEventListener('click', () => {
      this.store.setRole('FATHER');
      window.showToast('Đã chuyển danh tính: Bố 👨');
      this.renderHeader();
      this.renderSettingsView(container);
    });

    container.querySelector('#btn-role-mother')?.addEventListener('click', () => {
      this.store.setRole('MOTHER');
      window.showToast('Đã chuyển danh tính: Mẹ 👩');
      this.renderHeader();
      this.renderSettingsView(container);
    });

    // Sự kiện đổi số ngày tránh ăn trùng
    container.querySelector('#input-repeat-days')?.addEventListener('change', (e) => {
      this.store.setRepeatDays(e.target.value);
      window.showToast(`Đã cập nhật: Tránh trùng ${this.store.repeatDays} ngày.`);
    });

    // Lưu URL Google Apps Script
    container.querySelector('#btn-save-gas-url')?.addEventListener('click', async () => {
      const url = container.querySelector('#input-gas-url').value.trim();
      this.store.setGasUrl(url);
      window.showToast('Đang kết nối tới Google Apps Script...');
      await this.api.syncNow();
      this.renderHeader();
      window.showToast('Đã lưu cấu hình kết nối!');
    });

    // Xem hướng dẫn
    container.querySelector('#btn-show-guide')?.addEventListener('click', () => {
      this.openGuideModal();
    });

    // Reset dữ liệu
    container.querySelector('#btn-reset-cache')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn xóa bộ nhớ đệm và đặt lại cấu hình ứng dụng?')) {
        localStorage.clear();
        location.reload();
      }
    });
  }

  // Modal Setup Ban Đầu (Màn hình 0)
  openSetupModal() {
    const modalHtml = `
      <div id="modal-setup" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/60">
        <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
          <div class="text-center space-y-1">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white text-2xl shadow-lg shadow-orange-500/30">
              🍽️
            </div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 pt-2">Chào mừng đến với Hôm Nay Ăn Gì!</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Ứng dụng chọn món ăn & lập kế hoạch bữa ăn gia đình</p>
          </div>

          <div class="space-y-2 pt-2">
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300">1. Bạn đang sử dụng thiết bị của ai?</label>
            <div class="grid grid-cols-2 gap-3">
              <button id="setup-choose-father" type="button" class="p-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 text-center transition">
                <div class="text-3xl mb-1">👨</div>
                <div class="font-bold text-sm text-gray-800 dark:text-gray-100">Tôi là Bố</div>
              </button>
              <button id="setup-choose-mother" type="button" class="p-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-pink-500 text-center transition">
                <div class="text-3xl mb-1">👩</div>
                <div class="font-bold text-sm text-gray-800 dark:text-gray-100">Tôi là Mẹ</div>
              </button>
            </div>
          </div>

          <div class="space-y-1.5 pt-1">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300">2. Đường dẫn Google Apps Script (tùy chọn):</label>
              <button id="setup-btn-guide" class="text-[11px] text-orange-500 font-semibold underline">3 bước tạo URL</button>
            </div>
            <input id="setup-gas-url" type="url" placeholder="Dán link Web App URL tại đây..." class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500">
            <p class="text-[11px] text-gray-400">Nếu chưa tạo Google Sheet, bạn có thể để trống để dùng thử chế độ Offline/Demo.</p>
          </div>

          <div class="pt-3">
            <button id="btn-start-using" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition">
              Bắt đầu sử dụng
            </button>
          </div>
        </div>
      </div>
    `;

    this.renderModal(modalHtml, (modal) => {
      let selectedRole = 'MOTHER';
      const btnFather = modal.querySelector('#setup-choose-father');
      const btnMother = modal.querySelector('#setup-choose-mother');

      const updateRoleUI = (role) => {
        selectedRole = role;
        if (role === 'FATHER') {
          btnFather.classList.add('border-blue-500', 'bg-blue-50/60', 'dark:bg-blue-950/40');
          btnMother.classList.remove('border-pink-500', 'bg-pink-50/60', 'dark:bg-pink-950/40');
        } else {
          btnMother.classList.add('border-pink-500', 'bg-pink-50/60', 'dark:bg-pink-950/40');
          btnFather.classList.remove('border-blue-500', 'bg-blue-50/60', 'dark:bg-blue-950/40');
        }
      };

      updateRoleUI('MOTHER'); // Mặc định

      btnFather.addEventListener('click', () => updateRoleUI('FATHER'));
      btnMother.addEventListener('click', () => updateRoleUI('MOTHER'));

      modal.querySelector('#setup-btn-guide')?.addEventListener('click', () => {
        this.openGuideModal();
      });

      modal.querySelector('#btn-start-using')?.addEventListener('click', () => {
        const url = modal.querySelector('#setup-gas-url').value.trim();
        this.store.setRole(selectedRole);
        if (url) this.store.setGasUrl(url);
        modal.remove();
        this.renderHeader();
        this.renderCurrentView();
        window.showToast(`Chào mừng ${selectedRole === 'FATHER' ? 'Bố' : 'Mẹ'}!`);
      });
    });
  }

  // Modal Hướng dẫn 3 bước
  openGuideModal() {
    const modalHtml = `
      <div id="modal-guide" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/60">
        <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-5 max-h-[85vh] flex flex-col shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base">📖 Hướng Dẫn Kết Nối 3 Bước</h3>
            <button id="btn-close-guide" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div class="overflow-y-auto py-3 space-y-3.5 text-xs text-gray-700 dark:text-gray-300 flex-1 pr-1">
            <div class="p-3 rounded-2xl bg-orange-50/60 dark:bg-gray-800/60 border border-orange-100 dark:border-gray-700 space-y-1">
              <strong class="text-orange-600 dark:text-orange-400 font-bold block text-sm">Bước 1: Tạo Google Sheets mới</strong>
              <p>Mở trình duyệt vào <a href="https://sheets.new" target="_blank" class="text-blue-500 underline font-semibold">sheets.new</a> để tạo bảng tính mới. Đổi tên thành <em>Hom Nay An Gi</em>.</p>
            </div>

            <div class="p-3 rounded-2xl bg-amber-50/60 dark:bg-gray-800/60 border border-amber-100 dark:border-gray-700 space-y-1">
              <strong class="text-amber-600 dark:text-amber-400 font-bold block text-sm">Bước 2: Mở Apps Script & Dán mã nguồn</strong>
              <p>1. Vào <strong>Tiện ích mở rộng</strong> (Extensions) -> <strong>Apps Script</strong>.</p>
              <p>2. Xóa code cũ, copy toàn bộ nội dung trong tệp <code>backend/Code.gs</code> dán vào.</p>
              <p>3. Bấm nút <strong>Triển khai</strong> (Deploy) -> <strong>Quản lý bản triển khai mới</strong> (New deployment).</p>
              <p>4. Chọn <strong>Ứng dụng web</strong> (Web app):
                <br>• Thực thi dưới dạng: <em>Tôi (Me)</em>
                <br>• Ai có quyền truy cập: <strong>Bất kỳ ai (Anyone)</strong>
              </p>
              <p>5. Bấm Triển khai, cấp quyền và sao chép đường link <strong>Web App URL</strong>.</p>
            </div>

            <div class="p-3 rounded-2xl bg-emerald-50/60 dark:bg-gray-800/60 border border-emerald-100 dark:border-gray-700 space-y-1">
              <strong class="text-emerald-600 dark:text-emerald-400 font-bold block text-sm">Bước 3: Dán link vào ứng dụng</strong>
              <p>Dán đường link Web App URL vào ô cài đặt trong ứng dụng. Hệ thống sẽ tự động tạo 3 sheet và nạp sẵn 15 món ăn mẫu thân thuộc!</p>
            </div>
          </div>

          <div class="pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
            <button id="btn-guide-ok" class="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs">
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    `;

    this.renderModal(modalHtml, (modal) => {
      modal.querySelector('#btn-close-guide')?.addEventListener('click', () => modal.remove());
      modal.querySelector('#btn-guide-ok')?.addEventListener('click', () => modal.remove());
    });
  }

  // Helper render modal chung
  renderModal(html, binder) {
    const existingModal = document.querySelector('.modal-backdrop');
    if (existingModal) existingModal.remove();

    const div = document.createElement('div');
    div.innerHTML = html.trim();
    const modalEl = div.firstChild;
    document.body.appendChild(modalEl);

    if (binder) binder(modalEl);
  }
}

window.UIRenderer = UIRenderer;
