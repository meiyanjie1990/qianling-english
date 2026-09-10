# 谦灵启蒙 App · 项目名片

> 最后更新：2026-09-10｜页面代码版本 v2（version.json）｜内容版本 2（content.json，1-4 周已细化，48 周核心词句已补满）

## 项目概述

**谦灵启蒙** 是 Mei 给女儿谦灵（2023-06-22 出生，现 3 岁）做的手机**英语启蒙备课 + 打卡 PWA**（手机网页应用：可添加到主屏幕、断网也能打开）。

- 课程是一年 48 周的幼儿英语启蒙（2026-06-29 ~ 2027-06-20 排满），主题线来自 `E:\谦灵英语启蒙\` 的年度规划。
- 手机上是给 **Mei 备课速查 + 记录每天有没有带谦灵做**（打卡）的工具，不是给谦灵自己看自己玩的 App。
- 每周有「骨架」（主题、emoji、日期、核心词、核心句）；**细化过**的周还有逐日分时段内容（时间段 / 做什么 / 英文原句）。
- **48 周的核心词 / 核心句都已补满**（2026-09-10，内容版本 2）：非细化周一律 ≥5 个核心词、≥2 个核心句，不再有空数组。第 1-4 周的骨架字段保持与 docx 源材料一致，不动。
- 目前第 1-4 周已细化（Colors / Animals / Food / Body）；第 5 周起只有骨架，App 内显示「内容还没出」。
- 打开默认停在**第 2 周 Animals**（DEFAULT_WEEK=2）。
- **打卡记录只存在手机本地**（localStorage，浏览器本地存储），没有服务器、不跨设备同步；换设备或清浏览器数据会重新开始。
- 托管于 GitHub Pages（GitHub 免费网页托管），**已部署上线**：push 到 master 后由 `.github/workflows/pages.yml` 工作流自动发布（约 1-2 分钟生效）。注意本仓库不能用 GitHub 老式"分支构建"方式（新仓库会卡死在 building 状态），必须走工作流部署。

线上地址：<https://meiyanjie1990.github.io/qianling-english/>

## 目录定位

- **唯一主目录（git 仓库根）**：`E:\AI项目\谦灵启蒙App`。后续所有开发都从这里开始，不另建长期副本。
- GitHub 仓库：`meiyanjie1990/qianling-english`，Pages 服务仓库默认分支的根目录。
- **内容源材料在 `E:\谦灵英语启蒙\`**（另一个项目，有它自己的 CLAUDE.md）：每周一个 `第X周-主题\` 文件夹，装 docx 三件套（详细计划 / 配套讲义 / 冰箱贴），另有 `年度规划-谦灵英语启蒙.md` 和 `视频资源\`。App 仓库**只存转录后的 content.json，不存源 docx**。
- 转录参考：`docs/source-transcripts\` 放着 1-4 周源材料（docx 三件套）的 markdown 转录版 + 年度规划，转录 content.json 时对照用。
- 设计文档与 8 任务实施计划在 `docs\superpowers\specs\` 和 `docs\superpowers\plans\`（2026-09-09，本 App 从零到上线的完整记录）。
- 日常开发一律以主目录为准（2026-09 开发期的隔离 worktree 与 feat 分支已合并删除）。

## 当前进度

| 部分 | 状态 |
|---|---|
| 48 周骨架（weeks） | 全部在 content.json，字段完整（含 1-48 周的详细 false/true 标记）；**48 周核心词句已补满**（非细化周 ≥5 词 / ≥2 句） |
| 细化内容（details） | 第 1-4 周：Colors / Animals / Food / Body，每周 7 天（休息日固定第 3、6、7 天） |
| 页面代码 | v2：三页齐全（本周页 / 当天详情页 / 全年地图页）+ PWA 套件 + 更新徽标；返回键走历史记录、休息日无打卡键 |
| 测试 | 27/27 通过（content 7 + logic 8 + ui 7 + nav 5） |
| 仓库与上线 | ✅ 已上线 https://meiyanjie1990.github.io/qianling-english/，工作流自动部署 |

## 文件结构

| 文件 | 作用 |
|---|---|
| `index.html` | 页面外壳 + 全部 CSS + 三视图容器 + Service Worker 注册 + 「点我更新」徽标逻辑 |
| `logic.js` | Logic 模块：内容解析/拉取、周号钳制、打卡读写、localStorage 键定义。UMD（同一份代码浏览器和 Node 都能用），Node 下导出给测试 |
| `ui.js` | Ui 模块：本周页 / 当天详情页 / 全年地图页渲染、打卡勾选状态、**视图历史记录**（手机返回键先回上一页）。UMD |
| `content.json` | 全部课程数据：48 周骨架（核心词句已补满）+ 细化周的逐日内容；顶部带内容版本号 `version` |
| `version.json` | 页面代码发布版本 `{"version": 2}`，驱动「点我更新」徽标 |
| `manifest.json` | PWA 名称「谦灵启蒙」、图标、主题色 #FFF6E9（暖底） |
| `sw.js` | Service Worker（浏览器后台脚本，管缓存）：content/version 走网络优先，其余缓存优先；`CACHE_NAME` 即缓存版本 |
| `icon-192.png` / `icon-512.png` | PWA 图标（蓝色 #2F6FE0 圆角方块 + 白色「灵」字），`tools/make-icons.py` 生成 |
| `apple-touch-icon.png` | iPhone「添加到主屏幕」用的图标 |
| `tests/` | 测试：content / logic / ui / nav 四个文件共 27 条，`node --test` 跑（nav.test.js 用最小浏览器桩验证返回键历史） |
| `tools/` | `make-icons.py`：Pillow 脚本；重新生成图标后要提交新的 PNG |
| `docs/` | `source-transcripts/`（1-4 周源材料转录参考）+ `superpowers/`（设计文档、实施计划） |
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

1. **docx 三件套照常生成**到 `E:\谦灵英语启蒙\第X周-主题\`（Word/PDF 材料的固定出稿流程见主 CLAUDE.md 的文档生成条目，docx 用 docx skill 处理）。
2. **转录进 content.json**：把该周内容按上面的 schema 填进 `details`（video 主+进阶、advanced 文案、7 天逐块），并把 `weeks` 里该周骨架的 `detailed` 改成 `true`（骨架字段本来就该齐全，缺的补上）。转录对照源：docx 本体在 `E:\谦灵英语启蒙\`，markdown 转录参考在 `docs\source-transcripts\`。
3. **content.json 顶部 `"version"` 数字 +1**（内容版本号）。
4. 跑 `node --test` 全绿后提交并 **push**。
5. 完成。手机端 content.json 走网络优先，下次打开**自动拉到新内容**——这一步**不用动 version.json / sw.js**，也不用让 Mei 点更新。

## 发布规则

1. **测试**：`node --test`，27 条全绿才算过。注意参数不带 `tests/`（Windows 本机带目录参数会报错）。若本机沙箱让 `node --test` 报 `spawn EPERM`（它要开子进程管道），就逐个跑 `node tests/content.test.js`、`node tests/logic.test.js`、`node tests/ui.test.js`、`node tests/nav.test.js`，同样一份测试、同样 27 条。
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
  本周页（核心词条 + 核心句卡 + 视频条 + 7 天打卡列表 + 进阶选做折叠；未细化周显示「内容还没出」提示）；当天详情页（分时间段块：时间/做什么/英文原句 + 打卡勾选 + remember 小结）；全年地图页（48 周格子，细化周可点、未细化周灰显）。
- **代码分工**：index.html 只装配和启动；`Logic`（logic.js）管数据与状态，`Ui`（ui.js）管渲染；UMD 封装让浏览器和 Node 测试共用同一份文件。
- **导航与历史记录**（v2，解决「按返回键整个 App 退出」）：ui.js 的 `initApp` 把当前视图（week / day / map）同步写进 `history.state`。换页 = `pushState`（多一条记录），页内换周 = `replaceState`（原地改，返回键不会一周一周倒），页内「← 返回」按钮 = `history.back()`。`popstate` 回来就按 `e.state` 重渲染。**根记录 depth 0**：只有在本周页按返回键才会退出 App。测试在 `tests/nav.test.js`。
- **数据拉取**：逻辑层先 `content.json?ts=时间戳` 网络拉取，失败回退普通请求，再失败走缓存/报错提示——即内容**永远读线上最新**。
- **缓存策略**（sw.js）：`content.json` / `version.json` 网络优先（每次联网先拿最新，离线才用缓存）；其余静态资源（HTML/JS/图标）缓存优先。
- **本地状态** localStorage 三键：`qianling-progress-v1`（打卡记录）、`qianling-current-week`（当前周）、`qianling-app-version`（已接受的版本号）。
- **测试**：`tests/` 下四个文件 27 条，直接读 content.json 与 require logic.js/ui.js，不开浏览器；`nav.test.js` 自建最小 window/document/history 桩来验证返回键行为。

## 日常任务速查

| Mei 的说法 | 对应动作 |
|---|---|
| 「出第 X 周的细化版」/「第 X 周内容还没出」 | 走上面的「每周新内容固定流程」 |
| 「改页面样式 / 修个 bug」 | 改代码 → `node --test` → bump version.json + sw.js CACHE_NAME → push → curl 200 |
| 「按返回键整个 App 退出了」 | v2 已修：ui.js 用 history.state 记视图，返回键先回上一页，只有本周页根记录才退出。改了视图切换逻辑要跑 `tests/nav.test.js` |
| 「休息日怎么还有打卡键」 | v2 已修：`renderDayPage` 里 `day.rest` 为真就不渲染打卡键 |
| 「打卡没了 / 换个手机还有打卡吗」 | 打卡在手机本地，换设备/清浏览器会丢，无云端可恢复 |
| 「图标/名字/颜色想改」 | manifest.json、图标 png（tools/make-icons.py 重新生成，当前蓝底 #2F6FE0 + 白「灵」）、theme_color #FFF6E9 |
| 「第 X 周的内容怎么又没了」 | 检查是不是忘 push，或 content.json 忘标 detailed / 忘 bump 内容版本号 |
