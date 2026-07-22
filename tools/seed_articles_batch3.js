#!/usr/bin/env node
// 第三批奠基文章 (#6, #11, #12, #13, #15) → topchinacar-site/articles/*.json
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'topchinacar-site', 'articles');
fs.mkdirSync(OUT, { recursive: true });

const A = [];

// ============ 6. Changan ============
A.push({
  slug: 'changan-overseas-strategy-from-suvs-to-smart-evs',
  date: '2026-07-06', tag_en: 'Analysis', tag_zh: '分析',
  title_en: "Changan's Overseas Strategy: From SUVs to Smart EVs",
  title_zh: '长安的出海战略：从 SUV 到智能电动车',
  excerpt_en: "The quietest of China's big state-owned groups is running one of the most methodical globalization plays: Thai-built EVs for Europe, 22 overseas manufacturing bases, and a 1.5–1.8 million overseas target by 2030.",
  excerpt_zh: '中国大型国有集团里最低调的一家，正在执行最有章法的全球化打法之一：泰国造电动车供欧洲、22 个海外制造基地、2030 年海外 150-180 万辆目标。',
  html_en: `
<p>Changan rarely makes global headlines the way BYD or Xiaomi do. But watch the shipping manifests instead of the launch events, and one of China's most methodical globalization programmes comes into focus.</p>
<h2>What happened</h2>
<p>Changan sold <strong>212,585 vehicles overseas in Q1 2026</strong> — 38.1% of its total volume. <a href="https://www.ichongqing.info/2026/04/25/changan-unveils-new-global-strategy-targeting-1-8-million-overseas-sales/">[iChongqing]</a> The strategic centrepiece is Thailand: its Rayong plant builds the Deepal S05 with 60% local content and now exports it to the UK, Belgium, Norway and Germany — Chinese-brand EVs entering Europe without ever leaving a Chinese port. <a href="https://www.electrive.com/2026/01/07/changan-starts-exporting-thai-made-evs-to-europe/">[Electrive]</a></p>
<h2>Why it matters</h2>
<p>Changan is running the full Japanese playbook in compressed time: export ICE volume first (Alsvin and CS-series SUVs across the Middle East, Latin America and Central Asia), then layer smart EVs on top through the Deepal and premium Avatr brands, and localise production early — 22 overseas manufacturing bases already, with local content targets rising to 80% by 2030.</p>
<h2>Market context</h2>
<p>The Thailand-to-Europe route matters beyond Changan. Thai-built EVs enter the EU under standard third-country terms rather than the China-specific anti-subsidy duties — a template Geely (Proton, Malaysia) and others are now copying. It converts Southeast Asian plants from regional factories into global export hubs.</p>
<h2>Impact on Chinese automakers</h2>
<p>Changan's 2030 target of 1.5–1.8 million overseas sales — announced with a presence in 118 countries — would put it in the same league as BYD's current programme. Its challenge is brand: Deepal and Avatr are unknown abroad, and unlike Geely it owns no European badge to borrow credibility from. Its advantage is state-backed patience and a manufacturing footprint few rivals match.</p>
<h2>What to watch next</h2>
<p>Whether Deepal's European volumes justify a dedicated dealer network; the pace at which the Thai plant's 80% local-content target advances; and whether Avatr — the Huawei- and CATL-backed premium line — attempts Europe. Brand feed: <a href="/chinese-car-brands">all brands</a>; daily coverage in <a href="/china-car-export-news">Exports</a>.</p>`,
  html_zh: `
<p>长安很少像比亚迪或小米那样登上全球头条。但如果你盯的是船运舱单而不是发布会，就会看清中国最有章法的全球化项目之一。</p>
<h2>发生了什么</h2>
<p>长安 2026 年一季度海外销量 <strong>212,585 辆</strong>——占总量 38.1%。<a href="https://www.ichongqing.info/2026/04/25/changan-unveils-new-global-strategy-targeting-1-8-million-overseas-sales/">[iChongqing]</a> 战略支点在泰国：罗勇工厂以 60% 本地化率生产深蓝 S05，并已出口英国、比利时、挪威、德国——中国品牌电动车不经中国港口进入欧洲。<a href="https://www.electrive.com/2026/01/07/changan-starts-exporting-thai-made-evs-to-europe/">[Electrive]</a></p>
<h2>为什么重要</h2>
<p>长安在用压缩时间跑完整套日本剧本：先用燃油车上量（Alsvin 和 CS 系列 SUV 覆盖中东、拉美、中亚），再通过深蓝和高端品牌阿维塔叠加智能电动车，并且提早本地化——已有 22 个海外制造基地，本地化率目标 2030 年提至 80%。</p>
<h2>市场背景</h2>
<p>泰国-欧洲通道的意义超出长安本身。泰国产电动车按普通第三国条款进入欧盟，而非针对中国的反补贴税——吉利（马来西亚宝腾）等正在复制这一模板。它把东南亚工厂从区域工厂升级为全球出口枢纽。</p>
<h2>对中国车企的影响</h2>
<p>长安 2030 年海外 150-180 万辆的目标——伴随 118 国的布局——将使其与比亚迪当前的体量同级。它的挑战在品牌：深蓝和阿维塔在海外无人知晓，也不像吉利那样有欧洲车标可借力。它的优势是国资背景的耐心，和少有对手能匹敌的制造版图。</p>
<h2>下一步看什么</h2>
<p>深蓝的欧洲销量能否撑起独立经销网络；泰国工厂 80% 本地化目标的推进速度；以及华为与宁德时代加持的阿维塔会不会尝试欧洲。品牌档案：<a href="/chinese-car-brands">全部品牌</a>；每日动态见<a href="/china-car-export-news">出口栏目</a>。</p>`
});

// ============ 11. BYD vs Chery ============
A.push({
  slug: 'byd-vs-chery-overseas-two-different-globalization-models',
  date: '2026-07-06', tag_en: 'Analysis', tag_zh: '分析',
  title_en: 'BYD vs Chery Overseas: Two Different Globalization Models',
  title_zh: 'BYD 对奇瑞：两种截然不同的全球化模型',
  excerpt_en: "China's two biggest auto exporters got there by opposite routes — technology-led blitz versus market-led patience. Comparing them explains most of what is happening in China auto globalization.",
  excerpt_zh: '中国两大汽车出口商走的是相反的路——技术驱动的闪电战对市场驱动的持久战。比较两者，就能读懂中国汽车全球化的大半逻辑。',
  html_en: `
<p>BYD and Chery each shipped roughly 800,000–950,000 vehicles overseas in the first half of 2026 — more than most legacy automakers export in a year. But they reached those numbers by almost opposite strategies, and the contrast is the best single lens on China auto globalization.</p>
<h2>The two models</h2>
<p><strong>BYD is technology-led:</strong> it entered developed, EV-ready markets — Europe, Australia, Southeast Asia's EV hubs — on the strength of batteries and pricing, then built plants (Hungary, Brazil, Thailand) when tariffs and volume demanded. H1 2026: 792,256 overseas deliveries, +70.7%. <a href="https://money.usnews.com/investing/news/articles/2026-07-01/byds-sales-rise-for-second-month-buoyed-by-exports">[Reuters/USNews]</a> <strong>Chery is market-led:</strong> two decades of petrol SUVs into Russia, the Middle East and Latin America, assembly partnerships everywhere, electrification arriving only once distribution was won. H1 2026: 943,817 overseas units, +71.5%. <a href="https://autonews.gasgoo.com/articles/news/chery-group-reports-13575-million-vehicles-in-h1-sales-nev-volume-rises-323-2072673248226361344">[Gasgoo]</a></p>
<h2>Why it matters</h2>
<p>The two models fail differently. BYD's is exposed to policy — EV tariffs, subsidy rules, charging build-outs — but compounds fast where EVs win. Chery's is exposed to currency and commodity cycles in emerging markets, but survives policy shocks because petrol and hybrid exports face fewer barriers.</p>
<h2>Market context</h2>
<p>In Europe the models now collide: BYD arrives with EVs and a Hungarian plant; Chery with Omoda/Jaecoo hybrids and Spanish assembly. In the Gulf and Africa they barely overlap — Chery's ground game is years ahead. In Latin America both build factories, betting the region rewards local production over technology.</p>
<h2>Impact on Chinese automakers</h2>
<p>Every other Chinese brand is choosing between these templates or blending them: Geely runs both at once through its portfolio; Changan copies Chery's sequence with newer products; Leapmotor outsources the market-led part to Stellantis. The lesson from both leaders: distribution and localisation, not product alone, decide who stays.</p>
<h2>What to watch next</h2>
<p>Whether Chery's NEV export share catches up before BYD's dealer coverage does; which of the two wins Brazil, the one market where both are investing heavily; and full-year totals — both are on pace to pass 1.5 million overseas units. Profiles: <a href="/chinese-car-brands/byd">BYD</a> · <a href="/chinese-car-brands/chery">Chery</a>.</p>`,
  html_zh: `
<p>比亚迪和奇瑞在 2026 上半年各自出口了约 80-95 万辆——超过多数传统车企一整年的出口量。但两者抵达这个数字的路线几乎相反，而这组对照正是理解中国汽车全球化的最佳单一视角。</p>
<h2>两种模型</h2>
<p><strong>比亚迪是技术驱动：</strong>凭电池与价格切入电动化就绪的发达市场——欧洲、澳洲、东南亚电动枢纽——当关税与体量需要时再建厂（匈牙利、巴西、泰国）。2026 上半年海外交付 792,256 辆，+70.7%。<a href="https://money.usnews.com/investing/news/articles/2026-07-01/byds-sales-rise-for-second-month-buoyed-by-exports">[Reuters/USNews]</a> <strong>奇瑞是市场驱动：</strong>二十年燃油 SUV 深耕俄罗斯、中东、拉美，到处建组装合作，等分销网络到手才推进电动化。2026 上半年海外 943,817 辆，+71.5%。<a href="https://autonews.gasgoo.com/articles/news/chery-group-reports-13575-million-vehicles-in-h1-sales-nev-volume-rises-323-2072673248226361344">[Gasgoo]</a></p>
<h2>为什么重要</h2>
<p>两种模型的脆弱点不同。比亚迪暴露于政策——电动车关税、补贴规则、充电建设——但在电动车获胜的市场复利极快。奇瑞暴露于新兴市场的汇率与大宗周期，但能扛政策冲击，因为燃油和混动出口面对的壁垒少得多。</p>
<h2>市场背景</h2>
<p>在欧洲，两种模型正面相撞：比亚迪带着电动车和匈牙利工厂；奇瑞带着 Omoda/Jaecoo 混动和西班牙组装。在海湾和非洲两者几乎不重叠——奇瑞的地面战领先数年。在拉美双方都在建厂，赌的是这个区域奖励本地生产胜过奖励技术。</p>
<h2>对中国车企的影响</h2>
<p>其他中国品牌都在这两个模板之间选择或调和：吉利用品牌矩阵同时跑两条线；长安用更新的产品复刻奇瑞的次序；零跑把市场驱动的部分外包给 Stellantis。两位领跑者共同的教训是：决定去留的是分销与本地化，而不只是产品。</p>
<h2>下一步看什么</h2>
<p>奇瑞的新能源出口占比和比亚迪的渠道覆盖，谁先补齐短板；两家都重注的巴西花落谁家；以及全年总量——两者都在冲 150 万辆海外销量的节奏上。品牌档案：<a href="/chinese-car-brands/byd">BYD</a> · <a href="/chinese-car-brands/chery">奇瑞</a>。</p>`
});

// ============ 12. PHEV ============
A.push({
  slug: 'chinese-plug-in-hybrids-why-phevs-are-gaining-attention',
  date: '2026-07-06', tag_en: 'EV', tag_zh: '新能源',
  title_en: 'Chinese Plug-in Hybrids: Why PHEVs Are Gaining Attention',
  title_zh: '中国插混：PHEV 为什么突然成了主角',
  excerpt_en: "Pure EVs made the headlines, but plug-in hybrids and EREVs are becoming China's stealth export weapon: no charging anxiety, no EV tariffs in Europe, and 1,000-plus kilometres of combined range.",
  excerpt_zh: '纯电抢走了头条，但插混和增程正在成为中国的隐形出口武器：没有补能焦虑、不在欧盟电动车关税范围内、综合续航动辄 1,000 公里以上。',
  html_en: `
<p>The Chinese car story abroad was told as an EV story. Quietly, the fastest-growing part of the export mix has become something else: plug-in hybrids and extended-range EVs.</p>
<h2>What's happening</h2>
<p>The product wave is unmistakable. Geely's Galaxy Starship 7 super-hybrid launched across 57 countries and topped Australia's mid-size PHEV SUV segment within months. <a href="https://allweatherfinance.com/geely-joins-the-club-of-exporting-100-000-vehicles-in-a-single-month/">[AllWeather Finance]</a> Jaecoo's 7 PHEV became a UK breakout with 1,200 km of combined range; BYD's Shark 6 PHEV pickup opened Australia and Latin America; Wey, Denza and Li Auto push premium PHEV/EREV formats at home that follow abroad.</p>
<h2>Why it matters</h2>
<p>PHEVs solve the three biggest objections to Chinese EVs simultaneously: charging infrastructure (they do not depend on it), range anxiety (petrol backup), and — crucially in Europe — tariffs, since the EU's anti-subsidy duties target battery-electric vehicles, not plug-in hybrids. A Chinese PHEV enters the EU at standard rates while the same brand's EV pays up to 35 extra points.</p>
<h2>Market context</h2>
<p>China's home market previewed this shift: PHEVs and EREVs took an ever-larger share of NEV sales as buyers outside big cities chose flexibility. The technology matured accordingly — dedicated hybrid platforms, 100-200 km electric range, highway fuel economy petrol SUVs cannot match. Emerging markets with weak grids are the natural second act.</p>
<h2>Impact on Chinese automakers</h2>
<p>PHEV strength redraws the competitive map. It hands brands with deep hybrid line-ups — BYD, Geely, Chery, GWM — a tariff-resistant path into Europe and a grid-independent path into the Global South. Pure-EV players (NIO, Xpeng, Zeekr) lack that hedge; Li Auto has the products but not yet the export network.</p>
<h2>What to watch next</h2>
<p>Whether Brussels moves to extend duties to PHEVs — the single biggest regulatory risk; PHEV share in Chinese export statistics; and whether hybrid pickups become the wedge segment in Australia, South Africa and Latin America. Coverage: <a href="/china-ev-news">EV section</a>.</p>`,
  html_zh: `
<p>中国汽车的海外叙事一直被讲成纯电故事。但悄悄地，出口结构里增长最快的部分变成了另一样东西：插电混动和增程电动车。</p>
<h2>正在发生什么</h2>
<p>产品浪潮清晰可见。吉利银河星舰 7 超级混动进入 57 国，数月内登顶澳大利亚中型 PHEV SUV 细分。<a href="https://allweatherfinance.com/geely-joins-the-club-of-exporting-100-000-vehicles-in-a-single-month/">[AllWeather Finance]</a> 捷酷 7 PHEV 凭 1,200 公里综合续航在英国一炮而红；比亚迪 Shark 6 插混皮卡打开澳洲与拉美；魏牌、腾势、理想在国内推高端插混/增程,随后跟进海外。</p>
<h2>为什么重要</h2>
<p>插混同时化解了中国电动车面临的三大质疑：充电基础设施（它不依赖）、续航焦虑（有油兜底），以及——对欧洲至关重要的——关税，因为欧盟反补贴税针对的是纯电动车，不含插混。同一品牌的插混按标准税率进欧盟，纯电却要多缴最高 35 个百分点。</p>
<h2>市场背景</h2>
<p>中国本土市场预演了这场转变：大城市之外的买家选择灵活性，插混与增程在新能源销量中的占比持续走高。技术随之成熟——专用混动平台、100-200 公里纯电续航、燃油 SUV 望尘莫及的高速油耗。电网薄弱的新兴市场是天然的第二幕。</p>
<h2>对中国车企的影响</h2>
<p>插混实力重画了竞争地图。它给混动产品线深厚的品牌——比亚迪、吉利、奇瑞、长城——一条抗关税的欧洲通道和一条不依赖电网的南方通道。纯电玩家（蔚来、小鹏、极氪）没有这个对冲；理想有产品，但还没有出口网络。</p>
<h2>下一步看什么</h2>
<p>布鲁塞尔会不会把关税扩展到插混——这是最大的单一监管风险；中国出口统计中的插混占比；以及混动皮卡会不会成为澳洲、南非、拉美的楔子细分。持续报道：<a href="/china-ev-news">新能源栏目</a>。</p>`
});

// ============ 13. EU Tariffs ============
A.push({
  slug: 'what-eu-tariffs-mean-for-chinese-ev-makers',
  date: '2026-07-06', tag_en: 'Policy', tag_zh: '政策',
  title_en: 'What EU Tariffs Mean for Chinese EV Makers',
  title_zh: '欧盟关税对中国电动车企意味着什么',
  excerpt_en: "The EU's anti-subsidy duties were meant to slow Chinese EVs. Eighteen months on, the real effect is visible: not retreat, but localisation, PHEV substitution and a premium pivot.",
  excerpt_zh: '欧盟反补贴税本意是给中国电动车减速。十八个月过去，真实效果清晰可见：不是撤退，而是本地化、插混替代与高端化转向。',
  html_en: `
<p>When the EU imposed definitive anti-subsidy duties on Chinese-built EVs in late 2024, the question was whether Chinese brands would retreat from Europe. The 2026 answer is unambiguous: they changed shape instead.</p>
<h2>What happened</h2>
<p>The duties stack on top of the EU's 10% base tariff and vary by cooperation level — roughly 17% extra for BYD, 18.8% for Geely, 35.3% for SAIC, with most other cooperating brands around 21%. Talks between Brussels and Beijing over an alternative minimum-price mechanism have continued intermittently ever since, without a definitive replacement so far.</p>
<h2>Why it matters</h2>
<p>Tariffs raised the cost of the old model — build in China, ship to Rotterdam — by thousands of euros per car. But they did not touch three alternatives: cars built inside Europe, plug-in hybrids, and premium vehicles whose margins absorb the duty. All three are exactly where Chinese brands moved.</p>
<h2>Market context</h2>
<p>The localisation wave is the direct result: Leapmotor's B10 from Stellantis's Zaragoza plant, BYD's Hungarian factory ramping, Chery assembling in Spain, Geely weighing European options while routing the Zeekr 7X through Malaysia. <a href="https://www.automotivelogistics.media/ev-and-battery/stellantis-and-leapmotors-expanded-joint-venture-in-spain-signals-move-towards-europechina-hybrid-production-model/2661986">[Automotive Logistics]</a> Meanwhile PHEVs — outside the duty's scope — became the import of choice, and MG's petrol and hybrid line-up carried SAIC through the highest tariff band.</p>
<h2>Impact on Chinese automakers</h2>
<p>The duties effectively sorted the field into three tiers: groups with European production paths (Leapmotor, BYD, Geely, Chery) that treat the tariff as a construction deadline; brands using tariff-exempt product mixes (PHEV-heavy or ICE-heavy line-ups); and pure EV importers, who must either eat margin or hold niche premium positions. What tariffs did not do is close the gap in product cost — Chinese EVs remain price-competitive even after duties.</p>
<h2>What to watch next</h2>
<p>Any EU-China minimum-price agreement, which would reset the economics overnight; whether PHEVs get pulled into scope; the first duty-review cycle; and how EU rules treat Chinese cars built in third countries such as Thailand and Malaysia. Ongoing coverage: <a href="/policy">Policy & Tariffs</a>.</p>`,
  html_zh: `
<p>2024 年底欧盟对中国产电动车课征最终反补贴税时，问题是中国品牌会不会撤出欧洲。2026 年的答案毫不含糊：它们没有撤退，而是改变了形态。</p>
<h2>发生了什么</h2>
<p>反补贴税叠加在欧盟 10% 基础关税之上，按配合程度分档——比亚迪约加征 17%，吉利 18.8%，上汽 35.3%，其余配合调查的品牌多在 21% 左右。此后布鲁塞尔与北京围绕"最低限价"替代机制的谈判断续进行，至今没有definitive的替代方案。</p>
<h2>为什么重要</h2>
<p>关税让旧模式——中国制造、海运鹿特丹——每辆车贵了数千欧元。但它没有触及三个替代方案：欧洲本土制造的车、插电混动、以及利润足以消化税负的高端车型。中国品牌的转向恰恰全部落在这三处。</p>
<h2>市场背景</h2>
<p>本地化浪潮是最直接的结果：零跑 B10 出自 Stellantis 萨拉戈萨工厂，比亚迪匈牙利工厂爬坡，奇瑞在西班牙组装，吉利一边评估欧洲选项一边让极氪 7X 取道马来西亚。<a href="https://www.automotivelogistics.media/ev-and-battery/stellantis-and-leapmotors-expanded-joint-venture-in-spain-signals-move-towards-europechina-hybrid-production-model/2661986">[Automotive Logistics]</a> 与此同时，不在税负范围内的插混成了首选进口品类，MG 的燃油与混动产品线扛着上汽挺过了最高税档。</p>
<h2>对中国车企的影响</h2>
<p>关税实际上把阵营分成三层：拥有欧洲生产路径的集团（零跑、比亚迪、吉利、奇瑞），把关税当成建厂倒计时；用免税产品结构（插混或燃油为主）的品牌；以及纯电进口商——要么吃掉利润，要么固守高端利基。关税没有做到的是抹平产品成本差距——加税之后，中国电动车依然有价格竞争力。</p>
<h2>下一步看什么</h2>
<p>欧中最低限价协议——一旦达成将一夜重置经济账；插混会不会被纳入范围；第一个关税复审周期；以及欧盟如何对待泰国、马来西亚等第三国制造的中国品牌汽车。持续报道：<a href="/policy">政策与关税</a>。</p>`
});

// ============ 15. Pickups ============
A.push({
  slug: 'chinese-pickup-trucks-a-growing-export-segment',
  date: '2026-07-06', tag_en: 'Exports', tag_zh: '出口',
  title_en: 'Chinese Pickup Trucks: A Growing Export Segment',
  title_zh: '中国皮卡：正在崛起的出口细分',
  excerpt_en: "Pickups are the most brand-loyal segment in the markets Chinese automakers covet — and the segment where they are advancing fastest, led by GWM's Poer, BYD's Shark 6 and a wave of PHEV utes.",
  excerpt_zh: '皮卡是中国车企觊觎的市场里品牌忠诚度最高的细分——也是它们推进最快的细分：长城炮、比亚迪 Shark 6 和一波插混皮卡正在带队。',
  html_en: `
<p>Nothing tests a car brand's credibility like a pickup: buyers tow with them, work with them and keep them for a decade. That is precisely why the Chinese push into the segment matters more than its volumes suggest.</p>
<h2>What's happening</h2>
<p>Great Wall Motor — China's pickup specialist for decades — sold over half its volume overseas in June 2026, with the Poer line and Tank off-roaders anchoring Australia, the Middle East and Latin America. <a href="https://cnevpost.com/2026/07/01/gwm-jun-2026-sales/">[CnEVPost]</a> BYD's Shark 6 PHEV entered Australia as one of the market's first plug-in hybrid utes and followed into Latin America. JAC, Maxus and Foton fill fleet and commercial niches from Chile to South Africa.</p>
<h2>Why it matters</h2>
<p>Pickups are where Japanese brands are strongest — Hilux and Ranger own markets like Australia, South Africa and Thailand. Cracking the segment means winning conquest buyers on capability, not price alone. The Chinese wedge is electrification: PHEV utes offer torque, fuel savings and power-export features (running tools off the battery) that incumbent diesels cannot match, in a segment with almost no electrified competition.</p>
<h2>Market context</h2>
<p>Demand-side timing helps. Australia's emissions rules push fleets toward lower-CO2 utes; mining and agriculture buyers watch fuel costs; South African and Latin American buyers already accepted Chinese SUVs, lowering the brand barrier. Thailand — the world's pickup manufacturing hub — is simultaneously becoming a Chinese EV production base, positioning future Chinese utes inside the segment's home turf.</p>
<h2>Impact on Chinese automakers</h2>
<p>GWM gains most: pickups are its identity, and electrified utes let it outflank Toyota rather than chase it. For BYD, the Shark 6 is a brand-halo product that pulls showroom traffic beyond pickup buyers. The segment also deepens dealer economics — service, parts and accessories revenue per vehicle is far higher than in passenger EVs.</p>
<h2>What to watch next</h2>
<p>Shark 6 sales against Hilux/Ranger in Australia's monthly charts; whether GWM launches a full-electric Poer abroad; Thai-built Chinese pickups entering export circuits; and pickup lines from Chery and Geely, both of which have signalled interest. Coverage: <a href="/china-car-export-news">Exports</a>.</p>`,
  html_zh: `
<p>没有什么比皮卡更能考验一个汽车品牌的信誉：买家用它拖挂、干活，一开就是十年。这正是中国品牌进军该细分的意义远超销量数字的原因。</p>
<h2>正在发生什么</h2>
<p>长城汽车——数十年的中国皮卡专家——2026 年 6 月海外销量占比过半，炮系列与坦克越野车锚定澳洲、中东与拉美。<a href="https://cnevpost.com/2026/07/01/gwm-jun-2026-sales/">[CnEVPost]</a> 比亚迪 Shark 6 作为澳洲市场最早的插混皮卡之一登陆，随后进入拉美。江淮、大通、福田则从智利到南非填补车队与商用利基。</p>
<h2>为什么重要</h2>
<p>皮卡是日本品牌最强的阵地——Hilux 和 Ranger 统治着澳洲、南非、泰国这样的市场。攻下这个细分意味着靠能力而非仅靠价格赢得"策反型"买家。中国的楔子是电动化：插混皮卡的扭矩、油耗和对外放电（用电池带动工具）是在位柴油车给不了的，而这个细分几乎没有电动化竞争者。</p>
<h2>市场背景</h2>
<p>需求侧的时机也配合。澳洲排放法规推着车队选低碳皮卡；矿业和农业买家盯着油钱；南非和拉美买家已经接受了中国 SUV，品牌门槛被拉低。而全球皮卡制造枢纽泰国正同时变成中国电动车生产基地——未来的中国皮卡将从细分市场的主场腹地出发。</p>
<h2>对中国车企的影响</h2>
<p>长城受益最大：皮卡是它的身份标签，电动化皮卡让它得以迂回包抄丰田而不是追赶。对比亚迪，Shark 6 是拉动展厅客流的光环产品，辐射远超皮卡买家。这个细分还能加深经销商经济性——单车的售后、配件与改装收入远高于乘用电动车。</p>
<h2>下一步看什么</h2>
<p>Shark 6 在澳洲月度榜上与 Hilux/Ranger 的缠斗；长城会不会在海外推出纯电炮；泰国产中国皮卡进入出口循环；以及已释放信号的奇瑞、吉利皮卡产品线。持续报道：<a href="/china-car-export-news">出口栏目</a>。</p>`
});

for (const a of A) {
  fs.writeFileSync(path.join(OUT, `${a.slug}.json`), JSON.stringify(a, null, 2));
  console.log('✓', a.slug);
}
console.log(`\n${A.length} 篇已写入 topchinacar-site/articles/`);
