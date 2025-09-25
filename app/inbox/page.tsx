'use client'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'


function Toast({msg, onDone}:{msg:string|null; onDone:()=>void}){
useEffect(()=>{
if(!msg) return
const t = setTimeout(onDone, 2000)
return ()=>clearTimeout(t)
},[msg])
if(!msg) return null
return (
<div style={{position:'fixed',top:12,left:'50%',transform:'translateX(-50%)',background:'#16a34a',color:'#fff',padding:'8px 12px',borderRadius:999,boxShadow:'0 4px 16px rgba(0,0,0,.15)',zIndex:50}}>
{msg}
</div>
)
}


export default function Inbox(){
const [user,setUser]=useState<any>(null)
const [list,setList]=useState<any[]>([])
const [toast,setToast]=useState<string|null>(null)


useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user))},[])
useEffect(()=>{ if(!user) return; load() },[user])


async function load(){
// 取我为收件人的分享（share_targets）并带出 saved_at
const {data,error}=await supabase
.from('share_targets')
.select('id, saved_at, share:shares(id, created_at, sender:profiles(email), entry:entries(*))')
.eq('recipient_id', user.id)
.order('id',{ascending:false})
if(!error) setList(data as any)
}


// ✓ 一键保存：复制到我的 entries，并把 share_targets.saved_at 置为现在（无弹窗，用 toast）
async function saveToMine(st:any){
const e = st.share?.entry
if(!e) return
const payload = {
user_id: user.id,
datetime: e.datetime,
direction: e.direction,
person: e.person,
message: e.message,
channel: e.channel,
tag: e.tag,
bridge_flag: e.bridge_flag,
repair_flag: e.repair_flag,
repair_latency_days: e.repair_latency_days
}
const { error:insErr } = await supabase.from('entries').insert(payload)
if(insErr) return setToast(insErr.message)


const savedAt = new Date().toISOString()
const { error:updErr } = await supabase
.from('share_targets')
.update({ saved_at: savedAt })
.eq('id', st.id)
if(updErr) return setToast(updErr.message)


// 前端立即反映 ✓ 已保存
setList(prev=> prev.map(item=> item.id===st.id? {...item, saved_at: savedAt}: item))
setToast('✓ 已保存到我的记录')
}


return (
}