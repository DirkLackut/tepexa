import { NavLink } from 'react-router-dom'
import {
  Compass,
  Route,
  FileCheck2,
  Footprints,
  Users,
  Bot,
  User
} from 'lucide-react'
import { useLang } from '../hooks/useLang'
import { tDict } from '../i18n/translations'

export default function BottomNavbar() {
  const { t } = useLang()

  const navItems = [
    {
      to: '/app',
      end: true,
      label: t(tDict.navAtlas),
      corto: t({ es: 'Atlas', en: 'Atlas' }),
      icon: <Compass size={14} />
    },
    {
      to: '/app/planner',
      label: t(tDict.navPlanner),
      corto: t({ es: 'Rutas', en: 'Routes' }),
      icon: <Route size={14} />
    },
    {
      to: '/app/analysis',
      label: t(tDict.navAnalysis),
      corto: t({ es: 'Análisis', en: 'Analysis' }),
      icon: <FileCheck2 size={14} />
    },
    {
      to: '/app/simulator',
      label: t(tDict.navSimulator),
      corto: t({ es: '3D', en: '3D' }),
      icon: <Footprints size={14} />
    },
    {
      to: '/app/crew',
      label: t(tDict.navCrew),
      corto: t({ es: 'Tripulación', en: 'Crew' }),
      icon: <Users size={14} />
    },
    {
      to: '/app/intelligence',
      label: t(tDict.navIntelligence),
      corto: t({ es: 'Asistente', en: 'Assistant' }),
      icon: <Bot size={14} />
    },
    {
      to: '/app/profile',
      label: t(tDict.navProfile),
      corto: t({ es: 'Perfil', en: 'Profile' }),
      icon: <User size={14} />
    }
  ]

  return (
    <nav className="hud-bottom-navbar-container" aria-label="HUD Bottom Navbar">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `hud-bottom-nav-link ${isActive ? 'active' : ''}`}
        >
          {item.icon}
          <span className="nav-largo">{item.label}</span>
          <span className="nav-corto">{item.corto}</span>
        </NavLink>
      ))}
    </nav>
  )
}
