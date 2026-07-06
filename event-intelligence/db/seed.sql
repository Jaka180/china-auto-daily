insert into companies (name, country, type) values
  ('BYD', 'China', 'OEM'),
  ('Geely', 'China', 'OEM'),
  ('SAIC', 'China', 'OEM'),
  ('Chery', 'China', 'OEM'),
  ('Great Wall Motor', 'China', 'OEM'),
  ('NIO', 'China', 'Startup'),
  ('Xpeng', 'China', 'Startup'),
  ('Li Auto', 'China', 'Startup'),
  ('Xiaomi Auto', 'China', 'Startup'),
  ('Leapmotor', 'China', 'Startup')
on conflict (name) do nothing;

insert into markets (name, region) values
  ('Europe', 'Europe'),
  ('Thailand', 'Southeast Asia'),
  ('Indonesia', 'Southeast Asia'),
  ('Brazil', 'Latin America'),
  ('China', 'China'),
  ('Middle East', 'Middle East'),
  ('Southeast Asia', 'Southeast Asia'),
  ('Africa', 'Africa'),
  ('Australia', 'Oceania')
on conflict (name) do nothing;

insert into events (
  slug, article_hash, title, summary, event_type, company, market, model, event_date,
  source_url, source_name, source_priority, source_category, impact_score, confidence_score,
  final_score, low_confidence, raw_content, raw_evidence, is_seed
) values
  ('byd-factory-europe-2026-07-01', 'seed:byd-factory-europe-2026-07-01', 'BYD expands EV factory in Hungary', 'Seed intelligence event for cold-start ranking and page rendering.', 'factory', 'BYD', 'Europe', null, '2026-07-01T00:00:00Z', 'https://www.topchinacar.com/seed/byd-hungary-factory', 'TopChinaCar Seed Data', 6, 'seed', 8, 0.8, 5.44, false, 'Seed event: BYD expands EV factory in Hungary.', 'Seed event: BYD expands EV factory in Hungary.', true),
  ('chery-factory-thailand-2026-07-01', 'seed:chery-factory-thailand-2026-07-01', 'Chery builds plant in Thailand', 'Seed intelligence event for cold-start ranking and page rendering.', 'factory', 'Chery', 'Thailand', null, '2026-07-01T00:00:00Z', 'https://www.topchinacar.com/seed/chery-thailand-plant', 'TopChinaCar Seed Data', 6, 'seed', 8, 0.8, 5.44, false, 'Seed event: Chery builds plant in Thailand.', 'Seed event: Chery builds plant in Thailand.', true),
  ('global-tariff-europe-2026-07-01', 'seed:global-tariff-europe-2026-07-01', 'EU increases EV tariffs on Chinese imports', 'Seed intelligence event for cold-start ranking and page rendering.', 'tariff', null, 'Europe', null, '2026-07-01T00:00:00Z', 'https://www.topchinacar.com/seed/eu-china-ev-tariffs', 'TopChinaCar Seed Data', 6, 'seed', 9, 0.8, 5.94, false, 'Seed event: EU increases EV tariffs on Chinese imports.', 'Seed event: EU increases EV tariffs on Chinese imports.', true),
  ('tesla-pricing-china-2026-07-01', 'seed:tesla-pricing-china-2026-07-01', 'Tesla reduces prices in China', 'Seed intelligence event for cold-start ranking and page rendering.', 'pricing', 'Tesla', 'China', null, '2026-07-01T00:00:00Z', 'https://www.topchinacar.com/seed/tesla-china-pricing', 'TopChinaCar Seed Data', 6, 'seed', 5, 0.8, 3.94, false, 'Seed event: Tesla reduces prices in China.', 'Seed event: Tesla reduces prices in China.', true),
  ('xpeng-dealer-expansion-europe-2026-07-01', 'seed:xpeng-dealer-expansion-europe-2026-07-01', 'XPeng expands Europe distribution', 'Seed intelligence event for cold-start ranking and page rendering.', 'dealer_expansion', 'Xpeng', 'Europe', null, '2026-07-01T00:00:00Z', 'https://www.topchinacar.com/seed/xpeng-europe-distribution', 'TopChinaCar Seed Data', 6, 'seed', 6, 0.8, 4.44, false, 'Seed event: XPeng expands Europe distribution.', 'Seed event: XPeng expands Europe distribution.', true),
  ('geely-investment-southeast-asia-2026-07-01', 'seed:geely-investment-southeast-asia-2026-07-01', 'Geely invests in SEA expansion', 'Seed intelligence event for cold-start ranking and page rendering.', 'investment', 'Geely', 'Southeast Asia', null, '2026-07-01T00:00:00Z', 'https://www.topchinacar.com/seed/geely-sea-expansion', 'TopChinaCar Seed Data', 6, 'seed', 7, 0.8, 4.94, false, 'Seed event: Geely invests in SEA expansion.', 'Seed event: Geely invests in SEA expansion.', true)
on conflict (slug) do nothing;
