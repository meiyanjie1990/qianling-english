// 从 content.json 重新生成 E:\谦灵英语启蒙\ 的每周教案 md（2026-09 内容v5 升级版）
// 新生成：核心词句 / 逐日计划 / 冰箱贴 / 进阶
// 复用旧md：阶段、本周只需做的一件事、视频用法、文件路径
// 新写：休息日提示、本周提醒（数据在 MD_EXTRA）
// 用法：node tools/gen-md.js
"use strict";

const fs = require("fs");
const path = require("path");

const APP_ROOT = path.join(__dirname, "..");
const PLAN_DIR = "E:/谦灵英语启蒙";

// 每周 md 文件名（旧文件用同款名字覆盖）
const NAMES = {
  1: "第01周-颜色-Colors.md", 2: "第02周-动物-Animals.md", 3: "第03周-食物-Food.md",
  4: "第04周-身体-Body.md", 5: "第05周-家人-Family.md", 6: "第06周-动作-Actions.md",
  7: "第07周-数字-Numbers.md", 8: "第08周-颜色2-Colors.md", 9: "第09周-动物2-Animals.md",
  10: "第10周-食物2-Food.md", 11: "第11周-衣服-Clothes.md", 12: "第12周-天气-Weather.md",
  13: "第13周-情绪-Feelings.md", 14: "第14周-身体2-Body.md", 15: "第15周-动物3-Animals.md",
  16: "第16周-食物3-Food.md", 17: "第17周-动作2-Actions.md", 18: "第18周-交通-Transport.md",
  19: "第19周-家人2-Family.md", 20: "第20周-颜色3-Colors.md", 21: "第21周-数字2-Numbers.md",
  22: "第22周-地点-Places.md", 23: "第23周-圣诞特辑-Christmas.md", 24: "第24周-综合复习-Review.md"
};

// 每周期额外数据：休息日提示 + 本周提醒（中文教学指导，重新校准过）
const MD_EXTRA = {
  1: { rest3: "不安排。见红色东西顺口说一句 \"It's red!\" 就行。", rest67: "不安排。周末出门玩颜色寻宝：\"Find something blue!\"",
    remind: ["这一周的关键不是「教会」，是让孩子觉得「说英语好玩」——她说对了亲一下，说错了笑着重复一遍。", "颜色是最好复习的词：出门、吃饭、洗澡，随时随地指一指。", "本周结束时，能指对红蓝两色、跟着哼颜色歌，就算满分。"] },
  2: { rest3: "不安排。路上见猫狗顺口说 \"Look! A dog!\"。", rest67: "不安排。周末看动物绘本，指一个叫一声。",
    remind: ["叫声比单词更容易开口——先学 woof，再学 dog。", "学动物叫不嫌吵，越大声记得越牢。", "本周结束能对着狗说 dog 或 woof，就算满分。"] },
  3: { rest3: "不安排。吃饭时顺口报个菜名 \"Yummy rice!\"。", rest67: "不安排。周末逛菜场/超市，见什么说什么。",
    remind: ["\"I want...\" 是吃饭喝水天天能用的句型，比单词更值得练。", "她说不出完整句没关系，说 \"apple\" 一个词也接住。", "本周结束能在饭桌上说对两个食物名，就算满分。"] },
  4: { rest3: "不安排。洗澡时顺口说 \"Wash your nose!\"。", rest67: "不安排。周末玩「妈妈指哪她摸哪」。",
    remind: ["身体词要配动作——指、眨、闻，动作比发音先记住。", "别考她「鼻子怎么说」，要说 \"Touch your nose\" 看她做不做。", "本周结束能摸对鼻子和眼睛，就算满分。"] },
  5: { rest3: "不安排。见谁都顺口说一句英文称呼。", rest67: "不安排。周末出门见人随口指认：\"Look, that's a baby!\"",
    remind: ["这一周的关键不是「教会」，是把称呼和人脸挂上钩。她指对了、说清一个音，就算成功。", "爸爸回家、奶奶视频这种真人出现的瞬间，比任何卡片都有效，抓住那几秒钟。", "本周结束时，她能指着家人说出 mummy 或 daddy 里任意一个音，就算满分。"] },
  6: { rest3: "不安排。饭前喊一句 \"Sit down, please!\"。", rest67: "不安排。周末下楼玩 \"Let's run!\"",
    remind: ["动作词边说边做，她先会做、再会跟读，最后才会说。", "喊口令的活可以换她来——她发号施令，你夸张照做。", "本周结束能听口令做对三个动作，就算满分。"] },
  7: { rest3: "不安排。上下楼数台阶 \"One, two, three!\"。", rest67: "不安排。周末数水果、数饼干，数完就吃。",
    remind: ["数数要配手指和实物，空数没意义。", "数错不纠正，重数一遍就是。", "本周结束能跟着数到 five，就算满分。"] },
  8: { rest3: "不安排。穿衣服时问一句 \"Which one is red?\"。", rest67: "不安排。周末玩「颜色大搜寻」，全家一起找。",
    remind: ["pink 和 purple 容易混，找实物对照（她的发卡、你的手机壳）。", "\"I like...\" 让她自己挑颜色，比被考更有劲。", "本周结束六个颜色能指对四个，就算满分。"] },
  9: { rest3: "不安排。看见鸟学一声 \"Quack quack!\"。", rest67: "不安排。周末看动物视频，每出来一个学一声叫。",
    remind: ["叫声是这周的钥匙——先会叫，再会说。", "别要求四种动物都记住，能对上两种就是胜利。", "本周结束能听到 moo 指牛，就算满分。"] },
  10: { rest3: "不安排。饭桌上顺口说 \"I eat rice.\"。", rest67: "不安排。周末包饺子，包一个说一个 dumpling。",
    remind: ["食物词每天都在用，不用特意教，顺口说就行。", "\"More, please!\" 是高频句，她说了就真的再给一点。", "本周结束能说 \"I want...\" 加一个食物词，就算满分。"] },
  11: { rest3: "不安排。出门前顺口说 \"Put on your shoes!\"。", rest67: "不安排。周末晾衣服时指一件说一件。",
    remind: ["穿衣脱衣一天好几回，每次说一遍，比任何游戏都管用。", "她说 \"My hat!\" 这种带 my 的，要特别接住夸。", "本周结束能听懂 \"Put on your shoes\" 并去拿鞋，就算满分。"] },
  12: { rest3: "不安排。看窗外顺口说 \"Look at the sky!\"。", rest67: "不安排。周末去公园，说天气、找云彩。",
    remind: ["天气词要配着当天的真天气说，晴天说 sunny，下雨说 raining。", "假装下雨的游戏她最喜欢，多玩。", "本周结束能听懂 \"It's sunny\" 和 \"It's raining\"，就算满分。"] },
  13: { rest3: "不安排。她心情好时说一句 \"You're happy!\"。", rest67: "不安排。周末看动画，出现表情就指一下说情绪。",
    remind: ["情绪词别只教词，要配脸——照镜子做表情最好。", "她哭闹时先安抚，情绪平复了再说 \"Happy now?\"，不在情绪里教学。", "本周结束能对着镜子做出 happy 脸，就算满分。"] },
  14: { rest3: "不安排。洗澡时顺口说 \"Wash your hands!\"。", rest67: "不安排。周末按手印脚印玩。",
    remind: ["身体词第4周就学过，这周是「第二套」——多复习、少上新。", "挠痒痒游戏会让她对 tummy 记得特别牢。", "本周结束洗澡时能听懂 wash 加三个部位，就算满分。"] },
  15: { rest3: "不安排。见大狗小狗顺口比 \"Big! Small!\"。", rest67: "不安排。周末去动物园或看动物绘本。",
    remind: ["big 和 small 配上手势（摊手 vs 捏指），比单纯说管用。", "狮子吼和大象鼻子是这周最好玩的梗，尽情演。", "本周结束能比着大小说对两个动物，就算满分。"] },
  16: { rest3: "不安排。吃点心时问一句 \"Do you like it?\"。", rest67: "不安排。周末做小饼干，边做边说 cookie。",
    remind: ["点头摇头就是答案，不逼她说完整句。", "她说 \"No! I don't like carrots.\" 也是满分——会用 don't 了。", "本周结束能点头说 like、摇头说 don't like，就算满分。"] },
  17: { rest3: "不安排。上楼踮脚尖 \"Tip-toe!\"。", rest67: "不安排。周末全家转圈比赛，看谁先晕。",
    remind: ["动作词全家一起做才好玩，爸爸也跳。", "转圈要扶着她，防晕防摔。", "本周结束能听口令做对三个动作，就算满分。"] },
  18: { rest3: "不安排。路上见车顺口说 \"I see a car!\"。", rest67: "不安排。周末坐一次公交车，唱 Wheels On The Bus。",
    remind: ["出门路上就是教材，见一辆说一辆。", "The Wheels On The Bus 她可能已经会哼，重点跟 beep beep。", "本周结束能指认车和公交车，就算满分。"] },
  19: { rest3: "不安排。视频电话时教她说 \"Say hello to grandma!\"。", rest67: "不安排。周末翻全家福，挨个说 my。",
    remind: ["这周句子变长了（This is my...），她说一半也算数。", "aunt 和 uncle 家里没有就不用强带。", "本周结束能说 \"This is my mummy.\"，就算满分。"] },
  20: { rest3: "不安排。吃橙子时说 \"The orange is orange!\"。", rest67: "不安排。周末画彩虹，一个颜色涂一格。",
    remind: ["\"My favourite colour is...\" 她自己选的才算数，别替她答。", "黑白色的东西家里多，顺路就能复习。", "本周结束能说出一个自己喜欢的颜色，就算满分。"] },
  21: { rest3: "不安排。吃葡萄数一数 \"One, two, three!\"。", rest67: "不安排。周末玩积木，搭一块数一块。",
    remind: ["数实物永远比数手指更有劲，吃的最管用。", "数错就笑着重来，不纠正。", "本周结束能自己数到 ten，就算满分。"] },
  22: { rest3: "不安排。出门进门都喊 \"We are home!\"。", rest67: "不安排。周末去公园，一路报地名。",
    remind: ["地点词要「身临其境」——到了公园才说 park，在家说 home。", "家里摆地点地图的游戏可以常玩，消耗精力又复习。", "本周结束能指对公园和家，就算满分。"] },
  23: { rest3: "不安排。看圣诞树顺口说 \"Look at the star!\"。", rest67: "不安排。周末挂圣诞袜，说 stocking。",
    remind: ["圣诞周的任务是氛围不是词汇——开心过节，词顺口带。", "拆礼物时 \"Open the gift!\" 多说几遍，最有画面。", "本周结束能说 Merry Christmas，就算满分。"] },
  24: { rest3: "不安排。随机指颜色、动物、食物各说一遍。", rest67: "不安排。周末全家开「她的小表演会」，只鼓掌不考试。",
    remind: ["这是综合复习周：全部是旧知识，重点是让她「表演」而不是「被考」。", "表演会上全家鼓掌越响，她下阶段越敢开口。", "24周结束，她能主动往外蹦英语词，这半年的启蒙就算成功。"] }
};

function q(s) { return JSON.stringify(s); }

function buildDay(day, weekNum) {
  if (day.rest) {
    const note = day.day === 3
      ? MD_EXTRA[weekNum].rest3
      : MD_EXTRA[weekNum].rest67;
    return "### 第" + day.day + "天 · 休息\n\n" + note + "\n";
  }
  let out = "### 第" + day.day + "天 · " + day.title + "\n\n";
  for (const s of day.sections) {
    out += "**" + s.time + "**\n";
    out += "- 做什么：" + s.do + "\n";
    out += "- 说什么：\n";
    for (const line of s.say) out += "  > \"" + line + "\"\n";
    out += "\n";
  }
  out += "**今天只需记**：" + day.remember + "\n";
  return out;
}

function main() {
  const content = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "content.json"), "utf-8"));
  for (const w of content.weeks) {
    if (!w.detailed) continue;
    const n = w.week;
    const detail = content.details[String(n)];
    const oldPath = path.join(PLAN_DIR, NAMES[n]);
    const old = fs.readFileSync(oldPath, "utf-8");

    // 复用旧 md 的三块：阶段 / 一件事 / 视频段
    const stage = ((old.match(/\*\*阶段\*\*：([^*]+)/) || [])[1] || "").trim();
    const oneThing = (old.match(/\*\*本周只需做的一件事\*\*：([^\n]+)/) || [])[1] || "";
    const videoSec = old.split("## 一、本周视频")[1] && old.split("## 一、本周视频")[1].split("## 二、")[0]
      ? "## 一、本周视频" + old.split("## 一、本周视频")[1].split("## 二、")[0]
      : "";

    const words = w.coreWords.map(x => x.en + " " + x.zh).join(" · ");
    const sents = w.coreSentences.map(s => '"' + s + '"').join(" ");

    let out = "# 第" + String(n).padStart(2, "0") + "周 · " + w.theme + " " + w.themeEn + "\n\n";
    out += "**日期**：" + w.dates + "　**阶段**：" + stage + "　**节奏**：4 天活动（第1、2、4、5天）+ 3 天休息\n";
    out += "**核心词**：" + words + "\n";
    out += "**核心句**：" + sents + "\n";
    out += "**本周只需做的一件事**：" + oneThing + "\n\n---\n\n";
    out += videoSec.replace(/\n---\s*$/, "").trim() + "\n\n---\n\n";
    out += "## 二、逐日计划\n\n";
    for (const day of detail.days) out += buildDay(day, n) + "\n---\n\n";

    // 冰箱贴：活动日用 remember，休息日固定一句
    out += "## 三、冰箱贴版（打印出来贴冰箱，或截图存手机）\n\n";
    out += "| 天 | 主题 | 一句话 |\n|---|---|---|\n";
    for (const day of detail.days) {
      const line = day.rest ? "顺口说一句本周的词" : day.remember;
      out += "| " + day.day + " | " + day.title + " | " + line + " |\n";
    }
    const v = detail.video;
    out += "\n**视频**：" + v.primary.no + " " + v.primary.name +
      (v.advanced ? "｜**进阶**：" + v.advanced.no + " " + v.advanced.name : "") + "\n\n---\n\n";

    // 进阶：按标记拆成条目
    out += "## 四、进阶内容（选做）\n\n";
    const adv = detail.advanced;
    const parts = adv.split(/(?=进阶(?:词|句型|游戏|绘本|小任务))/).filter(Boolean);
    for (const p of parts) {
      const m = p.match(/^(进阶\S{1,2})：(.+)$/);
      if (m) out += "- **" + m[1] + "**：" + m[2].trim() + "\n";
      else out += "- " + p.trim() + "\n";
    }

    out += "\n---\n\n## 五、本周提醒\n\n";
    for (const r of MD_EXTRA[n].remind) out += "- " + r + "\n";

    fs.writeFileSync(oldPath, out, "utf-8");
    console.log("✔ 第" + String(n).padStart(2, "0") + "周 → " + NAMES[n]);
  }
}

main();
