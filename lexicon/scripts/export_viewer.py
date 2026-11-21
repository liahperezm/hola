"""Write a browsable page and a spreadsheet of the whole lexicon.

Usage:
  python3 lexicon/scripts/build.py
  python3 lexicon/scripts/export_viewer.py
Outputs lexicon/build/hola_lexicon.html and lexicon/build/hola_lexicon.csv.
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / "lexicon" / "build"
GENERATED = ROOT / "src" / "lib" / "lexicon.generated.ts"


def in_app() -> set[tuple[str, str]]:
    """(country, word) pairs the app gets from lexicon.generated.ts."""
    pairs = set()
    for line in GENERATED.read_text().splitlines():
        if line.startswith("  {"):
            c = json.loads(line.strip().rstrip(","))
            for code, words in c["terms"].items():
                pairs |= {(code, w) for w in words}
    return pairs


def main():
    data = json.loads((BUILD / "hola_es.json").read_text())
    app = in_app()
    rows = []
    for e in data["entries"]:
        parts = [p.strip() for p in e["term"].split("/")]
        for s in e["senses"]:
            app_countries = sorted({c for c in s["countries"] for p in parts if (c, p) in app})
            rows.append({
                "term": e["term"], "kind": e["kind"], "meaning": s["meaning_en"], "register": s["register"],
                "countries": s["countries"], "literal": s.get("literal_en", ""), "example": s.get("example_es", ""),
                "notes": s.get("notes", ""), "false_friend": bool(s.get("false_friend")), "app": app_countries,
            })
    concepts = data["concepts"]
    countries = [{"code": c["code"], "name": c["name_es"]} for c in data["countries"]]

    with (BUILD / "hola_lexicon.csv").open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh)
        w.writerow(["Term", "Type", "Meaning (English)", "Register", "Countries", "Literal", "Example",
                    "Notes", "False friend", "In the app for"])
        for r in rows:
            w.writerow([r["term"], r["kind"], r["meaning"], r["register"], " ".join(r["countries"]), r["literal"],
                        r["example"], r["notes"], "yes" if r["false_friend"] else "", " ".join(r["app"])])

    payload = json.dumps({"rows": rows, "concepts": concepts, "countries": countries}, ensure_ascii=False)
    search = (Path(__file__).parent / "viewer_search.js").read_text(encoding="utf-8")
    html = TEMPLATE.replace("__SEARCH__", search).replace("__DATA__", payload.replace("</", "<\\/"))
    (BUILD / "hola_lexicon.html").write_text(html, encoding="utf-8")
    print(f"{len(rows)} rows, {len(concepts)} concepts -> {BUILD / 'hola_lexicon.html'}, {BUILD / 'hola_lexicon.csv'}")


TEMPLATE = r"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hola · Léxico completo</title>
<style>
:root{--navy:#1b1d4f;--body:#3d3f63;--muted:#6b6d8a;--line:#e6e6f0;--bg:#f6f6fb;--lav:#e9e6ff;--butter:#fff0bf;--rose:#ffe1e1;--mint:#dff5ea;--sky:#e0efff}
*{box-sizing:border-box}body{margin:0;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--body);background:var(--bg)}
header{padding:28px 28px 8px}h1{margin:0;color:var(--navy);font-size:28px}.sub{color:var(--muted);margin-top:4px}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0 4px}.stat{background:#fff;border-radius:14px;padding:10px 14px;box-shadow:0 1px 2px #0001}
.stat b{display:block;color:var(--navy);font-size:20px}
.tabs{display:flex;gap:22px;padding:0 28px;border-bottom:1px solid var(--line);margin-top:10px}
.tab{background:none;border:0;border-bottom:3px solid transparent;padding:10px 0;font:inherit;font-weight:600;color:var(--muted);cursor:pointer}
.tab.on{color:var(--navy);border-color:var(--navy)}
.controls{display:flex;flex-wrap:wrap;gap:10px;padding:16px 28px;position:sticky;top:0;background:var(--bg);z-index:2}
input,select{font:inherit;padding:8px 12px;border:1.5px solid var(--line);border-radius:12px;background:#fff;color:var(--navy)}
input[type=search]{flex:1;min-width:220px}label.chk{display:flex;align-items:center;gap:6px;color:var(--navy)}
.count{padding:0 28px 8px;color:var(--muted)}
main{padding:0 28px 40px}table{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border-radius:16px;box-shadow:0 1px 2px #0001}
th:first-child{border-top-left-radius:16px}th:last-child{border-top-right-radius:16px}
th{position:sticky;top:var(--ctl,62px);z-index:1;background:#fff;text-align:left;font-size:12.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);padding:10px 12px;border-bottom:1px solid var(--line)}
td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}td.term{font-weight:700;color:var(--navy);white-space:nowrap}
.pill{display:inline-block;padding:1px 8px;border-radius:99px;font-size:12px;font-weight:600;margin:1px 2px 1px 0}
.r-vulgar{background:var(--butter)}.r-offensive{background:var(--rose)}.r-slang{background:var(--lav)}.r-informal{background:var(--sky)}.r-neutral{background:#eee}
.k{background:#f0f0f5;color:#55576f}.ff{background:var(--rose);color:#8a1f1f}.app{background:var(--mint);color:#17603a}
.cc{display:inline-block;font-size:12px;font-weight:600;color:var(--navy);background:#f0f0f5;border-radius:6px;padding:0 5px;margin:1px}
.small{font-size:13px;color:#5b5d78}.ex{font-style:italic}
.grid td{min-width:110px}.grid td.term{white-space:normal;min-width:160px}.grid th{white-space:nowrap}
.empty{color:#c3c3d3}
.best{margin:0 28px 14px;background:#fff;border-radius:18px;padding:16px 20px;box-shadow:0 1px 2px #0001;border-left:4px solid var(--navy)}
.bterm{font-size:22px;font-weight:800;color:var(--navy)}.bmean{font-size:17px;margin:4px 0}
.warn{display:inline-block;margin-top:4px;padding:2px 8px;border-radius:8px;background:var(--butter);color:#5c4400;font-size:12.5px;font-weight:600}
.more{display:block;margin:16px auto;font:inherit;font-weight:600;color:#fff;background:var(--navy);border:0;border-radius:99px;padding:10px 22px;cursor:pointer}
:focus-visible{outline:3px solid var(--navy);outline-offset:2px}
</style></head><body>
<header><h1>Léxico de Hola</h1><div class="sub">Todo lo que contiene la base de datos curada: palabras por país, jerga, falsos amigos y modismos.</div>
<div class="stats" id="stats"></div></header>
<div class="tabs" role="tablist"><button class="tab on" role="tab" aria-selected="true" data-v="list">Todas las entradas</button><button class="tab" role="tab" aria-selected="false" data-v="grid">Por concepto (palabra en cada país)</button></div>
<div class="controls">
 <input type="search" id="q" aria-label="Buscar" placeholder="Escribe una palabra o frase como la dirías…" autocomplete="off">
 <select id="country" aria-label="País"><option value="">Todos los países</option></select>
 <select id="kind" aria-label="Tipo"><option value="">Todos los tipos</option><option value="word">Palabra</option><option value="phrase">Frase</option><option value="idiom">Modismo</option><option value="proverb">Refrán</option></select>
 <select id="reg" aria-label="Registro"><option value="">Todos los registros</option><option>neutral</option><option>informal</option><option>slang</option><option>vulgar</option><option>offensive</option></select>
 <label class="chk"><input type="checkbox" id="ff"> Solo falsos amigos</label>
 <label class="chk"><input type="checkbox" id="inapp"> Solo lo que está en la app</label>
</div>
<div id="best"></div>
<div class="count" id="count" role="status"></div>
<main id="main"></main>
<script>
__SEARCH__
const D=__DATA__;
const $=s=>document.querySelector(s);const esc=s=>(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const NAME=Object.fromEntries(D.countries.map(c=>[c.code,c.name]));
const KIND={word:"Palabra",phrase:"Frase",idiom:"Modismo",proverb:"Refrán"};
const RUDE=new Set(["vulgar","offensive"]);
const PAGE=200;
for(const c of D.countries){const o=document.createElement("option");o.value=c.code;o.textContent=c.code==="ALL"?"General (todos)":c.name;$("#country").append(o)}
// Work done once: every way a row can be written, and the text to search in.
for(const r of D.rows){
 const forms=r.term.split("/").map(x=>x.trim());
 for(const m of (r.notes||"").matchAll(/'([^']{3,})'/g)) forms.push(m[1]);
 r._forms=forms;
 r._text=norm([r.meaning,r.literal,r.example,r.notes].join(" "));
}
const terms=new Set(D.rows.map(r=>r.term));
$("#stats").innerHTML=[[terms.size,"entradas"],[D.rows.length,"significados"],[D.concepts.length,"conceptos"],[D.rows.filter(r=>r.false_friend).length,"falsos amigos"],[D.rows.filter(r=>r.kind==="idiom"||r.kind==="proverb").length,"modismos y refranes"],[D.rows.filter(r=>r.app.length).length,"en la app"]].map(([n,l])=>`<div class="stat"><b>${n}</b>${l}</div>`).join("");
let view="list",shown=PAGE,timer;
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>{x.classList.toggle("on",x===b);x.setAttribute("aria-selected",x===b)});view=b.dataset.v;shown=PAGE;render()});
$("#q").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>{shown=PAGE;render()},120)});
["#country","#kind","#reg","#ff","#inapp"].forEach(s=>$(s).addEventListener("input",()=>{shown=PAGE;render()}));
const cc=cs=>cs.map(c=>`<span class="cc" title="${esc(NAME[c])}">${c}</span>`).join("");
const rude=r=>RUDE.has(r.register)?`<div class="warn">${r.register==="vulgar"?"Vulgar":"Ofensiva"}</div>`:"";
/** How well a row answers the query, 0 to 1. */
function rowScore(r,q){
 let best=0;for(const f of r._forms)best=Math.max(best,match(q,f));
 if(best<0.5&&q.length>=3&&r._text.includes(norm(q)))best=0.5;
 return best;
}
function render(){
 const raw=$("#q").value.trim(),q=norm(raw),c=$("#country").value,k=$("#kind").value,g=$("#reg").value,ff=$("#ff").checked,ia=$("#inapp").checked;
 const words=q?q.split(" ").length:0,min=words>=3?0.6:0.5;
 $("#best").innerHTML="";
 if(view==="list"){
  let rows=D.rows.filter(r=>(!c||r.countries.includes(c))&&(!k||r.kind===k)&&(!g||r.register===g)&&(!ff||r.false_friend)&&(!ia||r.app.length));
  if(q){rows=rows.map(r=>[r,rowScore(r,raw)]).filter(([,s])=>s>=min).sort((a,b)=>b[1]-a[1]).map(([r,s])=>(r._s=s,r))}
  const top=rows[0];
  if(q&&top&&top._s>=0.75&&words>=2){
   const same=norm(top.term)===q;
   $("#best").innerHTML=`<section class="best" aria-label="Mejor resultado">${same?"":`<div class="small">¿Buscabas…?</div>`}
    <div class="bterm">${esc(top.term)}</div><div class="bmean">${esc(top.meaning)}</div>
    ${top.literal?`<div class="small">Literal: ${esc(top.literal)}</div>`:""}${rude(top)}
    <div class="small">${KIND[top.kind]} · ${cc(top.countries)}${top.notes?` · ${esc(top.notes)}`:""}</div></section>`;
  }
  $("#count").textContent=`${rows.length} de ${D.rows.length} significados`;
  const page=rows.slice(0,shown);
  $("#main").innerHTML=`<table><thead><tr><th>Término</th><th>Significado (inglés)</th><th>Registro</th><th>Países</th><th>Notas y ejemplo</th></tr></thead><tbody>${page.map(r=>`<tr>
   <td class="term">${esc(r.term)}<br><span class="pill k">${KIND[r.kind]}</span>${r.false_friend?'<span class="pill ff">falso amigo</span>':""}${r.app.length?`<span class="pill app" title="En la app para ${r.app.join(", ")}">en la app</span>`:""}</td>
   <td>${esc(r.meaning)}${r.literal?`<div class="small">Literal: ${esc(r.literal)}</div>`:""}${rude(r)}</td>
   <td><span class="pill r-${r.register}">${r.register}</span></td><td>${cc(r.countries)}</td>
   <td>${r.example?`<div class="ex">${esc(r.example)}</div>`:""}${r.notes?`<div class="small">${esc(r.notes)}</div>`:""}</td></tr>`).join("")}</tbody></table>
   ${rows.length>shown?`<button class="more" id="more">Mostrar ${Math.min(PAGE,rows.length-shown)} más</button>`:""}`;
  const more=$("#more");if(more)more.onclick=()=>{shown+=PAGE;render()};
 }else{
  const codes=c?[c]:D.countries.map(x=>x.code).filter(x=>x!=="ALL");
  let cons=D.concepts.filter(x=>!g||x.terms.some(t=>t.register===g));
  if(q){cons=cons.map(x=>[x,Math.max(match(raw,x.meaning_en),...x.terms.map(t=>match(raw,t.term)))]).filter(([,s])=>s>=min).sort((a,b)=>b[1]-a[1]).map(([x])=>x)}
  $("#count").textContent=`${cons.length} de ${D.concepts.length} conceptos`;
  $("#main").innerHTML=`<div style="overflow:auto"><table class="grid"><thead><tr><th>Concepto</th><th>General</th>${codes.map(x=>`<th title="${esc(NAME[x])}">${x}</th>`).join("")}</tr></thead><tbody>${cons.map(x=>{
   const cell=code=>{const ts=x.terms.filter(t=>t.countries.includes(code)&&(!g||t.register===g));return ts.length?ts.map(t=>`${esc(t.term)}${t.register!=="neutral"?` <span class="pill r-${t.register}">${t.register}</span>`:""}`).join("<br>"):'<span class="empty">—</span>'};
   return `<tr><td class="term">${esc(x.meaning_en)}<div class="small">${esc(x.category)}</div></td><td>${cell("ALL")}</td>${codes.map(code=>`<td>${cell(code)}</td>`).join("")}</tr>`}).join("")}</tbody></table></div>`;
 }
}
const ctl=()=>document.documentElement.style.setProperty('--ctl',$('.controls').offsetHeight+'px');
addEventListener('resize',ctl);ctl();
render();
</script></body></html>
"""

if __name__ == "__main__":
    main()
