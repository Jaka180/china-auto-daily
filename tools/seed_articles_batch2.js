#!/usr/bin/env node
// 第二批奠基文章 (#4, #5, #8, #9, #10) → topchinacar-site/articles/*.json
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'topchinacar-site', 'articles');
fs.mkdirSync(OUT, { recursive: true });

const A = [];

// ============ 4. Chery Overseas ============
A.push({
  slug: 'chery-overseas-growth-why-emerging-markets-matter',
  date: '2026-07-06', tag_en: 'Analysis', tag_zh: '分析',
  title_en: "Chery's Overseas Growth: Why Emerging Markets Matter",
  title_zh: '奇瑞的海外增长：新兴市场为什么是胜负手',
  excerpt_en: "China's export champion for 23 straight years built its lead the unfashionable way: petrol SUVs, emerging markets, and local assembly — long before the EV wave. Now that base is funding a push into Europe.",
  excerpt_zh: '连续 23 年的中国出口冠军用最不时髦的方式建立领先：燃油 SUV、新兴市场、本地组装——远早于电动车浪潮。如今这个基本盘正在为进军欧洲输血。',
  html_en: `
<p>While the world debates Chinese EVs in Europe, the biggest Chinese exporter by far built its empire somewhere else entirely: Chery has been China's number-one passenger-car exporter for 23 consecutive years, and most of that volume never touched a European port.</p>
<h2>What happened</h2>
<p>Chery shipped <strong>943,817 vehicles overseas in H1 2026</strong>, up 71.5% year on year, with June alone exceeding 190,000 units for the first time. <a href="https://autonews.gasgoo.com/articles/news/chery-group-reports-13575-million-vehicles-in-h1-sales-nev-volume-rises-323-2072673248226361344">[Gasgoo]</a> The engine remains emerging markets — Russia, the Middle East, Latin America — but the new growth is Europe: roughly 139,000 units across 24 countries in the first five months of 2026, about double a year earlier, with Omoda & Jaecoo passing 40,000 cumulative sales in Spain. <a href="https://autonews.gasgoo.com/articles/news/cherys-first-overseas-operations-center-opens-european-localization-enters-functional-integration-phase-2042841618585923585">[Gasgoo]</a></p>
<h2>Why it matters</h2>
<p>Chery proves there are two viable globalization models, not one. The BYD model rides EV technology into developed markets; the Chery model wins volume first in markets Western brands under-serve — affordable petrol and hybrid SUVs, tolerant of rough fuel and rougher roads — then upgrades toward electrification with the customer base already in hand.</p>
<h2>Market context</h2>
<p>Emerging markets reward exactly what Chery optimised for: price-to-content ratio, dealer economics, and parts availability. Its Tiggo SUV line became a fixture from Santiago to Riyadh years before Omoda and Jaecoo gave the group younger export-first brands. The group also moved early on assembly — and in January 2026 it bought Nissan's Rosslyn plant in South Africa, its first full manufacturing base in Africa.</p>
<h2>Impact on Chinese automakers</h2>
<p>Chery's playbook sets the benchmark for every brand chasing the Global South: Great Wall, Changan and Geely all now run variations of it. Its weakness is brand ceiling — moving customers from "good value" to "first choice" — which is precisely what the Omoda/Jaecoo European push and the Exeed premium line are for.</p>
<h2>What to watch next</h2>
<p>Whether the Rosslyn plant starts production on schedule; whether Europe volumes can double again under EV tariffs (most Chery exports there are ICE and hybrid, dodging the duties); and how fast the group's NEV share of exports — rising 32% in H1 — catches up with its petrol base. Brand feed: <a href="/chinese-car-brands/chery">Chery</a>.</p>`,
  html_zh: `
<p>当全世界都在讨论中国电动车进欧洲时，遥遥领先的中国出口冠军却把帝国建在了完全不同的地方：奇瑞连续 23 年蝉联中国乘用车出口第一，而其中大部分销量从未经过欧洲港口。</p>
<h2>发生了什么</h2>
<p>奇瑞 2026 上半年海外出货 <strong>943,817 辆</strong>，同比增长 71.5%，6 月单月首次突破 19 万辆。<a href="https://autonews.gasgoo.com/articles/news/chery-group-reports-13575-million-vehicles-in-h1-sales-nev-volume-rises-323-2072673248226361344">[Gasgoo]</a> 增长引擎仍是新兴市场——俄罗斯、中东、拉美——但新增量在欧洲：2026 年前五个月在 24 国售出约 13.9 万辆，同比翻倍，Omoda & Jaecoo 在西班牙累计销量突破 4 万。<a href="https://autonews.gasgoo.com/articles/news/cherys-first-overseas-operations-center-opens-european-localization-enters-functional-integration-phase-2042841618585923585">[Gasgoo]</a></p>
<h2>为什么重要</h2>
<p>奇瑞证明了全球化有两条可行路线，而不是一条。比亚迪模式靠电动技术切入发达市场；奇瑞模式先在西方品牌照顾不周的市场赢下体量——皮实耐用、油品适应性强的平价燃油与混动 SUV——再带着现成的客户基盘向电动化升级。</p>
<h2>市场背景</h2>
<p>新兴市场恰好奖励奇瑞长期优化的能力：价格配置比、经销商盈利模型、配件可得性。早在 Omoda 和 Jaecoo 这些出口优先的年轻品牌出现之前，瑞虎系列就已是从圣地亚哥到利雅得的街车。集团在组装上也动手很早——2026 年 1 月，它收购了南非日产罗斯林工厂，拿下在非洲的第一个整车制造基地。</p>
<h2>对中国车企的影响</h2>
<p>奇瑞的打法是所有瞄准"全球南方"品牌的基准：长城、长安、吉利如今都在跑它的变体。它的短板是品牌天花板——让用户从"划算之选"变成"首选"——而这正是 Omoda/Jaecoo 欧洲攻势和星途高端线的任务。</p>
<h2>下一步看什么</h2>
<p>罗斯林工厂能否如期投产；在电动车关税之下欧洲销量能否再翻一倍（奇瑞对欧出口以燃油和混动为主，恰好绕开税负）；以及上半年增长 32% 的新能源出口占比，多快追上燃油基本盘。品牌动态：<a href="/chinese-car-brands/chery">奇瑞</a>。</p>`
});

// ============ 5. Geely Portfolio ============
A.push({
  slug: 'geely-global-brand-portfolio-explained',
  date: '2026-07-06', tag_en: 'Analysis', tag_zh: '分析',
  title_en: "Geely's Global Brand Portfolio Explained",
  title_zh: '一文看懂吉利的全球品牌矩阵',
  excerpt_en: 'Volvo, Polestar, Lotus, Zeekr, Lynk & Co, Proton, the Galaxy line — no Chinese group globalized through ownership like Geely. Here is how the pieces fit, and why exports just hit a record.',
  excerpt_zh: '沃尔沃、极星、路特斯、极氪、领克、宝腾、银河——没有哪家中国集团像吉利这样靠股权完成全球化。本文拆解各块拼图，以及出口为何刚创纪录。',
  html_en: `
<p>Most Chinese automakers globalize by exporting cars. Geely globalized by buying, building and sharing brands — and in June 2026 that twenty-year strategy produced a milestone: the first 100,000-export month in the group's history.</p>
<h2>What happened</h2>
<p>Geely exported <strong>102,874 vehicles in June</strong> (+157%), with H1 at 474,228 units — already above its full-year 2025 total. <a href="https://allweatherfinance.com/geely-joins-the-club-of-exporting-100-000-vehicles-in-a-single-month/">[AllWeather Finance]</a> Zeekr's global deliveries passed 820,000 cumulatively; the Galaxy Starship 7 super-hybrid is on sale in 57 countries with Brazilian assembly planned; and Zeekr 7X production is being prepared at Proton's Malaysian plant for early 2027. <a href="https://amp.kr-asia.com/geely-seeks-to-double-zeekr-sales-abroad-eyeing-malaysia-output">[KrAsia]</a></p>
<h2>Why it matters</h2>
<p>The portfolio is the strategy. Volvo (owned since 2010) supplied safety credibility, platforms and European plants. Lynk & Co shares Volvo's CMA architecture; Zeekr builds premium EVs on group technology; Polestar and Lotus carry performance halo; Proton anchors Southeast Asia; the Galaxy line fights the mainstream. Each brand tests a market the others can then enter — with shared platforms, batteries and software underneath.</p>
<h2>Market context</h2>
<p>This is closest to how Volkswagen Group runs multi-brand globalization — and it gives Geely options rivals lack. EU tariffs? Volvo and Polestar already build in Europe, and Lynk/Zeekr can follow through existing sites. Southeast Asia? Proton's plant becomes a right-hand-drive hub. Premium skepticism about Chinese brands? Sell a Swedish or British badge instead.</p>
<h2>Impact on Chinese automakers</h2>
<p>Geely's record month shows multi-brand complexity can convert into export volume, not just prestige. The cost is exactly that complexity: overlapping models, listed subsidiaries with minority shareholders, and the ongoing work of consolidating Zeekr and Lynk & Co. Rivals with single brands move faster; none can match the breadth.</p>
<h2>What to watch next</h2>
<p>The Zeekr 9X's Middle East launch in H2; whether Zeekr + Lynk hit their combined 100,000-plus overseas target for 2026 <a href="https://cleantechnica.com/2026/06/25/geely-aims-to-double-zeekrs-and-lynk-cos-sales-outside-of-china/">[CleanTechnica]</a>; Malaysian 7X output in early 2027; and Brazilian Starship 7 assembly at the Renault-shared plant. Brand feed: <a href="/chinese-car-brands/geely">Geely</a>.</p>`,
  html_zh: `
<p>大多数中国车企靠出口整车全球化，吉利靠买品牌、建品牌、共享品牌全球化——2026 年 6 月，这套经营了二十年的战略交出里程碑：集团史上第一个出口破 10 万辆的月份。</p>
<h2>发生了什么</h2>
<p>吉利 6 月出口 <strong>102,874 辆</strong>（+157%），上半年 474,228 辆——已超过 2025 全年总量。<a href="https://allweatherfinance.com/geely-joins-the-club-of-exporting-100-000-vehicles-in-a-single-month/">[AllWeather Finance]</a> 极氪全球累计交付突破 82 万辆；银河星舰 7 超级混动已进入 57 国并计划在巴西组装；极氪 7X 正准备在马来西亚宝腾工厂投产，目标 2027 年初。<a href="https://amp.kr-asia.com/geely-seeks-to-double-zeekr-sales-abroad-eyeing-malaysia-output">[KrAsia]</a></p>
<h2>为什么重要</h2>
<p>品牌矩阵本身就是战略。沃尔沃（2010 年收购）提供了安全信誉、平台与欧洲工厂；领克共享沃尔沃 CMA 架构；极氪用集团技术造高端电动车；极星和路特斯扛性能光环；宝腾锚定东南亚；银河系列主攻大众市场。每个品牌为其他品牌试探市场——底层则是共享的平台、电池与软件。</p>
<h2>市场背景</h2>
<p>这最接近大众集团的多品牌全球化打法——也给了吉利对手没有的选择权。欧盟关税？沃尔沃和极星本来就在欧洲生产，领克/极氪可以借既有基地跟进。东南亚？宝腾工厂就是右舵枢纽。高端市场对中国品牌有疑虑？那就卖一个瑞典或英国车标。</p>
<h2>对中国车企的影响</h2>
<p>吉利的纪录月份证明，多品牌的复杂性可以转化为出口体量，而不只是面子。代价恰恰是复杂本身：车型重叠、带少数股东的上市子公司、以及极氪与领克整合的长期功课。单品牌对手跑得更快，但没人能匹敌这个宽度。</p>
<h2>下一步看什么</h2>
<p>极氪 9X 下半年的中东上市；极氪 + 领克 2026 年合计 10 万辆以上的海外目标能否达成<a href="https://cleantechnica.com/2026/06/25/geely-aims-to-double-zeekrs-and-lynk-cos-sales-outside-of-china/">[CleanTechnica]</a>；2027 年初马来西亚 7X 的投产；以及巴西雷诺共用工厂的星舰 7 组装。品牌动态：<a href="/chinese-car-brands/geely">吉利</a>。</p>`
});

// ============ 8. Middle East ============
A.push({
  slug: 'chinese-cars-in-the-middle-east-why-demand-is-rising',
  date: '2026-07-06', tag_en: 'Markets', tag_zh: '市场',
  title_en: 'Chinese Cars in the Middle East: Why Demand Is Rising',
  title_zh: '中国汽车在中东：需求为什么在上升',
  excerpt_en: 'The Gulf went from skeptical to one of the fastest-adopting regions for Chinese cars in five years. Petrol SUVs opened the door; EVs and flagship showrooms are walking through it.',
  excerpt_zh: '五年之间，海湾从怀疑者变成中国汽车渗透最快的区域之一。燃油 SUV 敲开了门，电动车和旗舰展厅正鱼贯而入。',
  html_en: `
<p>Five years ago Chinese cars in the Gulf were a rental-fleet curiosity. Today they hold visible market share from Riyadh to Dubai, and the region has become a strategic pillar in almost every Chinese automaker's export plan.</p>
<h2>What happened</h2>
<p>The latest marker: Great Wall Motor opened its largest Middle East flagship showroom in Dubai in June 2026, as its overseas sales share climbed past half of total volume. <a href="https://cnevpost.com/2026/07/01/gwm-jun-2026-sales/">[CnEVPost]</a> Zeekr picked the Middle East as the first overseas region for its flagship 9X, arriving in H2 2026. <a href="https://allweatherfinance.com/geely-joins-the-club-of-exporting-100-000-vehicles-in-a-single-month/">[AllWeather Finance]</a> Chery, Jetour, MG and BYD have all posted rapid Gulf growth on top of that.</p>
<h2>Why it matters</h2>
<p>The Gulf is a profitability market, not just a volume market: strong purchasing power, taste for large SUVs, low trade barriers and no domestic auto industry to protect. It is also a brand showcase — flagship showrooms in Dubai and Riyadh function as regional advertising for Africa and Central Asia.</p>
<h2>Market context</h2>
<p>Demand splits in two. Petrol SUVs and crossovers — Jetour T2, Tiggo 8, Haval H9 — dominate today's volume, suited to fuel prices and desert conditions. The EV story is policy-led: Saudi Vision 2030, the kingdom's investment in Lucid and its own CEER brand, and charging build-outs in the UAE signal where the market is being steered. Chinese brands are the natural suppliers for both phases.</p>
<h2>Impact on Chinese automakers</h2>
<p>The region rewards brands with strong ICE/hybrid line-ups and patient dealer development — advantage Chery, GWM and Geely — while giving premium EV brands a wealthy early-adopter niche, which is exactly Zeekr's bet. The risk ledger: oil-linked demand cycles and heavy dependence on distributor relationships.</p>
<h2>What to watch next</h2>
<p>Zeekr 9X's Gulf pricing and reception; whether Saudi localisation incentives pull a Chinese assembly plant announcement; and GWM's Dubai flagship as a template for other brands. Market feed: <a href="/markets/middle-east">Middle East</a>.</p>`,
  html_zh: `
<p>五年前，中国汽车在海湾还只是租车公司车队里的稀罕物。今天，从利雅得到迪拜它们拥有肉眼可见的市场份额，中东已成为几乎每家中国车企出口计划中的战略支柱。</p>
<h2>发生了什么</h2>
<p>最新的标志：2026 年 6 月，长城汽车在迪拜开出其中东最大旗舰展厅，同期其海外销量占比越过总量一半。<a href="https://cnevpost.com/2026/07/01/gwm-jun-2026-sales/">[CnEVPost]</a> 极氪把旗舰 9X 的海外首发区域定在中东，下半年到店。<a href="https://allweatherfinance.com/geely-joins-the-club-of-exporting-100-000-vehicles-in-a-single-month/">[AllWeather Finance]</a> 此外，奇瑞、捷途、MG、比亚迪都在海湾录得快速增长。</p>
<h2>为什么重要</h2>
<p>海湾是利润市场，而不只是体量市场：购买力强、偏爱大 SUV、贸易壁垒低、且没有需要保护的本土汽车工业。它还是品牌橱窗——迪拜和利雅得的旗舰展厅，是面向非洲与中亚的区域级广告牌。</p>
<h2>市场背景</h2>
<p>需求一分为二。燃油 SUV 与跨界车——捷途 T2、瑞虎 8、哈弗 H9——支撑今天的体量，与油价和沙漠工况天然契合。电动车叙事则由政策牵引：沙特 2030 愿景、对 Lucid 的投资与自有品牌 CEER、阿联酋的充电网络建设，都指明了市场被引导的方向。两个阶段的天然供应商都是中国品牌。</p>
<h2>对中国车企的影响</h2>
<p>这个区域奖励燃油/混动产品线扎实、耐心深耕经销商的品牌——奇瑞、长城、吉利占优——同时为高端电动品牌提供富裕的尝鲜者利基，这正是极氪的押注。风险清单：与油价联动的需求周期，以及对总代关系的高度依赖。</p>
<h2>下一步看什么</h2>
<p>极氪 9X 的海湾定价与市场反响；沙特的本地化激励能否催生一座中国车企组装厂的官宣；以及长城迪拜旗舰店会不会成为其他品牌的模板。市场动态：<a href="/markets/middle-east">中东</a>。</p>`
});

// ============ 9. Africa ============
A.push({
  slug: 'chinese-cars-in-africa-suvs-pickups-and-commercial-vehicles',
  date: '2026-07-06', tag_en: 'Markets', tag_zh: '市场',
  title_en: 'Chinese Cars in Africa: SUVs, Pickups and Commercial Vehicles',
  title_zh: '中国汽车在非洲：SUV、皮卡与商用车',
  excerpt_en: "Africa is the quietest front of China auto globalization — and possibly the most durable. The wedge is not EVs but affordable SUVs, working pickups and commercial vehicles, with local assembly starting to take root.",
  excerpt_zh: '非洲是中国汽车全球化最安静的战线,也可能是最持久的一条。楔子不是电动车,而是平价 SUV、能干活的皮卡和商用车——本地组装也开始扎根。',
  html_en: `
<p>No tariff hearings, no viral launches — Africa rarely makes China-auto headlines. But brand by brand, port by port, it is becoming one of the most defensible parts of the export map.</p>
<h2>What happened</h2>
<p>The signal event came in January 2026: Chery announced the acquisition of Nissan's Rosslyn plant and stamping facility in South Africa — the first full-vehicle manufacturing base for a Chinese automaker on the continent. <a href="https://autonews.gasgoo.com/articles/news/cherys-first-overseas-operations-center-opens-european-localization-enters-functional-integration-phase-2042841618585923585">[Gasgoo]</a> It lands on years of groundwork: Haval and Chery are established top-ten brands in South Africa, and Chinese pickups and vans are working fleets from Egypt to Kenya.</p>
<h2>Why it matters</h2>
<p>Africa plays to the strengths Chinese automakers built at home and honed in other emerging markets: durable, affordable SUVs and pickups; tolerance for tough fuel and roads; aggressive dealer economics. Where Japanese brands long owned "reliable and affordable", Chinese brands now undercut them with newer designs and more equipment.</p>
<h2>Market context</h2>
<p>South Africa anchors the continent — a real regulatory regime, financing market and used-car ecosystem — which is why the Rosslyn move matters beyond its capacity. North Africa is a separate game: Morocco has built an auto and battery-materials industry serving Europe, and Egypt runs long-standing CKD assembly. Electrification remains early everywhere; hybrids and ICE will carry volumes for years.</p>
<h2>Impact on Chinese automakers</h2>
<p>Africa rewards patience over technology: parts networks, financing partners and fleet relationships beat spec sheets. That favours Chery, GWM and the commercial-vehicle arms of SAIC and Dongfeng. Local assembly adds tariff advantages inside regional trade blocs — and political goodwill that pure importers never earn.</p>
<h2>What to watch next</h2>
<p>Rosslyn's production start and which models it builds; whether GWM or another group answers with its own African plant; Moroccan supply-chain investments creeping from parts into vehicles; and pickup-segment share in South Africa, the continent's bellwether. Market feed: <a href="/markets/africa">Africa</a>.</p>`,
  html_zh: `
<p>没有关税听证，没有刷屏发布会——非洲很少登上中国汽车的新闻头条。但一个品牌一个品牌、一个港口一个港口，它正在成为出口版图上最能守得住的部分之一。</p>
<h2>发生了什么</h2>
<p>标志性事件发生在 2026 年 1 月：奇瑞宣布收购南非日产罗斯林工厂及冲压设施——中国车企在非洲大陆的第一个整车制造基地。<a href="https://autonews.gasgoo.com/articles/news/cherys-first-overseas-operations-center-opens-european-localization-enters-functional-integration-phase-2042841618585923585">[Gasgoo]</a> 这落在多年铺垫之上：哈弗和奇瑞已是南非稳定的前十品牌，中国皮卡和厢式车是从埃及到肯尼亚的工作车队。</p>
<h2>为什么重要</h2>
<p>非洲正好契合中国车企在本土练成、又在其他新兴市场磨砺过的能力：皮实平价的 SUV 与皮卡、对油品和路况的宽容度、激进的经销商经济模型。日本品牌长期垄断的"可靠又便宜"，如今被设计更新、配置更高的中国品牌从下方击穿。</p>
<h2>市场背景</h2>
<p>南非是大陆的锚——有真正的法规体系、金融市场和二手车生态——这也是罗斯林收购的意义超越产能本身的原因。北非是另一盘棋：摩洛哥建起了服务欧洲的汽车与电池材料产业，埃及有长期的 CKD 组装。电动化在全非洲都处于早期；未来数年混动和燃油仍将扛起体量。</p>
<h2>对中国车企的影响</h2>
<p>非洲奖励耐心胜过技术：配件网络、金融伙伴与车队关系比参数表管用。这有利于奇瑞、长城，以及上汽和东风的商用车业务。本地组装还能在区域贸易集团内部获得关税优势——以及纯进口商永远赚不到的政治好感。</p>
<h2>下一步看什么</h2>
<p>罗斯林工厂的投产时间与首发车型；长城或其他集团是否跟进自建非洲工厂；摩洛哥供应链投资从零部件向整车的渗透；以及南非皮卡细分的份额变化——那是整个大陆的风向标。市场动态：<a href="/markets/africa">非洲</a>。</p>`
});

// ============ 10. Export Data Guide ============
A.push({
  slug: 'china-auto-export-data-what-global-dealers-should-watch',
  date: '2026-07-06', tag_en: 'Data', tag_zh: '数据',
  title_en: 'China Auto Export Data: What Global Dealers Should Watch',
  title_zh: '中国汽车出口数据：全球经销商应该盯哪些指标',
  excerpt_en: "Wholesale vs retail, exports vs overseas sales, customs vs association data — China auto numbers confuse even professionals. A practical guide to reading them, and the five indicators that matter most.",
  excerpt_zh: '批发与零售、出口与海外销量、海关与协会口径——中国汽车数据连专业人士都会看混。这是一份实用的阅读指南,以及最值得盯的五个指标。',
  html_en: `
<p>China publishes more auto data, faster, than any other market — and misreading it is the easiest mistake in this industry. Here is how the numbers fit together, and what actually predicts opportunity.</p>
<h2>What the numbers mean</h2>
<p>Three distinctions matter. <strong>Wholesale vs retail:</strong> most headline figures are wholesales — cars shipped to dealers, not sold to customers. <strong>Exports vs overseas sales:</strong> "exports" counts vehicles leaving China; "overseas sales/deliveries" (BYD's 792,256 H1 figure, for instance <a href="https://money.usnews.com/investing/news/articles/2026-07-01/byds-sales-rise-for-second-month-buoyed-by-exports">[Reuters/USNews]</a>) includes cars built at overseas plants — an increasingly big gap as localisation spreads. <strong>Association vs customs:</strong> CAAM/CPCA industry data and customs statistics use different scopes and timings; they rarely match exactly.</p>
<h2>Why it matters</h2>
<p>Dealers and importers commit capital months ahead of demand. Reading wholesale spikes as retail demand, or China-port exports as market success, leads to over-ordering exactly when a market saturates — as Russia's inventory swings have repeatedly shown.</p>
<h2>The five indicators that matter</h2>
<p>1) <strong>Brand-level overseas deliveries, monthly</strong> — the cleanest demand proxy, published by each automaker in early-month reports. 2) <strong>Destination registrations</strong> — local licensing data beats any Chinese-side figure for your market. 3) <strong>Overseas plant output</strong> — signals which markets will get local pricing and supply priority. 4) <strong>Fuel-type mix of exports</strong> — ICE/PHEV/EV shares predict which products reach tariff-protected markets. 5) <strong>Ro-ro shipping capacity</strong> — car-carrier fleets and charter rates cap how fast volumes can move.</p>
<h2>Impact on Chinese automakers</h2>
<p>Data transparency is becoming a competitive tool: brands that report clean overseas numbers (BYD, Chery, Geely) build analyst and partner trust; those that blur domestic and export volumes invite skepticism precisely when they seek foreign dealers and capital.</p>
<h2>What to watch next</h2>
<p>Early-month delivery reports around the 1st-3rd; CAAM's monthly export release mid-month; and H1/H2 target revisions, which say more about real momentum than any single month. We track all of it in <a href="/data">Data & Rankings</a> and the daily <a href="/news">briefing</a>.</p>`,
  html_zh: `
<p>中国发布的汽车数据比任何市场都多、都快——而误读这些数据是这个行业最容易犯的错误。本文讲清各口径如何拼合，以及什么才真正预示机会。</p>
<h2>这些数字是什么意思</h2>
<p>三组区别最关键。<strong>批发与零售：</strong>大多数头条数字是批发量——发给经销商的车，不是卖给用户的车。<strong>出口与海外销量：</strong>"出口"统计离开中国的车；"海外销量/交付"（例如比亚迪上半年 792,256 辆 <a href="https://money.usnews.com/investing/news/articles/2026-07-01/byds-sales-rise-for-second-month-buoyed-by-exports">[Reuters/USNews]</a>）包含海外工厂生产的车——随着本地化铺开，这个差距越来越大。<strong>协会与海关：</strong>中汽协/乘联会与海关统计口径和时点不同，几乎从不完全一致。</p>
<h2>为什么重要</h2>
<p>经销商和进口商要提前数月押注资金。把批发脉冲当成零售需求、把中国港口出口当成市场成功，会让你恰好在市场饱和时过量订货——俄罗斯市场的库存反复摆动就是前车之鉴。</p>
<h2>最值得盯的五个指标</h2>
<p>1）<strong>品牌级海外月度交付</strong>——最干净的需求代理指标，各车企月初发布；2）<strong>目的地上牌数据</strong>——对你的市场而言，本地上牌比任何中国侧数据都可靠；3）<strong>海外工厂产量</strong>——预示哪些市场将获得本地定价与供给优先权；4）<strong>出口燃料结构</strong>——燃油/插混/纯电占比决定哪些产品能进入关税保护市场；5）<strong>滚装船运力</strong>——汽车船队规模与租金水平决定体量移动的上限。</p>
<h2>对中国车企的影响</h2>
<p>数据透明度正在变成竞争工具：海外数字干净的品牌（比亚迪、奇瑞、吉利）积累分析师与伙伴的信任；把国内外销量搅在一起的品牌，恰恰在寻求海外经销商与资本时招致怀疑。</p>
<h2>下一步看什么</h2>
<p>每月 1-3 日前后的交付快报；月中的中汽协出口数据；以及年中目标修订——它比任何单月数字都更能说明真实动能。<a href="/data">数据与排名</a>栏目和每日<a href="/news">简报</a>持续追踪。</p>`
});

for (const a of A) {
  fs.writeFileSync(path.join(OUT, `${a.slug}.json`), JSON.stringify(a, null, 2));
  console.log('✓', a.slug);
}
console.log(`\n${A.length} 篇已写入 topchinacar-site/articles/`);
