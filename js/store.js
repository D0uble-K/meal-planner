/**
 * Store & Business Logic cho ứng dụng Hôm Nay Ăn Gì
 */

const SEED_DISHES = [
  { id: 'dish-01', ten_mon: 'Phở bò', bua_an: ['SANG'], loai_hinh: 'AN_TIEM', ten_quan: 'Phở Gia Truyền', so_dien_thoai: '0901234567', con_thich: false, da_xoa: false },
  { id: 'dish-02', ten_mon: 'Bánh mì ốp la', bua_an: ['SANG'], loai_hinh: 'NAU_NHA', ten_quan: '', so_dien_thoai: '', con_thich: false, da_xoa: false },
  { id: 'dish-03', ten_mon: 'Bún chả', bua_an: ['TRUA'], loai_hinh: 'AN_TIEM', ten_quan: 'Bún Chả Hà Nội', so_dien_thoai: '0902345678', con_thich: false, da_xoa: false },
  { id: 'dish-04', ten_mon: 'Cơm sườn nướng', bua_an: ['TRUA', 'TOI'], loai_hinh: 'AN_TIEM', ten_quan: 'Cơm Tấm Sài Gòn', so_dien_thoai: '0903456789', con_thich: true, da_xoa: false },
  { id: 'dish-05', ten_mon: 'Thịt kho tàu', bua_an: ['TRUA', 'TOI'], loai_hinh: 'NAU_NHA', ten_quan: '', so_dien_thoai: '', con_thich: true, da_xoa: false },
  { id: 'dish-06', ten_mon: 'Canh chua cá lóc', bua_an: ['TRUA', 'TOI'], loai_hinh: 'NAU_NHA', ten_quan: '', so_dien_thoai: '', con_thich: false, da_xoa: false },
  { id: 'dish-07', ten_mon: 'Gà chiên nước mắm', bua_an: ['TRUA', 'TOI'], loai_hinh: 'NAU_NHA', ten_quan: '', so_dien_thoai: '', con_thich: true, da_xoa: false },
  { id: 'dish-08', ten_mon: 'Rau muống xào tỏi', bua_an: ['TRUA', 'TOI'], loai_hinh: 'NAU_NHA', ten_quan: '', so_dien_thoai: '', con_thich: false, da_xoa: false },
  { id: 'dish-09', ten_mon: 'Bò xào thiên lý', bua_an: ['TRUA', 'TOI'], loai_hinh: 'NAU_NHA', ten_quan: '', so_dien_thoai: '', con_thich: false, da_xoa: false },
  { id: 'dish-10', ten_mon: 'Trứng chiên thịt băm', bua_an: ['TRUA', 'TOI'], loai_hinh: 'NAU_NHA', ten_quan: '', so_dien_thoai: '', con_thich: true, da_xoa: false },
  { id: 'dish-11', ten_mon: 'Hủ tiếu Nam Vang', bua_an: ['SANG', 'TOI'], loai_hinh: 'AN_TIEM', ten_quan: 'Quán Hủ Tiếu Chợ Lớn', so_dien_thoai: '0904567890', con_thich: false, da_xoa: false },
  { id: 'dish-12', ten_mon: 'Cá thu sốt cà', bua_an: ['TRUA', 'TOI'], loai_hinh: 'NAU_NHA', ten_quan: '', so_dien_thoai: '', con_thich: false, da_xoa: false },
  { id: 'dish-13', ten_mon: 'Sườn xào chua ngọt', bua_an: ['TRUA', 'TOI'], loai_hinh: 'NAU_NHA', ten_quan: '', so_dien_thoai: '', con_thich: true, da_xoa: false },
  { id: 'dish-14', ten_mon: 'Bánh cuốn nóng', bua_an: ['SANG'], loai_hinh: 'AN_TIEM', ten_quan: 'Bánh Cuốn Thanh Trì', so_dien_thoai: '0905678901', con_thich: false, da_xoa: false },
  { id: 'dish-15', ten_mon: 'Pizza phô mai', bua_an: ['TOI'], loai_hinh: 'AN_TIEM', ten_quan: 'The Pizza Company', so_dien_thoai: '19006066', con_thich: true, da_xoa: false }
];

class Store {
  constructor() {
    this.STORAGE_KEYS = {
      ROLE: 'meal_role',
      GAS_URL: 'meal_gas_url',
      REPEAT_DAYS: 'meal_repeat_days',
      THEME: 'meal_theme',
      DISHES: 'meal_dishes_cache',
      HISTORY: 'meal_history_cache',
      VOTES: 'meal_votes_cache',
      LAST_SYNC: 'meal_last_sync_time'
    };

    this.role = localStorage.getItem(this.STORAGE_KEYS.ROLE) || null; // 'FATHER' | 'MOTHER'
    this.gasUrl = localStorage.getItem(this.STORAGE_KEYS.GAS_URL) || '';
    this.repeatDays = parseInt(localStorage.getItem(this.STORAGE_KEYS.REPEAT_DAYS) || '3', 10);
    this.theme = localStorage.getItem(this.STORAGE_KEYS.THEME) || 'light';
    
    // Khởi tạo dữ liệu cache từ localStorage, nếu chưa có thì nạp SEED_DISHES
    const cachedDishes = localStorage.getItem(this.STORAGE_KEYS.DISHES);
    this.dishes = cachedDishes ? JSON.parse(cachedDishes) : JSON.parse(JSON.stringify(SEED_DISHES));
    
    const cachedHistory = localStorage.getItem(this.STORAGE_KEYS.HISTORY);
    this.history = cachedHistory ? JSON.parse(cachedHistory) : [];
    
    const cachedVotes = localStorage.getItem(this.STORAGE_KEYS.VOTES);
    this.votes = cachedVotes ? JSON.parse(cachedVotes) : [];

    this.lastSync = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC) || null;
    this.isOnline = navigator.onLine;
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  setRole(role) {
    this.role = role;
    localStorage.setItem(this.STORAGE_KEYS.ROLE, role);
    this.notify();
  }

  setGasUrl(url) {
    this.gasUrl = (url || '').trim();
    localStorage.setItem(this.STORAGE_KEYS.GAS_URL, this.gasUrl);
    this.notify();
  }

  setRepeatDays(days) {
    const d = Math.max(1, Math.min(14, parseInt(days, 10) || 3));
    this.repeatDays = d;
    localStorage.setItem(this.STORAGE_KEYS.REPEAT_DAYS, d.toString());
    this.notify();
  }

  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.notify();
  }

  // Cập nhật dữ liệu từ Server snapshot
  updateFromSnapshot(data) {
    if (data.dishes && Array.isArray(data.dishes)) {
      this.dishes = data.dishes;
      localStorage.setItem(this.STORAGE_KEYS.DISHES, JSON.stringify(this.dishes));
    }
    if (data.history && Array.isArray(data.history)) {
      this.history = data.history;
      localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    }
    if (data.votes && Array.isArray(data.votes)) {
      this.votes = data.votes;
      localStorage.setItem(this.STORAGE_KEYS.VOTES, JSON.stringify(this.votes));
    }
    this.lastSync = new Date().toISOString();
    localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, this.lastSync);
    this.notify();
  }

  // Lấy định dạng YYYY-MM-DD từ đối tượng Date
  formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTodayStr() {
    return this.formatDate(new Date());
  }

  // Tìm món ăn theo ID
  getDishById(id) {
    return this.dishes.find(d => d.id === id);
  }

  // Lấy danh sách món đang hoạt động (chưa xóa mềm)
  getActiveDishes() {
    return this.dishes.filter(d => !d.da_xoa);
  }

  // Lấy danh sách món trong thùng rác
  getDeletedDishes() {
    return this.dishes.filter(d => d.da_xoa);
  }

  // Lấy thông tin chốt món cho một ngày & bữa
  getMealDecision(dateStr, mealType) {
    return this.history.find(h => h.ngay === dateStr && h.bua === mealType);
  }

  // Lấy danh sách các vote cho một ngày & bữa
  getMealVotes(dateStr, mealType) {
    return this.votes.filter(v => v.ngay === dateStr && v.bua === mealType && v.nguoi_vote !== 'SYSTEM');
  }

  // Kiểm tra quyền nhượng quyền chốt món cho bữa
  isNhuongQuyen(dateStr, mealType) {
    const voteRecord = this.votes.find(v => v.ngay === dateStr && v.bua === mealType && v.nhuong_quyen === true);
    return Boolean(voteRecord);
  }

  // QUY TẮC 1: Tránh ăn trùng trong N ngày gần nhất (D - N đến D - 1)
  getDishesEatenInRange(targetDateStr, nDays = this.repeatDays) {
    const targetDate = new Date(targetDateStr);
    const eatenDishIds = new Set();

    for (let i = 1; i <= nDays; i++) {
      const prevDate = new Date(targetDate);
      prevDate.setDate(targetDate.getDate() - i);
      const prevDateStr = this.formatDate(prevDate);

      this.history.forEach(h => {
        if (h.ngay === prevDateStr && h.mon_id) {
          eatenDishIds.add(h.mon_id);
        }
      });
    }

    return eatenDishIds;
  }

  // QUY TẮC 2: Hiển thị Lần ăn gần nhất (chỉ hiện nếu delta <= 7 ngày, nếu > 7 hoặc chưa ăn thì ẩn)
  getLastEatenDeltaDays(dishId, currentDateStr = this.getTodayStr()) {
    const currentDate = new Date(currentDateStr);
    let latestEatenDate = null;

    this.history.forEach(h => {
      if (h.mon_id === dishId && h.ngay < currentDateStr) {
        const d = new Date(h.ngay);
        if (!latestEatenDate || d > latestEatenDate) {
          latestEatenDate = d;
        }
      }
    });

    if (!latestEatenDate) return null;

    const diffTime = currentDate.getTime() - latestEatenDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 1 && diffDays <= 7) {
      return diffDays;
    }
    return null;
  }

  // QUY TẮC 3: Bốc thăm xúc xắc ngẫu nhiên
  getRandomDish(mealType, currentDateStr = this.getTodayStr(), relaxRules = false) {
    const activeDishes = this.getActiveDishes().filter(d => d.bua_an && d.bua_an.includes(mealType));
    if (activeDishes.length === 0) return null;

    if (relaxRules) {
      const idx = Math.floor(Math.random() * activeDishes.length);
      return { dish: activeDishes[idx], relaxed: true };
    }

    const eatenIds = this.getDishesEatenInRange(currentDateStr, this.repeatDays);
    const validCandidates = activeDishes.filter(d => !eatenIds.has(d.id));

    if (validCandidates.length === 0) {
      return { exhausted: true };
    }

    const idx = Math.floor(Math.random() * validCandidates.length);
    return { dish: validCandidates[idx], relaxed: false };
  }

  // Lấy các món ăn tiệm/gọi ship quen thuộc sắp xếp theo tần suất gọi nhiều nhất
  getLazyDishes() {
    const eatOutDishes = this.getActiveDishes().filter(d => d.loai_hinh === 'AN_TIEM');
    const counts = {};

    this.history.forEach(h => {
      if (h.mon_id) {
        counts[h.mon_id] = (counts[h.mon_id] || 0) + 1;
      }
    });

    return eatOutDishes.sort((a, b) => {
      const countA = counts[a.id] || 0;
      const countB = counts[b.id] || 0;
      return countB - countA;
    });
  }

  // Lấy danh sách 7 ngày trong tuần hiện tại (từ Thứ 2 đến Chủ Nhật)
  getCurrentWeekDates(baseDate = new Date()) {
    const current = new Date(baseDate);
    const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday,...
    // Chuẩn hóa: Thứ 2 là ngày bắt đầu tuần (offset 0)
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(current);
    monday.setDate(current.getDate() - distanceToMonday);

    const week = [];
    const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push({
        dayName: dayNames[i],
        dateStr: this.formatDate(d),
        isWeekend: (i >= 5), // T7 (index 5) và CN (index 6)
        dateObj: d
      });
    }
    return week;
  }

  // QUY TẮC 4: Xáo trộn thực đơn tuần
  // CHỈ hoán đổi ngẫu nhiên T2 - T6; GIỮ NGUYÊN 100% Thứ 7 và Chủ Nhật!
  shuffleWeekdaySchedule(weekDates) {
    const weekdays = weekDates.slice(0, 5); // T2 đến T6
    const meals = ['SANG', 'TRUA', 'TOI'];
    const updatedMeals = [];

    // Lấy toàn bộ thực đơn hiện có của T2 - T6 theo từng bữa
    meals.forEach(bua => {
      const currentList = weekdays.map(day => {
        const item = this.getMealDecision(day.dateStr, bua);
        return {
          mon_id: item ? item.mon_id : '',
          ghi_chu_dac_biet: item ? item.ghi_chu_dac_biet : ''
        };
      });

      // Fisher-Yates shuffle mảng thực đơn của 5 ngày
      for (let i = currentList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentList[i], currentList[j]] = [currentList[j], currentList[i]];
      }

      // Gán lại cho các ngày T2 - T6
      weekdays.forEach((day, index) => {
        updatedMeals.push({
          ngay: day.dateStr,
          bua: bua,
          mon_id: currentList[index].mon_id,
          ghi_chu_dac_biet: currentList[index].ghi_chu_dac_biet,
          nguoi_chot: 'XÁO TRỘN'
        });
      });
    });

    // Cập nhật vào history local
    updatedMeals.forEach(um => {
      const existingIdx = this.history.findIndex(h => h.ngay === um.ngay && h.bua === um.bua);
      if (existingIdx >= 0) {
        this.history[existingIdx] = { ...this.history[existingIdx], ...um };
      } else {
        this.history.push(um);
      }
    });

    localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    this.notify();
    return updatedMeals;
  }

  // Sao chép thực đơn tuần trước sang tuần này
  copyLastWeekSchedule(currentWeekDates) {
    const updatedMeals = [];
    const meals = ['SANG', 'TRUA', 'TOI'];

    currentWeekDates.forEach(day => {
      const curDate = new Date(day.dateStr);
      const prevDate = new Date(curDate);
      prevDate.setDate(curDate.getDate() - 7);
      const prevDateStr = this.formatDate(prevDate);

      meals.forEach(bua => {
        const lastWeekItem = this.getMealDecision(prevDateStr, bua);
        if (lastWeekItem) {
          const newItem = {
            ngay: day.dateStr,
            bua: bua,
            mon_id: lastWeekItem.mon_id || '',
            ghi_chu_dac_biet: lastWeekItem.ghi_chu_dac_biet || '',
            nguoi_chot: 'SAO CHÉP TUẦN TRƯỚC'
          };
          updatedMeals.push(newItem);

          const existingIdx = this.history.findIndex(h => h.ngay === day.dateStr && h.bua === bua);
          if (existingIdx >= 0) {
            this.history[existingIdx] = { ...this.history[existingIdx], ...newItem };
          } else {
            this.history.push(newItem);
          }
        }
      });
    });

    localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    this.notify();
    return updatedMeals;
  }

  // Cập nhật vote lạc quan (Optimistic Update)
  setVoteOptimistic(ngay, bua, nguoi_vote, mon_id) {
    const existingIdx = this.votes.findIndex(v => v.ngay === ngay && v.bua === bua && v.nguoi_vote === nguoi_vote);
    if (!mon_id) {
      if (existingIdx >= 0) this.votes.splice(existingIdx, 1);
    } else {
      if (existingIdx >= 0) {
        this.votes[existingIdx].mon_id = mon_id;
      } else {
        this.votes.push({
          ngay,
          bua,
          nguoi_vote,
          mon_id,
          nhuong_quyen: false
        });
      }
    }
    localStorage.setItem(this.STORAGE_KEYS.VOTES, JSON.stringify(this.votes));
    this.notify();
  }

  // Chốt món lạc quan
  setChotMonOptimistic(ngay, bua, mon_id, nguoi_chot, ghi_chu_dac_biet = '') {
    const existingIdx = this.history.findIndex(h => h.ngay === ngay && h.bua === bua);
    const item = {
      ngay,
      bua,
      mon_id,
      ghi_chu_dac_biet,
      nguoi_chot,
      thoi_gian_chot: new Date().toISOString()
    };
    if (existingIdx >= 0) {
      this.history[existingIdx] = item;
    } else {
      this.history.push(item);
    }

    // Xóa các vote tương ứng
    this.votes = this.votes.filter(v => !(v.ngay === ngay && v.bua === bua));

    localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    localStorage.setItem(this.STORAGE_KEYS.VOTES, JSON.stringify(this.votes));
    this.notify();
  }

  // Hủy chốt món lạc quan
  setHuyChotOptimistic(ngay, bua) {
    this.history = this.history.filter(h => !(h.ngay === ngay && h.bua === bua));
    localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    this.notify();
  }

  // Nhượng quyền lạc quan
  setNhuongQuyenOptimistic(ngay, bua, value) {
    const record = this.votes.find(v => v.ngay === ngay && v.bua === bua);
    if (record) {
      record.nhuong_quyen = value;
    } else {
      this.votes.push({
        ngay,
        bua,
        nguoi_vote: 'SYSTEM',
        mon_id: '',
        nhuong_quyen: value
      });
    }
    localStorage.setItem(this.STORAGE_KEYS.VOTES, JSON.stringify(this.votes));
    this.notify();
  }

  // Lưu món ăn lạc quan
  saveDishOptimistic(dish) {
    const existingIdx = this.dishes.findIndex(d => d.id === dish.id);
    if (existingIdx >= 0) {
      this.dishes[existingIdx] = { ...this.dishes[existingIdx], ...dish };
    } else {
      const newDish = {
        ...dish,
        id: dish.id || ('dish-' + Date.now().toString(36)),
        da_xoa: false
      };
      this.dishes.push(newDish);
    }
    localStorage.setItem(this.STORAGE_KEYS.DISHES, JSON.stringify(this.dishes));
    this.notify();
  }

  // Xóa mềm món ăn lạc quan
  deleteDishOptimistic(id) {
    const dish = this.dishes.find(d => d.id === id);
    if (dish) {
      dish.da_xoa = true;
      localStorage.setItem(this.STORAGE_KEYS.DISHES, JSON.stringify(this.dishes));
      this.notify();
    }
  }

  // Khôi phục món ăn lạc quan
  restoreDishOptimistic(id) {
    const dish = this.dishes.find(d => d.id === id);
    if (dish) {
      dish.da_xoa = false;
      localStorage.setItem(this.STORAGE_KEYS.DISHES, JSON.stringify(this.dishes));
      this.notify();
    }
  }
}

window.store = new Store();
