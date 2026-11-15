import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import RegisterStep1 from './pages/RegisterStep1'
import ForgotPassword from './pages/ForgotPassword'
import RoleSelect from './pages/RoleSelect'
import DashboardLayout from './shared/components/DashboardLayout'

// Los 6 módulos de TEPEXA
const MartianAtlas = lazy(() => import('./pages/MartianAtlas'))
const RoutePlanner = lazy(() => import('./pages/RoutePlanner'))
const MissionAnalysis = lazy(() => import('./pages/MissionAnalysis'))
const EVASimulator = lazy(() => import('./pages/EVASimulator'))
const CrewSelection = lazy(() => import('./pages/CrewSelection'))
const MissionIntelligence = lazy(() => import('./pages/MissionIntelligence'))

// Perfil
const UserProfile = lazy(() => import('./pages/UserProfile'))

// Se quitaron Feed, Radar de incidentes y Situación global (eran de otro proyecto de rescate) y los pasos 2–4
// del registro (pedían datos médicos). Medusae Fossae se ve dentro del Atlas (/app?region=medusae).
export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register-step-1', element: <RegisterStep1 /> },
  { path: '/register-step-2', element: <Navigate to="/role" replace /> },
  { path: '/register-step-3', element: <Navigate to="/role" replace /> },
  { path: '/register-step-4', element: <Navigate to="/role" replace /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/role', element: <RoleSelect /> },
  {
    path: '/app',
    // Cada módulo se carga al entrar (el mapa y el 3D no pesan en la entrada).
    element: <DashboardLayout><Suspense fallback={null}><Outlet /></Suspense></DashboardLayout>,
    children: [
      { index: true, element: <MartianAtlas /> },
      { path: 'atlas', element: <MartianAtlas /> },
      { path: 'explore', element: <MartianAtlas /> },
      { path: 'planner', element: <RoutePlanner /> },
      { path: 'plan', element: <RoutePlanner /> },
      { path: 'analysis', element: <MissionAnalysis /> },
      { path: 'results', element: <MissionAnalysis /> },
      { path: 'simulator', element: <EVASimulator /> },
      { path: 'simulate', element: <EVASimulator /> },
      { path: 'crew', element: <CrewSelection /> },
      { path: 'intelligence', element: <MissionIntelligence /> },
      { path: 'medusae', element: <Navigate to="/app?region=medusae" replace /> },
      { path: 'next-mission', element: <Navigate to="/app?region=medusae" replace /> },
      { path: 'profile', element: <UserProfile /> },
      { path: '*', element: <Navigate to="/app" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
