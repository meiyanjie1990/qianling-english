const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
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
    "data-action=\"toggle-checkin\"", "data-day=\"1\"", "data-action=\"go-back\""]) {
    assert.ok(html.includes(needle), "缺: " + needle);
  }
});

test("休息天不渲染时间块，也不给打卡键", () => {
  const html = Ui.renderDayPage(c, 2, 3, {});
  assert.ok(html.includes("休息"));
  assert.ok(!html.includes("上午"));
  assert.ok(!html.includes("data-action=\"toggle-checkin\""), "休息日不该有打卡键");
});

test("本周页有整周打卡键，未细化周没有", () => {
  const html = Ui.renderWeekPage(c, 2, {});
  assert.ok(html.includes("data-action=\"toggle-week\""));
  assert.ok(html.includes("已完成 0/1 天"), "活动日只算不休息的那天");
  const all = Ui.renderWeekPage(c, 2, { 2: { 1: true } });
  assert.ok(all.includes("本周已全部完成"));
  assert.ok(!Ui.renderWeekPage(c, 5, {}).includes("toggle-week"));
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

// 用真实的 content.json 跑一遍：每个细化周、每一天都得能渲染出内容。
// 内容是一周一加进来的，这条能挡住"新加的周把页面渲染搞崩"这类问题。
test("content.json 里每个细化周、每一天都能渲染", () => {
  const real = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "content.json"), "utf-8"));
  const weeks = Object.keys(real.details).map(Number);
  assert.ok(weeks.length > 0, "一个细化周都没有？");
  for (const n of weeks) {
    const wk = Ui.renderWeekPage(real, n, {});
    assert.ok(wk.includes("第" + n + "周"), `第${n}周本周页没渲染出周号`);
    assert.ok(wk.includes('data-action="open-day"'), `第${n}周本周页没有 7 天列表`);
    assert.ok(wk.includes('data-action="toggle-week"'), `第${n}周本周页没有整周打卡键`);
    for (let d = 1; d <= 7; d++) {
      const day = Ui.renderDayPage(real, n, d, {});
      assert.ok(day.includes('data-action="go-back"'), `第${n}周第${d}天没有返回键`);
      const isRest = real.details[String(n)].days.find(x => x.day === d).rest;
      if (isRest) {
        assert.ok(day.includes("休息日"), `第${n}周第${d}天缺休息提示`);
      } else {
        assert.ok(day.length > 300, `第${n}周第${d}天渲染出来太空`);
        assert.ok(day.includes('data-action="toggle-checkin"'), `第${n}周第${d}天没有打卡键`);
      }
    }
  }
});
