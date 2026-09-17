export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Oversite.ng Platform</h1>
      <p>Production-ready Next.js App Router baseline for AWS ECS Fargate.</p>
      <ul>
        <li>Drizzle ORM + PostgreSQL schema foundation</li>
        <li>AWS S3 media pipeline and SES dispatch modules</li>
        <li>Redis-backed realtime event bridge for websocket handlers</li>
        <li>Versioned external API namespace: /api/v1/external/*</li>
      </ul>
    </main>
  );
}
