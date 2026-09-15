/**
 * API Service & Background Polling cho Hôm Nay Ăn Gì
 */

class ApiService {
  constructor(store) {
    this.store = store;
    this.pollingInterval = null;
    this.POLL_TIME = 45000; // 45 giây theo đặc tả kỹ thuật
    this.isSyncing = false;

    this.initNetworkListeners();
    this.startPolling();
  }

  initNetworkListeners() {
    window.addEventListener('online', () => {
      this.store.isOnline = true;
      this.store.notify();
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.store.isOnline = false;
      this.store.notify();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.syncNow();
      }
    });
  }

  startPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => {
      if (this.store.isOnline && document.visibilityState === 'visible') {
        this.syncNow(true);
      }
    }, this.POLL_TIME);
  }

  async syncNow(isBackground = false) {
    if (!this.store.gasUrl) {
      if (!isBackground) {
        console.log('Chưa cấu hình URL Google Apps Script. Ứng dụng hoạt động ở chế độ ngoại tuyến (Local/Demo).');
      }
      return;
    }

    if (this.isSyncing) return;
    this.isSyncing = true;
    this.store.notify();

    try {
      const response = await fetch(`${this.store.gasUrl}?t=${Date.now()}`, {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status === 'success' && result.data) {
        this.store.updateFromSnapshot(result.data);
      }
    } catch (err) {
      console.warn('Đồng bộ thất bại, tiếp tục sử dụng dữ liệu cục bộ:', err);
    } finally {
      this.isSyncing = false;
      this.store.notify();
    }
  }

  async postAction(action, payload) {
    if (!this.store.gasUrl) {
      console.log(`[Offline Mode] Đã lưu hành động "${action}" vào bộ nhớ cục bộ.`);
      return { status: 'success', offline: true };
    }

    // 1. Thử gửi POST (text/plain để tránh CORS preflight)
    try {
      const response = await fetch(this.store.gasUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: action,
          payload: payload
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          this.store.updateFromSnapshot(result.data);
          return result;
        }
      }
    } catch (err) {
      console.warn(`POST không thành công (${err.message}), tự động chuyển sang GET fallback...`);
    }

    // 2. Fallback qua GET (Google Apps Script luôn chấp nhận GET không bị chặn CORS)
    try {
      const url = new URL(this.store.gasUrl);
      url.searchParams.set('action', action);
      url.searchParams.set('payload', JSON.stringify(payload));
      url.searchParams.set('t', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          this.store.updateFromSnapshot(result.data);
          return result;
        }
      }
    } catch (getErr) {
      console.warn('Fallback GET cũng gặp sự cố, giữ lại dữ liệu cục bộ:', getErr);
    }

    return { status: 'pending_sync' };
  }

  // Các thao tác nghiệp vụ cụ thể
  async vote(ngay, bua, nguoi_vote, mon_id) {
    this.store.setVoteOptimistic(ngay, bua, nguoi_vote, mon_id);
    return this.postAction('VOTE', { ngay, bua, nguoi_vote, mon_id });
  }

  async chotMon(ngay, bua, mon_id, nguoi_chot, ghi_chu_dac_biet = '') {
    this.store.setChotMonOptimistic(ngay, bua, mon_id, nguoi_chot, ghi_chu_dac_biet);
    return this.postAction('CHOT_MON', { ngay, bua, mon_id, nguoi_chot, ghi_chu_dac_biet });
  }

  async huyChot(ngay, bua) {
    this.store.setHuyChotOptimistic(ngay, bua);
    return this.postAction('HUY_CHOT', { ngay, bua });
  }

  async nhuongQuyen(ngay, bua, value) {
    this.store.setNhuongQuyenOptimistic(ngay, bua, value);
    return this.postAction('NHUONG_QUYEN', { ngay, bua, value });
  }

  async specialMeal(ngay, bua, ghi_chu_dac_biet, nguoi_chot) {
    this.store.setChotMonOptimistic(ngay, bua, '', nguoi_chot, ghi_chu_dac_biet);
    return this.postAction('SPECIAL_MEAL', { ngay, bua, ghi_chu_dac_biet, nguoi_chot });
  }

  async saveDish(dish) {
    this.store.saveDishOptimistic(dish);
    return this.postAction('SAVE_DISH', dish);
  }

  async deleteDish(id) {
    this.store.deleteDishOptimistic(id);
    return this.postAction('DELETE_DISH', { id });
  }

  async restoreDish(id) {
    this.store.restoreDishOptimistic(id);
    return this.postAction('RESTORE_DISH', { id });
  }

  async updateSchedule(meals) {
    return this.postAction('UPDATE_SCHEDULE', { meals });
  }
}

window.apiService = new ApiService(window.store);
