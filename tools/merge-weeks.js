// 把每周的 JSON 片段合并进 content.json，并保持原有排版风格。
//
//   用法：node tools/merge-weeks.js <片段目录> <周号...> [--bump]
//   例：  node tools/merge-weeks.js "E:/AI项目/.谦灵md暂存" 5 6 7 8 9 --bump
//
// 片段文件名：week-05.json（两位补零），内容形如
//   { "video": {...}, "advanced": "...", "days": [ 7 项 ] }
//
// 做四件事：校验片段 → 写进 details["N"] → 把该周骨架标 detailed:true → 可选内容版本 +1
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content.json");

const REST_DAYS = [3, 6, 7];
const ACTIVE_DAYS = [1, 2, 4, 5];

function fail(msg) {
  console.error("✖ " + msg);
  process.exitCode = 1;
}

function checkWeek(n, d) {
  const errs = [];
  if (!d || typeof d !== "object") return ["不是对象"];
  if (!d.video || !d.video.primary || !d.video.primary.name || !d.video.primary.no) {
    errs.push("缺 video.primary.name / no");
  }
  if (d.video && d.video.advanced && (!d.video.advanced.name || !d.video.advanced.no)) {
    errs.push("video.advanced 缺 name 或 no");
  }
  if (typeof d.advanced !== "string" || !d.advanced.trim()) errs.push("advanced 不是非空字符串");
  if (!Array.isArray(d.days) || d.days.length !== 7) {
    errs.push("days 不是恰好 7 项");
    return errs;
  }
  d.days.forEach((day, i) => {
    if (day.day !== i + 1) errs.push(`第 ${i + 1} 项的 day 不是 ${i + 1}`);
    if (!day.title) errs.push(`第 ${day.day} 天缺 title`);
    if (REST_DAYS.includes(day.day)) {
      if (day.rest !== true) errs.push(`第 ${day.day} 天应是休息日`);
      if (!Array.isArray(day.sections) || day.sections.length !== 0) errs.push(`第 ${day.day} 天休息日不该有 sections`);
      if (day.remember !== "") errs.push(`第 ${day.day} 天休息日的 remember 应为空`);
    } else {
      if (day.rest) errs.push(`第 ${day.day} 天不该是休息日`);
      if (!Array.isArray(day.sections) || day.sections.length < 1) errs.push(`第 ${day.day} 天没有 sections`);
      (day.sections || []).forEach((s) => {
        if (!s.time) errs.push(`第 ${day.day} 天有块缺 time`);
        if (!s.do) errs.push(`第 ${day.day} 天有块缺 do`);
        if (!Array.isArray(s.say)) errs.push(`第 ${day.day} 天 ${s.time} 的 say 不是数组`);
        else if (s.say.some((x) => typeof x !== "string")) errs.push(`第 ${day.day} 天 ${s.time} 的 say 里有非字符串`);
      });
      if (day.sections && day.sections.length < 3) errs.push(`第 ${day.day} 天 sections 只有 ${day.sections.length} 块（规范要求 ≥3）`);
      if (!day.remember) errs.push(`第 ${day.day} 天缺 remember`);
    }
  });
  if (ACTIVE_DAYS.length !== d.days.filter((x) => !x.rest).length) {
    errs.push("活动日不是 4 天（应为第 1、2、4、5 天）");
  }
  return errs;
}

// ---------- 按项目原有风格输出 JSON ----------

function wordPair(w) {
  return `{"en": ${JSON.stringify(w.en)}, "zh": ${JSON.stringify(w.zh)}}`;
}

// 数组按项目原有风格输出：逗号后留一个空格
function arr(list) {
  return "[" + (list || []).map((x) => JSON.stringify(x)).join(", ") + "]";
}

function fmtWeek(w) {
  const lines = [];
  lines.push("    {");
  lines.push(`      "week": ${w.week}, "stage": ${w.stage}, "dates": ${JSON.stringify(w.dates)},`);
  lines.push(`      "theme": ${JSON.stringify(w.theme)}, "themeEn": ${JSON.stringify(w.themeEn)}, "emoji": ${JSON.stringify(w.emoji)},`);
  if (!w.coreWords.length) {
    lines.push('      "coreWords": [],');
  } else {
    lines.push('      "coreWords": [');
    for (let i = 0; i < w.coreWords.length; i += 2) {
      const pair = w.coreWords.slice(i, i + 2).map(wordPair).join(", ");
      lines.push("        " + pair + (i + 2 < w.coreWords.length ? "," : ""));
    }
    lines.push("      ],");
  }
  lines.push(`      "coreSentences": ${arr(w.coreSentences)},`);
  lines.push(`      "detailed": ${w.detailed ? "true" : "false"}`);
  lines.push("    }");
  return lines.join("\n");
}

function fmtVideo(video) {
  const lines = ["      \"video\": {"];
  const items = [`        "primary": {"name": ${JSON.stringify(video.primary.name)}, "no": ${JSON.stringify(video.primary.no)}}`];
  if (video.advanced) {
    items.push(`        "advanced": {"name": ${JSON.stringify(video.advanced.name)}, "no": ${JSON.stringify(video.advanced.no)}}`);
  }
  lines.push(items.join(",\n"));
  lines.push("      },");
  return lines.join("\n");
}

function fmtDay(day) {
  if (day.rest) {
    return `        {"day": ${day.day}, "title": ${JSON.stringify(day.title)}, "rest": true, "sections": [], "remember": ""}`;
  }
  const lines = [];
  lines.push(`        {"day": ${day.day}, "title": ${JSON.stringify(day.title)}, "rest": false,`);
  lines.push('         "sections": [');
  day.sections.forEach((s, i) => {
    const one = `{"time": ${JSON.stringify(s.time)}, "do": ${JSON.stringify(s.do)}, "say": ${arr(s.say)}}`;
    lines.push("           " + one + (i + 1 < day.sections.length ? "," : ""));
  });
  lines.push("         ],");
  lines.push(`         "remember": ${JSON.stringify(day.remember)}}`);
  return lines.join("\n");
}

function fmtDetail(d) {
  const lines = [];
  lines.push(fmtVideo(d.video));
  lines.push(`      "advanced": ${JSON.stringify(d.advanced)},`);
  lines.push('      "days": [');
  d.days.forEach((day, i) => {
    lines.push(fmtDay(day) + (i + 1 < d.days.length ? "," : ""));
  });
  lines.push("      ]");
  return lines.join("\n");
}

function serialize(content) {
  const parts = [];
  parts.push("{");
  parts.push(`  "version": ${content.version},`);
  parts.push('  "weeks": [');
  parts.push(content.weeks.map(fmtWeek).join(",\n"));
  parts.push("  ],");
  parts.push('  "details": {');
  const keys = Object.keys(content.details);
  parts.push(keys.map((k) => `    ${JSON.stringify(k)}: {\n${fmtDetail(content.details[k])}\n    }`).join(",\n"));
  parts.push("  }");
  parts.push("}");
  return parts.join("\n") + "\n";
}

// ---------- 主流程 ----------

function main() {
  const args = process.argv.slice(2);
  const bump = args.includes("--bump");
  const rest = args.filter((a) => a !== "--bump");
  const dir = rest.shift();
  const weeks = rest.map(Number);
  if (!dir || !weeks.length) {
    console.error('用法：node tools/merge-weeks.js <片段目录> <周号...> [--bump]');
    process.exit(2);
  }

  const content = JSON.parse(fs.readFileSync(CONTENT, "utf-8"));
  let bad = 0;

  for (const n of weeks) {
    const file = path.join(dir, "week-" + String(n).padStart(2, "0") + ".json");
    if (!fs.existsSync(file)) { fail(`找不到 ${file}`); bad++; continue; }
    let frag;
    try {
      frag = JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch (e) {
      fail(`${file} 不是合法 JSON：${e.message}`); bad++; continue;
    }
    const errs = checkWeek(n, frag);
    if (errs.length) {
      errs.forEach((e) => fail(`第 ${n} 周：${e}`));
      bad++;
      continue;
    }
    const skeleton = content.weeks.find((w) => w.week === n);
    if (!skeleton) { fail(`content.json 里没有第 ${n} 周的骨架`); bad++; continue; }
    content.details[String(n)] = frag;
    skeleton.detailed = true;
    const done = frag.days.filter((d) => !d.rest).length;
    console.log(`✔ 第 ${n} 周 ${skeleton.theme}／${skeleton.themeEn}：${done} 个活动日，${frag.days.reduce((a, d) => a + d.sections.length, 0)} 个时间段块`);
  }

  if (bad) {
    console.error(`\n有 ${bad} 周没通过校验，content.json 未改动。`);
    process.exit(1);
  }

  // 键按周号排序，读起来顺
  const sorted = {};
  Object.keys(content.details).map(Number).sort((a, b) => a - b)
    .forEach((k) => { sorted[String(k)] = content.details[String(k)]; });
  content.details = sorted;

  if (bump) {
    content.version = Number(content.version) + 1;
    console.log(`内容版本 → ${content.version}`);
  }

  fs.writeFileSync(CONTENT, serialize(content), "utf-8");
  const detailed = content.weeks.filter((w) => w.detailed).map((w) => w.week);
  console.log(`\ncontent.json 已更新：细化周 = ${detailed.join(", ")}`);
}

main();
