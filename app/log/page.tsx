'use client'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'


type Direction = 'Sent'|'Received'


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


useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user))},[])
useEffect(()=>{ if(!user) return; load(); loadGroups() },[user])


async function load(){
const {data}=await supabase.from('entries').select('*').order('datetime',{ascending:false})
setList(data||[])
}
async function loadGroups(){
const {data}=await supabase.from('groups').select('*').order('created_at',{ascending:false})
setGroups(data||[])
}


async function add(){
if(!person.trim()) return alert('请填写对象')
const now=new Date().toISOString()
const {error}=await supabase.from('entries').insert({user_id:user.id, datetime:now, direction, person, message})
if(error) return alert(error.message); setPerson(''); setMessage(''); load()
}


async function share(){
if(!sharePick) return alert('请选择要分享的记录')
// 新建 share
const {data:share, error:e0}=await supabase.from('shares').insert({ entry_id:sharePick, sender_id:user.id }).select('*').single()
if(e0) return alert(e0.message)


// 1) 群发邮箱
const emails = shareEmails.split(/[;,\s]+/).filter(Boolean)
for(const em of emails){
const {data:prof}=await supabase.from('profiles').select('id').eq('email',em).maybeSingle()
if(prof){ await supabase.from('share_targets').insert({ share_id:share.id, recipient_id:prof.id }) }
}
// 2) 群组成员
if(selectedGroup){
const {data:members}=await supabase.from('group_members').select('member_id').eq('group_id',selectedGroup)
for(const m of (members||[])){
await supabase.from('share_targets').insert({ share_id:share.id, recipient_id:m.member_id })
}
}
alert('已分享'); setShareEmails(''); setSelectedGroup('')
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
<div><b>{e.person}</b> · {new Date(e.datetime).toLocaleString()} · {e.direction==='Sent'?'发送':'接收'}<div style={{color:'#444'}}>{e.message}</div></div>
<div style={{display:'flex',gap:6,alignItems:'center'}}>
<input type='radio' name='sharePick' onChange={()=>setSharePick(e.id)} checked={sharePick===e.id}/> 选择
</div>
}