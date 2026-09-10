(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) { module.exports = factory(); }
  else { root.Logic = factory(); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var PROGRESS_KEY = "qianling-progress-v1";
  var CURRENT_WEEK_KEY = "qianling-current-week";
  var LAST_WEEK_KEY = "qianling-last-checkin-week";
  var APP_VERSION_KEY = "qianling-app-version";
  var DEFAULT_WEEK = 2;

  function parseContent(text) {
    var data = JSON.parse(text);
    if (!Array.isArray(data.weeks) || typeof data.details !== "object" || data.details === null) {
      throw new Error("content.json 结构不对：需要 weeks 数组和 details 对象");
    }
    return data;
  }

  function getWeek(content, weekNum) {
    for (var i = 0; i < content.weeks.length; i++) {
      if (content.weeks[i].week === weekNum) return content.weeks[i];
    }
    return undefined;
  }

  function getDetail(content, weekNum) {
    return content.details[String(weekNum)] || null;
  }

  function clampWeek(n) {
    n = Number(n);
    if (!Number.isFinite(n)) return DEFAULT_WEEK;
    return Math.min(48, Math.max(1, Math.round(n)));
  }

  function loadProgress(storage) {
    try {
      var raw = storage.getItem(PROGRESS_KEY);
      if (!raw) return {};
      var p = JSON.parse(raw);
      return (p && typeof p === "object") ? p : {};
    } catch (e) { return {}; }
  }

  function saveProgress(storage, progress) {
    storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  function toggleDay(progress, weekNum, dayNum) {
    var p = JSON.parse(JSON.stringify(progress || {}));
    var wk = String(weekNum), d = String(dayNum);
    if (!p[wk]) p[wk] = {};
    p[wk][d] = !p[wk][d];
    return p;
  }

  function isDayDone(progress, weekNum, dayNum) {
    return !!(progress && progress[String(weekNum)] && progress[String(weekNum)][String(dayNum)]);
  }

  function weekDoneCount(progress, weekNum) {
    var wk = progress && progress[String(weekNum)];
    if (!wk) return 0;
    return Object.keys(wk).filter(function (d) { return !!wk[d]; }).length;
  }

  // 一周里真正需要打卡的日子（休息日不算）
  function activityDays(detail) {
    if (!detail || !Array.isArray(detail.days)) return [];
    return detail.days.filter(function (d) { return !d.rest; }).map(function (d) { return d.day; });
  }

  function doneCount(progress, weekNum, days) {
    var wk = progress && progress[String(weekNum)];
    if (!wk) return 0;
    return days.filter(function (d) { return !!wk[String(d)]; }).length;
  }

  function allDaysDone(progress, weekNum, days) {
    return days.length > 0 && doneCount(progress, weekNum, days) === days.length;
  }

  // 整周打卡：还没全勾就全勾上，已经全勾了就全部取消
  function toggleWeek(progress, weekNum, days) {
    var p = JSON.parse(JSON.stringify(progress || {}));
    var wk = String(weekNum);
    if (!p[wk]) p[wk] = {};
    var target = !allDaysDone(progress, weekNum, days);
    days.forEach(function (d) { p[wk][String(d)] = target; });
    return p;
  }

  function loadCurrentWeek(storage) {
    try {
      var raw = storage.getItem(CURRENT_WEEK_KEY);
      if (raw === null || raw === undefined || raw === "") return DEFAULT_WEEK;
      return clampWeek(Number(raw));
    } catch (e) { return DEFAULT_WEEK; }
  }

  function saveCurrentWeek(storage, weekNum) {
    storage.setItem(CURRENT_WEEK_KEY, String(weekNum));
  }

  // 「上一次打卡的那一周」：Mei 打开 App 就停在这里，跟着她真实进度走。
  // 没打过卡（返回 null）时上层再退回 loadCurrentWeek。
  function loadLastCheckinWeek(storage) {
    try {
      var raw = storage.getItem(LAST_WEEK_KEY);
      if (raw === null || raw === undefined || raw === "") return null;
      var n = Number(raw);
      if (!Number.isFinite(n)) return null;
      return clampWeek(n);
    } catch (e) { return null; }
  }

  function saveLastCheckinWeek(storage, weekNum) {
    try { storage.setItem(LAST_WEEK_KEY, String(clampWeek(weekNum))); } catch (e) { /* 存不下就算了 */ }
  }

  async function fetchContent(fetchImpl) {
    try {
      var res = await fetchImpl("content.json?ts=" + Date.now());
      if (res && res.ok) return await res.json();
    } catch (e) { /* 走回退 */ }
    try {
      var res2 = await fetchImpl("content.json");
      if (res2 && res2.ok) return await res2.json();
    } catch (e) { /* 走失败 */ }
    return null;
  }

  return {
    PROGRESS_KEY: PROGRESS_KEY,
    CURRENT_WEEK_KEY: CURRENT_WEEK_KEY,
    LAST_WEEK_KEY: LAST_WEEK_KEY,
    APP_VERSION_KEY: APP_VERSION_KEY,
    DEFAULT_WEEK: DEFAULT_WEEK,
    parseContent: parseContent,
    getWeek: getWeek,
    getDetail: getDetail,
    clampWeek: clampWeek,
    loadProgress: loadProgress,
    saveProgress: saveProgress,
    toggleDay: toggleDay,
    isDayDone: isDayDone,
    weekDoneCount: weekDoneCount,
    activityDays: activityDays,
    doneCount: doneCount,
    allDaysDone: allDaysDone,
    toggleWeek: toggleWeek,
    loadCurrentWeek: loadCurrentWeek,
    saveCurrentWeek: saveCurrentWeek,
    loadLastCheckinWeek: loadLastCheckinWeek,
    saveLastCheckinWeek: saveLastCheckinWeek,
    fetchContent: fetchContent
  };
});
