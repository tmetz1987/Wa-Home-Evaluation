"use client";
import { useState } from "react";

function currency(n){
  return n.toLocaleString(undefined,{style:"currency",currency:"USD",maximumFractionDigits:0});
}

export default function Page(){
  const [form,setForm]=useState({
    address:"", beds:3, baths:2, sqft:1800, lotSqft:6000,
    yearBuilt:1995, condition:3, view:"none", garageSpots:2,
    marketTrend:"flat", renovations:{}
  });
  const [loading,setLoading]=useState(false);
  const [res,setRes]=useState(null);
  const [err,setErr]=useState(null);

  async function onEstimate(){
    setLoading(true); setErr(null);
    try{
      const r=await fetch("/api/estimate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(form)
      });
      const data=await r.json();
      if(!r.ok) throw new Error(data?.error||"Failed");
      setRes(data);
    }catch(e){ setErr(e.message); }
    finally{ setLoading(false); }
  }

  const Field=({label,children})=>(
    <div className="space-y-1">
      <div className="label">{label}</div>
      {children}
    </div>
  );
