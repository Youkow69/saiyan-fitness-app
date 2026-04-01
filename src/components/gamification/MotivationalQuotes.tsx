import { useMemo } from 'react'

interface Quote {
  text: string
  character: string
}

const QUOTES: Quote[] = [
  { text: "Le pouvoir vient en reponse a un besoin, pas a un desir.", character: "Goku" },
  { text: "Je suis le Super Saiyan, Son Goku !", character: "Goku" },
  { text: "Chaque fois que tu seras au bord de l'abandon, rappelle-toi pourquoi tu as commence.", character: "Vegeta" },
  { text: "Je suis le prince de tous les Saiyans ! Je ne m'inclinerai devant personne !", character: "Vegeta" },
  { text: "Le combat est tout ce que j'ai. Pas de combat, pas de vie.", character: "Goku" },
  { text: "Repousse tes limites. C'est tout ce qu'il y a a faire.", character: "Goku" },
  { text: "La douleur d'aujourd'hui est la force de demain.", character: "Vegeta" },
  { text: "Je ne suis pas un heros. Je suis un guerrier.", character: "Vegeta" },
  { text: "Le destin appartient a ceux qui ne cessent jamais de se battre.", character: "Goku" },
  { text: "Ta fierte de Saiyan, ne la perds jamais.", character: "Vegeta" },
  { text: "Il n'y a pas de limites. Il n'y a que des plateaux, et tu ne dois pas y rester.", character: "Goku" },
  { text: "Entrainer son corps, c'est entrainer son esprit.", character: "Piccolo" },
  { text: "La vraie force ne vient pas du corps, elle vient de la volonte.", character: "Gohan" },
  { text: "N'abandonne jamais. Bats-toi jusqu'au bout.", character: "Goku" },
  { text: "Chaque defaite est une lecon. Chaque lecon est un pas vers la victoire.", character: "Vegeta" },
  { text: "Le pouvoir est inutile sans la discipline pour le maitriser.", character: "Piccolo" },
  { text: "Un vrai guerrier n'a pas besoin de raison pour s'entrainer.", character: "Vegeta" },
  { text: "Plus le defi est grand, plus la gloire est belle.", character: "Goku" },
  { text: "La seule facon de devenir plus fort, c'est de se battre contre plus fort que soi.", character: "Goku" },
  { text: "Les limites n'existent que dans l'esprit de ceux qui y croient.", character: "Vegeta" },
  { text: "Transforme ta douleur en puissance.", character: "Gohan" },
  { text: "Le guerrier qui s'entraine quand tout va bien n'est pas un guerrier. Celui qui s'entraine dans l'adversite, oui.", character: "Piccolo" },
  { text: "Je suis peut-etre en bas aujourd'hui, mais demain, je serai au sommet.", character: "Goku" },
  { text: "La victoire revient a celui qui refuse de tomber.", character: "Vegeta" },
  { text: "Surpasse-toi. C'est le seul adversaire qui compte.", character: "Goku" },
  { text: "Mon niveau de puissance est bien au-dela de ce que tu peux imaginer.", character: "Vegeta" },
  { text: "Les Saiyans deviennent plus forts apres chaque combat. C'est notre nature.", character: "Goku" },
  { text: "Ne sous-estime jamais le pouvoir d'un Saiyan.", character: "Vegeta" },
  { text: "La discipline forge le guerrier que le talent ne peut pas creer.", character: "Piccolo" },
  { text: "Chaque repetition te rapproche de ton objectif. Continue.", character: "Gohan" },
  { text: "Tu n'as pas besoin d'etre motive. Tu as besoin d'etre discipline.", character: "Vegeta" },
  { text: "Le combat n'est jamais fini. Il y a toujours un niveau superieur a atteindre.", character: "Goku" },
  { text: "Je me bats pour ceux que j'aime. C'est la source de ma force.", character: "Goku" },
  { text: "La fatigue est une illusion. Ton corps peut bien plus que ce que ton esprit croit.", character: "Vegeta" },
]

const CHARACTER_COLORS: Record<string, string> = {
  Goku: '#ed8936',
  Vegeta: '#3182ce',
  Piccolo: '#38a169',
  Gohan: '#9f7aea',
}

const CHARACTER_ICONS: Record<string, string> = {
  Goku: '🟠',
  Vegeta: '🔵',
  Piccolo: '🟢',
  Gohan: '🟣',
}

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function DailyQuote() {
  const quote = useMemo(() => {
    const dayIdx = getDayOfYear() % QUOTES.length
    return QUOTES[dayIdx]
  }, [])

  const accentColor = CHARACTER_COLORS[quote.character] || '#ed8936'
  const icon = CHARACTER_ICONS[quote.character] || '⭐'

  return (
    <div
      style={{
        background: `linear-gradient(135deg, #1a1a2e, ${accentColor}15)`,
        borderRadius: 16,
        padding: 24,
        maxWidth: 500,
        margin: '0 auto',
        color: '#e2e8f0',
        fontFamily: "'Segoe UI', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${accentColor}30`,
      }}
    >
      {/* Decorative background element */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}15, transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* Quote marks */}
      <div
        style={{
          fontSize: 48,
          lineHeight: 1,
          color: accentColor,
          opacity: 0.3,
          fontFamily: 'Georgia, serif',
          marginBottom: -10,
        }}
      >
        &ldquo;
      </div>

      {/* Quote text */}
      <p
        style={{
          fontSize: 17,
          lineHeight: 1.6,
          margin: '0 0 16px',
          fontStyle: 'italic',
          position: 'relative',
          zIndex: 1,
          paddingLeft: 8,
        }}
      >
        {quote.text}
      </p>

      {/* Character attribution */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'flex-end',
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: accentColor,
          }}
        >
          -- {quote.character}
        </span>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
          fontSize: 11,
          color: '#718096',
        }}
      >
        Citation du jour -- Puissance Saiyan
      </div>
    </div>
  )
}
