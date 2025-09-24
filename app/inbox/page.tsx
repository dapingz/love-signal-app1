'use client'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function Inbox(){
  const [user,setUser]=useState<any>(null)
  const [list,setList]=useState<any[]>([])
  useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user))},[])
  useEffect(()=>{ if(!user) return; load() },[user])

  async function load(){
    const {data,error}=await supabase
      .from('share_targets')
      .select('id, saved_at, share:shares(id, created_at, sender:profiles(email), entry:entries(*))')
      .eq('recipient_id', user.id)
      .order('id',{ascending:false})
    if(!error) setList(data as any)
  }

  async function saveToMine(st:any){
    const e = st.share?.entry
    if(!e) return
    const payload = { user_id:user.id, datetime:e.datetime, direction:e.direction, person:e.person, message:e.message, channel:e.channel, tag:e.tag, bridge_flag:e.bridge_flag, repair_flag:e.repair_flag, repair_latency_days:e.repair_latency_days }
    const {error}=await supabase.from('entries').insert(payload)
    if(error) return alert(error.message)
    await supabase.from('share_targets').update({ saved_at: new Date().toISOString() }).eq('id', st.id)
    await load()
  }

  return (
    <main style={{maxWidth:720,margin:'24px auto',padding:16}}>
      <h2>收件箱</h2>
      {list.length===0 && <div>暂无分享</div>}
      {list.map(st=> (
        <div key={st.id} style={{border:'1px solid #e5e7eb',borderRadius:8,padding:8,marginTop:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>来自：{st.share?.sender?.email||'未知'} · {new Date(st.share?.created_at).toLocaleString()}</div>
            {st.saved_at ? (
              <span style={{fontSize:12,color:'#059669'}}>✓ 已保存</span>
            ) : (
              <button onClick={()=>saveToMine(st)} style={{padding:'4px 8px',border:'1px solid #10b981',borderRadius:8,background:'#ecfdf5'}}>保存到我的记录</button>
            )}
          </div>
          <div style={{marginTop:6}}>
            <div><b>{st.share?.entry?.person}</b> · {new Date(st.share?.entry?.datetime).toLocaleString()} · {st.share?.entry?.direction==='Sent'?'发送':'接收'}</div>
            <div style={{color:'#444'}}>{st.share?.entry?.message||'（无正文）'}</div>
          </div>
        </div>
      ))}
    </main>
  )
}
