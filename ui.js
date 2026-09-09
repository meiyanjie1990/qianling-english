(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) { module.exports = factory(); }
  else { root.Ui = factory(); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function wordChips(words) {
    return '<div class="word-chips">' + words.map(function (w) {
      return '<span class="word-chip"><b>' + escapeHtml(w.en) + '</b><i>' + escapeHtml(w.zh) + '</i></span>';
    }).join("") + '</div>';
  }

  function sentenceCard(sentences) {
    return '<div class="sentence-card">' + sentences.map(function (s) {
      return '<p class="sentence">' + escapeHtml(s) + '</p>';
    }).join("") + '</div>';
  }

  function dayRow(weekNum, day, done) {
    var cls = "day-row" + (done ? " is-done" : "");
    var state = day.rest ? '<span class="day-state rest">休息</span>'
      : '<span class="day-state' + (done ? " done" : "") + '">' + (done ? "✓" : "○") + '</span>';
    return '<button class="' + cls + '" data-action="open-day" data-day="' + day.day + '">' +
      '<span class="day-name">第' + day.day + '天 · ' + escapeHtml(day.title) + '</span>' + state + '</button>';
  }

  function videoBar(detail) {
    if (!detail.video || !detail.video.primary) return "";
    var html = '<div class="video-bar">🎬 本周主视频：' + escapeHtml(detail.video.primary.name) +
      '（' + escapeHtml(detail.video.primary.no) + '）';
    if (detail.video.advanced) {
      html += '　·　进阶：' + escapeHtml(detail.video.advanced.name) +
        '（' + escapeHtml(detail.video.advanced.no) + '）';
    }
    return html + '</div>';
  }

  function renderWeekPage(content, weekNum, progress) {
    var week = content.weeks.find(function (w) { return w.week === weekNum; });
    if (!week) return '<div class="empty">没有这一周</div>';
    var detail = content.details[String(weekNum)] || null;
    var core = wordChips(week.coreWords) + sentenceCard(week.coreSentences);
    var body;
    if (!detail) {
      body = core + '<div class="notice warn">这周的内容还没出——在电脑上跟Claude说「出第' + weekNum +
        '周的细化版」，下次打开就有。</div>';
    } else {
      var days = detail.days.map(function (d) {
        return dayRow(weekNum, d, !!(progress[String(weekNum)] && progress[String(weekNum)][String(d.day)]));
      }).join("");
      var adv = detail.advanced
        ? '<details class="adv"><summary>进阶内容（选做）</summary><p>' + escapeHtml(detail.advanced) + '</p></details>'
        : "";
      body = core + videoBar(detail) + '<div class="day-list">' + days + '</div>' + adv;
    }
    return '<header class="page-head">' +
      '<span class="week-badge">' + escapeHtml(week.dates) + '</span>' +
      '<h1>' + escapeHtml(week.emoji) + ' 第' + week.week + '周 · ' + escapeHtml(week.theme) + '</h1>' +
      '<p class="sub">' + escapeHtml(week.themeEn) + '</p></header>' +
      body +
      '<footer class="week-nav">' +
      '<button class="nav-btn" data-action="prev-week">◀</button>' +
      '<span class="nav-label">第' + week.week + '周 / 48</span>' +
      '<button class="nav-btn" data-action="next-week">▶</button>' +
      '<button class="nav-btn map" data-action="show-map">🗺 全年地图</button>' +
      '</footer>';
  }

  function renderDayPage(content, weekNum, dayNum, progress) {
    var week = content.weeks.find(function (w) { return w.week === weekNum; });
    var detail = content.details[String(weekNum)];
    var day = detail && detail.days.find(function (d) { return d.day === dayNum; });
    if (!week || !day) return '<div class="empty">没有这一天</div>';
    var done = !!(progress[String(weekNum)] && progress[String(weekNum)][String(dayNum)]);
    var blocks;
    if (day.rest) {
      blocks = '<div class="notice tip">休息日——不用安排。顺口说一句本周的词就行。</div>';
    } else {
      blocks = day.sections.filter(function (s) { return s.time && (s.do || (s.say && s.say.length)); })
        .map(function (s) {
          var says = (s.say || []).map(function (line) {
            return '<p class="say">“' + escapeHtml(line) + '”</p>';
          }).join("");
          return '<section class="block"><h2>🕐 ' + escapeHtml(s.time) + '</h2>' +
            (s.do ? '<p class="do">' + escapeHtml(s.do) + '</p>' : '') + says + '</section>';
        }).join("");
    }
    var remember = day.remember
      ? '<div class="notice warn">今天只需记：' + escapeHtml(day.remember) + '</div>' : "";
    var btnCls = "btn-checkin" + (done ? " is-done" : "");
    return '<header class="page-head">' +
      '<button class="back" data-action="show-week">← 返回本周</button>' +
      '<h1>第' + dayNum + '天 · ' + escapeHtml(day.title) + '</h1>' +
      '<p class="sub">第' + week.week + '周 · ' + escapeHtml(week.theme) + '</p></header>' +
      blocks + remember +
      '<button class="' + btnCls + '" data-action="toggle-checkin" data-day="' + day.day + '">' +
      (done ? '✅ 已完成 · 点一下取消' : '✅ 今天完成啦') + '</button>';
  }

  function renderMapPage(content) {
    var cells = content.weeks.map(function (w) {
      var inner = '<span class="map-week">第' + w.week + '周</span>' +
        '<span class="map-emoji">' + escapeHtml(w.emoji) + '</span>' +
        '<span class="map-theme">' + escapeHtml(w.theme) + '</span>' +
        '<span class="map-en">' + escapeHtml(w.themeEn) + '</span>';
      if (w.detailed) {
        return '<button class="map-cell detailed" data-action="goto-week" data-week="' + w.week + '">' +
          inner + '</button>';
      }
      return '<div class="map-cell">' + inner + '<span class="map-tag">内容还没出</span></div>';
    }).join("");
    return '<header class="page-head">' +
      '<button class="back" data-action="show-week">← 返回</button>' +
      '<h1>🗺 全年地图</h1><p class="sub">48周 · 七大主题循环</p></header>' +
      '<div class="map-grid">' + cells + '</div>';
  }

  function initApp(content) {
    var storage = window.localStorage;
    var state = {
      content: content,
      week: Logic.loadCurrentWeek(storage),
      progress: Logic.loadProgress(storage)
    };
    var views = {
      week: document.getElementById("view-week"),
      day: document.getElementById("view-day"),
      map: document.getElementById("view-map")
    };
    function show(name) {
      Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
      window.scrollTo(0, 0);
    }
    function render(name) {
      if (name === "week") views.week.innerHTML = Ui.renderWeekPage(state.content, state.week, state.progress);
      else if (name === "day") views.day.innerHTML = Ui.renderDayPage(state.content, state.week, state.day, state.progress);
      else views.map.innerHTML = Ui.renderMapPage(state.content);
      show(name);
    }
    function save() {
      Logic.saveProgress(storage, state.progress);
      Logic.saveCurrentWeek(storage, state.week);
    }
    document.getElementById("app").addEventListener("click", function (e) {
      var el = e.target.closest("[data-action]");
      if (!el) return;
      var action = el.getAttribute("data-action");
      if (action === "open-day") {
        state.day = Number(el.getAttribute("data-day"));
        render("day");
      } else if (action === "toggle-checkin") {
        state.progress = Logic.toggleDay(state.progress, state.week, Number(el.getAttribute("data-day")));
        save();
        render("day");
      } else if (action === "prev-week") {
        state.week = Logic.clampWeek(state.week - 1); save(); render("week");
      } else if (action === "next-week") {
        state.week = Logic.clampWeek(state.week + 1); save(); render("week");
      } else if (action === "show-map") {
        render("map");
      } else if (action === "show-week") {
        render("week");
      } else if (action === "goto-week") {
        state.week = Number(el.getAttribute("data-week")); save(); render("week");
      }
    });
    render("week");
  }

  return {
    escapeHtml: escapeHtml,
    renderWeekPage: renderWeekPage,
    renderDayPage: renderDayPage,
    renderMapPage: renderMapPage,
    initApp: initApp
  };
});
