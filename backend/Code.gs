/**
 * HÔM NAY ĂN GÌ - FAMILY MEAL PLANNER
 * Google Apps Script Backend (Code.gs) - Phiên bản tối ưu v1.2
 * 
 * Khắc phục triệt để:
 * 1. Lệch múi giờ ngày ăn giữa Google Sheets và Trình duyệt
 * 2. Hỗ trợ cả GET và POST để không bị chặn CORS trên các trình duyệt di động
 * 3. Hỗ trợ chọn nhiều món cho 1 bữa ăn
 */

const SHEET_NAMES = {
  MON_AN: 'MON_AN',
  LICH_SU: 'LICH_SU_VA_KE_HOACH',
  BINH_CHON: 'BINH_CHON'
};

// Khởi tạo và kiểm tra Sheet cơ sở dữ liệu
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet MON_AN
  let sheetMonAn = ss.getSheetByName(SHEET_NAMES.MON_AN);
  if (!sheetMonAn) {
    sheetMonAn = ss.insertSheet(SHEET_NAMES.MON_AN);
    sheetMonAn.appendRow(['id', 'ten_mon', 'bua_an', 'loai_hinh', 'ten_quan', 'so_dien_thoai', 'con_thich', 'da_xoa']);
    sheetMonAn.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#FFF2CC');
    
    // Nạp sẵn 15 món ăn mẫu chuẩn theo yêu cầu dự án
    const seedDishes = [
      ['dish-01', 'Phở bò', JSON.stringify(['SANG']), 'AN_TIEM', 'Phở Gia Truyền', '0901234567', false, false],
      ['dish-02', 'Bánh mì ốp la', JSON.stringify(['SANG']), 'NAU_NHA', '', '', false, false],
      ['dish-03', 'Bún chả', JSON.stringify(['TRUA']), 'AN_TIEM', 'Bún Chả Hà Nội', '0902345678', false, false],
      ['dish-04', 'Cơm sườn nướng', JSON.stringify(['TRUA', 'TOI']), 'AN_TIEM', 'Cơm Tấm Sài Gòn', '0903456789', true, false],
      ['dish-05', 'Thịt kho tàu', JSON.stringify(['TRUA', 'TOI']), 'NAU_NHA', '', '', true, false],
      ['dish-06', 'Canh chua cá lóc', JSON.stringify(['TRUA', 'TOI']), 'NAU_NHA', '', '', false, false],
      ['dish-07', 'Gà chiên nước mắm', JSON.stringify(['TRUA', 'TOI']), 'NAU_NHA', '', '', true, false],
      ['dish-08', 'Rau muống xào tỏi', JSON.stringify(['TRUA', 'TOI']), 'NAU_NHA', '', '', false, false],
      ['dish-09', 'Bò xào thiên lý', JSON.stringify(['TRUA', 'TOI']), 'NAU_NHA', '', '', false, false],
      ['dish-10', 'Trứng chiên thịt băm', JSON.stringify(['TRUA', 'TOI']), 'NAU_NHA', '', '', true, false],
      ['dish-11', 'Hủ tiếu Nam Vang', JSON.stringify(['SANG', 'TOI']), 'AN_TIEM', 'Quán Hủ Tiếu Chợ Lớn', '0904567890', false, false],
      ['dish-12', 'Cá thu sốt cà', JSON.stringify(['TRUA', 'TOI']), 'NAU_NHA', '', '', false, false],
      ['dish-13', 'Sườn xào chua ngọt', JSON.stringify(['TRUA', 'TOI']), 'NAU_NHA', '', '', true, false],
      ['dish-14', 'Bánh cuốn nóng', JSON.stringify(['SANG']), 'AN_TIEM', 'Bánh Cuốn Thanh Trì', '0905678901', false, false],
      ['dish-15', 'Pizza phô mai', JSON.stringify(['TOI']), 'AN_TIEM', 'The Pizza Company', '19006066', true, false]
    ];
    
    seedDishes.forEach(row => sheetMonAn.appendRow(row));
  }
  
  // 2. Sheet LICH_SU_VA_KE_HOACH
  let sheetLichSu = ss.getSheetByName(SHEET_NAMES.LICH_SU);
  if (!sheetLichSu) {
    sheetLichSu = ss.insertSheet(SHEET_NAMES.LICH_SU);
    sheetLichSu.appendRow(['ngay', 'bua', 'mon_id', 'ghi_chu_dac_biet', 'nguoi_chot', 'thoi_gian_chot']);
    sheetLichSu.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#D9EAD3');
  }
  
  // 3. Sheet BINH_CHON
  let sheetBinhChon = ss.getSheetByName(SHEET_NAMES.BINH_CHON);
  if (!sheetBinhChon) {
    sheetBinhChon = ss.insertSheet(SHEET_NAMES.BINH_CHON);
    sheetBinhChon.appendRow(['ngay', 'bua', 'nguoi_vote', 'mon_id', 'nhuong_quyen']);
    sheetBinhChon.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#FCE5CD');
  }
}

// Helper: Chuẩn hóa chuỗi ngày tháng YYYY-MM-DD an toàn tuyệt đối với múi giờ
function getSafeDateStr(cellVal, ss) {
  if (!cellVal) return '';
  if (cellVal instanceof Date) {
    // Dùng timezone của spreadsheet hoặc GMT+7 (Asia/Ho_Chi_Minh)
    const tz = (ss && ss.getSpreadsheetTimeZone()) ? ss.getSpreadsheetTimeZone() : 'Asia/Ho_Chi_Minh';
    return Utilities.formatDate(cellVal, tz, 'yyyy-MM-dd');
  }
  let s = String(cellVal).trim();
  if (s.includes('T')) s = s.split('T')[0];
  return s;
}

// Xử lý GET Request - Đọc toàn bộ snapshot hoặc thực thi action fallback
function doGet(e) {
  try {
    initDatabase();
    
    // Nếu có tham số action trong URL GET (fallback khi POST bị chặn CORS trên trình duyệt)
    if (e && e.parameter && e.parameter.action && e.parameter.action !== 'GET_SNAPSHOT') {
      let payload = {};
      if (e.parameter.payload) {
        try {
          payload = JSON.parse(e.parameter.payload);
        } catch (err) {
          payload = e.parameter;
        }
      } else {
        payload = e.parameter;
      }
      return executeAction(e.parameter.action, payload);
    }

    const data = getFullSnapshot();
    return createJsonResponse({ status: 'success', data: data });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// Xử lý POST Request - Tiếp nhận các thao tác từ máy Ba/Mẹ
function doPost(e) {
  try {
    initDatabase();
    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (err) {
        body = e.parameter || {};
      }
    } else if (e.parameter) {
      body = e.parameter;
    }
    
    const action = body.action;
    const payload = body.payload || body;
    return executeAction(action, payload);
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// Bộ xử lý thống nhất mọi Action
function executeAction(action, payload) {
  let result = {};
  
  switch (action) {
    case 'VOTE':
      result = handleVote(payload);
      break;
    case 'CHOT_MON':
      result = handleChotMon(payload);
      break;
    case 'NHUONG_QUYEN':
      result = handleNhuongQuyen(payload);
      break;
    case 'HUY_CHOT':
      result = handleHuyChot(payload);
      break;
    case 'SPECIAL_MEAL':
      result = handleSpecialMeal(payload);
      break;
    case 'SAVE_DISH':
      result = handleSaveDish(payload);
      break;
    case 'DELETE_DISH':
      result = handleDeleteDish(payload);
      break;
    case 'RESTORE_DISH':
      result = handleRestoreDish(payload);
      break;
    case 'UPDATE_SCHEDULE':
      result = handleUpdateSchedule(payload);
      break;
    case 'GET_SNAPSHOT':
      result = getFullSnapshot();
      break;
    default:
      return createJsonResponse({ status: 'error', message: 'Hành động không hợp lệ: ' + action });
  }
  
  const snapshot = getFullSnapshot();
  return createJsonResponse({ status: 'success', action: action, result: result, data: snapshot });
}

// Helper: Trả về JSON chuẩn CORS
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Đọc toàn bộ dữ liệu trả về cho Frontend
function getFullSnapshot() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone() || 'Asia/Ho_Chi_Minh';
  
  // 1. Món ăn
  const sheetMonAn = ss.getSheetByName(SHEET_NAMES.MON_AN);
  const rowsMonAn = sheetMonAn.getDataRange().getValues();
  const dishes = [];
  for (let i = 1; i < rowsMonAn.length; i++) {
    const r = rowsMonAn[i];
    if (!r[0]) continue;
    let buaAn = [];
    try {
      buaAn = typeof r[2] === 'string' && r[2].startsWith('[') ? JSON.parse(r[2]) : (r[2] ? [r[2]] : []);
    } catch(err) {
      buaAn = [r[2]];
    }
    dishes.push({
      id: String(r[0]),
      ten_mon: String(r[1]),
      bua_an: buaAn,
      loai_hinh: String(r[3]),
      ten_quan: String(r[4] || ''),
      so_dien_thoai: String(r[5] || ''),
      con_thich: Boolean(r[6]),
      da_xoa: Boolean(r[7])
    });
  }
  
  // 2. Lịch sử & Kế hoạch
  const sheetLichSu = ss.getSheetByName(SHEET_NAMES.LICH_SU);
  const rowsLichSu = sheetLichSu.getDataRange().getValues();
  const history = [];
  for (let i = 1; i < rowsLichSu.length; i++) {
    const r = rowsLichSu[i];
    if (!r[0]) continue;
    const dateStr = getSafeDateStr(r[0], ss);
    history.push({
      ngay: String(dateStr),
      bua: String(r[1]),
      mon_id: String(r[2] || ''),
      ghi_chu_dac_biet: String(r[3] || ''),
      nguoi_chot: String(r[4] || ''),
      thoi_gian_chot: r[5] ? (r[5] instanceof Date ? Utilities.formatDate(r[5], tz, 'yyyy-MM-dd HH:mm:ss') : String(r[5])) : ''
    });
  }
  
  // 3. Bình chọn hiện tại
  const sheetBinhChon = ss.getSheetByName(SHEET_NAMES.BINH_CHON);
  const rowsBinhChon = sheetBinhChon.getDataRange().getValues();
  const votes = [];
  for (let i = 1; i < rowsBinhChon.length; i++) {
    const r = rowsBinhChon[i];
    if (!r[0]) continue;
    const dateStr = getSafeDateStr(r[0], ss);
    votes.push({
      ngay: String(dateStr),
      bua: String(r[1]),
      nguoi_vote: String(r[2]),
      mon_id: String(r[3] || ''),
      nhuong_quyen: Boolean(r[4])
    });
  }
  
  return {
    dishes: dishes,
    history: history,
    votes: votes,
    serverTime: Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss')
  };
}

// Xử lý vote món (Hỗ trợ 1 hoặc nhiều món)
function handleVote(payload) {
  // payload: { ngay, bua, nguoi_vote, mon_id }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.BINH_CHON);
  const rows = sheet.getDataRange().getValues();
  const targetDate = String(payload.ngay).trim();
  
  let foundRowIndex = -1;
  let currentNhuongQuyen = false;
  
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const d = getSafeDateStr(r[0], ss);
    if (d === targetDate && String(r[1]) === String(payload.bua) && String(r[2]) === String(payload.nguoi_vote)) {
      foundRowIndex = i + 1;
      currentNhuongQuyen = Boolean(r[4]);
      break;
    }
  }
  
  const monIdVal = Array.isArray(payload.mon_id) ? payload.mon_id.join(',') : (payload.mon_id || '');

  if (monIdVal === null || monIdVal === '') {
    // Hủy vote
    if (foundRowIndex > 0) {
      sheet.deleteRow(foundRowIndex);
    }
  } else {
    if (foundRowIndex > 0) {
      sheet.getRange(foundRowIndex, 4).setValue(monIdVal);
    } else {
      sheet.appendRow(["'" + targetDate, payload.bua, payload.nguoi_vote, monIdVal, currentNhuongQuyen]);
    }
  }
  return { success: true };
}

// Xử lý Chốt món (Hỗ trợ 1 hoặc nhiều món)
function handleChotMon(payload) {
  // payload: { ngay, bua, mon_id, nguoi_chot, ghi_chu_dac_biet }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetHistory = ss.getSheetByName(SHEET_NAMES.LICH_SU);
  const rowsHistory = sheetHistory.getDataRange().getValues();
  const tz = ss.getSpreadsheetTimeZone() || 'Asia/Ho_Chi_Minh';
  const nowStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss');
  
  const monIdVal = Array.isArray(payload.mon_id) ? payload.mon_id.join(',') : (payload.mon_id || '');
  const targetDate = String(payload.ngay).trim();
  let targetRow = -1;
  
  for (let i = 1; i < rowsHistory.length; i++) {
    const r = rowsHistory[i];
    const d = getSafeDateStr(r[0], ss);
    if (d === targetDate && String(r[1]) === String(payload.bua)) {
      targetRow = i + 1;
      break;
    }
  }
  
  if (targetRow > 0) {
    sheetHistory.getRange(targetRow, 3, 1, 4).setValues([[
      monIdVal,
      payload.ghi_chu_dac_biet || '',
      payload.nguoi_chot || '',
      nowStr
    ]]);
  } else {
    // Ghi date với tiền tố dấu ' để Google Sheets không làm lệch múi giờ
    sheetHistory.appendRow([
      "'" + targetDate,
      payload.bua,
      monIdVal,
      payload.ghi_chu_dac_biet || '',
      payload.nguoi_chot || '',
      nowStr
    ]);
  }
  
  // Xóa các vote của bữa này trong Sheet BINH_CHON
  clearMealVotes(targetDate, payload.bua);
  
  return { success: true };
}

// Xử lý Hủy chốt món (Mẹ muốn chọn lại)
function handleHuyChot(payload) {
  // payload: { ngay, bua }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetHistory = ss.getSheetByName(SHEET_NAMES.LICH_SU);
  const rows = sheetHistory.getDataRange().getValues();
  const targetDate = String(payload.ngay).trim();
  
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const d = getSafeDateStr(r[0], ss);
    if (d === targetDate && String(r[1]) === String(payload.bua)) {
      sheetHistory.deleteRow(i + 1);
      break;
    }
  }
  return { success: true };
}

// Xử lý Nhượng quyền chốt món cho Ba
function handleNhuongQuyen(payload) {
  // payload: { ngay, bua, value: true/false }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.BINH_CHON);
  const rows = sheet.getDataRange().getValues();
  const targetDate = String(payload.ngay).trim();
  
  let found = false;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const d = getSafeDateStr(r[0], ss);
    if (d === targetDate && String(r[1]) === String(payload.bua)) {
      sheet.getRange(i + 1, 5).setValue(payload.value);
      found = true;
    }
  }
  
  if (!found) {
    sheet.appendRow(["'" + targetDate, payload.bua, 'SYSTEM', '', payload.value]);
  }
  
  return { success: true };
}

// Xử lý bữa ăn đặc biệt (Ăn đồ cũ / Không nấu / Đi tiệc)
function handleSpecialMeal(payload) {
  // payload: { ngay, bua, ghi_chu_dac_biet, nguoi_chot }
  return handleChotMon({
    ngay: payload.ngay,
    bua: payload.bua,
    mon_id: '',
    ghi_chu_dac_biet: payload.ghi_chu_dac_biet,
    nguoi_chot: payload.nguoi_chot
  });
}

// Xóa votes của một bữa
function clearMealVotes(ngay, bua) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.BINH_CHON);
  const rows = sheet.getDataRange().getValues();
  const targetDate = String(ngay).trim();
  
  for (let i = rows.length - 1; i >= 1; i--) {
    const r = rows[i];
    const d = getSafeDateStr(r[0], ss);
    if (d === targetDate && String(r[1]) === String(bua)) {
      sheet.deleteRow(i + 1);
    }
  }
}

// Thêm / Sửa món ăn
function handleSaveDish(dish) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.MON_AN);
  const rows = sheet.getDataRange().getValues();
  
  let targetRow = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(dish.id)) {
      targetRow = i + 1;
      break;
    }
  }
  
  const buaAnStr = JSON.stringify(dish.bua_an || []);
  
  if (targetRow > 0) {
    sheet.getRange(targetRow, 2, 1, 6).setValues([[
      dish.ten_mon,
      buaAnStr,
      dish.loai_hinh,
      dish.ten_quan || '',
      dish.so_dien_thoai || '',
      Boolean(dish.con_thich)
    ]]);
  } else {
    const newId = dish.id || ('dish-' + Utilities.getUuid().substring(0, 8));
    sheet.appendRow([
      newId,
      dish.ten_mon,
      buaAnStr,
      dish.loai_hinh,
      dish.ten_quan || '',
      dish.so_dien_thoai || '',
      Boolean(dish.con_thich),
      false
    ]);
  }
  return { success: true };
}

// Xóa mềm món ăn (da_xoa = TRUE)
function handleDeleteDish(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.MON_AN);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(payload.id)) {
      sheet.getRange(i + 1, 8).setValue(true);
      return { success: true };
    }
  }
  return { success: false, message: 'Không tìm thấy món' };
}

// Khôi phục món ăn (da_xoa = FALSE)
function handleRestoreDish(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.MON_AN);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(payload.id)) {
      sheet.getRange(i + 1, 8).setValue(false);
      return { success: true };
    }
  }
  return { success: false, message: 'Không tìm thấy món' };
}

// Cập nhật kế hoạch tuần hàng loạt
function handleUpdateSchedule(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.LICH_SU);
  const rows = sheet.getDataRange().getValues();
  const tz = ss.getSpreadsheetTimeZone() || 'Asia/Ho_Chi_Minh';
  const nowStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss');
  
  (payload.meals || []).forEach(meal => {
    const targetDate = String(meal.ngay).trim();
    let targetRow = -1;
    for (let i = 1; i < rows.length; i++) {
      const d = getSafeDateStr(rows[i][0], ss);
      if (d === targetDate && String(rows[i][1]) === String(meal.bua)) {
        targetRow = i + 1;
        break;
      }
    }
    
    const monIdVal = Array.isArray(meal.mon_id) ? meal.mon_id.join(',') : (meal.mon_id || '');

    if (targetRow > 0) {
      sheet.getRange(targetRow, 3, 1, 4).setValues([[
        monIdVal,
        meal.ghi_chu_dac_biet || '',
        meal.nguoi_chot || 'AUTO',
        nowStr
      ]]);
    } else {
      sheet.appendRow([
        "'" + targetDate,
        meal.bua,
        monIdVal,
        meal.ghi_chu_dac_biet || '',
        meal.nguoi_chot || 'AUTO',
        nowStr
      ]);
    }
  });
  
  return { success: true };
}
