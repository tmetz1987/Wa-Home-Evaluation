// bootstrap.mjs — writes the app files during install
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
const write = (p, c) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, c, "utf8"); };

// Alias support, just in case anything uses "@/..."
write("jsconfig.json", JSON.stringify({
  compilerOptions: { baseUrl: ".", paths: { "@/*": ["*"] } }
}, null, 2));

write("next.config.mjs", `/** @type {import('next').NextConfig} */
const nextConfig = { experimental: { serverActions: { allowedOrigins: ["*"] } } };
export default nextConfig;`);

write("postcss.config.js", `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };`);

write("tailwind.config.js", `module.exports = { content: ["./app/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"], theme: { extend: {} }, plugins: [] };`);

write("app/globals.css", `@tailwind base;
@tailwind components;
@tailwind utilities;
:root{color-scheme:light dark}
body{background:#f9fafb;color:#0b0b0c}
@media(prefers-color-scheme:dark){body{background:#0b0b0c;color:#f5f5f6}}
.card{border-radius:16px;border:1px solid rgba(0,0,0,.08);background:rgba(255,255,255,.9);box-shadow:0 1px 8px rgba(0,0,0,.04)}
.input{width:100%;border:1px solid rgba(0,0,0,.15);border-radius:12px;padding:10px 12px;background:rgba(255,255,255,.8)}
.label{font-size:14px;color:#6b7280}
.badge{display:inline-flex;align-items:center;border:1px solid rgba(0,0,0,.15);padding:2px 10px;border-radius:999px;font-size:12px}`);

write("app/layout.js", `import "./globals.css";
export const metadata={title:"WA Home Valuation",description:"Estimate your home value (WA-only beta)"};
export default function RootLayout({children}){return <html lang="en"><body>{children}</body></html>}`);

write("app/page.js", `"use client";
import { useState } from "react";
function currency(n){ return n.toLocaleString(undefined,{style:"currency",currency:"USD",maximumFractionDigits:0}); }
export default function Page(){
  const [form,setForm]=useState({ address:"", beds:3, baths:2, sqft:1800, lotSqft:6000, yearBuilt:1995, condition:3, view:"none", garageSpots:2, marketTrend:"flat", renovations:{} });
  const [loading,setLoading]=useState(false); const [res,setRes]=useState(null); const [err,setErr]=useState(null);
  async function onEstimate(){ setLoading(true); setErr(null);
    try{ const r=await fetch("/api/estimate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); const data=await r.json(); if(!r.ok) throw new Error(data?.error||"Failed"); setRes(data);}
    catch(e){ setErr(e.message);} finally{ setLoading(false);} }
  const Field=({label,children})=>(<div className="space-y-1"><div className="label">{label}</div>{children}</div>);
  return (<main className="mx-auto max-w-6xl p-4 md:p-8 grid md:grid-cols-5 gap-6">
    <div className="md:col-span-3 space-y-4">
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Property details</h1><span className="badge">WA-only Beta</span></div>
        <Field label="Address (Washington)"><input className="input" placeholder="123 Main St, Seattle, WA 98101" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Living area (sqft)"><input type="number" className="input" value={form.sqft||""} onChange={e=>setForm({...form,sqft:+e.target.value||undefined})}/></Field>
          <Field label="Lot size (sqft)"><input type="number" className="input" value={form.lotSqft||""} onChange={e=>setForm({...form,lotSqft:+e.target.value||undefined})}/></Field>
          <Field label="Bedrooms"><input type="number" className="input" value={form.beds||""} onChange={e=>setForm({...form,beds:+e.target.value||undefined})}/></Field>
          <Field label="Bathrooms"><input type="number" className="input" value={form.baths||""} onChange={e=>setForm({...form,baths:+e.target.value||undefined})}/></Field>
          <Field label="Year built"><input type="number" className="input" value={form.yearBuilt||""} onChange={e=>setForm({...form,yearBuilt:+e.target.value||undefined})}/></Field>
          <Field label="Garage spots"><input type="number" className="input" value={form.garageSpots||0} onChange={e=>setForm({...form,garageSpots:+e.target.value||0})}/></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Condition (1–5)"><input type="number" className="input" min={1} max={5} value={form.condition||3} onChange={e=>setForm({...form,condition:Math.max(1,Math.min(5,+e.target.value||3))})}/></Field>
          <Field label="View"><select className="input" value={form.view||"none"} onChange={e=>setForm({...form,view:e.target.value})}><option value="none">None</option><option value="city">City</option><option value="mountain">Mountain</option><option value="water">Water</option></select></Field>
          <Field label="Trend"><select className="input" value={form.marketTrend||"flat"} onChange={e=>setForm({...form,marketTrend:e.target.value})}><option value="declining">Declining</option><option value="flat">Flat</option><option value="rising">Rising</option></select></Field>
        </div>
        <div className="grid grid-cols-5 gap-2">{["kitchen","bath","roof","hvac","windows"].map(k=>(<label key={k} className="text-sm flex items-center gap-2 border rounded-xl px-3 py-2"><input type="checkbox" checked={Boolean((form.renovations||{})[k])} onChange={e=>setForm({...form,renovations:{...(form.renovations||{}),[k]:e.target.checked}})} /><span style={{textTransform:"capitalize"}}>{k}</span></label>))}</div>
        <button onClick={onEstimate} disabled={loading} className="input" style={{textAlign:"center",fontWeight:600}}>{loading?"Estimating…":"Estimate value"}</button>
        {err && <div style={{color:"#dc2626",fontSize:12}}>{err}</div>}
      </div>
    </div>
    <div className="md:col-span-2 space-y-4">
      <div className="card p-5">
        <h2 className="text-base font-semibold mb-3">Estimated value</h2>
        {!res && <p className="text-sm">Enter your address and details, then tap Estimate.</p>}
        {res && (<div className="space-y-3">
          <div className="text-3xl font-bold">{currency(res.estimate)}</div>
          <div className="text-sm">Range: {currency(res.low)} – {currency(res.high)}</div>
          <div className="border rounded-xl p-3"><div className="text-xs">Used $/sqft</div><div className="text-lg font-semibold">{currency(res.ppsfUsed)}/sqft</div></div>
          <div className="border rounded-xl p-3 max-h-64 overflow-auto"><div className="text-sm font-medium mb-2">Breakdown</div><ul className="list-disc pl-5 space-y-1 text-sm">{res.breakdown?.map((b,i)=>(<li key={i}>{b}</li>))}</ul></div>
        </div>)}
      </div>
    </div>
  </main>); }`
);

// API route — uses RELATIVE imports with .js
write("app/api/estimate/route.js", `import { NextResponse } from "next/server";
import { z } from "zod";
import { estimateValue } from "../../lib/valuation.js";
import { geocodeAddress, fetchSubjectFromEstated, fetchSchoolRating, fetchCompsATTOM } from "../../lib/providers.js";

const InputSchema = z.object({
  address: z.string().min(8),
  sqft: z.number().int().positive().optional(),
  beds: z.number().int().min(0).max(10).optional(),
  baths: z.number().int().min(0).max(10).optional(),
  lotSqft: z.number().int().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  condition: z.number().int().min(1).max(5).optional(),
  renovations: z.object({ kitchen: z.boolean().optional(), bath: z.boolean().optional(), roof: z.boolean().optional(), hvac: z.boolean().optional(), windows: z.boolean().optional() }).optional(),
  view: z.enum(["none","city","mountain","water"]).optional(),
  garageSpots: z.number().int().min(0).max(6).optional(),
  schoolRating: z.number().int().min(1).max(10).optional(),
  marketTrend: z.enum(["declining","flat","rising"]).optional(),
  comps: z.array(z.object({ price: z.number().positive(), sqft: z.number().positive() })).optional()
});

export async function POST(req){
  try{
    const parsed = InputSchema.parse(await req.json());
    const geo = await geocodeAddress(parsed.address);

    let { sqft, lotSqft, yearBuilt } = parsed;
    const subject = await fetchSubjectFromEstated(geo.formatted).catch(()=>null);
    sqft = sqft || subject?.sqft; lotSqft = lotSqft || subject?.lotSqft; yearBuilt = yearBuilt || subject?.yearBuilt;

    let schoolRating = parsed.schoolRating;
    if (!schoolRating){ schoolRating = await fetchSchoolRating(geo.lat, geo.lng); }

    let comps = parsed.comps || [];
    if (comps.length === 0){ comps = await fetchCompsATTOM(geo.lat, geo.lng, sqft); }

    const result = estimateValue({
      ...parsed,
      address: geo.formatted,
      sqft: sqft || 0,
      lotSqft,
      yearBuilt,
      schoolRating,
      comps,
      zipcode: geo.zipcode
    });
    result.subject = { normalizedAddress: geo.formatted, zipcode: geo.zipcode, county: geo.county, lat: geo.lat, lng: geo.lng, filledSqft: sqft };

    return NextResponse.json(result, { status: 200 });
  }catch(err){
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 400 });
  }
}`);

// Lib files
write("lib/waPpsfBaseline.js", `export const WA_ZIP_PPSF = {
  "98101": 720, "98102": 680, "98103": 620, "98104": 580, "98105": 650, "98106": 500, "98107": 610, "98108": 480, "98109": 700,
  "98112": 760, "98115": 640, "98116": 660, "98117": 620, "98118": 520, "98119": 740, "98122": 630, "98125": 540, "98126": 560,
  "98012": 430, "98052": 600, "98033": 640, "98004": 950, "98005": 820, "98034": 560, "98027": 650, "98006": 780, "98059": 520,
  "98208": 380, "98201": 360, "98290": 360, "98335": 360, "98402": 340, "99201": 300, "99223": 280, "98801": 280, "99352": 270
};`);

write("lib/valuation.js", `import { WA_ZIP_PPSF } from "./waPpsfBaseline.js";
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const median=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2};
const currency=n=>n.toLocaleString(undefined,{style:"currency",currency:"USD",maximumFractionDigits:0});
const pct=n=>(n*100).toFixed(1)+"%";
export function estimateValue(input){
  const br=[],zip=input.zipcode||extractZip(input.address)||"",base=WA_ZIP_PPSF[zip]??250;
  let ppsf=base;br.push("Base price per sqft from zip "+(zip||"(unknown)")+": "+currency(base)+"/sqft");
  const compPps=(input.comps||[]).filter(c=>c.price&&c.sqft).map(c=>c.price/c.sqft);
  if(compPps.length){const med=median(compPps);ppsf=(base*0.5)+(med*0.5);br.push("Adjusted with comps median ("+currency(med)+"/sqft) → blended PPSF: "+currency(ppsf)+"/sqft")}
  const sqft=input.sqft||0;let value=ppsf*sqft;br.push("Base value: "+currency(value)+" ("+currency(ppsf)+"/sqft × "+sqft.toLocaleString()+" sqft)");
  const bedAdj=clamp((Math.max(0,(input.beds||0)-2))*0.01,0,0.03),bathAdj=clamp((Math.max(0,(input.baths||0)-1))*0.015,0,0.045);
  const bbAdj=1+bedAdj+bathAdj;value*=bbAdj;if(bedAdj||bathAdj)br.push("Bedrooms/Bathrooms adjustment: "+pct(bbAdj-1)+" ("+currency(value)+")");
  const condMap={1:0.85,2:0.93,3:1,4:1.06,5:1.12},c=input.condition||3;value*=condMap[c];br.push("Condition ("+c+"/5): ×"+condMap[c].toFixed(2)+" ("+currency(value)+")");
  if(input.yearBuilt){const age=Math.max(0,Math.min(120,new Date().getFullYear()-input.yearBuilt));let f=1-Math.min(age,80)*0.001;if(input.renovations?.kitchen||input.renovations?.bath)f+=0.03;value*=f;br.push("Age/modernization: ×"+f.toFixed(3)+" ("+currency(value)+")")}
  const reno=(input.renovations?.kitchen?0.05:0)+(input.renovations?.bath?0.04:0)+(input.renovations?.roof?0.02:0)+(input.renovations?.hvac?0.015:0)+(input.renovations?.windows?0.01:0);
  if(reno){value*=(1+reno);br.push("Renovations premium: +"+pct(reno)+" ("+currency(value)+")")}
  const vMap={none:0,city:0.03,mountain:0.04,water:0.08},v=vMap[input.view||"none"]||0;if(v){value*=(1+v);br.push("View ("+(input.view)+"): +"+pct(v)+" ("+currency(value)+")")}
  if(input.lotSqft&&sqft){const r=input.lotSqft/sqft,p=clamp(r/5-0.1,-0.05,0.10);if(p){value*=(1+p);br.push("Lot/land premium: "+(p>=0?"+":"")+pct(p)+" ("+currency(value)+")")}}
  if(input.garageSpots){const g=clamp(input.garageSpots*0.01,0,0.03);if(g){value*=(1+g);br.push("Parking (garage "+input.garageSpots+"): +"+pct(g)+" ("+currency(value)+")")}}
  if(input.schoolRating){const s=clamp((input.schoolRating-5)*0.01,-0.04,0.05);if(s){value*=(1+s);br.push("School quality: "+(s>0?"+":"")+pct(s)+" ("+currency(value)+")")}}
  const tMap={declining:-0.02,flat:0,rising:0.02},t=tMap[input.marketTrend||"flat"];if(t){value*=(1+t);br.push("Local trend: "+(t>0?"+":"")+pct(t)+" ("+currency(value)+")")}
  const fields=[input.address,sqft,input.beds,input.baths,input.condition,input.yearBuilt,input.lotSqft].filter(Boolean).length;
  const band=Math.max(0.03,Math.min(0.10,0.08 - (fields/7)*0.03 - (compPps.length?0.02:0)));
  const low=value*(1-band),high=value*(1+band);br.push("Uncertainty band: ±"+pct(band)+" based on inputs");
  return { estimate:value, low, high, ppsfUsed:ppsf, breakdown:br, subject:{ normalizedAddress: undefined, zipcode: zip } };
}
export function extractZip(address){const m=address?.match(/\\b(\\d{5})(?:-\\d{4})?\\b/);return m?m[1]:null}`);

write("lib/providers.js", `export async function geocodeAddress(address){
  if (!process.env.GOOGLE_MAPS_API_KEY) throw new Error("Missing GOOGLE_MAPS_API_KEY");
  const url=new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address",address); url.searchParams.set("key",process.env.GOOGLE_MAPS_API_KEY);
  const res=await fetch(url,{cache:"no-store"}); if(!res.ok) throw new Error("Geocoding request failed");
  const data=await res.json(); const r=data.results?.[0]; if(!r) throw new Error("Address not found");
  const loc=r.geometry.location; const comps=r.address_components||[];
  const zipcode=comps.find(c=>c.types?.includes("postal_code"))?.long_name;
  const county=comps.find(c=>c.types?.includes("administrative_area_level_2"))?.long_name;
  return { lat:loc.lat, lng:loc.lng, formatted:r.formatted_address, zipcode, county };
}
export async function fetchSubjectFromEstated(address){
  const key=process.env.ESTATED_API_KEY; if(!key) return null;
  const url=new URL("https://api.estated.com/property/v5"); url.searchParams.set("token",key); url.searchParams.set("address",address);
  const res=await fetch(url,{cache:"no-store"}); if(!res.ok) return null; const data=await res.json(); const p=data?.data; if(!p) return null;
  return { sqft:p?.structure?.total_area||p?.building_size?.living_area, lotSqft:p?.lot?.lot_size||p?.lot_size?.lot_size_sq_ft, yearBuilt:p?.structure?.year_built||p?.year_built };
}
export async function fetchSchoolRating(lat,lng){
  const id=process.env.SCHOOLDIGGER_APP_ID,key=process.env.SCHOOLDIGGER_APP_KEY; if(!id||!key) return undefined;
  const url=new URL("https://api.schooldigger.com/v2.0/schools");
  url.searchParams.set("st","WA"); url.searchParams.set("nearLatitude",String(lat)); url.searchParams.set("nearLongitude",String(lng));
  url.searchParams.set("radiusMiles","3"); url.searchParams.set("appID",id); url.searchParams.set("appKey",key);
  const res=await fetch(url,{cache:"no-store"}); if(!res.ok) return undefined;
  const data=await res.json(); const first=data?.schoolList?.[0]; const rating=first?.rankHistory?.[0]?.rankScore; if(!rating) return undefined;
  let n=rating; if(rating<=5) n=(rating/5)*10; else if(rating<=100) n=(rating/100)*10; return Math.round(n);
}
export async function fetchCompsATTOM(lat,lng,sqft){
  const key=process.env.ATTOM_API_KEY; if(!key) return [];
  const url=new URL("https://api.gateway.attomdata.com/propertyapi/v1.0.0/sales/snapshot");
  url.searchParams.set("latitude",String(lat)); url.searchParams.set("longitude",String(lng)); url.searchParams.set("radius","1");
  if(sqft){ url.searchParams.set("minbuildingareasqft",String(Math.floor(sqft*0.85))); url.searchParams.set("maxbuildingareasqft",String(Math.ceil(sqft*1.15))); }
  const res=await fetch(url,{headers:{apikey:key},cache:"no-store"}); if(!res.ok) return []; const data=await res.json();
  const sales=data?.sale||data?.sales||[]; return sales.slice(0,12).map(s=>({price:+s.saleamt||0,sqft:+s.buildingareasqft||0,closingDate:s.salerecdate,distanceMiles:+s.distance||undefined})).filter(c=>c.price&&c.sqft);
}`);
console.log("bootstrap done");
