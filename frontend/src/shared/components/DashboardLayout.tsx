import { type ReactNode } from 'react'
import Topbar from './Topbar'
import BottomNavbar from './BottomNavbar'

interface Props {
  children: ReactNode
}

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="dash-wrapper">
      <Topbar />
      <main className="dash-main">
        {children}
      </main>
      <BottomNavbar />
    </div>
  )
}
