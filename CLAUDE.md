# 谦灵启蒙 App · 项目名片

> 最后更新：2026-09-10｜页面代码版本 v4（version.json）｜内容版本 3（content.json，第 1-24 周已细化）

## 项目概述

**谦灵启蒙** 是 Mei 给女儿谦灵（2023-06-22 出生，现 3 岁）做的手机**英语启蒙备课 + 打卡 PWA**（手机网页应用：可添加到主屏幕、断网也能打开）。

- 课程是一年 48 周的幼儿英语启蒙（2026-06-29 ~ 2027-06-20 排满），主题线来自 `E:\谦灵英语启蒙\` 的年度规划。
- 手机上是给 **Mei 备课速查 + 记录每天有没有带谦灵做**（打卡）的工具，不是给谦灵自己看自己玩的 App。
- 每周有「骨架」（主题、emoji、日期、核心词、核心句）；**细化过**的周还有逐日分时段内容（时间段 / 做什么 / 英文原句）。
- **48 周的核心词 / 核心句都已补满**（2026-09-10，内容版本 2）：非细化周一律 ≥5 个核心词、≥2 个核心句，不再有空数组。第 1-4 周的骨架字段保持与 docx 源材料一致，不动。
- 目前第 1-24 周已细化（到 12 月中的「综合复习」）；第 25 周起只有骨架，App 内显示「内容还没出」。
- **每周的详细计划另有一份 md**，在 `E:\谦灵英语启蒙\第NN周-主题-English.md`（每周一个文件，第 01-24 周齐全）。md 是给 Mei 看的完整教案（视频/逐日计划/冰箱贴/配套讲义/进阶/提醒），content.json 是 App 读的数据版——**同一份内容两个出口**，改内容要两边一起改。
- 打开默认停在**第 2 周 Animals**（DEFAULT_WEEK=2）。
- **打卡记录只存在手机本地**（localStorage，浏览器本地存储），没有服务器、不跨设备同步；换设备或清浏览器数据会重新开始。
- 托管于 GitHub Pages（GitHub 免费网页托管），**已部署上线**：push 到 master 后由 `.github/workflows/pages.yml` 工作流自动发布（约 1-2 分钟生效）。注意本仓库不能用 GitHub 老式"分支构建"方式（新仓库会卡死在 building 状态），必须走工作流部署。

线上地址：<https://meiyanjie1990.github.io/qianling-english/>

## 目录定位

- **唯一主目录（git 仓库根）**：`E:\AI项目\谦灵启蒙App`。后续所有开发都从这里开始，不另建长期副本。
- GitHub 仓库：`meiyanjie1990/qianling-english`，Pages 服务仓库默认分支的根目录。
- **内容源材料在 `E:\谦灵英语启蒙\`**（另一个项目）：根目录下 `第NN周-主题-English.md` 是每周的详细计划（**第 01-24 周齐全，2026-09-10 起 md 取代了原来的 docx 三件套**），另有 `年度规划-谦灵英语启蒙.md`、`视频资源\01 - Super Simple Songs 视频272首\`（272 首，编号就在文件名开头），以及第 1-4 周遗留的 `第X周-主题\` docx 文件夹（Mei 会自己删）。App 仓库**只存转录后的 content.json，不存计划原文**。
- 每周 md 的写作规范（模板、JSON 规则、内容风格）：`E:\AI项目\.谦灵md暂存\_写作规范.md`，标杆样本是同目录的 `第05周-家人-Family.md` + `week-05.json`。这两个文件是「怎么写一周新内容」的活教材，别删。
- 转录参考：`docs/source-transcripts\` 放着 1-4 周老 docx 的 markdown 转录版 + 年度规划（历史资料）。
- 设计文档与 8 任务实施计划在 `docs\superpowers\specs\` 和 `docs\superpowers\plans\`（2026-09-09，本 App 从零到上线的完整记录）。
- 日常开发一律以主目录为准（2026-09 开发期的隔离 worktree 与 feat 分支已合并删除）。

## 当前进度

| 部分 | 状态 |
|---|---|
| 48 周骨架（weeks） | 全部在 content.json，字段完整（含 1-48 周的详细 false/true 标记）；**48 周核心词句已补满**（非细化周 ≥5 词 / ≥2 句） |
| 细化内容（details） | **第 1-24 周**，每周 7 天（休息日固定第 3、6、7 天，活动日只有 1/2/4/5），每周带主视频+进阶视频+进阶说明 |
| 每周 md 计划 | `E:\谦灵英语启蒙\第01周-…` 到 `第24周-…`，共 24 个文件 |
| 页面代码 | v4：三页齐全 + PWA 套件 + 更新徽标（真按钮、禁选字、清缓存后再刷新）；返回键走历史记录、休息日无打卡键、本周页有「整周打卡」 |
| 测试 | 32/32 通过（content 7 + logic 10 + ui 9 + nav 6） |
| 仓库与上线 | ✅ 已上线 https://meiyanjie1990.github.io/qianling-english/，工作流自动部署 |

## 文件结构

| 文件 | 作用 |
|---|---|
| `index.html` | 页面外壳 + 全部 CSS + 三视图容器 + Service Worker 注册 + 「点我更新」徽标逻辑 |
| `logic.js` | Logic 模块：内容解析/拉取、周号钳制、打卡读写、localStorage 键定义。UMD（同一份代码浏览器和 Node 都能用），Node 下导出给测试 |
| `ui.js` | Ui 模块：本周页 / 当天详情页 / 全年地图页渲染、打卡勾选状态、整周打卡键、**视图历史记录**（手机返回键先回上一页）。UMD |
| `content.json` | 全部课程数据：48 周骨架（核心词句已补满）+ 细化周的逐日内容；顶部带内容版本号 `version` |
| `version.json` | 页面代码发布版本 `{"version": 4}`，驱动「点我更新」徽标 |
| `manifest.json` | PWA 名称「谦灵启蒙」、图标、主题色 #FFF6E9（暖底） |
| `sw.js` | Service Worker（浏览器后台脚本，管缓存）：content/version 走网络优先，其余缓存优先；`CACHE_NAME` 即缓存版本 |
| `icon-192.png` / `icon-512.png` | PWA 图标（浅蓝渐变圆角方块 #C1DFFA→#82BBEF + 白色幼圆「灵」字），`tools/make-icons.py` 生成 |
| `apple-touch-icon.png` | iPhone「添加到主屏幕」用的图标 |
| `tests/` | 测试：content / logic / ui / nav 四个文件共 32 条，`node --test` 跑（nav.test.js 用最小浏览器桩验证返回键与整周打卡；ui.test.js 有一条拿真实 content.json 全量渲染的回归测试） |
| `tools/` | `make-icons.py`：图标（`python tools/make-icons.py` 出正式图标，加 `options` 出三方案对比图 `docs/icon-options.png`）。`merge-weeks.js`：**把每周 JSON 片段合并进 content.json 的工具**，见「每周新内容固定流程」。改图标后要提交新的 PNG |
| `docs/` | `source-transcripts/`（1-4 周老 docx 转录，历史资料）+ `superpowers/`（设计文档、实施计划）+ `icon-options.png` |
| `.github/workflows/pages.yml` | GitHub Pages 部署工作流（push 到 master 自动发布）；仓库 remote 用 SSH（git@github.com），https 推送会被重置 |

## content.json 结构（转新内容照这个填）

```json
{
  "version": 1,
  "weeks": [
    { "week": 1, "stage": 1, "dates": "6/29-7/5", "theme": "颜色",
      "themeEn": "Colors", "emoji": "🔴",
      "coreWords": [{ "en": "red", "zh": "红色" }],
      "coreSentences": ["I see red."],
      "detailed": true }
  ],
  "details": {
    "1": {
      "video":    { "primary": { "name": "I See Something Blue", "no": "026" },
                    "advanced": { "name": "I See Something Pink", "no": "027" } },
      "advanced": "进阶词/句/游戏/绘本文案（选做内容，App 里可展开）",
      "days": [
        { "day": 1, "title": "第1天标题", "rest": false,
          "sections": [ { "time": "穿衣服 7:00-7:15", "do": "动作描述", "say": ["英文原句1", "英文原句2"] } ],
          "remember": "当天小结（中英都行）" },
        { "day": 6, "title": "休息", "rest": true, "sections": [], "remember": "" }
      ]
    }
  }
}
```

规则要点：

- `weeks` 48 个骨架对象**全部存在**，1-4 周已标 `detailed: true`；加新周细化时把该周骨架标 true 并补全核心词句。
- **48 周都有核心词和核心句**（内容版本 2 起）：非细化周一律 ≥5 个核心词、≥2 个核心句，`content.test.js` 会卡这条。改骨架时别把某周清空。
- `details` 的键是字符串周号（`"1"` 不是 `1`）；每周 `days` 恰 7 天，**休息日固定为第 3、6、7 天**（周三+周末，`rest: true`、sections 空），**活动日只有 1/2/4/5**，样式见上面的 `{"day": 6, ...}` 休息日条目。
- 每个活动日（非休息天）的 sections 块 `time / do / say`：时间段、Mei 照做的动作、对谦灵说的英文原句。测试要求整周 7 天齐全、有 video、活动日结构完整。
- **休息日不打卡**：`renderDayPage` 遇到 `rest: true` 不渲染打卡按钮（休息日本来就没事可做），只有活动日才有「✅ 今天完成啦」。改当天页时别把这条删了。

## 每周新内容固定流程

Mei 说「**出第 X 周的细化版**」（或 App 里提示的同款话）时，照此执行：

1. **写本周的 md 计划**，落到 `E:\谦灵英语启蒙\第NN周-<中文主题>-<EnglishTheme>.md`（NN 两位补零，保证按顺序排）。
   模板、JSON 规则、内容风格照 `E:\AI项目\.谦灵md暂存\_写作规范.md`；标杆样本是同目录的 `第05周-家人-Family.md` + `week-05.json`。
2. **写本周的 JSON 片段** `week-NN.json`：顶层正好 video / advanced / days 三个键，`days` 恰好 7 项，休息日固定第 3、6、7 天，活动日（1/2/4/5）每天 ≥3 个时间段块。
3. **合并进 content.json**（别手工改 JSON，排版会乱）：
   `node tools/merge-weeks.js "<片段所在目录>" NN --bump`
   工具先严格校验（7 天齐全 / 休息日结构 / 活动日块数 / time,do,say 完整），通过后写进 `details["NN"]`、把该周骨架标 `detailed: true`、内容版本 +1，并保持项目原有排版。
   一次做多周：`node tools/merge-weeks.js <目录> 5 6 7 8 9 --bump`（`--bump` 只加一次）。
4. 跑测试全绿（`node --test`；沙箱里报 EPERM 就逐个 `node tests/x.test.js`）。
5. **提交并 push**，线上验证 `curl` 返回 200。
6. 完成。手机端 content.json 走网络优先，下次打开**自动拉到新内容**——这一步**不用动 version.json / sw.js**，也不用让 Mei 点更新。

> 2026-09-10 起：Mei 明确**以后不再要 docx 三件套**，每周只要一个 md。第 1-4 周的三个 docx 已由 `第01周-…md` 等取代（遗留的 `第X周-主题\` 文件夹她自己删）。

## 发布规则

1. **测试**：`node --test`，32 条全绿才算过。注意参数不带 `tests/`（Windows 本机带目录参数会报错）。若本机沙箱让 `node --test` 报 `spawn EPERM`（它要开子进程管道），就逐个跑 `node tests/content.test.js`、`node tests/logic.test.js`、`node tests/ui.test.js`、`node tests/nav.test.js`，同样一份测试、同样 32 条。
2. **提交**：`git status` 先确认没有意外文件；`.gitignore` 只忽略 Python 缓存等杂物（tools 目录），不把临时文件带进提交。
3. **改完必须 push + 线上验证**：push 后 Actions 工作流自动部署（`gh run list --repo meiyanjie1990/qianling-english` 看状态，约 1-2 分钟），再
   `curl -s -o /dev/null -w "%{http_code}" https://meiyanjie1990.github.io/qianling-english/` 返回 `200` 才算发布成功。
4. **纯内容更新**（只动 content.json）按「每周新内容固定流程」，不动版本号以外的发布件。
5. **页面代码更新**（index / logic / ui / manifest / 图标 / sw 行为变了）才需要**三处同步**：
   `version.json` 数字 +1 并 bump `sw.js` 的 `CACHE_NAME`（旧缓存版本会在 activate 时自动清掉），否则手机上旧缓存会盖住新代码。徽标「点我更新」= version.json 数字大于手机 localStorage 里记的 `qianling-app-version`。
6. 打卡记录在 Mei 手机 localStorage，与仓库无关——删库、回滚、改数据都不会动手机上的打卡。

## 技术架构

- **纯前端单页，无框架、无构建、零 npm 依赖**（测试用 Node 内置的 node:test）。
- **三个视图**（`index.html` 里三个 view 容器，ui.js 切换渲染）：
  本周页（核心词条 + 核心句卡 + 视频条 + 7 天打卡列表 + 整周打卡键 + 进阶选做折叠；未细化周显示「内容还没出」提示）；当天详情页（分时间段块：时间/做什么/英文原句 + 打卡勾选 + remember 小结）；全年地图页（48 周格子，细化周可点、未细化周灰显）。
- **代码分工**：index.html 只装配和启动；`Logic`（logic.js）管数据与状态，`Ui`（ui.js）管渲染；UMD 封装让浏览器和 Node 测试共用同一份文件。
- **导航与历史记录**（v2，解决「按返回键整个 App 退出」）：ui.js 的 `initApp` 把当前视图（week / day / map）同步写进 `history.state`。换页 = `pushState`（多一条记录），页内换周 = `replaceState`（原地改，返回键不会一周一周倒），页内「← 返回」按钮 = `history.back()`。`popstate` 回来就按 `e.state` 重渲染。**根记录 depth 0**：只有在本周页按返回键才会退出 App。测试在 `tests/nav.test.js`。
- **整周打卡**（v3）：本周页 7 天列表下面一个「✅ 整周打卡 · 已完成 n/4 天」描边胶囊。内容太简单、谦灵早就会了的时候一下就勾满，省得一天天点。逻辑在 `Logic.activityDays` / `doneCount` / `allDaysDone` / `toggleWeek`：**只勾活动日（非休息日），休息日不勾也不显示**；没勾满时点 = 全勾，已全勾时点 = 全取消。
- **更新徽标（v4，修「点不动 / 一点选中一个字」）**：`#update-badge` 是**真 `<button type="button">`**（原来是 div，手机上一点就变成选字）；
  CSS 里全局给 `button, [data-action]` 加了 `user-select:none / -webkit-user-select:none / -webkit-touch-callout:none / touch-action:manipulation`；
  点击后先**真的把缓存清干净**（`serviceWorker.getRegistrations()` 全部 unregister + `caches.keys()` 全部 delete，等 Promise 走完）**再** `location.reload()`，
  不再用「postMessage 后 setTimeout 600ms 刷新」那套（会跟清缓存赛跑，这正是「要点好几次才生效」的原因）。连点有 `updating` 守卫，徽标常驻到点掉。
  **这几条是通用教训，已写进 `E:\AI项目\AGENTS.md` 的「手机端 App 通则」，以后做任何手机 App 先照做。**
- **数据拉取**：逻辑层先 `content.json?ts=时间戳` 网络拉取，失败回退普通请求，再失败走缓存/报错提示——即内容**永远读线上最新**。
- **缓存策略**（sw.js）：`content.json` / `version.json` 网络优先（每次联网先拿最新，离线才用缓存）；其余静态资源（HTML/JS/图标）缓存优先。
- **本地状态** localStorage 三键：`qianling-progress-v1`（打卡记录）、`qianling-current-week`（当前周）、`qianling-app-version`（已接受的版本号）。
- **测试**：`tests/` 下四个文件 32 条，直接读 content.json 与 require logic.js/ui.js，不开浏览器；`nav.test.js` 自建最小 window/document/history 桩来验证返回键与整周打卡行为；`ui.test.js` 里有一条**拿真实 content.json 把每个细化周的每一天都渲染一遍**的回归测试（新加周把页面搞崩会当场报错）。

## 日常任务速查

| Mei 的说法 | 对应动作 |
|---|---|
| 「出第 X 周的细化版」/「第 X 周内容还没出」 | 走上面的「每周新内容固定流程」 |
| 「改页面样式 / 修个 bug」 | 改代码 → `node --test` → bump version.json + sw.js CACHE_NAME → push → curl 200 |
| 「点我更新点不动 / 一点就选中一个字」 | v4 已修：真 button + 全局禁选字（`button,[data-action]`）+ 清完缓存再 reload。通用做法见 `E:\AI项目\AGENTS.md`「手机端 App 通则」，新 App 一开始就要带上 |
| 「出后面 N 周的详细计划」 | 走「每周新内容固定流程」：写 md + JSON 片段 → `node tools/merge-weeks.js <目录> 周号… --bump` → 测试 → push |
| 「按返回键整个 App 退出了」 | v2 已修：ui.js 用 history.state 记视图，返回键先回上一页，只有本周页根记录才退出。改了视图切换逻辑要跑 `tests/nav.test.js` |
| 「休息日怎么还有打卡键」 | v2 已修：`renderDayPage` 里 `day.rest` 为真就不渲染打卡键 |
| 「这周内容太简单 / 她早就会了」 | 本周页点「✅ 整周打卡」，一次勾满本周 4 个活动日（休息日不勾）；再点一下全部取消 |
| 「打卡没了 / 换个手机还有打卡吗」 | 打卡在手机本地，换设备/清浏览器会丢，无云端可恢复 |
| 「图标/名字/颜色想改」 | manifest.json、图标 png（tools/make-icons.py 重新生成；当前浅蓝渐变 #C1DFFA→#82BBEF + 白色幼圆「灵」，备选方案见 docs/icon-options.png）、theme_color #FFF6E9 |
| 「第 X 周的内容怎么又没了」 | 检查是不是忘 push，或 content.json 忘标 detailed / 忘 bump 内容版本号 |
