import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'es' | 'en'
type Texto = { es: string; en: string }

// Idioma por defecto: el guardado por la persona; si no hay, el del navegador (español → es, el resto → en).
function idiomaInicial(): Lang {
  try {
    const guardado = localStorage.getItem('tepexa_lang')
    if (guardado === 'es' || guardado === 'en') return guardado
  } catch { /* almacenamiento bloqueado: se usa el navegador */ }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
}

interface Valor { lang: Lang; setLang: (l: Lang) => void; toggle: () => void; t: (obj: Texto | undefined | null) => string }
const Contexto = createContext<Valor | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(idiomaInicial)
  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem('tepexa_lang', l) } catch { /* sin almacenamiento */ }
    setLangState(l)
    document.documentElement.lang = l
  }, [])
  const valor = useMemo<Valor>(() => ({
    lang, setLang,
    toggle: () => setLang(lang === 'es' ? 'en' : 'es'),
    t: (obj) => (obj ? obj[lang] ?? obj[lang === 'es' ? 'en' : 'es'] ?? '' : ''),
  }), [lang, setLang])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useLangContext(): Valor {
  const v = useContext(Contexto)
  if (!v) throw new Error('useLang necesita <LanguageProvider>')
  return v
}
