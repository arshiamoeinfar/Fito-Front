function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function chartSvg(chart) {
  if (Array.isArray(chart.lines)) {
    return combinedSvg(chart);
  }
  const points = chart.points || [];
  if (points.length === 0) {
    return "";
  }

  const width = 680;
  const height = 200;
  const pad = 36;
  const values = points.map((point) => point.value);
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const span = highest - lowest || 1;
  const coords = points.map((point, index) => {
    const x = points.length === 1
      ? width / 2
      : pad + (index * (width - pad * 2)) / (points.length - 1);
    const y = height - pad - ((point.value - lowest) / span) * (height - pad * 2);
    return { ...point, x, y };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const dots = coords.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="3.5" fill="${chart.color}" />`).join("");
  const first = coords[0];
  const last = coords[coords.length - 1];
  const labels = [first, last].filter((point, index, list) => list.findIndex((item) => item.x === point.x) === index)
    .map((point) => `<text x="${point.x}" y="${height - 8}" font-size="11" text-anchor="middle" fill="#4B5563">${escapeHtml(point.label)}</text>`)
    .join("");

  return `<h2>${escapeHtml(chart.title)}</h2><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${width} ${height}"><polyline fill="none" stroke="${chart.color}" stroke-width="2.5" points="${line}" />${dots}${labels}</svg>`;
}

function combinedSvg(chart) {
  const width = 680;
  const height = 240;
  const padLeft = 20;
  const padRight = 20;
  const padTop = chart.shape === "curve" ? 28 : 16;
  const padBottom = 36;
  const span = Math.max(1, chart.to - chart.from);
  const xOf = (time) => padLeft + ((time - chart.from) / span) * (width - padLeft - padRight);
  const yOf = (value) => height - padBottom - (value / 100) * (height - padTop - padBottom);
  const lines = chart.shape === "column"
    ? columnMarks(chart, yOf, height, padBottom, padLeft, width)
    : chart.shape === "curve"
      ? curveMarks(chart, xOf, yOf)
      : chart.lines.map((line) => {
      const points = line.points.filter((point) => point.norm !== null && point.norm !== undefined);
      if (points.length === 0) {
        return "";
      }
      const poly = points.map((point) => `${xOf(point.time)},${yOf(point.norm)}`).join(" ");
      const dots = chart.shape === "points"
        ? points.filter((point, index) => index === 0 || point.norm !== points[index - 1].norm)
          .map((point) => `<circle cx="${xOf(point.time)}" cy="${yOf(point.norm)}" r="4" fill="${line.color}" />`)
          .join("")
        : "";
      return `<polyline fill="none" stroke="${line.color}" stroke-width="2.2" points="${poly}" />${dots}`;
    }).join("");
  const ticks = (chart.ticks || []).map((tick) => `<text x="${xOf(tick.time)}" y="${height - 10}" font-size="11" text-anchor="middle" fill="#4B5563">${escapeHtml(tick.label)}</text>`).join("");
  const legend = chart.lines.map((line) => `<span style="color:${line.color};margin-left:12px">${escapeHtml(line.title)}</span>`).join("");

  return `<h2>${escapeHtml(chart.title)}</h2><svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${width} ${height}">${lines}${ticks}</svg><p>${legend}</p>`;
}

function smoothPath(coords) {
  if (coords.length === 0) {
    return "";
  }
  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let index = 0; index < coords.length - 1; index += 1) {
    const from = coords[index];
    const to = coords[index + 1];
    const mid = (from.x + to.x) / 2;
    path += ` C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x} ${to.y}`;
  }
  return path;
}

function curveMarks(chart, xOf, yOf) {
  return chart.lines.map((line, lineIndex) => {
    const coords = (line.points || [])
      .filter((point) => point.norm !== null && point.norm !== undefined)
      .map((point) => ({ ...point, x: xOf(point.time), y: yOf(point.norm) }));
    const marks = coords.filter((point) => point.label).map((point) => {
      const lift = 10 + (lineIndex % 3) * 11;
      return `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${line.color}" /><text x="${point.x}" y="${point.y - lift}" font-size="10" text-anchor="middle" fill="${line.color}">${escapeHtml(point.label)}</text>`;
    }).join("");
    return `<path d="${smoothPath(coords)}" fill="none" stroke="${line.color}" stroke-width="2.2" />${marks}`;
  }).join("");
}

function columnMarks(chart, yOf, height, padBottom, padLeft, width) {
  const columns = chart.columns || [];
  const seriesCount = Math.max(1, chart.lines.length);
  const slot = (width - padLeft - 20) / Math.max(1, columns.length);
  const bar = Math.max(3, Math.min(16, (slot - 8) / seriesCount));

  return columns.map((column, monthIndex) => (column.values || []).map((value, lineIndex) => {
    if (value === null || value === undefined) {
      return "";
    }
    const x = padLeft + monthIndex * slot + lineIndex * bar;
    const y = yOf(value);
    const barHeight = Math.max(0, height - padBottom - y);
    const color = chart.lines[lineIndex]?.color || "#007BFF";
    return `<rect x="${x}" y="${y}" width="${Math.max(1, bar - 1)}" height="${barHeight}" fill="${color}" />`;
  }).join("")).join("");
}

export function printMealPlan({ title, documentTitle = title, intro = "", days = [] }) {
  const blocks = days.map((day) => {
    const meals = day.meals.length ? day.meals : [{ name: "وعده", items: [] }];
    const rows = meals.map((meal) => {
      const items = meal.items.length ? meal.items : [{ food: "—", amount: "—", energy: "—" }];
      return items.map((item, index) => {
        const mealCell = index === 0
          ? `<td class="meal" rowspan="${items.length}">${escapeHtml(meal.name)}</td>`
          : "";
        return `<tr>${mealCell}<td>${escapeHtml(item.food)}</td><td>${escapeHtml(item.amount)}</td><td>${escapeHtml(item.energy)}</td></tr>`;
      }).join("");
    }).join("");

    return `<section class="day"><div class="day-head"><h2>${escapeHtml(day.title)}</h2><span>${escapeHtml(day.total)}</span></div><p class="meta">${escapeHtml(day.meta || "")}</p><table><thead><tr><th>وعده</th><th>غذا</th><th>مقدار</th><th>انرژی</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  }).join("");

  openPrintFrame(documentTitle, `<h1>${escapeHtml(title)}</h1><p class="intro">${escapeHtml(intro)}</p>${blocks}`, MEAL_PRINT_STYLE);
}

const MEAL_PRINT_STYLE = `@page{size:A4;margin:14mm}body{font-family:Tahoma,sans-serif;color:#1F2937;margin:0}h1{font-size:22px;font-weight:600;margin:0}.intro{margin:6px 0 22px;color:#6B7280;font-size:13px}.day{margin:0 0 22px;break-inside:avoid}.day-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin:0 0 4px}.day-head h2{margin:0;font-size:16px;font-weight:600}.day-head span{color:#007BFF;font-size:13px}.meta{margin:0 0 8px;color:#6B7280;font-size:12px}table{width:100%;border-collapse:collapse}th{background:#F5F7FB;color:#6B7280;font-size:12px;font-weight:600}th,td{border:1px solid #E5E7EB;padding:7px 10px;text-align:right;vertical-align:middle;font-size:13px}td.meal{width:24%;background:#FAFBFC;font-weight:600}`;

function openPrintFrame(title, body, style) {
  const frame = document.createElement("iframe");
  frame.setAttribute("title", title);
  frame.style.cssText = "position:fixed;inset:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${style}</style></head><body>${body}</body></html>`);
  doc.close();
  const win = frame.contentWindow;
  const cleanup = () => frame.remove();
  win.onafterprint = cleanup;
  setTimeout(() => {
    win.focus();
    win.print();
  }, 250);
  setTimeout(cleanup, 60000);
}

export function printDocument({ title, intro = "", charts = [], tables = [] }) {
  const chartHtml = charts.map(chartSvg).join("");
  const tableHtml = tables.map((table) => {
    const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
    return `<h2>${escapeHtml(table.title)}</h2><table>${rows}</table>`;
  }).join("");
  openPrintFrame(
    title,
    `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(intro)}</p>${chartHtml}${tableHtml}`,
    "body{font-family:Tahoma,sans-serif;color:#1F2937;padding:24px}h1,h2{font-weight:normal}table{width:100%;border-collapse:collapse;margin:0 0 24px}td{border:1px solid #E5E7EB;padding:8px;text-align:right}p{line-height:1.8}",
  );
}
