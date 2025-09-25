'use client'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

interface Row {
  id: string
  created_at: string
  entry: { id:string; person:string; datetime:string; message?:string } | null
  st: { id:string; saved_at:string|null; recipient:{ email:string|null } | null }[]
}

export default function Shares(){
  const [user,setUser]=useState<any>(null)
  const [rows,setRows]=useState<Row[]>([])
  useEffect(()=>{ supabase.auth.getUser().then(({data})=>setUser(data.user)) },[])
  useEffect(()=>{ if(!user) return; load() },[user])

  async function load(){
    // 我发出的分享；带全部目标与保存状态
    const { data, error } = await supabase
      .from('shares')
      .select('id, created_at, entry:entries(id,person,datetime,message), st:share_targets(id, saved_at, recipient:profiles(email))')
      .eq('sender_id', user.id)
      .order('created_at', { ascending:false })
    if(!error) setRows((data||[]) as any)
  }

  return (
    <main style={{maxWidth:720,margin:'24px auto',padding:16}}>
      <h2>分享概览</h2>
      {rows.length===0 && <div>暂无分享</div>}
      <div style={{display:'grid',gap:10}}>
        {rows.map(r=>{
          const delivered = r.st?.length || 0
          const saved = (r.st||[]).filter(t=> !!t.saved_at).length
          const pct = delivered? Math.round(saved/delivered*100) : 0
          return (
            <div key={r.id} style={{border:'1px solid #ffe4e6',borderRadius:10,padding:10,background:'#fff'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                <div>
                  <div style={{fontWeight:600}}>{r.entry?.person||'（无对象）'}</div>
                  <div style={{fontSize:12,opacity:.8}}>
                    {new Date(r.created_at).toLocaleString()} · 送达 {delivered} · ✓ 已保存 {saved}
                  </div>
                </div>
                <div style={{minWidth:140}}>
                  <Progress percent={pct}/>
                </div>
              </div>
              {r.entry?.message && <div style={{marginTop:6,color:'#444'}}>{r.entry.message}</div>}
              <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:6}}>
                {(r.st||[]).map(t=> (
                  <RecipientPill key={t.id} email={t.recipient?.email||'未知'} saved={!!t.saved_at}/>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

function Progress({percent}:{percent:number}){
  return (
    <div style={{height:10, background:'#ffe4e6', borderRadius:6, overflow:'hidden'}}>
      <div style={{height:10, width:`${Math.max(0,Math.min(100,percent))}%`, background:'#fb7185'}}/>
    </div>
  )
}

function RecipientPill({email,saved}:{email:string; saved:boolean}){
  return (
    <span style={{fontSize:12,padding:'4px 8px',borderRadius:999, border:'1px solid #fecdd3', background: saved? '#f0fdf4':'#fff'}}>
      {saved? '✓ ' : ''}{email}
    </span>
  )
}
