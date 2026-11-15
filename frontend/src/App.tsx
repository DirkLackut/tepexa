import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { LanguageProvider } from './shared/context/LanguageContext'
import { MisionProvider } from './shared/context/MisionContext'

export default function App() {
  return (
    <LanguageProvider>
      <MisionProvider>
        <RouterProvider router={router} />
      </MisionProvider>
    </LanguageProvider>
  )
}
