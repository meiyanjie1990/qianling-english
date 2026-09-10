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

test("activityDays 只取活动日", () => {
  const detail = { days: [
    { day: 1, rest: false }, { day: 3, rest: true },
    { day: 4, rest: false }, { day: 6, rest: true }, { day: 7, rest: true }
  ] };
  assert.deepStrictEqual(Logic.activityDays(detail), [1, 4]);
  assert.deepStrictEqual(Logic.activityDays(null), []);
});

test("toggleWeek 整周勾满 / 再点全部取消，不动原对象", () => {
  const days = [1, 2, 4, 5];
  let p = {};
  p = Logic.toggleWeek(p, 2, days);
  assert.strictEqual(Logic.doneCount(p, 2, days), 4);
  assert.strictEqual(Logic.allDaysDone(p, 2, days), true);
  const orig = Logic.toggleWeek({}, 2, days);
  Logic.toggleWeek(orig, 2, days);
  assert.strictEqual(Logic.doneCount(orig, 2, days), 4, "原对象不该被改");
  p = Logic.toggleWeek(p, 2, days);
  assert.strictEqual(Logic.doneCount(p, 2, days), 0);
  assert.strictEqual(Logic.allDaysDone(p, 2, days), false);
  // 只勾了一半时，整周打卡是「补齐」而不是「取消」
  const half = { 2: { 1: true } };
  assert.strictEqual(Logic.doneCount(half, 2, days), 1);
  assert.strictEqual(Logic.allDaysDone(half, 2, days), false);
  assert.strictEqual(Logic.doneCount(Logic.toggleWeek(half, 2, days), 2, days), 4);
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

test("上一次打卡的周号：存取、夹范围、坏数据不炸", () => {
  const s = memStorage();
  assert.strictEqual(Logic.loadLastCheckinWeek(s), null, "没记录时应是 null（好退回当前周）");
  Logic.saveLastCheckinWeek(s, 5);
  assert.strictEqual(Logic.loadLastCheckinWeek(s), 5);
  Logic.saveLastCheckinWeek(s, 99);
  assert.strictEqual(Logic.loadLastCheckinWeek(s), 48, "超出 1-48 要夹住");
  s.setItem(Logic.LAST_WEEK_KEY, "abc");
  assert.strictEqual(Logic.loadLastCheckinWeek(s), null);
  s.setItem(Logic.LAST_WEEK_KEY, "");
  assert.strictEqual(Logic.loadLastCheckinWeek(s), null);
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
