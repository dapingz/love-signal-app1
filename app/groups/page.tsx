'use client'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function Groups(){
  const [user,setUser]=useState<any>(null)
  const [groups,setGroups]=useState<any[]>([])
  const [emails,setEmails]=useState('')
  const [name,setName]=useState('')

  useEffect(()=>{ supabase.auth.getUser().then(({data})=>setUser(data.user)) },[])
  useEffect(()=>{ if(!user) return; load() },[user])

  async function load(){
    const {data}=await supabase.from('groups').select('*').order('created_at',{ascending:false})
    setGroups(data||[])
  }

  async function createGroup(){
    if(!name.trim()) return alert('请输入群组名')
    const {data:grp, error} = await supabase.from('groups').insert({owner_id:user.id,name}).select('*').single()
    if(error) return alert(error.message)
    const parts = emails.split(/[;,\s]+/).filter(Boolean)
    for(const em of parts){
      const {data:prof} = await supabase.from('profiles').select('id').eq('email',em).maybeSingle()
      if(prof){ await supabase.from('group_members').insert({group_id:grp.id, member_id:prof.id}) }
    }
    setName(''); setEmails(''); load()
  }

  return (
    <main style={{maxWidth:720,margin:'24px auto',padding:16,background:'#fff',border:'1px solid #ffe4e6',borderRadius:12}}>
      <h2>群组</h2>
      <div style={{display:'grid',gap:8,gridTemplateColumns:'1fr',marginTop:8}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder='群组名（如：家人/同事/小组）'/>
        <input value={emails} onChange={e=>setEmails(e.target.value)} placeholder='成员邮箱，逗号/空格分隔；需先登录过一次'/>
        <button onClick={createGroup} style={{padding:'6px 10px',border:'1px solid #fb7185',borderRadius:8,background:'#fff'}}>创建</button>
      </div>

      <div style={{marginTop:16}}>
        {groups.map(g=> (<GroupCard key={g.id} g={g}/>))}
      </div>
    </main>
  )
}

function GroupCard({g}:{g:any}){
  const [members,setMembers]=useState<any[]>([])
  useEffect(()=>{ load() },[])
  async function load(){
    const {data}=await supabase.from('group_members').select('member:profiles(id,email)').eq('group_id', g.id)
    setMembers(data||[])
  }
  return (
    <div style={{border:'1px solid #e5e7eb',borderRadius:8,padding:8,marginTop:8}}>
      <div><b>{g.name}</b></div>
      <div style={{fontSize:12,opacity:.8,marginTop:4}}>{members.map(m=>m.member?.email).filter(Boolean).join(' · ')||'暂无成员'}</div>
    </div>
  )
}
