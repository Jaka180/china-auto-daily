# 出口/海外销量数据底座（overseas-sales）

持续维护的月度**海外销量**时间序列,覆盖 10 家传统车企 + 5 家新势力。由日报 pipeline
每月自动追加,git 版本管理,可喂给网站 /data 页与日报做同比/趋势。

## 口径（重要）
- **overseas_units = 海外销量,含当地生产**（overseas / global-ex-China deliveries，
  包含海外工厂本地产销），不是单纯海关出口台数。
- 若某公司某月只查到「海关出口」口径,照填,并在 `note` 标注 `customs-export`。
- 一律用**集团（母公司）口径**;子品牌计入母公司（如极氪计入吉利、MG 计入上汽）。

## 覆盖对象（15，company_key）
- 传统(traditional)：`byd` `geely` `chery` `changan` `saic` `faw` `gwm` `gac` `dongfeng` `baic`
- 新势力(new_force)：`nio` `xpeng` `li` `leapmotor` `xiaomi`

## 文件
- `overseas-sales.csv` —— 唯一事实来源(long format,一行一个「公司-月」)。人工与 pipeline 都改这个。
- `overseas-sales.json` —— 由 CSV 生成的嵌套结构,供网站/日报消费。**不要手改**。
- `build_json.py` —— 读 CSV 生成 JSON:`python3 data/build_json.py`。

## CSV 字段
`company_key, company_en, company_zh, group_type, year, month, overseas_units, metric, yoy_pct, source_url, note`
- `group_type`：`traditional` | `new_force`
- `year`：如 2026；`month`：1–12
- `overseas_units`：整数;查不到留空(不要编)
- `metric`：`overseas`(海外销量,含当地生产,首选) | `customs_export`(仅海关出口口径,该月只查到出口数时用)
- `yoy_pct`：同比%,有就填(如 94.7),无留空
- `source_url`：该数字的来源链接;留空表示待补
- `note`：口径/可信度备注,如 `low-confidence mixed base`、`negligible/none`、`revised YYYY-MM-DD` 等

> 口径混用是真实存在的:BYD/GWM/SAIC/Changan 报「海外销量」(含海外厂本地产销),
> Geely/Chery/GAC 及新势力多为「海关出口」。`metric` 列如实标注,跨公司比较时注意。

## 更新协议（pipeline 每次运行时执行）
1. 中国乘联会/海关月度数据通常在**次月上旬**发布。每天生成日报时,若当天检索到某公司
   **上一个完整月**的海外销量/出口新数字,则在 `overseas-sales.csv` 追加/更新对应行,
   附来源。日中数据不计入(月度口径)。
2. 只补「上一个完整月」及更早的缺口;不预填未完成月份。
3. 已有行若发现更权威的修正值,可覆盖,并在 `note` 记 `revised YYYY-MM-DD`。
4. 改完 CSV 后运行 `python3 data/build_json.py` 重生成 JSON。
5. 绝不编造:查不到就留空,宁缺毋假。

## 校验
`python3 data/build_json.py` 会检查:company_key 合法、month∈1–12、overseas_units 为空或非负整数,
并打印每家已覆盖的月份数与缺口。
