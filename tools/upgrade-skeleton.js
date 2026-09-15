// 48周骨架核心词句一次性升级（2026-09 内容v5）
// 目标：①句子全部换成 native 妈妈日常话 ②难度按周爬坡（前8周短句，往后渐长）
// 用法：node tools/upgrade-skeleton.js（只动 coreWords/coreSentences，排版交给 merge-weeks 重排）
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content.json");

// [en, zh] 词表 + 核心句
const UPGRADES = [
  { w: 1, words: [["red", "红色"], ["blue", "蓝色"], ["yellow", "黄色"], ["green", "绿色"], ["orange", "橙色"], ["pink", "粉红色"]],
    sent: ["What colour is this? It's red!", "Can you find the blue one?", "I see something green!"] },
  { w: 2, words: [["dog", "狗"], ["cat", "猫"], ["bird", "鸟"], ["fish", "鱼"], ["duck", "鸭子"], ["rabbit", "兔子"]],
    sent: ["What's this? It's a dog!", "The dog says woof woof!", "Can you find the cat?"] },
  { w: 3, words: [["milk", "牛奶"], ["apple", "苹果"], ["banana", "香蕉"], ["egg", "鸡蛋"], ["rice", "米饭"], ["yogurt", "酸奶"]],
    sent: ["Do you want some milk?", "Yum! I like apples.", "Can you say banana?"] },
  { w: 4, words: [["head", "头"], ["eyes", "眼睛"], ["nose", "鼻子"], ["mouth", "嘴巴"], ["ears", "耳朵"], ["tummy", "肚子"], ["toes", "脚趾"]],
    sent: ["Touch your nose!", "Where's your mouth? Here it is!", "I have two eyes. Blink, blink!"] },
  { w: 5, words: [["mummy", "妈妈"], ["daddy", "爸爸"], ["baby", "宝宝"], ["grandma", "奶奶"], ["grandpa", "爷爷"], ["sister", "姐姐/妹妹"], ["brother", "哥哥/弟弟"], ["family", "家人"]],
    sent: ["This is my mummy. She gives me big hugs!", "My daddy is home! Let's go and say hi.", "Where's Grandma? There she is!"] },
  { w: 6, words: [["clap", "拍手"], ["jump", "跳"], ["run", "跑"], ["sit", "坐"], ["walk", "走"], ["dance", "跳舞"], ["stop", "停"]],
    sent: ["I can jump! Look at me!", "Clap your hands, one two three!", "Let's run! Ready, set, go!"] },
  { w: 7, words: [["one", "一"], ["two", "二"], ["three", "三"], ["four", "四"], ["five", "五"], ["six", "六"], ["seven", "七"]],
    sent: ["I have two hands.", "One, two, three! Count with me.", "How many toes? Five!"] },
  { w: 8, words: [["red", "红色"], ["blue", "蓝色"], ["yellow", "黄色"], ["green", "绿色"], ["pink", "粉红色"], ["purple", "紫色"], ["orange", "橙色"], ["white", "白色"]],
    sent: ["Which one is red? Point to it!", "I like blue. What do you like?", "Your dress is pink!"] },
  { w: 9, words: [["cow", "奶牛"], ["duck", "鸭子"], ["pig", "猪"], ["sheep", "绵羊"], ["moo", "哞（牛叫）"], ["quack", "嘎嘎（鸭叫）"], ["horse", "马"], ["neigh", "嘶（马叫）"]],
    sent: ["The cow says moo!", "Look at the ducks! Quack quack!", "What does the pig say? Oink oink!"] },
  { w: 10, words: [["rice", "米饭"], ["water", "水"], ["bread", "面包"], ["juice", "果汁"], ["soup", "汤"], ["noodles", "面条"], ["dumpling", "饺子"], ["yummy", "好吃"]],
    sent: ["I want some water, please.", "Rice is yummy!", "More, please!"] },
  { w: 11, words: [["hat", "帽子"], ["shirt", "衬衫"], ["shoes", "鞋子"], ["socks", "袜子"], ["dress", "连衣裙"], ["coat", "外套"], ["pants", "裤子"], ["gloves", "手套"]],
    sent: ["Put on your shoes!", "Where's my hat?", "Take off your socks."] },
  { w: 12, words: [["sun", "太阳"], ["rain", "雨"], ["wind", "风"], ["cloud", "云"], ["sky", "天空"], ["umbrella", "雨伞"], ["wet", "湿的"]],
    sent: ["It's sunny today!", "Look at the clouds!", "It's raining! We need an umbrella!"] },
  { w: 13, words: [["happy", "开心"], ["sad", "难过"], ["angry", "生气"], ["tired", "累"], ["scared", "害怕"], ["hungry", "饿"], ["sleepy", "困"]],
    sent: ["I'm happy!", "Are you tired?", "Don't be scared. Mummy's here."] },
  { w: 14, words: [["hands", "手"], ["feet", "脚"], ["tummy", "肚子"], ["back", "背"], ["hair", "头发"], ["knees", "膝盖"], ["elbows", "手肘"]],
    sent: ["Clap your hands!", "Wash your feet!", "My tummy is full!"] },
  { w: 15, words: [["lion", "狮子"], ["tiger", "老虎"], ["elephant", "大象"], ["monkey", "猴子"], ["big", "大的"], ["small", "小的"], ["giraffe", "长颈鹿"], ["tall", "高的"]],
    sent: ["The lion is big!", "The monkey is small.", "The giraffe is tall!"] },
  { w: 16, words: [["cake", "蛋糕"], ["carrot", "胡萝卜"], ["chicken", "鸡肉"], ["juice", "果汁"], ["yummy", "好吃"], ["cookie", "饼干"], ["share", "分享"]],
    sent: ["I like cake.", "Do you like carrots?", "Let's share the cookie!"] },
  { w: 17, words: [["stomp", "跺脚"], ["hop", "单脚跳"], ["skip", "蹦跳"], ["tip-toe", "踮脚尖"], ["spin", "转圈"], ["dance", "跳舞"], ["freeze", "定住"]],
    sent: ["I can hop on one foot!", "Let's stomp like an elephant!", "Freeze! Don't move!"] },
  { w: 18, words: [["car", "汽车"], ["bus", "公交车"], ["bike", "自行车"], ["plane", "飞机"], ["train", "火车"], ["boat", "船"], ["road", "马路"], ["fast", "快的"]],
    sent: ["I see a blue car!", "The bus is big.", "Let's go by train! Choo choo!"] },
  { w: 19, words: [["mummy", "妈妈"], ["daddy", "爸爸"], ["baby", "宝宝"], ["grandma", "奶奶"], ["grandpa", "爷爷"], ["sister", "姐姐/妹妹"], ["brother", "哥哥/弟弟"], ["aunt", "阿姨/姑姑"], ["uncle", "叔叔/舅舅"]],
    sent: ["This is my little sister.", "My grandma likes to sing.", "We are a family!"] },
  { w: 20, words: [["orange", "橙色"], ["white", "白色"], ["black", "黑色"], ["gold", "金色"], ["brown", "棕色"], ["silver", "银色"], ["rainbow", "彩虹"]],
    sent: ["My favourite colour is blue.", "What colour do you like?", "Look! A rainbow!"] },
  { w: 21, words: [["one", "一"], ["two", "二"], ["three", "三"], ["four", "四"], ["five", "五"], ["six", "六"], ["seven", "七"], ["eight", "八"], ["nine", "九"], ["ten", "十"], ["eleven", "十一"], ["twelve", "十二"]],
    sent: ["How many? Let's count!", "I have three cars!", "One, two... ten! Well done!"] },
  { w: 22, words: [["home", "家"], ["park", "公园"], ["shop", "商店"], ["bed", "床"], ["zoo", "动物园"], ["outside", "外面"], ["kitchen", "厨房"], ["playground", "游乐场"]],
    sent: ["Let's go to the park!", "Where's my bed?", "We're home!"] },
  { w: 23, words: [["tree", "圣诞树"], ["gift", "礼物"], ["star", "星星"], ["Santa", "圣诞老人"], ["snow", "雪"], ["bell", "铃铛"], ["reindeer", "驯鹿"]],
    sent: ["Merry Christmas!", "I see a gift under the tree!", "Jingle bells!"] },
  { w: 24, words: [["again", "再来一次"], ["all", "全部"], ["favourite", "最喜欢的"], ["more", "还要"], ["well done", "真棒"], ["together", "一起"], ["by myself", "我自己来"]],
    sent: ["Let's play again!", "Show me your favourite colour!", "I can do it by myself!"] },
  { w: 25, words: [["tree", "树"], ["flower", "花"], ["grass", "草"], ["leaf", "树叶"], ["sky", "天空"], ["butterfly", "蝴蝶"], ["grow", "生长"]],
    sent: ["I see a big green tree.", "The flowers are so pretty!", "Watch the butterfly fly!"] },
  { w: 26, words: [["hungry", "饿"], ["thirsty", "渴"], ["cold", "冷"], ["hot", "热"], ["sleepy", "困"], ["excited", "兴奋"], ["better", "好多了"]],
    sent: ["I'm hungry! Let's eat.", "I'm thirsty. Some water, please.", "I'm cold. Put on your coat."] },
  { w: 27, words: [["ant", "蚂蚁"], ["bee", "蜜蜂"], ["butterfly", "蝴蝶"], ["spider", "蜘蛛"], ["ladybug", "瓢虫"], ["worm", "蚯蚓"], ["snail", "蜗牛"]],
    sent: ["I see a busy bee!", "The butterfly is yellow.", "The ant is tiny but strong!"] },
  { w: 28, words: [["jacket", "夹克"], ["sweater", "毛衣"], ["pants", "裤子"], ["boots", "靴子"], ["scarf", "围巾"], ["gloves", "手套"], ["zipper", "拉链"]],
    sent: ["Put on your jacket — it's cold!", "My blue sweater is soft.", "Can you zip it up?"] },
  { w: 29, words: [["running", "跑步"], ["jumping", "跳"], ["eating", "吃"], ["sleeping", "睡觉"], ["drinking", "喝水"], ["singing", "唱歌"], ["dancing", "跳舞"], ["playing", "玩"]],
    sent: ["I am running!", "Daddy is sleeping. Shh!", "What are you doing? I'm playing!"] },
  { w: 30, words: [["giraffe", "长颈鹿"], ["zebra", "斑马"], ["bear", "熊"], ["kangaroo", "袋鼠"], ["tall", "高的"], ["fast", "快的"], ["stripes", "条纹"], ["pouch", "育儿袋"]],
    sent: ["The giraffe is tall.", "The zebra has stripes!", "The kangaroo can jump high!"] },
  { w: 31, words: [["plate", "盘子"], ["bowl", "碗"], ["cup", "杯子"], ["spoon", "勺子"], ["fork", "叉子"], ["knife", "刀"], ["chopsticks", "筷子"], ["napkin", "餐巾"]],
    sent: ["Breakfast time! Let's eat.", "I eat rice with a spoon.", "I'm full. Thank you, Mummy!"] },
  { w: 32, words: [["sunny", "晴"], ["rainy", "雨"], ["windy", "风"], ["cloudy", "多云"], ["cold", "冷"], ["hot", "热"], ["storm", "暴风雨"], ["rainbow", "彩虹"]],
    sent: ["It's cold today.", "It's rainy. Jump in the puddles!", "I like sunny days!"] },
  { w: 33, words: [["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"], ["E", "E"], ["F", "F"], ["G", "G"], ["H", "H"]],
    sent: ["A is for apple!", "B is for ball!", "Can you find the letter C?"] },
  { w: 34, words: [["Twinkle", "小星星"], ["Old Mac", "老麦克唐纳"], ["ABC", "字母歌"], ["Baby Shark", "鲨鱼宝宝"], ["Five Little Ducks", "五只小鸭子"], ["Head Shoulders", "头肩膝脚"], ["Itsy Bitsy", "小蜘蛛"], ["Row Row", "划小船"]],
    sent: ["Twinkle, twinkle, little star!", "Old MacDonald had a farm, E-I-E-I-O!", "The itsy bitsy spider climbs up!"] },
  { w: 35, words: [["school", "学校"], ["kitchen", "厨房"], ["bathroom", "浴室"], ["garden", "花园"], ["bedroom", "卧室"], ["playground", "游乐场"], ["shop", "商店"]],
    sent: ["Where's Mummy? She's in the kitchen.", "I play in the garden.", "Let's clean up your bedroom!"] },
  { w: 36, words: [["what's this", "这是什么"], ["let me try", "让我试试"], ["almost", "差一点"], ["by myself", "我自己来"], ["say it again", "再说一遍"], ["good try", "不错的尝试"], ["my turn", "轮到我了"]],
    sent: ["What's this? Let me try!", "I can do it by myself!", "Almost! Good try!"] },
  { w: 37, words: [["tall", "高"], ["kind", "善良"], ["funny", "有趣"], ["strong", "强壮"], ["beautiful", "漂亮"], ["love", "爱"], ["warm", "温暖"], ["hug", "拥抱"]],
    sent: ["My daddy is strong.", "Mummy is kind to me.", "I love my family!"] },
  { w: 38, words: [["run", "跑"], ["swim", "游泳"], ["fly", "飞"], ["eat", "吃"], ["sleep", "睡"], ["jump", "跳"], ["crawl", "爬"]],
    sent: ["A bird can fly.", "Fish can swim.", "A snake can crawl. Sss!"] },
  { w: 39, words: [["circle", "圆形"], ["square", "方形"], ["star", "星星"], ["heart", "心形"], ["triangle", "三角形"], ["diamond", "菱形"], ["colour", "颜色"]],
    sent: ["It's a red circle.", "The star is yellow.", "Draw a heart for Mummy!"] },
  { w: 40, words: [["story", "故事"], ["book", "书"], ["read", "读"], ["page", "页"], ["the end", "讲完了"], ["once upon a time", "很久很久以前"], ["turn", "翻"]],
    sent: ["Let's read a story!", "Once upon a time...", "Turn the page!"] },
  { w: 41, words: [["first", "先"], ["then", "然后"], ["again", "再一次"], ["wait", "等一下"], ["after", "之后"], ["before", "之前"], ["slowly", "慢慢地"]],
    sent: ["First clap, then jump!", "Wash your hands first, then eat!", "Wait for me, please!"] },
  { w: 42, words: [["shop", "商店"], ["buy", "买"], ["how much", "多少钱"], ["please", "请"], ["here you are", "给你"], ["thank you", "谢谢"], ["money", "钱"], ["welcome", "不客气"]],
    sent: ["I want an apple, please.", "How much is it?", "Here you are! Thank you!"] },
  { w: 43, words: [["sun", "太阳"], ["moon", "月亮"], ["star", "星星"], ["rainbow", "彩虹"], ["cloud", "云"], ["shine", "发光"], ["night", "夜晚"]],
    sent: ["Look at the rainbow!", "The moon is big tonight.", "The stars are shining!"] },
  { w: 44, words: [["who", "谁"], ["where", "在哪里"], ["why", "为什么"], ["tell me", "告诉我"], ["and then", "然后呢"], ["what happened", "发生了什么"], ["because", "因为"]],
    sent: ["Who is this?", "Where is the bear?", "What happened next? Tell me!"] },
  { w: 45, words: [["cake", "蛋糕"], ["candle", "蜡烛"], ["gift", "礼物"], ["balloon", "气球"], ["party", "派对"], ["blow", "吹"], ["wish", "愿望"]],
    sent: ["Happy Birthday to you!", "I am three years old!", "Make a wish and blow!"] },
  { w: 46, words: [["count", "数"], ["how many", "多少个"], ["crayons", "蜡笔"], ["fingers", "手指"], ["together", "一起"], ["ten", "十"], ["more", "还要"]],
    sent: ["I have five crayons.", "Let's count together: one, two, three!", "How many fingers do I have?"] },
  { w: 47, words: [["G", "G"], ["H", "H"], ["I", "I"], ["J", "J"], ["K", "K"], ["L", "L"], ["M", "M"], ["N", "N"], ["O", "O"], ["P", "P"]],
    sent: ["G is for green!", "M is for Mummy!", "What letter is this?"] },
  { w: 48, words: [["I can", "我会"], ["remember", "记得"], ["sing", "唱"], ["dance", "跳舞"], ["English", "英语"], ["proud", "骄傲"], ["grow", "长大"]],
    sent: ["I can speak English!", "Let's sing all our songs!", "I'm so proud of you!"] },
];

function main() {
  const content = JSON.parse(fs.readFileSync(CONTENT, "utf-8"));
  let bad = 0;
  for (const u of UPGRADES) {
    const w = content.weeks.find((x) => x.week === u.w);
    if (!w) { console.error("✖ 找不到第 " + u.w + " 周骨架"); bad++; continue; }
    if (u.words.length < 5) { console.error("✖ 第 " + u.w + " 周词少于5个"); bad++; }
    if (u.sent.length < 2) { console.error("✖ 第 " + u.w + " 周句少于2句"); bad++; }
    w.coreWords = u.words.map((p) => ({ en: p[0], zh: p[1] }));
    w.coreSentences = u.sent;
    console.log("✔ 第 " + u.w + " 周 " + w.theme + "：" + u.words.length + " 词 / " + u.sent.length + " 句");
  }
  if (bad) { console.error("\n有错误，content.json 未改动。"); process.exit(1); }
  fs.writeFileSync(CONTENT, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log("\n骨架升级完成。");
}

main();
