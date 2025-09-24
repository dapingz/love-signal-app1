'use client'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

type Direction = 'Sent'|'Received'
type ShareStats = { delivered: number; saved: number }

export default function Log(){
  const [user,setUser]=useState<any>(null)
  const [list,setList]=useState<any[]>([])
  const [person,setPerson]=useState('')
  const [message,setMessage]=useState('')
  const [direction,setDirection]=useState<Direction>('Sent')
  const [shareEmails,setShareEmails]=useState('')
  const [selectedGroup,setSelectedGroup]=useState<string>('')
  const [groups,setGroups]=useState<any[]>([])
  const [sharePick,setSharePick]=useState<string>('')
  const [stats,setStats]=useState<Record<string,ShareStats>>({})

  useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user))},[])
  useEffect(()=>{ if(!user) return; load(); loadGroups() },[user])

  async function load(){
    const {data}=await supabase.from('entries').select('*').order('datetime',{ascending:false})
    setList(data||[])
    if(data?.length){ await loadStats(data.map(e=>e.id)) }
  }
  async function loadGroups(){
    const {data}=await supabase.from('groups').select('*').order('created_at',{ascending:false})
    setGroups(data||[])
  }
  async function loadStats(entryIds:string[]){
    const {data:shares}=await supabase.from('shares').select('id, entry_id').in('entry_id', entryIds)
    if(!shares?.length){ setStats({}); return }
    const ids = shares.map(s=>s.id)
    const {data:targets}=await supabase.from('share_targets').select('share_id, saved_at').in('share_id', ids)
    const map:Record<string,ShareStats> = {}
    for(const eId of entryIds){
      const related = shares.filter(s=>s.entry_id===eId)
      const t = (targets||[]).filter(tt=> related.some(r=>r.id===tt.share_id))
      map[eId] = { delivered: t.length, saved: t.filter(x=>x.saved_at!=null).length }
    }
    setStats(map)
  }

  async function add(){
    if(!person.trim()) return alert('请填写对象')
    const now=new Date().toISOString()
    const {error}=await supabase.from('entries').insert({user_id:user.id, datetime:now, direction, person, message})
    if(error) return alert(error.message); setPerson(''); setMessage(''); load()
  }

  async function share(){
    if(!sharePick) return alert('请选择要分享的记录')
    const {data:share, error:e0}=await supabase.from('shares').insert({ entry_id:sharePick, sender_id:user.id }).select('*').single()
    if(e0) return alert(e0.message)
    const emails = shareEmails.split(/[;,\s]+/).filter(Boolean)
    for(const em of emails){
      const {data:prof}=await supabase.from('profiles').select('id').eq('email',em).maybeSingle()
      if(prof){ await supabase.from('share_targets').insert({ share_id:share.id, recipient_id:prof.id }) }
    }
    if(selectedGroup){
      const {data:members}=await supabase.from('group_members').select('member_id').eq('group_id',selectedGroup)
      for(const m of (members||[])){
        await supabase.from('share_targets').insert({ share_id:share.id, recipient_id:m.member_id })
      }
    }
    alert('已分享'); setShareEmails(''); setSelectedGroup(''); await load()
  }

  return (
    <main style={{maxWidth:720,margin:'24px auto',padding:16}}>
      <h2>新建记录</h2>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,alignItems:'center'}}>
        <select value={direction} onChange={e=>setDirection(e.target.value as Direction)}><option value='Sent'>发送</option><option value='Received'>接收</option></select>
        <input value={person} onChange={e=>setPerson(e.target.value)} placeholder='对象/联系人'/>
        <input value={message} onChange={e=>setMessage(e.target.value)} placeholder='留言（可空）'/>
      </div>
      <button onClick={add} style={{marginTop:8,padding:'6px 10px',border:'1px solid #fb7185',borderRadius:8,background:'#fff'}}>保存</button>
      <hr style={{margin:'16px 0'}}/>

      <h2>记录列表（选择一条分享）</h2>
      {list.map(e=> (
        <div key={e.id} style={{border:'1px solid #ffe4e6',borderRadius:8,padding:8,marginTop:8,display:'grid',gridTemplateColumns:'1fr auto',gap:8}}>
          <div>
            <b>{e.person}</b> · {new Date(e.datetime).toLocaleString()} · {e.direction==='Sent'?'发送':'接收'}
            <div style={{color:'#444'}}>{e.message}</div>
            <div style={{marginTop:6,fontSize:12,opacity:.8}}>已送达：{stats[e.id]?.delivered||0} 人；✓ 已保存：{stats[e.id]?.saved||0} 人</div>
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <input type='radio' name='sharePick' onChange={()=>setSharePick(e.id)} checked={sharePick===e.id}/> 选择
          </div>
        </div>
      ))}

      <div style={{marginTop:12,display:'grid',gap:8}}>
        <input value={shareEmails} onChange={e=>setShareEmails(e.target.value)} placeholder='群发邮箱（逗号/空格分隔；需先登录过）'/>
        <div>
          <select value={selectedGroup} onChange={e=>setSelectedGroup(e.target.value)}>
            <option value=''>选择一个群组（可选）</option>
            {groups.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <button onClick={share} style={{padding:'6px 10px',border:'1px solid #fb7185',borderRadius:8,background:'#fff'}}>分享所选记录</button>
      </div>
    </main>
  )
}
