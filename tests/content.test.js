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
          assert.ok(Array.isArray(s.say), `第${wk}周第${day.day}天 ${s.time} 缺 say 数组`);
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
    assert.ok(Array.isArray(w.coreWords) && Array.isArray(w.coreSentences), `第${w.week}周缺词/句数组`);
    if (w.detailed) {
      assert.ok(w.coreWords.length >= 1, `第${w.week}周(细化)缺核心词`);
      assert.ok(w.coreSentences.length >= 1, `第${w.week}周(细化)缺核心句`);
    }
    for (const cw of w.coreWords) assert.ok(cw.en && cw.zh, `第${w.week}周有词缺中英`);
  }
});

test("version是数字", () => {
  assert.strictEqual(typeof content.version, "number");
});
