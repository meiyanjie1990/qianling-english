const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const content = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "content.json"), "utf-8"));

test("48周骨架齐全且周号连续", () => {
  assert.strictEqual(content.weeks.length, 48);
  for (let i = 0; i < 48; i++) assert.strictEqual(content.weeks[i].week, i + 1);
});

test("细化到第 24 周，骨架与 details 一一对应", () => {
  const weeks1to24 = Array.from({ length: 24 }, (_, i) => i + 1);
  const detailed = content.weeks.filter(w => w.detailed).map(w => w.week);
  assert.deepStrictEqual(detailed, weeks1to24);
  const keys = Object.keys(content.details).map(Number).sort((a, b) => a - b);
  assert.deepStrictEqual(keys, weeks1to24);
  for (const n of weeks1to24) {
    assert.ok(content.details[String(n)], `缺第${n}周细化内容`);
  }
});

test("每个细化周7天齐全，非休息天结构完整", () => {
  for (const [wk, detail] of Object.entries(content.details)) {
    assert.strictEqual(detail.days.length, 7, `第${wk}周不是7天`);
    const days = detail.days.map(d => d.day).sort((a, b) => a - b);
    assert.deepStrictEqual(days, [1, 2, 3, 4, 5, 6, 7], `第${wk}周天数不连续`);
    for (const day of detail.days) {
      assert.ok(day.title, `第${wk}周第${day.day}天缺 title`);
      if (day.rest) {
        assert.ok([3, 6, 7].includes(day.day), `第${wk}周第${day.day}天不该是休息日（只有3/6/7休息）`);
        assert.strictEqual(day.sections.length, 0, `第${wk}周第${day.day}天休息日不该有内容`);
        assert.strictEqual(day.remember, "", `第${wk}周第${day.day}天休息日的 remember 应为空`);
      } else {
        assert.ok([1, 2, 4, 5].includes(day.day), `第${wk}周第${day.day}天应是休息日`);
        // 地板是 2 块（第1-4周源材料里"大回顾日"就是 2 块）；
        // 第5周起新写的内容要求 ≥3 块，由 tools/merge-weeks.js 在合并时把关
        assert.ok(day.sections.length >= 2, `第${wk}周第${day.day}天时间段太少`);
        assert.ok(day.remember, `第${wk}周第${day.day}天缺 remember`);
        for (const s of day.sections) {
          assert.ok(s.time && s.do, `第${wk}周第${day.day}天有块缺 time/do`);
          assert.ok(Array.isArray(s.say), `第${wk}周第${day.day}天 ${s.time} 缺 say 数组`);
          assert.ok(s.say.every(x => typeof x === "string"), `第${wk}周第${day.day}天 ${s.time} 的 say 有非字符串`);
        }
      }
    }
    assert.ok(detail.video && detail.video.primary && detail.video.primary.name && detail.video.primary.no,
      `第${wk}周缺主视频`);
    assert.ok(typeof detail.advanced === "string" && detail.advanced.trim(), `第${wk}周缺进阶内容`);
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

test("每周核心词句都不空", () => {
  for (const w of content.weeks) {
    assert.ok(w.coreWords.length >= 1, `第${w.week}周缺核心词`);
    assert.ok(w.coreSentences.length >= 1, `第${w.week}周缺核心句`);
  }
});

test("未细化周核心词句已补满（≥5词/≥2句）", () => {
  for (const w of content.weeks.filter(x => !x.detailed)) {
    assert.ok(w.coreWords.length >= 5, `第${w.week}周核心词不足5个`);
    assert.ok(w.coreSentences.length >= 2, `第${w.week}周核心句不足2句`);
  }
});

test("version是数字", () => {
  assert.strictEqual(typeof content.version, "number");
});
