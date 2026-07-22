#!/usr/bin/env node
// 生成 content-plan 第一批 5 篇奠基文章 → topchinacar-site/articles/*.json
// 用法: node tools/seed_articles_batch1.js && cd topchinacar-site && node build.js
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'topchinacar-site', 'articles');
fs.mkdirSync(OUT, { recursive: true });

const A = [];

// ============ 1. China's Car Exports ============
A.push({
  slug: 'chinas-car-exports-why-global-markets-are-paying-attention',
  date: '2026-07-05', tag_en: 'Analysis', tag_zh: '分析',
  title_en: "China's Car Exports: Why Global Markets Are Paying Attention",
  title_zh: '中国汽车出口：全球市场为何开始认真对待',
  excerpt_en: "China has been the world's largest car exporter for three straight years, and the first half of 2026 shows the machine accelerating: record brand-level shipments, overseas plants multiplying, and exports becoming the industry's profit engine.",
  excerpt_zh: '中国已连续三年蝉联全球第一大汽车出口国，2026 年上半年这台机器仍在加速：品牌出口纪录、海外工厂遍地开花、出口成为行业利润引擎。',
  html_en: `
<p>China overtook Japan as the world's largest car exporter in 2023 and has not looked back — annual new-energy vehicle exports alone crossed four million units in 2025. The first half of 2026 shows the machine still accelerating, and changing shape.</p>
<h2>What happened</h2>
<p>The H1 2026 numbers are the clearest signal yet. BYD delivered <strong>792,256 vehicles overseas</strong> in the first six months, up 70.7% year on year — already more than half its raised full-year target of 1.5 million. <a href="https://money.usnews.com/investing/news/articles/2026-07-01/byds-sales-rise-for-second-month-buoyed-by-exports">[Reuters/USNews]</a> Chery shipped <strong>943,817 vehicles</strong> overseas in H1 (+71.5%), extending a 23-year run as China's top passenger-car exporter. <a href="https://autonews.gasgoo.com/articles/news/chery-group-reports-13575-million-vehicles-in-h1-sales-nev-volume-rises-323-2072673248226361344">[Gasgoo]</a> Geely crossed <strong>100,000 monthly exports for the first time</strong> in June, with H1 up 158%. <a href="https://allweatherfinance.com/geely-joins-the-club-of-exporting-100-000-vehicles-in-a-single-month/">[AllWeather Finance]</a></p>
<h2>Why it matters</h2>
<p>Exports are no longer a side business that absorbs domestic overcapacity — they are becoming the profit centre. Overseas gross margins run roughly ten percentage points above domestic levels for major groups, while China's home market is locked in a price war. For BYD, overseas deliveries reached 43.5% of total monthly sales in June; for Great Wall Motor the share was 55.7%. <a href="https://cnevpost.com/2026/07/01/gwm-jun-2026-sales/">[CnEVPost]</a></p>
<h2>Market context</h2>
<p>The export mix is broader than the "Chinese EV" headline suggests. Fuel and hybrid vehicles still carry huge volumes into Russia, the Middle East, Africa and Latin America; plug-in hybrids are the fastest-growing slice into tariff-protected markets; pure EVs lead in Europe, Southeast Asia and Australia. Logistics has been rebuilt too — BYD alone operates a fleet of eight ro-ro car carriers with annual capacity above one million vehicles. <a href="https://www.automotiveworld.com/news/bloomberg-byd-tells-analysts-1-5-million-overseas-sales-in-2026/">[Bloomberg/AutoWorld]</a></p>
<h2>Impact on Chinese automakers</h2>
<p>A hierarchy is forming. Companies with established export machines and local plants — BYD, Chery, Geely, GWM, SAIC — are compounding scale advantages. New-energy startups are picking focused beachheads: Leapmotor through Stellantis's network, Xpeng and NIO through Europe. Automakers that stayed domestic now face a shrinking home market and no overseas cushion.</p>
<h2>What to watch next</h2>
<p>Three markers for H2 2026: whether BYD holds its 1.5-million overseas run-rate; whether Geely sustains six-figure monthly exports as Jefferies expects; and how quickly overseas plants — Hungary, Spain, Brazil, Thailand, Malaysia — shift volumes from "exported from China" to "built where they are sold". Our <a href="/china-car-export-news">Exports section</a> tracks all of it, daily.</p>`,
  html_zh: `
<p>中国在 2023 年超越日本成为全球第一大汽车出口国，此后再未回头——仅新能源车年出口量就在 2025 年突破 400 万辆。2026 年上半年的数据显示，这台机器仍在加速，而且正在改变形态。</p>
<h2>发生了什么</h2>
<p>2026 上半年的数字是迄今最清晰的信号。比亚迪上半年海外交付 <strong>792,256 辆</strong>，同比增长 70.7%——已完成上调后 150 万辆全年目标的一半以上。<a href="https://money.usnews.com/investing/news/articles/2026-07-01/byds-sales-rise-for-second-month-buoyed-by-exports">[Reuters/USNews]</a> 奇瑞上半年海外出货 <strong>943,817 辆</strong>（+71.5%），把中国乘用车出口冠军的纪录延长到第 23 年。<a href="https://autonews.gasgoo.com/articles/news/chery-group-reports-13575-million-vehicles-in-h1-sales-nev-volume-rises-323-2072673248226361344">[Gasgoo]</a> 吉利 6 月<strong>史上首次单月出口突破 10 万辆</strong>，上半年同比增长 158%。<a href="https://allweatherfinance.com/geely-joins-the-club-of-exporting-100-000-vehicles-in-a-single-month/">[AllWeather Finance]</a></p>
<h2>为什么重要</h2>
<p>出口不再是消化国内过剩产能的副业，而正在成为利润中心。主要集团的海外毛利率比国内高出约 10 个百分点，而中国本土市场深陷价格战。6 月，比亚迪海外交付占当月总销量的 43.5%；长城汽车这一比例达 55.7%。<a href="https://cnevpost.com/2026/07/01/gwm-jun-2026-sales/">[CnEVPost]</a></p>
<h2>市场背景</h2>
<p>出口结构比"中国电动车"这个标签更宽：燃油车和混动车仍然向俄罗斯、中东、非洲、拉美输送巨大体量；插混是进入关税保护市场增长最快的一块；纯电则在欧洲、东南亚和澳洲领跑。物流体系也已重建——仅比亚迪就运营 8 艘滚装船，年运力超过 100 万辆。<a href="https://www.automotiveworld.com/news/bloomberg-byd-tells-analysts-1-5-million-overseas-sales-in-2026/">[Bloomberg/AutoWorld]</a></p>
<h2>对中国车企的影响</h2>
<p>格局正在分层。拥有成熟出口体系和海外工厂的企业——比亚迪、奇瑞、吉利、长城、上汽——正在滚雪球式放大规模优势；新势力选择聚焦式登陆：零跑借 Stellantis 渠道，小鹏与蔚来主攻欧洲。而留在国内的车企，面对的是收缩的本土市场和缺失的海外缓冲。</p>
<h2>下一步看什么</h2>
<p>下半年三个观察点：比亚迪能否守住 150 万辆的海外节奏；吉利能否如 Jefferies 预期维持单月 10 万辆以上出口；以及匈牙利、西班牙、巴西、泰国、马来西亚的海外工厂，能以多快速度把"从中国出口"变成"在销地制造"。<a href="/china-car-export-news">出口栏目</a>每日跟踪。</p>`
});

// ============ 2. Why Expanding Faster Overseas ============
A.push({
  slug: 'why-chinese-automakers-are-expanding-faster-overseas',
  date: '2026-07-05', tag_en: 'Analysis', tag_zh: '分析',
  title_en: 'Why Chinese Automakers Are Expanding Faster Overseas',
  title_zh: '中国车企为什么在海外越跑越快',
  excerpt_en: 'Price war at home, fatter margins abroad, and a closing tariff window: the three forces pushing every major Chinese automaker to accelerate globalization at the same time.',
  excerpt_zh: '国内价格战、海外高毛利、正在关闭的关税窗口：三股力量让所有主要中国车企同时踩下全球化油门。',
  html_en: `
<p>Every major Chinese automaker is accelerating overseas at once. That is not a coincidence — it is the rational response to three forces acting simultaneously.</p>
<h2>What's happening</h2>
<p>Chinese brands posted record overseas volumes across the board in H1 2026: BYD +70.7%, Chery +71.5%, Geely +158%, GWM's overseas share above half its sales. <a href="https://cnevpost.com/2026/07/01/jun-2026-deliveries-chinese-automakers/">[CnEVPost]</a> At the same time, several of them reported shrinking domestic sales — BYD's China volume fell 22% year on year in June. <a href="https://electriccarsreport.com/2026/07/byd-june-sales-climb-as-record-overseas-demand-offsets-weak-china-market/">[Electric Cars Report]</a></p>
<h2>Why it matters</h2>
<p>The push factor is the world's most brutal home market: over a hundred brands, years of price war, and regulators openly warning against "involution". The pull factor is margin — overseas gross margins run roughly ten points higher than domestic ones. And the clock factor is trade policy: every quarter of delay makes tariff walls higher and first-mover dealer networks harder to displace.</p>
<h2>Market context</h2>
<p>This is the same playbook Japan ran in the 1970s-80s and South Korea in the 1990s-2000s, compressed. Japan took roughly two decades to go from export surge to local manufacturing across its main markets; Chinese automakers are attempting the same transition in under five years — Leapmotor already builds the B10 in Spain, BYD in Hungary and Brazil, Changan in Thailand, Geely activating Proton capacity in Malaysia. <a href="https://electriccarsreport.com/2026/03/leapmotor-b10-production-confirmed-at-stellantis-spain-plant-for-2026/">[Electric Cars Report]</a></p>
<h2>Impact on Chinese automakers</h2>
<p>Globalization is becoming the sorting mechanism for the industry's consolidation. Winners convert export scale into local production, brand equity and service networks before trade barriers rise further. Losers stay trapped in the domestic price war. That is why targets keep being raised mid-year — BYD lifted its 2026 overseas goal 15% to 1.5 million units — and why even profitable niche players like Li Auto are being questioned for their slow overseas start.</p>
<h2>What to watch next</h2>
<p>Watch the second-order signals: overseas R&D and design centres, localized model development (right-hand drive, larger body-on-frame segments), and financing/insurance offerings abroad. When those appear at scale, expansion has moved from opportunistic to structural. Brand-by-brand strategy profiles are collected in our <a href="/analysis">Analysis section</a>.</p>`,
  html_zh: `
<p>所有主要中国车企都在同一时间加速出海。这不是巧合，而是三股力量同时作用下的理性选择。</p>
<h2>正在发生什么</h2>
<p>2026 上半年，中国品牌的海外销量全线创纪录：比亚迪 +70.7%、奇瑞 +71.5%、吉利 +158%、长城海外占比过半。<a href="https://cnevpost.com/2026/07/01/jun-2026-deliveries-chinese-automakers/">[CnEVPost]</a> 与此同时，多家车企国内销量收缩——比亚迪 6 月中国市场同比下滑 22%。<a href="https://electriccarsreport.com/2026/07/byd-june-sales-climb-as-record-overseas-demand-offsets-weak-china-market/">[Electric Cars Report]</a></p>
<h2>为什么重要</h2>
<p>推力来自全球最残酷的本土市场：上百个品牌、连年价格战、监管层公开警示"内卷"。拉力是利润——海外毛利率普遍比国内高约 10 个百分点。时钟则是贸易政策：每晚一个季度，关税墙就更高一分，先行者的经销网络就更难撼动。</p>
<h2>市场背景</h2>
<p>这是日本在 1970-80 年代、韩国在 1990-2000 年代走过的剧本，只是被压缩了。日本从出口激增到在主要市场本地制造用了约二十年；中国车企正试图在五年内完成同样的转身——零跑已在西班牙生产 B10，比亚迪落地匈牙利与巴西，长安在泰国，吉利激活马来西亚宝腾产能。<a href="https://electriccarsreport.com/2026/03/leapmotor-b10-production-confirmed-at-stellantis-spain-plant-for-2026/">[Electric Cars Report]</a></p>
<h2>对中国车企的影响</h2>
<p>全球化正在成为行业整合的筛选机制。赢家在贸易壁垒进一步抬高前，把出口规模转化为本地生产、品牌资产与服务网络；输家则被困在国内价格战里。这解释了为什么目标年中还在上调——比亚迪把 2026 年海外目标上调 15% 至 150 万辆——也解释了为什么连理想这样盈利的细分王者，都因出海迟缓而受到质疑。</p>
<h2>下一步看什么</h2>
<p>关注二阶信号：海外研发与设计中心、本地化车型开发（右舵、大型非承载车身细分）、海外金融与保险服务。当这些成规模出现时，扩张就从机会主义变成了结构性动作。各品牌战略档案见<a href="/analysis">分析栏目</a>。</p>`
});

// ============ 3. BYD Global Expansion ============
A.push({
  slug: 'byd-global-expansion-strategy-key-markets-to-watch',
  date: '2026-07-05', tag_en: 'Analysis', tag_zh: '分析',
  title_en: "BYD's Global Expansion Strategy: Key Markets to Watch",
  title_zh: '比亚迪全球扩张战略：值得盯住的关键市场',
  excerpt_en: "BYD went from exporting almost nothing in 2021 to targeting 1.5 million overseas sales in 2026. Its strategy rests on three pillars: ships, plants, and a product ladder from the Seagull to Yangwang.",
  excerpt_zh: '比亚迪从 2021 年几乎零出口，到 2026 年瞄准 150 万辆海外销量。它的战略立于三根支柱：船队、工厂，和从海鸥到仰望的产品阶梯。',
  html_en: `
<p>No company embodies China auto globalization like BYD. It barely exported passenger cars before 2021; in 2026 it targets 1.5 million overseas sales — a number that would rank it among the world's top auto exporters on its own.</p>
<h2>What's happening</h2>
<p>BYD delivered 792,256 vehicles overseas in H1 2026 (+70.7%), hitting a monthly record of 175,349 in June — 43.5% of its total sales. <a href="https://money.usnews.com/investing/news/articles/2026-07-01/byds-sales-rise-for-second-month-buoyed-by-exports">[Reuters/USNews]</a> Management raised the full-year overseas target 15% to 1.5 million and told analysts exports are now the group's primary profit engine. <a href="https://www.automotiveworld.com/news/bloomberg-byd-tells-analysts-1-5-million-overseas-sales-in-2026/">[Bloomberg/AutoWorld]</a></p>
<h2>Why it matters</h2>
<p>BYD's model is vertical integration extended across borders: it makes its own batteries and chips, and now owns its own logistics — a fleet of eight ro-ro carriers with over a million units of annual capacity. Localisation does the rest: plants in Thailand and Uzbekistan are running, Brazil and Hungary are ramping, Turkey and Indonesia follow. The Hungary plant is designed to neutralise the EU's 17% additional duty on BYD EVs.</p>
<h2>Market context</h2>
<p>The product ladder matters as much as the factories. The Seagull (exported as Dolphin Mini) attacks price-sensitive markets below US$15,000; Atto 3, Seal and Sealion 07 fight in the global mainstream; Denza and Yangwang stretch the brand upward. In pickups, the Shark 6 PHEV opened Australia and Latin America — segments where Chinese brands previously had no premium credibility.</p>
<h2>Impact on Chinese automakers</h2>
<p>BYD's scale sets the pricing floor and the logistics standard for everyone else. Rivals either differentiate (NIO's swap network, Xpeng's software, GWM's off-road niche) or compete in segments BYD hasn't prioritised. Its weakness is a thinner premium story in Europe and dependence on markets — Brazil, Thailand, Israel — that can shift policy quickly.</p>
<h2>What to watch next</h2>
<p>Hungary's ramp-up curve; whether Japan and South Korea volumes stay symbolic or turn real; the pace of ultra-fast-charging rollout overseas planned from 2027; and whether the 1.5-million target survives any European demand wobble. Follow the brand feed on our <a href="/chinese-car-brands/byd">BYD page</a>.</p>`,
  html_zh: `
<p>没有哪家公司比比亚迪更能代表中国汽车全球化。2021 年前它几乎不出口乘用车；2026 年它的海外目标是 150 万辆——仅这个数字就足以跻身全球汽车出口商前列。</p>
<h2>正在发生什么</h2>
<p>比亚迪 2026 上半年海外交付 792,256 辆（+70.7%），6 月单月创下 175,349 辆纪录，占总销量 43.5%。<a href="https://money.usnews.com/investing/news/articles/2026-07-01/byds-sales-rise-for-second-month-buoyed-by-exports">[Reuters/USNews]</a> 管理层把全年海外目标上调 15% 至 150 万辆，并向分析师明确：出口已是集团的第一利润引擎。<a href="https://www.automotiveworld.com/news/bloomberg-byd-tells-analysts-1-5-million-overseas-sales-in-2026/">[Bloomberg/AutoWorld]</a></p>
<h2>为什么重要</h2>
<p>比亚迪的模式是把垂直整合延伸到国境之外：自产电池和芯片，如今连物流也自己掌握——8 艘滚装船、年运力超百万辆。剩下的交给本地化：泰国、乌兹别克斯坦工厂已投产，巴西、匈牙利爬坡中，土耳其、印尼跟进。匈牙利工厂的使命，就是对冲欧盟对比亚迪电动车加征的 17% 关税。</p>
<h2>市场背景</h2>
<p>产品阶梯与工厂同样关键。海鸥（海外名 Dolphin Mini）进攻 1.5 万美元以下的价格敏感市场；Atto 3、海豹、海狮 07 在全球主流市场缠斗；腾势与仰望向上拉伸品牌。皮卡方面，Shark 6 插混打开了澳洲与拉美——这是中国品牌过去毫无溢价话语权的细分。</p>
<h2>对中国车企的影响</h2>
<p>比亚迪的规模为所有人设定了价格地板和物流标准。对手要么差异化（蔚来的换电、小鹏的软件、长城的越野），要么去比亚迪尚未聚焦的细分竞争。它的软肋是欧洲高端叙事偏薄，以及对巴西、泰国、以色列等政策可变市场的依赖。</p>
<h2>下一步看什么</h2>
<p>匈牙利工厂的爬坡曲线；日韩销量是停留在象征性还是转为真实规模；计划 2027 年起海外铺设的超快充网络；以及 150 万辆目标能否经受欧洲需求波动。品牌动态见 <a href="/chinese-car-brands/byd">BYD 页面</a>。</p>`
});

// ============ 7. Chinese EVs in Europe ============
A.push({
  slug: 'chinese-evs-in-europe-opportunity-tariffs-and-competition',
  date: '2026-07-05', tag_en: 'Markets', tag_zh: '市场',
  title_en: 'Chinese EVs in Europe: Opportunity, Tariffs and Competition',
  title_zh: '中国电动车在欧洲：机会、关税与竞争',
  excerpt_en: "Europe is the hardest market Chinese EV makers have entered — and the one they refuse to give up. Tariffs reshaped the strategy from exporting cars to building them inside the wall.",
  excerpt_zh: '欧洲是中国电动车企进入过的最难市场，也是它们拒绝放弃的市场。关税把战略从"出口整车"改写为"墙内造车"。',
  html_en: `
<p>Europe combines everything Chinese EV makers want — scale, EV adoption, brand prestige — with everything that makes expansion hard: entrenched incumbents, demanding regulation, and tariffs aimed squarely at them.</p>
<h2>What's happening</h2>
<p>Since late 2024, Chinese-built EVs entering the EU carry anti-subsidy duties on top of the 10% base tariff — roughly 17% extra for BYD, 18.8% for Geely and up to 35.3% for SAIC. The response has been localisation, fast: Leapmotor's B10 is now built at Stellantis's Zaragoza plant in Spain, BYD's Hungarian plant is ramping, and Geely plans Zeekr 7X production at Proton in Malaysia partly with Europe in mind. <a href="https://www.automotivelogistics.media/ev-and-battery/stellantis-and-leapmotors-expanded-joint-venture-in-spain-signals-move-towards-europechina-hybrid-production-model/2661986">[Automotive Logistics]</a> Meanwhile Xpeng chose Munich for the Mona L03's global premiere — a first for a Chinese automaker. <a href="https://cnevpost.com/2026/07/02/xpeng-mona-l03-china-debut-launch-jul-16/">[CnEVPost]</a></p>
<h2>Why it matters</h2>
<p>Europe is the proving ground for whether Chinese brands can win on brand rather than just price. MG — British badge, Chinese owner — remains the volume leader; BYD is scaling through mainstream retail; NIO, Zeekr and Xpeng test the premium tier. Tariffs did not stop the expansion; they changed its form and raised the stakes.</p>
<h2>Market context</h2>
<p>European incumbents are cutting EV prices, and EU-China talks over minimum-price arrangements continue in the background. Plug-in hybrids — outside the EV tariff scope — have become a side door: several Chinese groups now push PHEVs into Europe while their EVs localise. Hungary, Spain and potentially Poland are emerging as the "inside the wall" manufacturing bases.</p>
<h2>Impact on Chinese automakers</h2>
<p>The tariff wall splits the field: groups with European production (Leapmotor via Stellantis, BYD, Geely through its multi-brand plants) keep a structural cost path into the market; pure exporters absorb duties or retreat upmarket. It also favours brands with European identities — MG, Volvo, Polestar, Lotus — that carry Chinese industrial advantages without Chinese-brand perception risk.</p>
<h2>What to watch next</h2>
<p>The Mona L03's European pricing on July 16; BYD Hungary's output curve; any EU-China minimum-price deal; and whether PHEV imports draw regulatory attention next. Full market feed: <a href="/markets/europe">Chinese cars in Europe</a>.</p>`,
  html_zh: `
<p>欧洲集齐了中国电动车企想要的一切——规模、电动化渗透率、品牌声望——也集齐了让扩张变难的一切：强势的本土巨头、严苛的法规，以及直指它们的关税。</p>
<h2>正在发生什么</h2>
<p>2024 年底以来，中国产电动车进入欧盟需在 10% 基础关税之上缴纳反补贴税——比亚迪约加征 17%，吉利 18.8%，上汽最高 35.3%。应对是快速本地化：零跑 B10 已在 Stellantis 西班牙萨拉戈萨工厂投产，比亚迪匈牙利工厂爬坡中，吉利计划在马来西亚宝腾生产极氪 7X、部分瞄准欧洲。<a href="https://www.automotivelogistics.media/ev-and-battery/stellantis-and-leapmotors-expanded-joint-venture-in-spain-signals-move-towards-europechina-hybrid-production-model/2661986">[Automotive Logistics]</a> 与此同时，小鹏把 Mona L03 的全球首发放在慕尼黑——中国车企的第一次。<a href="https://cnevpost.com/2026/07/02/xpeng-mona-l03-china-debut-launch-jul-16/">[CnEVPost]</a></p>
<h2>为什么重要</h2>
<p>欧洲是检验中国品牌能否靠品牌而非仅靠价格取胜的试炼场。MG——英国车标、中国东家——仍是销量领跑者；比亚迪借主流渠道上量；蔚来、极氪、小鹏试探高端。关税没有止住扩张，只是改变了形态、抬高了赌注。</p>
<h2>市场背景</h2>
<p>欧洲本土车企在降价，欧中最低限价谈判仍在幕后进行。不在电动车关税范围内的插混成了侧门：多家中国集团一边让电动车本地化，一边向欧洲推插混。匈牙利、西班牙以及潜在的波兰，正在成为"墙内"制造基地。</p>
<h2>对中国车企的影响</h2>
<p>关税墙把阵营一分为二：拥有欧洲产能的集团（借 Stellantis 的零跑、比亚迪、多品牌布局的吉利）保有进入市场的结构性成本通道；纯出口者要么消化关税、要么退守高端。它同时有利于带欧洲身份的品牌——MG、沃尔沃、极星、路特斯——享受中国的产业优势，却不背"中国品牌"的认知包袱。</p>
<h2>下一步看什么</h2>
<p>7 月 16 日 Mona L03 的欧洲定价；比亚迪匈牙利工厂的产量曲线；欧中最低限价协议有无进展；以及插混进口会不会成为下一个监管焦点。市场动态：<a href="/markets/europe">中国汽车在欧洲</a>。</p>`
});

// ============ 14. Overseas Plants ============
A.push({
  slug: 'why-chinese-automakers-are-building-overseas-plants',
  date: '2026-07-05', tag_en: 'Exports', tag_zh: '出口',
  title_en: 'Why Chinese Automakers Are Building Overseas Plants',
  title_zh: '中国车企为什么在海外建厂',
  excerpt_en: 'From Thailand to Hungary to Brazil, Chinese automakers are racing to manufacture where they sell. The logic: get inside the tariff wall before it rises further.',
  excerpt_zh: '从泰国到匈牙利再到巴西，中国车企正在赶工"销地制造"。逻辑只有一条：赶在关税墙进一步抬高前进到墙内。',
  html_en: `
<p>For two decades, "Chinese car exports" meant ships leaving Shanghai and Yantai. That era is ending. The defining move of 2025-26 is the overseas plant.</p>
<h2>What's happening</h2>
<p>The map is filling in fast. Leapmotor builds the B10 in Zaragoza, Spain — among the first Chinese EVs manufactured in Europe. <a href="https://electriccarsreport.com/2026/03/leapmotor-b10-production-confirmed-at-stellantis-spain-plant-for-2026/">[Electric Cars Report]</a> BYD runs Thailand and Uzbekistan and is ramping Hungary and Brazil. Changan's Thai plant exports the Deepal S05 to Europe with 60% local content. <a href="https://www.electrive.com/2026/01/07/changan-starts-exporting-thai-made-evs-to-europe/">[Electrive]</a> Geely plans Zeekr 7X output at Proton in Malaysia; SAIC's Brazil plant starts MG production in October; Chery bought Nissan's Rosslyn plant in South Africa; Dongfeng will localise Voyah at Stellantis's Rennes site in France from 2027. <a href="https://amp.kr-asia.com/geely-seeks-to-double-zeekr-sales-abroad-eyeing-malaysia-output">[KrAsia]</a></p>
<h2>Why it matters</h2>
<p>Plants convert a trade flow into a permanent market position. They neutralise tariffs (EU duties, Brazil's rising import tax), qualify for local incentives, shorten delivery, and change the politics — an automaker that employs thousands locally is a stakeholder, not an import threat.</p>
<h2>Market context</h2>
<p>The pattern mirrors Japan's 1980s transplant wave, with one twist: Chinese automakers are doing it earlier in their export cycle and often through partners — Stellantis for Leapmotor and Dongfeng, Proton for Geely — rather than building alone. CKD assembly is the low-risk first step; full manufacturing follows where volumes justify it.</p>
<h2>Impact on Chinese automakers</h2>
<p>Localisation splits the industry into those with a structural path into protected markets and those paying duties at the border. It also exports the supply chain: Chinese battery and parts makers follow the OEMs — as Leapmotor's chassis supplier already has in Spain — planting the next layer of globalization.</p>
<h2>What to watch next</h2>
<p>Hungary and Brazil ramp rates; whether Zeekr's Malaysia plan hits early-2027 production; which group announces the first Chinese-brand plant in a G7 country beyond Stellantis-hosted lines; and how host governments tie incentives to local content. Tracked daily in <a href="/china-car-export-news">Exports</a>.</p>`,
  html_zh: `
<p>过去二十年，"中国汽车出口"意味着从上海和烟台出发的滚装船。这个时代正在结束。2025-26 年的标志性动作，是海外工厂。</p>
<h2>正在发生什么</h2>
<p>版图正在快速填满。零跑在西班牙萨拉戈萨生产 B10——首批在欧洲制造的中国电动车之一。<a href="https://electriccarsreport.com/2026/03/leapmotor-b10-production-confirmed-at-stellantis-spain-plant-for-2026/">[Electric Cars Report]</a> 比亚迪的泰国、乌兹别克斯坦工厂已运转，匈牙利、巴西在爬坡。长安泰国工厂以 60% 本地化率向欧洲出口 Deepal S05。<a href="https://www.electrive.com/2026/01/07/changan-starts-exporting-thai-made-evs-to-europe/">[Electrive]</a> 吉利计划在马来西亚宝腾投产极氪 7X；上汽巴西工厂 10 月起生产 MG；奇瑞收购了南非日产罗斯林工厂；东风将从 2027 年起在法国雷恩的 Stellantis 工厂本地化生产岚图。<a href="https://amp.kr-asia.com/geely-seeks-to-double-zeekr-sales-abroad-eyeing-malaysia-output">[KrAsia]</a></p>
<h2>为什么重要</h2>
<p>工厂把一条贸易流变成永久的市场地位：对冲关税（欧盟反补贴税、巴西不断上调的进口税）、获取当地补贴、缩短交付，还改变政治属性——雇佣数千本地员工的车企是利益相关者，而不是进口威胁。</p>
<h2>市场背景</h2>
<p>这一幕像极了日本 1980 年代的海外建厂潮，但有一个不同：中国车企在出口周期更早的阶段就开始建厂，而且常常借助伙伴——零跑和东风靠 Stellantis，吉利靠宝腾——而非单打独斗。CKD 组装是低风险的第一步，销量到位后再升级为完整制造。</p>
<h2>对中国车企的影响</h2>
<p>本地化把行业分成两类：拥有进入保护市场结构性通道的，和在边境缴税的。它还在输出供应链：中国电池和零部件厂商跟随主机厂出海——零跑的底盘供应商已经落地西班牙——种下全球化的下一层。</p>
<h2>下一步看什么</h2>
<p>匈牙利与巴西的爬坡速度；极氪马来西亚计划能否在 2027 年初量产；除 Stellantis 代工外，哪家集团宣布第一座 G7 国家的中国品牌工厂；以及东道国政府如何把补贴与本地化率挂钩。<a href="/china-car-export-news">出口栏目</a>每日追踪。</p>`
});

for (const a of A) {
  fs.writeFileSync(path.join(OUT, `${a.slug}.json`), JSON.stringify(a, null, 2));
  console.log('✓', a.slug);
}
console.log(`\n${A.length} 篇已写入 topchinacar-site/articles/`);
