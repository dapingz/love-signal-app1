'use client'
import Tabbar from './_components/Tabbar'
export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="zh-CN">
      <body style={{fontFamily:'system-ui',background:'#fff5f7',paddingBottom:64}}>
        {children}
        <Tabbar/>
      </body>
    </html>
  )
}
