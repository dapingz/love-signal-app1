'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
const tabs = [
  { href: '/', label: '首页' },
  { href: '/log', label: '记录' },
  { href: '/inbox', label: '收件箱' },
  { href: '/groups', label: '群组' },
  { href: '/settings', label: '设置' }
]
export default function Tabbar(){
  const p = usePathname()
  return (
    <nav style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid #eee'}}>
      <ul style={{display:'grid',gridTemplateColumns:`repeat(${tabs.length},1fr)`,maxWidth:720,margin:'0 auto',padding:'8px 12px',listStyle:'none',gap:6}}>
        {tabs.map(t=>{
          const active = p===t.href
          return (
            <li key={t.href}>
              <Link href={t.href} style={{display:'block',textAlign:'center',padding:'6px 8px',borderRadius:8, textDecoration:'none', color: active? '#be185d':'#374151', background: active?'#fff1f2':'transparent', border: active? '1px solid #fecdd3':'1px solid transparent'}}>{t.label}</Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
