'use client'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function Inbox(){
  const [user,setUser]=useState<any>(null)
  const [list,setList]=useState<any[]>([])
  useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user))},[])
  useEffect(()=>{ if(!user) return; load() },[user])

  async function load(){
    // 带出 saved_at；列表基于 share_targets（我是收件人）
    const {data,error}=await supabase
      .from('share_targets')
      .select('id, saved_at, share:shares(id, created_at, sender:profiles(email), entry:entries(*))')
      .eq('recipient_id', user.id)
      .order('id',{ascending:false})
    if(!error) setList(data as any)
  }

  // ✓ 一键保存：复制 entry 到我的 entries，并把 share_targets.saved_at 置为现在
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
    if(insErr) return alert(insErr.message)

    const { error:updErr } = await supabase
      .from('share_targets')
      .update({ saved_at: new Date().toISOString() })
      .eq('id', st.id)
    if(updErr) return alert(updErr.message)

    await load()
    alert('已保存到我的记录')
  }

  return (
    <main style={{maxWidth:720,margin:'24px auto',padding:16}}>
      <h2>收件箱</h2>
      {list.length===0 && <div>暂无分享</div>}
      {list.map(st=> (
        <div key={st.id} style={{border:'1px solid #e5e7eb',borderRadius:8,padding:8,marginTop:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>来自：{st.share?.sender?.email||'未知'} · {new Date(st.share?.created_at).toLocaleString()}</div>
            <button
              onClick={()=>saveToMine(st)}
              disabled={!!st.saved_at}
              style={{padding:'4px 8px',border:'1px solid #10b981',borderRadius:8,background: st.saved_at? '#f0fdf4':'#ecfdf5', opacity: st.saved_at? .7:1}}
            >{st.saved_at? '✓ 已保存':'保存到我的记录'}</button>
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
