const $ = s => document.querySelector(s);
const rows = $("#rows");
let last = [];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const short = (c, n = 16) => { const p = c.trim().split("/").pop(); return p.length > n ? p.slice(0, n - 1) + "…" : p; };

function addRow(v = "") {
  const d = document.createElement("div"); d.className = "row";
  d.innerHTML = `<input placeholder="e.g. python3 script.py" aria-label="Command" value="${esc(v)}">
                 <button class="ghost" aria-label="Remove program">Remove</button>`;
  d.querySelector("button").onclick = () => rows.children.length > 1 && d.remove();
  rows.appendChild(d);
}
$("#add").onclick = () => rows.children.length < 8 && addRow();

fetch("/api/samples").then(r => r.json()).then(list => {
  addRow(list[0].cmd); addRow(list[1].cmd);
  $("#samples").append("Examples:");
  list.forEach(s => {
    const b = document.createElement("button"); b.className = "ghost"; b.textContent = s.label;
    b.onclick = () => {
      const empty = [...rows.querySelectorAll("input")].find(i => !i.value.trim());
      if (empty) empty.value = s.cmd; else addRow(s.cmd);
    };
    $("#samples").append(b);
  });
});

$("#go").onclick = async () => {
  const commands = [...rows.querySelectorAll("input")].map(i => i.value).filter(v => v.trim());
  if (!commands.length) return;
  const btn = $("#go"); btn.disabled = true; btn.textContent = "Running…";
  $("#out").hidden = false; $("#status").textContent = "Running benchmarks. This can take a while…";
  try {
    const res = await fetch("/api/benchmark", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands, runs: +$("#runs").value }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    last = data; render(data);
  } catch (e) { $("#status").innerHTML = `<span class="err">${esc(e.message)}</span>`; }
  btn.disabled = false; btn.textContent = "Run benchmark";
};

const CHARTS = [
  ["wall_s", "Wall time", "s", "--wall", 3], ["cpu_s", "CPU time", "s (user + system)", "--cpu", 3],
  ["max_rss_mb", "Peak memory", "MB", "--mem", 1], ["io_mb", "Disk I/O", "MB", "--io", 2],
];

function render(data) {
  const ok = data.filter(r => !r.error), bad = data.filter(r => r.error);
  $("#status").innerHTML = bad.length
    ? bad.map(r => `<div class="err">${esc(r.command)}: ${esc(r.error)}</div>`).join("") : "Done. Lower is better.";
  $("#charts").innerHTML = ok.length ? CHARTS.map(([k, t, u, c, dp]) => {
    const max = Math.max(...ok.map(r => r[k].mean), 1e-9), min = Math.min(...ok.map(r => r[k].mean));
    return `<div class="chart"><h3>${t} <small>${u}</small></h3>` + ok.map((r, i) =>
      `<div class="b ${ok.length > 1 && r[k].mean === min ? "win" : ""}"><span class="n" title="${esc(r.command)}">#${i + 1} ${esc(short(r.command))}</span>
       <div class="track"><div class="fill" style="width:${Math.max(r[k].mean / max * 100, 1)}%;background:var(${c})"></div></div>
       <span class="v">${r[k].mean.toFixed(dp)}</span></div>`).join("") + "</div>";
  }).join("") : "";
  const cols = [["wall_s", "Wall s"], ["user_s", "User s"], ["sys_s", "Sys s"], ["max_rss_mb", "Peak MB"], ["io_mb", "I/O MB"],
                ["ctx_voluntary", "Vol. ctx"], ["ctx_involuntary", "Invol. ctx"], ["major_faults", "Major faults"]];
  $("#tbl").innerHTML = "<tr><th>Command</th>" + cols.map(c => `<th>${c[1]}</th>`).join("") + "<th>± wall</th></tr>" +
    ok.map((r, i) => `<tr><td title="${esc(r.command)}">#${i + 1} ${esc(short(r.command, 40))}</td>` +
      cols.map(c => `<td>${r[c[0]].mean.toFixed(/ctx|faults/.test(c[0]) ? 0 : 3)}</td>`).join("") +
      `<td>${r.wall_s.stdev.toFixed(3)}</td></tr>`).join("");
}

$("#csv").onclick = () => {
  const ok = last.filter(r => !r.error);
  const head = ["command", "runs", "wall_s", "cpu_s", "user_s", "sys_s", "max_rss_mb", "io_mb", "ctx_voluntary", "ctx_involuntary", "major_faults"];
  const lines = [head.join(",")].concat(ok.map(r => head.map((h, i) => i < 2 ? JSON.stringify(r[h]) : r[h].mean).join(",")));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" })); a.download = "benchmark.csv"; a.click();
};
