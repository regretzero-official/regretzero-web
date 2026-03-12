# RegretZero Web

RegretZero Web is a Next.js app that visualizes long-term investing outcomes and compares cash vs. asset growth.

## Local Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Check

```bash
npm run build
```

Current status: build passes successfully.

## Deploy + Custom Domain (Vercel)

1. Push this project to GitHub.
2. Import the repo at [Vercel](https://vercel.com/new).
3. In Vercel project settings, add environment variable:
   `NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN`
4. Deploy once.
5. Go to `Settings > Domains`, add your purchased domain.
6. At your domain provider, apply the DNS records shown by Vercel.
7. Wait for SSL issuance and DNS propagation, then open your domain.

## Domain Test Checklist

1. Main page opens on `https://YOUR_DOMAIN`.
2. `https://YOUR_DOMAIN/sitemap.xml` is accessible.
3. `https://YOUR_DOMAIN/robots.txt` is accessible.
4. Browser console has no critical errors.

## Notes

- SEO metadata, `sitemap.xml`, and `robots.txt` are already configured.
- The site URL is controlled by `NEXT_PUBLIC_SITE_URL`.
