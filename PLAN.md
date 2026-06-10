# More Farms Dashboard - Project Brief

## Summary
A single-page analytics dashboard showing key farm operation metrics for corn and soybean production.
Primary stakeholder is the farm operator who needs a consolidated, at-a-glance view of yield performance, grain inventory, and market pricing to make informed selling and operational decisions.
Think a clean, practical tool similar to a farm management app like FarmLogs or Granular.

## Data
- Generate a fake dataset as a JSON file (src/data/metrics.json).
- Data should represent a full crop year (2025 growing season) and include multiple fields on the farm.
- Data is organized by **Field** and **Crop Type** (Corn or Soybeans) and should include:

- **Yield Per Field**
    - Field name/ID (e.g., North Field, South Field, East Field, West Field)
    - Crop type (Corn or Soybeans)
    - Acres per field
    - Bushels harvested per field
    - Yield in bushels per acre (bu/ac)
    - Yield comparison — 2025 actual vs. 2024 actual vs. 5-year average

- **Grain Bin Inventory**
    - Bin name/ID (e.g., Bin 1, Bin 2, Bin 3)
    - Crop type stored per bin
    - Bin capacity (bushels)
    - Current bushels in storage
    - Fill level percentage
    - Moisture level (%)
    - Temperature (°F)
    - Days in storage

- **Market Prices**
    - Current cash price per bushel — Corn
    - Current cash price per bushel — Soybeans
    - CBOT futures price — Corn and Soybeans
    - Basis (cash price minus futures price)
    - Price trend data — 90 days of daily price history for both crops
    - Estimated total inventory value (bushels in storage × current cash price)

- **Financial Snapshot**
    - Break-even price per bushel (Corn and Soybeans)
    - Estimated profit/loss per crop based on current market price vs. break-even
    - Input cost per acre (seed, fertilizer, chemicals)
    - Total revenue from grain sold to date

## Layout (Vuetify)
- **v-app-bar** at the top with the dashboard title **"Green Acres Farm Dashboard"** and filters
- Filters should be dropdown menus:
    - **Crop Filter:** Default to All. Options: All, Corn, Soybeans
    - **Field Filter:** Default to All Fields. Options: All Fields, North Field, South Field, East Field, West Field
- When a filter is selected, all relevant cards and charts update to reflect the selection
- Use a **top-down hierarchy**, prioritizing the most critical KPIs at the top and drilling into details as the user scrolls
- **Row 1 — Summary KPI Cards** (below the app bar): A row of v-cards showing the top at-a-glance metrics:
    - Corn Cash Price ($/bu)
    - Soybean Cash Price ($/bu)
    - Total Bushels in Storage
    - Estimated Inventory Value ($)
    - Average Yield — Corn (bu/ac)
    - Average Yield — Soybeans (bu/ac)
- **Row 2 — Yield Performance:** Bar chart showing yield per field (bu/ac), filterable by crop type, with a reference line for the 5-year average
- **Row 3 — Grain Bin Inventory:** Visual bin cards showing fill level (progress bar or gauge), moisture, temperature, and days in storage per bin
- **Row 4 — Market Price Trends:** Line chart showing 90-day price history for Corn and Soybeans with current price highlighted
- **Row 5 — Financial Snapshot:** Cards showing break-even price vs. current market price, estimated profit/loss per crop, and total revenue from sales to date
- Use **v-container, v-row, v-col** for responsive grid layout

## Interactions
- **Crop filter** — dropdown that filters yield charts, bin inventory, and financial cards to the selected crop
- **Field filter** — dropdown that filters yield data and financial metrics to the selected field
- **Hovering over chart data points** reveals exact values, dates, and percentage changes vs. prior year
- **KPI summary cards** show a small up/down arrow and color indicator showing change vs. prior year (green = favorable, red = unfavorable)
- **Bin cards** use a color-coded fill indicator:
    - Green = under 75% full
    - Yellow = 75–90% full
    - Red = over 90% full
- **Moisture level** on bin cards color-coded:
    - Green = safe storage range (under 14%)
    - Yellow = monitor (14–15%)
    - Red = at risk (over 15%)

## Style
- Clean, minimal, lots of whitespace
- **Color palette** inspired by agriculture — earthy greens, warm golds, and neutral grays. Not rainbow.
    - Primary: Deep green `#2E7D32`
    - Accent: Harvest gold `#F9A825`
    - Background: Light warm gray `#F5F5F0`
    - Cards: White `#FFFFFF`
    - Danger/Alert: Muted red `#C62828`
- Charts should use a cohesive two-tone palette — **green for soybeans, gold for corn**
- Mobile responsive — cards and charts stack gracefully on small screens
- Bin inventory cards should feel **visual and intuitive** — a farmer glancing at a phone in the field should immediately understand the status

## Tech
- Vue 3 + TypeScript + Vuetify 3
- Chart.js via vue-chartjs for all charts
- Fake data from a local JSON file (no API calls)
- Single page — no routing needed for this app

## Key Metrics — At a Glance Priority
| Metric | Display Type | Why It Matters |
|---|---|---|
| Corn & Soybean Cash Price | KPI Card | Daily selling decision |
| Total Bushels in Storage | KPI Card | Know your inventory |
| Estimated Inventory Value | KPI Card | Financial awareness |
| Yield per Field (bu/ac) | Bar Chart | Field performance |
| Bin Fill Level | Progress/Gauge | Storage management |
| Bin Moisture & Temp | Bin Card | Grain quality protection |
| 90-Day Price Trend | Line Chart | Selling timing decisions |
| Break-even vs. Market Price | KPI Card | Profit/loss awareness |