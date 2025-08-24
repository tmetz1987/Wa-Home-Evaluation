// bootstrap.mjs
// Writes the WA-only valuation app to disk during install (so you don't need to upload a ZIP).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

function S() {
  return Array.from(arguments).join("\n");
}

const files = {
  // ---- Next/Tailwind config ----
  "next.config.mjs": S(
    '/** @type {import("next").NextConfig} */',
    "const nextConfig = {",
    '  experimental: { serverActions: { allowedOrigins: ["*"] } }',
    "};",
    "export default nextConfig;"
  ),

  "postcss.config.js": 'module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };',

  "tailwind.config.js": S(
    "module.exports = {",
    '  content: ["./app/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],',
    "  theme: { extend: {} },",
    "  plugins: []",
    "};"
  ),

  // ---- Global styles ----
  "app/globals.css": S(
    "@tailwind base;",
    "@tailwind components;",
    "@tailwind utilities;",
    ":root{color-scheme:light dark}",
    "body{background:#f9fafb;color:#0b0b0c}",
    "@media(prefers-color-scheme:dark){body{background:#0b0b0c;color:#f5f5f6}}",
    ".card{border-radius:16px;border:1px solid rgba(0,0,0,.08);background:rgba(255,255,255,.9);box-shadow:0 1px 8px rgba(0,0,0,.04)}",
    ".input{width:100%;border:1px solid rgba(0,0,0,.15);border-radius:12px;padding:10px 12px;background:rgba(255,255,255,.8)}",
    ".label{font-size:14px;color:#6b7280}",
    ".badge{display:inline-flex;align-items:center;border:1px solid rgba(0,0,0,.15);padding:2px 10px;border-radius:999px;font-size:12px}"
  ),

  // ---- App shell ----
  "app/layout.js": S(
    'import "./globals.css";',
    'export const metadata={title:"WA Home Valuation",description:"Estimate your home value (WA-only beta)"};',
    "export default function RootLayout({children}){",
    '  return <html lang="en"><body>{children}</body></html>;',
    "}"
  ),

  // ---- UI page ----
  "app/page.js": S(
    '"use client";',
    'import { useState } from "react";',
    "function currency(n){ return n.toLocaleString(undefined,{style:\"currency\",currency:\"USD\",maximumFractionDigits:0}); }",
    "export default function Page(){",
    "  const [form,setForm]=useState({ address:\"\", beds:3, baths:2, sqft:1800, lotSqft:6000, yearBuilt:1995, condition:3, view:\"none\", garageSpots:2, marketTrend:\"flat\", renovations:{} });",
    "  const [loading,setLoading]=useState(false); const [res,setRes]=useState(null); const [err,setErr]=useState(null);",
    "  async function onEstimate(){ setLoading(true); setErr(null);",
    '    try{ const r=await fetch("/api/estimate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); const data=await r.json(); if(!r.ok) throw new Error(data?.error||"Failed"); setRes(data);} ',
    "    catch(e){ setErr(e.message);} finally{ setLoading(false);} }",
    '  const Field=({label,children})=>(<div className="space-y-1"><div className="label">{label}</div>{children}</div>);',
    '  return (<main className="mx-auto max-w-6xl p-4 md:p-8 grid md:grid-cols-5 gap-6">',
    '    <div className="md:col-span-3 space-y-4">',
    '      <div className="card p-5 space-y-4">',
    '        <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Property details</h1><span className="badge">WA-only Beta</span></div>',
    '        <Field label="Address (Washington)"><input className="input" placeholder="123 Main St, Seattle, WA 98101" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></Field>',
    '        <div className="grid grid-cols-2 gap-3">',
    '          <Field label="Living area (sqft)"><input type="number" className="input" value={form.sqft||""} onChange={e=>setForm({...form,sqft:+e.target.value||undefined})}/></Field>',
    '          <Field label="Lot size (sqft)"><input type="number" className="input" value={form.lotSqft||""} onChange={e=>setForm({...form,lotSqft:+e.target.value||undefined})}/></Field>',
    '          <Field label="Bedrooms"><input type="number" className="input" value={form.beds||""} onChange={e=>setForm({...form,beds:+e.target.value||undefined})}/></Field>',
    '          <Field label="Bathrooms"><input type="number" className="input" value={form.baths||""} onChange={e=>setForm({...form,baths:+e.target.value||undefined})}/></Field>',
    '          <Field label="Year built"><input type="number" className="input" value={form.yearBuilt||""} onChange={e=>setForm({...form,yearBuilt:+e.target.value||undefined})}/></Field>',
    '          <Field label="Garage spots"><input type="number" className="input" value={form.garageSpots||0} onChange={e=>setForm({...form,garageSpots:+e.target.value||0})}/></Field>',
    "        </div>",
    '        <div className="grid grid-cols-3 gap-3">',
    '          <Field label="Condition (1–5)"><input type="number" className="input" min={1} max={5} value={form.condition||3} onChange={e=>setForm({...form,condition:Math.max(1,Math.min(5,+e.target.value||3))})}/></Field>',
    '          <Field label="View"><select className="input" value={form.view||"none"} onChange={e=>setForm({...form,view:e.target.value})}><option value="none">None</option><option value="city">City</option><option value="mountain">Mountain</option><option value="water">Water</option></select></Field>',
    '          <Field label="Trend"><select className="input" value={form.marketTrend||"flat"} onChange={e=>setForm({...form,marketTrend:e.target.value})}><option value="declining">Declining</option><option value="flat">Flat</option><option value="rising">Rising</option></select></Field>',
    "        </div>",
    '        <div className="grid grid-cols-5 gap-2">{["kitchen","bath","roof","hvac","windows"].map(k=>(<label key={k} className="text-sm flex items-center gap-2 border rounded-xl px-3 py-2"><input type="checkbox" checked={Boolean((form.renovations||{})[k])} onChange={e=>setForm({...form,renovations:{...(form.renovations||{}),[k]:e.target.checked}})} /><span style={{textTransform:"capitalize"}}>{k}</span></label>))}</div>',
    '        <button onClick={onEstimate} disabled={loading} className="input" style={{textAlign:"center",fontWeight:600}}>{loading?"Estimating…":"Estimate value"}</button>',
    "        {err && <div style={{color:'#dc2626',fontSize:12}}>{err}</div>}",
    "      </div>",
    "    </div>",
    '    <div className="md:col-span-2 space-y-4">',
    '      <div className="card p-5">',
    '        <h2 className="text-base font-semibold mb-3">Estimated value</h2>',
    '        {!res && <p className="text-sm">Enter your address and details, then tap Estimate.</p>}',
    "        {res && (<div className='space-y-3'>",
    "          <div className='text-3xl font-bold'>{currency(res.estimate)}</div>",
    "          <div className
