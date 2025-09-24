'use client'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
export default function Home(){
  const [user,setUser]=useState<any>(null)
  const [email,setEmail]=useState('')
  useEffect(()=>{ supabase.auth.getUser().then(({data})=>setUser(data.user)) },[])
  if(!user){
    return (
      <main style={{maxWidth:560,margin:'40px auto',padding:16,background:'#fff',borderRadius:12,border:'1px solid #ffe4e6'}}>
        <h1>Love Signals</h1>
        <p>用邮箱登录以与朋友互发爱信号。</p>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="你的邮箱" style={{padding:8,border:'1px solid #fecdd3',borderRadius:8,width:'100%'}}/>
        <button onClick={async()=>{await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.href}}); alert('登录邮件已发送');}} style={{marginTop:8,padding:'8px 12px',border:'1px solid #fb7185',borderRadius:8,background:'#ffe4e6'}}>发送登录链接</button>
      </main>
    )
  }
  return (
    <main style={{maxWidth:720,margin:'40px auto',padding:16}}>
      <h2>欢迎，{user.email}</h2>
      <p>去「记录」新建内容，或在「收件箱」查看别人分享给你的爱信号。</p>
    </main>
  )
}
