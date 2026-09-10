const test = require("node:test");
const assert = require("node:assert");
const Ui = require("../ui.js");
const Logic = require("../logic.js");

// 最小浏览器桩：只为了验证「手机的返回键 / 侧滑 = 回上一页，而不是退出 App」
function makeEnv() {
  const views = {};
  for (const id of ["view-week", "view-day", "view-map"]) {
    views[id] = { id, innerHTML: "", hidden: false };
  }
  const app = { id: "app", handlers: {}, addEventListener(t, fn) { this.handlers[t] = fn; } };
  const listeners = {};
  const entries = [{ state: null }];
  let idx = 0;
  const store = {};
  const emit = (type, ev) => (listeners[type] || []).forEach(fn => fn(ev));
  const win = {
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); }
    },
    scrollTo() {},
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    history: {
      get state() { return entries[idx].state; },
      replaceState(s) { entries[idx].state = s; },
      pushState(s) { entries.splice(idx + 1); entries.push({ state: s }); idx = entries.length - 1; },
      back() { if (idx > 0) { idx -= 1; emit("popstate", { state: entries[idx].state }); } }
    }
  };
  const doc = { getElementById: id => (id === "app" ? app : views[id] || null) };
  return { win, doc, app, views, entries };
}

const content = {
  weeks: [
    { week: 2, stage: 1, dates: "7/6-7/12", theme: "动物①", themeEn: "Animals", emoji: "🐱",
      coreWords: [{ en: "dog", zh: "狗" }], coreSentences: ["I see a dog."], detailed: true },
    { week: 5, stage: 1, dates: "7/27-8/2", theme: "家人①", themeEn: "Family", emoji: "👨‍👩‍👧",
      coreWords: [{ en: "mum", zh: "妈妈" }], coreSentences: ["This is Mum."], detailed: true }
  ],
  details: {
    "2": { video: { primary: { name: "Old MacDonald", no: "016" } }, days: [
      { day: 1, title: "狗猫日", rest: false,
        sections: [{ time: "上午", do: "指狗玩偶", say: ["I see a dog!"] }], remember: "看到狗就说 dog" },
      { day: 3, title: "休息", rest: true, sections: [], remember: "" }
    ] }
  }
};

function boot() {
  const env = makeEnv();
  global.window = env.win;
  global.document = env.doc;
  global.Ui = Ui;
  global.Logic = Logic;
  Ui.initApp(JSON.parse(JSON.stringify(content)));
  return env;
}

function click(env, action, attrs) {
  const el = {
    getAttribute: k => (k === "data-action" ? action : (attrs || {})[k] ?? null)
  };
  env.app.handlers.click({ target: { closest: () => el } });
}

test("打开某天后按手机返回键：回本周页，不退出 App", () => {
  const env = boot();
  assert.strictEqual(env.views["view-week"].hidden, false);
  click(env, "open-day", { "data-day": "1" });
  assert.strictEqual(env.views["view-day"].hidden, false);
  assert.ok(env.views["view-day"].innerHTML.includes("I see a dog!"));
  assert.strictEqual(env.entries.length, 2, "换页应该压一条历史记录");
  env.win.history.back();
  assert.strictEqual(env.views["view-week"].hidden, false, "返回键应回到本周页");
  assert.strictEqual(env.views["view-day"].hidden, true);
});

test("页内「返回」按钮走的是同一条历史，不新增记录", () => {
  const env = boot();
  click(env, "show-map");
  assert.strictEqual(env.views["view-map"].hidden, false);
  assert.strictEqual(env.entries.length, 2);
  click(env, "go-back");
  assert.strictEqual(env.views["view-week"].hidden, false);
  assert.strictEqual(env.entries.length, 2, "返回不该再压记录");
});

test("地图里点进某一周，返回键回地图", () => {
  const env = boot();
  click(env, "show-map");
  click(env, "goto-week", { "data-week": "5" });
  assert.strictEqual(env.views["view-week"].hidden, false);
  assert.strictEqual(env.entries.length, 3);
  env.win.history.back();
  assert.strictEqual(env.views["view-map"].hidden, false, "应回到地图");
});

test("同一页里换周不压历史，返回键不会一周一周倒", () => {
  const env = boot();
  click(env, "next-week");
  click(env, "next-week");
  click(env, "prev-week");
  assert.strictEqual(env.entries.length, 1, "换周只改当前记录");
});

test("休息日页面没有打卡键，平时有", () => {
  const env = boot();
  click(env, "open-day", { "data-day": "3" });
  assert.ok(!env.views["view-day"].innerHTML.includes("toggle-checkin"), "休息日不该有打卡键");
  env.win.history.back();
  click(env, "open-day", { "data-day": "1" });
  assert.ok(env.views["view-day"].innerHTML.includes("toggle-checkin"), "活动日要有打卡键");
});
