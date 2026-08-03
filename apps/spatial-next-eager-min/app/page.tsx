import Link from 'next/link'

export default function HomePage() {
  return (
    <div>
      <h1>spatial-next-eager-min</h1>
      <p>
        Worked examples of the eager entry (
        <code>@webspatial/react-sdk/eager</code>) under Next.js 15 App Router.
      </p>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          <Link href="/eager">
            <strong>/eager</strong>
          </Link>{' '}
          — single eager route: SSR shell + client-only eager island
          (`dynamic(..., {` ssr: false `})`).
        </li>
        <li>
          <Link href="/server-only-util">
            <strong>/server-only-util</strong>
          </Link>{' '}
          — pure RSC UA-branching demo (no SDK runtime import).
        </li>
      </ul>
      <p>
        Lazy-entry examples live in <code>apps/spatial-next-min</code>.
      </p>
    </div>
  )
}
