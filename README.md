# Hashan Soysa — Professional Services Website

Official luxury professional services portfolio for Hashan Soysa, built and hosted entirely with GitHub + GitHub Pages.

## Live website

https://hashansoysa92-commits.github.io/HashanSoysa/

## Core service areas

1. Photography, Videography & Camera Services
2. Video Editing, Colour Grading & Graphic Design
3. Social Media, Digital Marketing & Meta Ads
4. Website Development & Digital Presence
5. Audio, Music & Live Sound
6. Training & Professional Consultation

## Technology

- Semantic HTML5
- Responsive CSS
- Lightweight vanilla JavaScript
- Luxury motion design
- Mobile-first layout
- SEO metadata and Schema.org structured data
- Open Graph and social sharing metadata
- `robots.txt` and XML sitemap
- Web app manifest
- Accessibility and reduced-motion support
- GitHub Actions → GitHub Pages deployment

## GitHub-only architecture

The website has no Vercel, Floot, Netlify or other hosting dependency. The production source is stored in this repository and is deployed through GitHub Pages.

### Production files

- `index.html` — page content, SEO and structured data
- `assets/styles.css` — luxury responsive visual system and motion
- `assets/script.js` — navigation, reveal and interaction behavior
- `assets/favicon.svg` — site icon
- `site.webmanifest` — web app metadata
- `robots.txt` — crawler instructions
- `sitemap.xml` — search-engine sitemap
- `.nojekyll` — direct static asset serving
- `.github/workflows/pages.yml` — GitHub Pages deployment

Every push to `main` automatically triggers the GitHub Pages deployment workflow once Pages is enabled for this repository.
