# 谦灵启蒙 App 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做一个手机 PWA「谦灵启蒙」，Mei 打开就能看到本周/今天的英语启蒙教案（做什么、说什么），轻量打卡。

**Architecture:** 纯前端单页无构建：`index.html`（外壳+CSS）+ `logic.js`（纯逻辑，可测）+ `ui.js`（渲染函数，可测）+ `content.json`（48周骨架+第1-4周细化内容）。GitHub Pages 托管，Service Worker 缓存，内容网络优先。

**Tech Stack:** 原生 HTML/CSS/JS（ES5 风格，无框架无 npm 依赖）、Node 24 内置 `node:test` 做单元测试、Python Pillow 生成图标、GitHub Pages + gh CLI 部署。

**Spec:** `docs/superpowers/specs/2026-09-09-qianling-english-app-design.md`

## Global Constraints

- 项目根目录：`E:\AI项目\谦灵启蒙App\`；部署仓库：`meiyanjie1990/qianling-english`（公开），线上地址 `https://meiyanjie1990.github.io/qianling-english/`
- 应用名「谦灵启蒙」；无 TTS、无视频播放、无账号、无后端、无第三方 API
- 本地存储键：打卡 `qianling-progress-v1`、当前周 `qianling-current-week`、版本 `qianling-app-version`；默认周 = 2
- `content.json` 网络优先（`?ts=` 防缓存，失败回退普通请求→SW 缓存）；其余文件缓存优先
- 页面代码更新：`version.json` 版本号 + `sw.js` 的 `CACHE_NAME` 必须同步 bump，缺一不可
- 内容源材料：`docs/source-transcripts/` 下的转录文件（已从 docx 提取好），内容以《详细计划》为准、《冰箱贴》交叉核对
- 每个 git commit 消息末尾加一行 `Co-Authored-By: Claude <noreply@anthropic.com>`
- 发布前必须 push；说"完成"前必须在本地验证 + 线上验证（curl 线上地址 200）
- 测试运行方式：`cd E:\AI项目\谦灵启蒙App && node --test tests/`

---

### Task 1: 内容数据 content.json

**Files:**
- Create: `content.json`
- Create: `tests/content.test.js`
- Commit: `docs/source-transcripts/`（已在仓库工作区，任务内一并提交）

**Interfaces:**
- Produces `content.json`，schema（后续所有任务依赖此结构，字段名不得改动）：

```json
{
  "version": 1,
  "weeks": [
    {
      "week": 1, "stage": 1, "dates": "6/29-7/5",
      "theme": "颜色①", "themeEn": "Colors", "emoji": "🎨",
      "coreWords": [{"en": "red", "zh": "红"}],
      "coreSentences": ["It's red!", "What color is this?"],
      "detailed": true
    }
  ],
  "details": {
    "1": {
      "video": {
        "primary": {"name": "I See Something Blue", "no": "026"},
        "advanced": {"name": "I See Something Pink", "no": "027"}
      },
      "advanced": "进阶词4个：pink（粉红）……",
      "days": [
        {"day": 1, "title": "红色日", "rest": false,
         "sections": [{"time": "穿衣服 7:00-7:15", "do": "挑红色衣服", "say": ["Let's wear your red shirt! Red!"]}],
         "remember": "一切红色 = Red!"}
      ]
    }
  }
}
```

- `video.advanced` 可缺省（周没有进阶视频时省略该键）；`advanced` 字符串可空；`rest: true` 的天 `sections: []`、`remember: ""`、`title` 填「休息」

- [ ] **Step 1: 写数据校验测试 `tests/content.test.js`**

```js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const content = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "content.json"), "utf-8"));

test("48周骨架齐全且周号连续", () => {
  assert.strictEqual(content.weeks.length, 48);
  for (let i = 0; i < 48; i++) assert.strictEqual(content.weeks[i].week, i + 1);
});

test("只有1-4周细化", () => {
  const detailed = content.weeks.filter(w => w.detailed).map(w => w.week);
  assert.deepStrictEqual(detailed, [1, 2, 3, 4]);
  assert.deepStrictEqual(Object.keys(content.details).sort(), ["1", "2", "3", "4"]);
});

test("每个细化周7天齐全，非休息天结构完整", () => {
  for (const [wk, detail] of Object.entries(content.details)) {
    assert.strictEqual(detail.days.length, 7, `第${wk}周不是7天`);
    const days = detail.days.map(d => d.day).sort((a, b) => a - b);
    assert.deepStrictEqual(days, [1, 2, 3, 4, 5, 6, 7], `第${wk}周天数不连续`);
    for (const day of detail.days) {
      assert.ok(day.title, `第${wk}周第${day.day}天缺 title`);
      if (!day.rest) {
        assert.ok(day.sections.length >= 1, `第${wk}周第${day.day}天没有时间段`);
        for (const s of day.sections) {
          assert.ok(s.time && s.do, `第${wk}周第${day.day}天有块缺 time/do`);
          assert.ok(Array.isArray(s.say) && s.say.length >= 1, `第${wk}周第${day.day}天 ${s.time} 缺英文原句`);
        }
      }
    }
    assert.ok(detail.video && detail.video.primary && detail.video.primary.name && detail.video.primary.no,
      `第${wk}周缺主视频`);
  }
});

test("每周有emoji/主题/日期/核心词中英/核心句", () => {
  for (const w of content.weeks) {
    assert.ok(w.emoji && w.theme && w.themeEn && w.dates, `第${w.week}周缺基础字段`);
    assert.ok(w.coreWords.length >= 1 && w.coreSentences.length >= 1, `第${w.week}周缺词或句`);
    for (const cw of w.coreWords) assert.ok(cw.en && cw.zh, `第${w.week}周有词缺中英`);
  }
});

test("version是数字", () => {
  assert.strictEqual(typeof content.version, "number");
});
```

- [ ] **Step 2: 运行确认测试失败**

Run: `node --test tests/`
Expected: FAIL（content.json 不存在）

- [ ] **Step 3: 写 `content.json`**

数据来源与转录规则：

**骨架（48周）：** 抄 `docs/source-transcripts/年度规划.md` 的周排表。每行 → 一个 week 对象：`week`=周次，`stage`=1-4（按四个阶段分），`dates`=表内日期，`theme`=主题（保留①序号，如「动物①」），`emoji`=表内 emoji，`coreWords`=核心词拆成 `{en, zh}`（zh 由执行者补常识译名，如 dog→狗），`coreSentences`=核心句型数组，`detailed` 仅第1-4周为 true。注意：周13-48 的日期跨越 2027 年，表内日期原文照抄。

**细化（第1-4周）：** 抄 `docs/source-transcripts/第X周-*-详细计划.md`（为准），与同周《冰箱贴》交叉核对英文原句是否一致（不一致以详细计划为准）。转录规则：
- `time`：保留原文时间段名（穿衣服/早餐/上午/出门/晚饭后/睡前……），有钟点就附上（如「穿衣服 7:00-7:15」）
- `do`：中文概括该块做什么（把中文旁白并进来）
- `say`：该块内引号里的英文原句，一句一条；没有英文原句的块（纯玩）可以不拆 say 而写进 do
- `remember`：抄「今天只需记」后的内容
- 休息天（原文标「休息/灵活」的天）：`rest: true`
- `video.primary`：从「本周XX歌」段的主选视频提取 name 和集数；有进阶视频则加 `video.advanced`
- `advanced`（周级）：合并原文「进阶内容（选做）」段为一段字符串，保留关键英文

第1周 worked example（其余天同理照抄）：

```json
"1": {
  "video": {
    "primary": {"name": "I See Something Blue", "no": "026"},
    "advanced": {"name": "I See Something Pink", "no": "027"}
  },
  "advanced": "进阶词4个：pink（粉红）· purple（紫色）· orange（橙色）· rainbow（彩虹）——红蓝黄绿熟了之后随口带进去，不求记住。进阶句型：\"This apple is red and green.\" \"I like blue more than red.\" 进阶游戏：颜色混合实验（red+yellow=orange）。进阶绘本：《Brown Bear, Brown Bear, What Do You See?》先读 Red Bird 和 Blue Horse 两页。",
  "days": [
    {"day": 1, "title": "红色日", "rest": false,
     "sections": [
       {"time": "穿衣服 7:00-7:15", "do": "挑红色衣服，边穿边说；穿好站镜子前指", "say": ["Let's wear your red shirt! Red!", "Red shirt!"]},
       {"time": "早餐 7:30-7:45", "do": "找红色食物：苹果、番茄；红色杯子也指", "say": ["Red apple! Yummy!", "Red cup!"]},
       {"time": "上午 8:00-9:30（5分钟）", "do": "红色寻宝：客厅找所有红色东西，找到大力鼓掌", "say": ["Let's find red!", "Red! You found red!"]},
       {"time": "晚饭后（5分钟）", "do": "打印苹果轮廓涂红色，涂完贴墙上；放视频或唱颜色歌Red段", "say": ["What color? Red! A red apple!"]}
     ],
     "remember": "一切红色 = \"Red!\""},
    {"day": 2, "title": "蓝色日", "rest": false,
     "sections": [
       {"time": "穿衣服", "do": "Yesterday red, today blue，站镜子前看自己", "say": ["Yesterday red. Today... blue!"]},
       {"time": "早餐", "do": "指蓝色碗，顺便复习红色", "say": ["Blue bowl!", "Remember red?"]},
       {"time": "出门（湖边/海边）", "do": "看天看水，你先指先喊", "say": ["Look up! The sky is blue! Blue sky!", "Look down! The water is blue!"]},
       {"time": "晚饭后", "do": "蓝色寻宝+红蓝对比：红苹果和蓝玩具放一起让她指；放视频或唱Red+Blue两段", "say": ["Which is red? Which is blue?"]}
     ],
     "remember": "天空+水 = Blue"},
    {"day": 3, "title": "休息", "rest": true, "sections": [], "remember": ""},
    {"day": 4, "title": "黄+绿日", "rest": false,
     "sections": [
       {"time": "早餐", "do": "找黄色食物：鸡蛋黄、香蕉，让她帮你在冰箱找", "say": ["Yellow egg! Yellow banana!"]},
       {"time": "上午（8分钟）", "do": "颜色分类：红蓝黄积木混一起，三个纸片当\"颜色家\"，你边分边自言自语", "say": ["Let's put red here, blue here, yellow here!"]},
       {"time": "出门", "do": "指所有绿色：草、树叶、灌木，蹲下摘片叶子递给她", "say": ["Green! The grass is green!", "Green leaf!"]},
       {"time": "晚饭后", "do": "放视频或唱完整四段颜色歌（Red→Blue→Yellow→Green），边唱边指家里对应颜色的东西", "say": []}
     ],
     "remember": "食物=Yellow，户外=Green"},
    {"day": 5, "title": "颜色大回顾", "rest": false,
     "sections": [
       {"time": "穿衣服", "do": "Red or blue 让她自己选并说出颜色名", "say": ["Red shirt or blue shirt?"]},
       {"time": "上午（10分钟）", "do": "颜色大游行：放视频，你说颜色她跑去碰对应颜色的东西", "say": ["Red!", "Blue!"]},
       {"time": "睡前", "do": "颜色小故事，讲完放视频或唱颜色歌", "say": ["Once there was a red apple. It met a blue bird. They saw a yellow sun and sat on the green grass. The end!"]}
     ],
     "remember": "让她二选一 + 大游行"},
    {"day": 6, "title": "休息", "rest": true, "sections": [], "remember": ""},
    {"day": 7, "title": "休息", "rest": true, "sections": [], "remember": ""}
  ]
}
```

注意：第4天「晚饭后」块没有英文原句，`say` 为空数组是允许的（该块纯活动）；但测试要求非休息天 `sections.length >= 1` 即可，`say` 只在有 say 的块上非空——测试里「每块 say 非空」的断言会挡住第4天这个块。**执行时把这个块合并进「出门」或保留一个 do 说明、不拆独立块**；若仍需要空 say 块，则把测试中 `s.say.length >= 1` 的断言删掉（改为 s.time && s.do 必填）。二选一，前后一致即可。

- [ ] **Step 4: 运行确认测试通过**

Run: `node --test tests/`
Expected: PASS 全部

- [ ] **Step 5: 校验 JSON 语法**

Run: `node -e "JSON.parse(require('fs').readFileSync('content.json','utf-8')); console.log('JSON OK')"`
Expected: `JSON OK`

- [ ] **Step 6: Commit**

```bash
git add content.json tests/content.test.js docs/source-transcripts/
git commit -m "feat: content.json 48周骨架+1-4周细化内容及校验测试

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: logic.js 纯逻辑

**Files:**
- Create: `logic.js`
- Create: `tests/logic.test.js`

**Interfaces:**
- Consumes: 无（`content.json` 由 fetch 层读取，本任务不依赖 Task 1 数据）
- Produces（浏览器全局 `Logic` / Node `require("../logic.js")`，名字不得改动）：
  - 常量：`PROGRESS_KEY = "qianling-progress-v1"`、`CURRENT_WEEK_KEY = "qianling-current-week"`、`APP_VERSION_KEY = "qianling-app-version"`、`DEFAULT_WEEK = 2`
  - `parseContent(text)` → content 对象（坏 JSON/缺 weeks/details 抛错）
  - `getWeek(content, weekNum)` → week 对象或 undefined
  - `getDetail(content, weekNum)` → detail 对象或 null
  - `clampWeek(n)` → 1..48 的整数（NaN 返回 DEFAULT_WEEK）
  - `loadProgress(storage)` → `{ "2": {"1": true} }` 形状对象（坏数据返回 `{}`）
  - `saveProgress(storage, progress)`
  - `toggleDay(progress, weekNum, dayNum)` → 新 progress（不改原对象）
  - `isDayDone(progress, weekNum, dayNum)` → bool
  - `weekDoneCount(progress, weekNum)` → 完成天数
  - `loadCurrentWeek(storage)` → 数字（默认 2）
  - `saveCurrentWeek(storage, weekNum)`
  - `fetchContent(fetchImpl)` → Promise<content|null>：先 `fetchImpl("content.json?ts=" + Date.now())`，ok 则返回 json；否则再 `fetchImpl("content.json")`，ok 则返回 json；都失败返回 null。`fetchImpl` 需满足 `{ok, json()}` 形状，任何异常都吞掉走下一步

- [ ] **Step 1: 写失败测试 `tests/logic.test.js`**

```js
const test = require("node:test");
const assert = require("node:assert");
const Logic = require("../logic.js");

const memStorage = () => {
  const m = {};
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } };
};

test("parseContent 拒绝坏 JSON 和坏结构", () => {
  assert.throws(() => Logic.parseContent("not json"));
  assert.throws(() => Logic.parseContent(JSON.stringify({ hello: 1 })));
  assert.deepStrictEqual(Logic.parseContent(JSON.stringify({ weeks: [], details: {} })).weeks, []);
});

test("getWeek / getDetail", () => {
  const c = { weeks: [{ week: 2 }], details: { "2": { video: {} } } };
  assert.strictEqual(Logic.getWeek(c, 2).week, 2);
  assert.strictEqual(Logic.getWeek(c, 9), undefined);
  assert.deepStrictEqual(Logic.getDetail(c, 2), { video: {} });
  assert.strictEqual(Logic.getDetail(c, 9), null);
});

test("clampWeek 边界", () => {
  assert.strictEqual(Logic.clampWeek(0), 1);
  assert.strictEqual(Logic.clampWeek(49), 48);
  assert.strictEqual(Logic.clampWeek(7), 7);
  assert.strictEqual(Logic.clampWeek(NaN), Logic.DEFAULT_WEEK);
});

test("toggleDay 勾选/取消，不动原对象", () => {
  let p = {};
  p = Logic.toggleDay(p, 2, 1);
  assert.strictEqual(Logic.isDayDone(p, 2, 1), true);
  assert.strictEqual(Logic.weekDoneCount(p, 2), 1);
  p = Logic.toggleDay(p, 2, 1);
  assert.strictEqual(Logic.isDayDone(p, 2, 1), false);
  assert.strictEqual(Logic.weekDoneCount(p, 2), 0);
  const orig = { 2: { 3: true } };
  const next = Logic.toggleDay(orig, 2, 3);
  assert.strictEqual(orig[2][3], true);
  assert.strictEqual(next[2][3], false);
});

test("进度存取 localStorage 往返", () => {
  const s = memStorage();
  assert.deepStrictEqual(Logic.loadProgress(s), {});
  const p = Logic.toggleDay({}, 2, 1);
  Logic.saveProgress(s, p);
  assert.strictEqual(Logic.isDayDone(Logic.loadProgress(s), 2, 1), true);
});

test("坏进度数据不炸", () => {
  const s = memStorage();
  s.setItem(Logic.PROGRESS_KEY, "{{{");
  assert.deepStrictEqual(Logic.loadProgress(s), {});
});

test("当前周默认2，存读正常", () => {
  const s = memStorage();
  assert.strictEqual(Logic.loadCurrentWeek(s), 2);
  Logic.saveCurrentWeek(s, 5);
  assert.strictEqual(Logic.loadCurrentWeek(s), 5);
});

test("fetchContent 网络优先，失败回退，再失败 null", async () => {
  const calls = [];
  const impl = async url => {
    calls.push(url);
    if (url.includes("ts=")) return { ok: false, json: async () => ({}) };
    return { ok: true, json: async () => ({ weeks: [], details: {} }) };
  };
  const got = await Logic.fetchContent(impl);
  assert.deepStrictEqual(got, { weeks: [], details: {} });
  assert.strictEqual(calls.length, 2);
  assert.strictEqual(calls[0].startsWith("content.json?ts="), true);
  assert.strictEqual(calls[1], "content.json");
  const dead = async () => { throw new Error("net"); };
  assert.strictEqual(await Logic.fetchContent(dead), null);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test tests/logic.test.js`
Expected: FAIL（Cannot find module ../logic.js）

- [ ] **Step 3: 写 `logic.js`（完整实现，直接采用）**

```js
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) { module.exports = factory(); }
  else { root.Logic = factory(); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var PROGRESS_KEY = "qianling-progress-v1";
  var CURRENT_WEEK_KEY = "qianling-current-week";
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

  function loadCurrentWeek(storage) {
    return clampWeek(Number(storage.getItem(CURRENT_WEEK_KEY)));
  }

  function saveCurrentWeek(storage, weekNum) {
    storage.setItem(CURRENT_WEEK_KEY, String(weekNum));
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
    loadCurrentWeek: loadCurrentWeek,
    saveCurrentWeek: saveCurrentWeek,
    fetchContent: fetchContent
  };
});
```

- [ ] **Step 4: 运行确认通过**

Run: `node --test tests/logic.test.js`
Expected: PASS 全部

- [ ] **Step 5: Commit**

```bash
git add logic.js tests/logic.test.js
git commit -m "feat: logic.js 核心逻辑（周切换/打卡/内容拉取）及测试

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: ui.js 渲染函数

**Files:**
- Create: `ui.js`
- Create: `tests/ui.test.js`

**Interfaces:**
- Consumes: 浏览器全局 `Logic`（仅 `initApp` 内使用）；渲染函数是纯函数不依赖 DOM
- Produces（浏览器全局 `Ui` / Node `require("../ui.js")`）：
  - `escapeHtml(s)` → 转义字符串
  - `renderWeekPage(content, weekNum, progress)` → HTML 字符串（周标题、核心词 chips、核心句卡片、视频条、7天列表、进阶折叠区、周切换器）
  - `renderDayPage(content, weekNum, dayNum, progress)` → HTML 字符串（返回按钮、分时段块、remember 条、打卡按钮）
  - `renderMapPage(content)` → HTML 字符串（48格，细化周是按钮，未细化周是灰 div）
  - `initApp(content)` → DOM 装配（事件委托、三视图切换、打卡持久化），仅浏览器调用
- 交互契约（Task 4-6 的 CSS 与 initApp 都按这些 data-action 挂钩）：
  - `data-action="open-day" data-day="N"` → 打开第N天
  - `data-action="toggle-checkin" data-day="N"` → 打卡切换
  - `data-action="prev-week"` / `data-action="next-week"` → 周切换（clamp 1..48，持久化）
  - `data-action="show-map"` / `data-action="show-week"` → 视图切换
  - `data-action="goto-week" data-week="N"` → 从地图跳周
  - 打卡按钮 `is-done` class 表示已完成；每天行 `is-done` class 表示该天完成

- [ ] **Step 1: 写失败测试 `tests/ui.test.js`**

```js
const test = require("node:test");
const assert = require("node:assert");
const Ui = require("../ui.js");

const c = {
  weeks: [
    { week: 2, stage: 1, dates: "7/6-7/12", theme: "动物①", themeEn: "Animals", emoji: "🐱",
      coreWords: [{ en: "dog", zh: "狗" }, { en: "cat", zh: "猫" }],
      coreSentences: ["I see a dog."], detailed: true },
    { week: 5, stage: 1, dates: "7/27-8/2", theme: "家人①", themeEn: "Family", emoji: "👨‍👩‍👧",
      coreWords: [{ en: "mum", zh: "妈妈" }], coreSentences: ["This is Mum."], detailed: false }
  ],
  details: {
    "2": {
      video: { primary: { name: "Old MacDonald", no: "016" } },
      advanced: "进阶词：rabbit 兔子",
      days: [
        { day: 1, title: "狗猫日", rest: false,
          sections: [{ time: "上午", do: "指狗玩偶", say: ["I see a dog!"] }],
          remember: "看到狗就说 dog" },
        { day: 3, title: "休息", rest: true, sections: [], remember: "" }
      ]
    }
  }
};

test("escapeHtml 转义", () => {
  assert.strictEqual(Ui.escapeHtml('<a href="x">&\'</a>'), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
});

test("本周页含关键信息与交互标记", () => {
  const html = Ui.renderWeekPage(c, 2, {});
  for (const needle of ["第2周", "Animals", "动物①", "dog", "狗", "I see a dog.",
    "Old MacDonald", "狗猫日", "休息", "data-action=\"open-day\"", "data-action=\"prev-week\"",
    "data-action=\"next-week\"", "data-action=\"show-map\"", "进阶词：rabbit 兔子"]) {
    assert.ok(html.includes(needle), "缺: " + needle);
  }
});

test("未细化周显示提示但骨架可见", () => {
  const html = Ui.renderWeekPage(c, 5, {});
  assert.ok(html.includes("内容还没出"));
  assert.ok(html.includes("This is Mum."));
  assert.ok(!html.includes("data-action=\"open-day\""));
});

test("当天页有分时块、原句、remember、打卡按钮", () => {
  const html = Ui.renderDayPage(c, 2, 1, {});
  for (const needle of ["上午", "指狗玩偶", "I see a dog!", "看到狗就说 dog",
    "data-action=\"toggle-checkin\"", "data-day=\"1\"", "data-action=\"show-week\""]) {
    assert.ok(html.includes(needle), "缺: " + needle);
  }
});

test("休息天不渲染时间块", () => {
  const html = Ui.renderDayPage(c, 2, 3, {});
  assert.ok(html.includes("休息"));
  assert.ok(!html.includes("上午"));
});

test("打卡状态影响渲染", () => {
  const done = Ui.renderDayPage(c, 2, 1, { 2: { 1: true } });
  assert.ok(done.includes("is-done"));
  const notDone = Ui.renderDayPage(c, 2, 1, {});
  assert.ok(!notDone.includes("is-done"));
  const weekHtml = Ui.renderWeekPage(c, 2, { 2: { 1: true } });
  assert.ok(weekHtml.includes("is-done"));
});

test("全年地图：细化周可点，未细化周灰化", () => {
  const html = Ui.renderMapPage(c);
  assert.ok(html.includes("data-action=\"goto-week\""));
  assert.ok(html.includes("data-week=\"2\""));
  assert.ok(html.includes("内容还没出"));
  assert.ok(html.includes("第5周"));
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test tests/ui.test.js`
Expected: FAIL（Cannot find module ../ui.js）

- [ ] **Step 3: 写 `ui.js`（完整实现，直接采用）**

```js
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
```

- [ ] **Step 4: 运行确认通过**

Run: `node --test tests/ui.test.js`
Expected: PASS 全部

- [ ] **Step 5: Commit**

```bash
git add ui.js tests/ui.test.js
git commit -m "feat: ui.js 三页渲染函数与交互契约及测试

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: index.html 外壳 + 本周页样式

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: 全局 `Logic`、`Ui`、`content.json`、容器 id：`#app`、`#view-week`、`#view-day`、`#view-map`、`#update-badge`
- Produces: 可打开的页面（先有本周页，day/map 视图容器先空壳）

- [ ] **Step 1: 先调用 frontend-design 技能定视觉系统**

用 `Skill(frontend-design)` 获取设计指导，再落地 CSS。方向约束（来自 spec §9）：亲子可爱风但信息优先——暖底色、大圆角卡片、明快色块、英文大字、扫一眼就能读。设计令牌建议起点（可微调）：背景 `#FFF6E9`（奶油暖底）、主色 `#FF8C1A`（暖橙）、强调绿 `#4CAF50`、文字 `#4A3728`（深棕）、卡片白 `#FFFFFF`、圆角 16-20px、正文字号 ≥15px、英文句/词 ≥22px。

- [ ] **Step 2: 写 `index.html`**

结构骨架（CSS 填在 `<style>` 里）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#FFF6E9">
  <title>谦灵启蒙</title>
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">
  <link rel="icon" href="icon-192.png">
  <style>
    /* 设计系统：reset、:root 变量、.page-head/.word-chip/.sentence-card/.video-bar/
       .day-list/.day-row/.day-state/.notice(.tip/.warn)/.adv/.week-nav/.empty 等组件样式。
       移动优先：max-width 520px 居中，safe-area 内边距，按钮最小触控 44px。
       #view-day、#view-map 的样式在 Task 5/6 加。 */
  </style>
</head>
<body>
  <div id="app">
    <div id="view-week" class="view"></div>
    <div id="view-day" class="view" hidden></div>
    <div id="view-map" class="view" hidden></div>
  </div>
  <div id="update-badge" hidden>点我更新</div>
  <script src="logic.js"></script>
  <script src="ui.js"></script>
  <script>
    (function () {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").catch(function () {});
      }
      Logic.fetchContent(window.fetch).then(function (content) {
        if (!content) {
          document.getElementById("view-week").innerHTML =
            '<div class="empty"><p>内容加载失败，请检查网络后刷新。</p>' +
            '<button onclick="location.reload()">重试</button></div>';
          return;
        }
        Ui.initApp(content);
      });
    })();
  </script>
</body>
</html>
```

CSS 覆盖本周页全部组件（.page-head/.week-badge/.sub/.word-chips/.word-chip b/i/.sentence-card/.sentence/.video-bar/.day-list/.day-row/.day-name/.day-state(.rest/.done)/.notice(.tip/.warn)/.adv/.week-nav/.nav-btn/.map 等）。`#update-badge` 样式预留：右下角悬浮胶囊（Task 7 接入逻辑）。

- [ ] **Step 3: 语法检查 + 本地起服务验证**

Run:
```bash
node --check logic.js && node --check ui.js
python -m http.server 8000 --bind 127.0.0.1
```
（后台跑）再另开：
```bash
curl -s http://127.0.0.1:8000/ | head -20
curl -s http://127.0.0.1:8000/content.json | head -c 200
```
Expected: 前者含 `<title>谦灵启蒙</title>`，后者返回 JSON。然后停掉 http.server。

- [ ] **Step 4: 全量测试**

Run: `node --test tests/`
Expected: PASS 全部（内容+逻辑+渲染）

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: index.html 外壳与本周页样式（frontend-design 视觉系统）

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: 当天详情页 + 打卡交互

**Files:**
- Modify: `index.html`（`<style>` 增加 day 视图组件样式）

**Interfaces:**
- Consumes: Task 3 的 `renderDayPage` 输出结构（.block h2 / .do / .say / .notice / .btn-checkin(.is-done) / .back）
- Produces: 手机上可用的当天页与打卡闭环

- [ ] **Step 1: 加 day 视图样式**

在 `<style>` 里为当天页组件加样式：`.back`（返回按钮，大触控区）、`.block`（时间段卡片，左色条区分块）、`.block h2`（时间段标题）、`.do`（做什么，正文）、`.say`（英文原句，≥22px 加粗、主色底淡色块内）、`.btn-checkin`（全宽大按钮，44px+ 高，`is-done` 态换绿色）。用 frontend-design 定稿细节。

- [ ] **Step 2: 本地验证**

Run: `python -m http.server 8000 --bind 127.0.0.1`（后台）+ `curl -s http://127.0.0.1:8000/ | grep -c "btn-checkin"`（应为 0，样式在 html 内以文本存在则 grep 有值——以肉眼确认样式块包含 `.btn-checkin` 为准），然后 `node --test tests/` 全绿。停掉服务。

- [ ] **Step 3: 手工走查清单（Mei 的验收前自测，电脑浏览器即可）**

打开 `http://127.0.0.1:8000/`：本周页能切到第2周→点「第1天」进详情→时间块齐全→点「✅ 今天完成啦」变「✅ 已完成」→返回本周见该天 ✓→再进详情点一下取消→返回本周 ✓消失。刷新后状态仍在（localStorage 生效）。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: 当天详情页样式与打卡闭环

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: 全年地图页

**Files:**
- Modify: `index.html`（`<style>` 增加 map 视图样式）

**Interfaces:**
- Consumes: Task 3 的 `renderMapPage` 输出结构（.map-grid / .map-cell(.detailed) / .map-week / .map-emoji / .map-theme / .map-en / .map-tag）
- Produces: 可浏览的48周地图，细化周可点击跳转

- [ ] **Step 1: 加 map 样式**

`.map-grid`：两列网格；`.map-cell`：卡片，未细化周灰色降低饱和 + `.map-tag` 小灰标签；`.map-cell.detailed`：可点，按下有反馈。用 frontend-design 定稿。

- [ ] **Step 2: 本地验证**

Run: `python -m http.server 8000 --bind 127.0.0.1`（后台）→ 确认页面含 map-grid 样式 → `node --test tests/` 全绿 → 停服务。

- [ ] **Step 3: 手工走查**

首页点「🗺 全年地图」→ 48格齐全 → 第1-4周格高亮可点、点击跳对应周 → 第5周起灰色带「内容还没出」→ 「← 返回」回本周页。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: 全年地图页样式与跳转

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: PWA 套件（manifest / sw / 图标 / 版本更新）

**Files:**
- Create: `manifest.json`、`sw.js`、`version.json`、`tools/make-icons.py`
- Create: `icon-192.png`、`icon-512.png`、`apple-touch-icon.png`（脚本生成）
- Modify: `index.html`（`#update-badge` 逻辑）

**Interfaces:**
- Produces: 可安装 PWA；`content.json`/`version.json` 网络优先；`sw.js` 监听 `CLEAR_CACHE` message；`index.html` 启动时检查 `version.json` 大于本地 `qianling-app-version` 则显示 `#update-badge`

- [ ] **Step 1: 写图标生成脚本 `tools/make-icons.py`**

```python
# 生成 PWA 图标：暖橙圆角方块 + 白色"谦"字
from PIL import Image, ImageDraw, ImageFont

def make(size, path):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = size // 5
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=(255, 140, 26, 255))
    try:
        font = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", int(size * 0.55))
    except OSError:
        font = ImageFont.load_default()
    bbox = d.textbbox((0, 0), "谦", font=font)
    x = (size - (bbox[2] - bbox[0])) / 2 - bbox[0]
    y = (size - (bbox[3] - bbox[1])) / 2 - bbox[1]
    d.text((x, y), "谦", font=font, fill=(255, 255, 255, 255))
    img.save(path)

make(192, "icon-192.png")
make(512, "icon-512.png")
make(180, "apple-touch-icon.png")
print("icons done")
```

Run: `python tools/make-icons.py`，确认三个 png 生成且肉眼可见（文件大小 > 1KB）。

- [ ] **Step 2: 写 `manifest.json`**

```json
{
  "name": "谦灵启蒙",
  "short_name": "谦灵启蒙",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#FFF6E9",
  "theme_color": "#FFF6E9",
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}
  ]
}
```

- [ ] **Step 3: 写 `version.json`**

```json
{"version": 1}
```

- [ ] **Step 4: 写 `sw.js`**

```js
var CACHE_NAME = "qianling-app-v1";
var PRECACHE = [
  "./", "index.html", "logic.js", "ui.js", "content.json",
  "manifest.json", "version.json",
  "icon-192.png", "icon-512.png", "apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (c) { return c.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var pathname = new URL(e.request.url).pathname;
  var isFresh = pathname.endsWith("/content.json") || pathname.endsWith("/version.json");
  if (isFresh) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (m) { return m || caches.match("./"); });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (m) { return m || fetch(e.request); })
  );
});

self.addEventListener("message", function (e) {
  if (e.data === "CLEAR_CACHE") {
    e.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      })
    );
  }
});
```

- [ ] **Step 5: `index.html` 加更新徽标逻辑**

在启动脚本后追加：

```js
    (function () {
      var badge = document.getElementById("update-badge");
      fetch("version.json?ts=" + Date.now()).then(function (r) { return r.json(); })
        .then(function (v) {
          var cur = Number(localStorage.getItem(Logic.APP_VERSION_KEY)) || 0;
          if (v.version > cur) {
            badge.hidden = false;
            badge.onclick = function () {
              if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage("CLEAR_CACHE");
              }
              localStorage.setItem(Logic.APP_VERSION_KEY, String(v.version));
              setTimeout(function () { location.reload(true); }, 600);
            };
          } else {
            localStorage.setItem(Logic.APP_VERSION_KEY, String(v.version));
          }
        }).catch(function () {});
    })();
```

- [ ] **Step 6: 校验**

Run:
```bash
node --check sw.js
python -c "import json; json.load(open('manifest.json', encoding='utf-8')); json.load(open('version.json', encoding='utf-8')); print('JSON OK')"
node --test tests/
```
Expected: 全部通过。

- [ ] **Step 7: Commit**

```bash
git add manifest.json sw.js version.json tools/make-icons.py icon-192.png icon-512.png apple-touch-icon.png index.html
git commit -m "feat: PWA 套件（manifest/sw/图标/版本更新徽标）

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: 部署上线 + 项目名片 + 收尾

**Files:**
- Create: `CLAUDE.md`（项目名片）、`.gitignore`

**Interfaces:**
- Produces: 线上可访问的 `https://meiyanjie1990.github.io/qianling-english/`

- [ ] **Step 1: 写 `.gitignore`**

```
__pycache__/
*.pyc
```

- [ ] **Step 2: 写 `CLAUDE.md`（项目名片，参照五人打卡的风格）**

内容要点（写成完整文档）：
- 项目概述：谦灵启蒙 App，Mei 给女儿（2023-06-22 生）用的手机英语启蒙备课+打卡 PWA。线上地址。
- 目录定位：唯一主目录 `E:\AI项目\谦灵启蒙App`；内容源材料在 `E:\谦灵英语启蒙\`（docx 三件套），App 只存转录后的 content.json；转录参考在 `docs/source-transcripts/`
- 文件结构表：index.html / logic.js / ui.js / content.json / version.json / manifest.json / sw.js / 图标 / tests/ / tools/
- **每周新内容固定流程**：Mei 说「出第X周细化版」时 → ① docx 三件套照常生成到 `E:\谦灵英语启蒙\` ② 该周内容按 schema 转录进 content.json（`detailed: true`，周骨架里也要标 true）③ content.json 版本号+1 ④ push ⑤ 手机下次打开自动拉到（内容网络优先，无需点更新）。页面代码改了才需要同步 bump version.json + sw.js CACHE_NAME
- 发布规则：改完必须 push + curl 线上 200 验证；tests 全绿才提交；`.gitignore` 不发布杂物
- 技术架构：纯前端单页、无框架无构建、GitHub Pages、SW 缓存（content/version 网络优先，其余缓存优先）、localStorage 三键（打卡/当前周/版本）

- [ ] **Step 3: 全量验证再提交**

Run: `node --test tests/`（全绿）+ `git status`（无意外文件）

```bash
git add -A
git commit -m "chore: CLAUDE.md 项目名片与 .gitignore

Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] **Step 4: 建仓库并推送**

```bash
gh repo create qianling-english --public --source . --remote origin --push
```

Expected: 仓库创建成功，main 已推送。（若仓库已存在，改用 `git remote add origin git@github.com:meiyanjie1990/qianling-english.git && git push -u origin main`）

- [ ] **Step 5: 开启 GitHub Pages**

```bash
gh api -X POST repos/meiyanjie1990/qianling-english/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

Expected: 返回含 `"html_url": "https://meiyanjie1990.github.io/qianling-english/"` 的 JSON。

- [ ] **Step 6: 线上验证（等1-2分钟后）**

```bash
curl -s -o /dev/null -w "%{http_code}" https://meiyanjie1990.github.io/qianling-english/
curl -s https://meiyanjie1990.github.io/qianling-english/content.json | head -c 120
curl -s https://meiyanjie1990.github.io/qianling-english/version.json
```

Expected: 依次为 `200`、content.json 开头内容、`{"version":1}`。

- [ ] **Step 7: 请 Mei 手机上验收（把清单发给 Mei，等确认）**

清单：① 手机浏览器打开 `https://meiyanjie1990.github.io/qianling-english/` ② 应直接显示第2周 Animals ③ 点开任意一天，时间段+英文原句清晰 ④ 打卡打勾→返回→勾在 ⑤ 切到第5周显示「内容还没出」 ⑥ 浏览器菜单「添加到主屏幕」，桌面上出现「谦灵启蒙」图标，点击直达 ⑦ 关网再打开仍能用（PWA 缓存）。

- [ ] **Step 8: 更新记忆**

在 `C:\Users\meilo\.claude\projects\C--Users-meilo\memory\` 新建 `qianling-enlightenment-app.md`（type: project）：App 位置、仓库、线上地址、内容源在 `E:\谦灵英语启蒙\`、每周更新流程、打卡存手机本地。并在 `MEMORY.md` 加一行索引。同时把 `deployed-projects-must-push` 记忆里补上第三个仓库 `qianling-english`。

---

## Self-Review 结论

- Spec 覆盖：§3 三页面（Task 3/4/5/6）、§4 数据两层（Task 1）、§5 打卡（Task 2/5）、§6 更新流程（Task 7/8）、§7 技术路线（Task 7）、§8 文件位置（Task 8 CLAUDE.md）、§9 视觉（Task 4 frontend-design）、§10 验收（Task 8 Step 6/7）、§11 风险（无需任务）
- 已知取舍：Task 1 测试中「每块 say 非空」与第1周第4天纯活动块的矛盾已写明两种解法，执行时任选其一保持一致
- 类型一致：`Ui`/`Logic` 导出名、`data-action` 集合、localStorage 键名在全部任务间一致
