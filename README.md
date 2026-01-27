# Datamaks Website

Profesionalni web sajt za Datamaks d.o.o. - digitalizacija poslovanja za mala i srednja preduzeća.

## Struktura

```
datamaks-website/
├── index.html          # Bosanska verzija (default)
├── en/index.html       # Engleska verzija
├── de/index.html       # Njemačka verzija
├── assets/
│   ├── css/style.css   # Svi stilovi
│   ├── js/             # JavaScript (ako bude potrebno)
│   └── images/         # Slike
├── sitemap.xml         # SEO sitemap
├── robots.txt          # Crawler instructions
└── README.md           # Ovaj fajl
```

## TODO prije deploy-a

### 1. Slike (Midjourney)
Potrebne slike:
- [ ] `hero-dashboard.png` (600x450) - Poslovni dashboard/analytics prikaz
- [ ] `partnership.png` (500x400) - Partnerski pristup, sastanak, razgovor
- [ ] `og-image.jpg` (1200x630) - Open Graph slika za social sharing
- [ ] `apple-touch-icon.png` (180x180) - iOS ikona
- [ ] `logo.png` (200x50) - Logo ako treba PNG verzija

**Midjourney prompts:**
```
hero-dashboard: "Modern business dashboard on laptop screen, data visualization, charts and graphs, clean UI, blue accent color, professional, isometric view, white background --ar 4:3 --v 6"

partnership: "Two business professionals discussing strategy at modern office, laptop on table, friendly atmosphere, consulting session, natural lighting --ar 5:4 --v 6"

og-image: "Modern business digitalization concept, data flow visualization, blue gradient background, professional, corporate, abstract --ar 1200:630 --v 6"
```

### 2. Kontakt forma (Formspree)
1. Idi na https://formspree.io
2. Kreiraj account
3. Kreiraj novi form
4. Zamijeni `YOUR_FORM_ID` u svim HTML fajlovima

### 3. GitHub Pages Deploy

```bash
# 1. Kreiraj GitHub repo
gh repo create datamaks-website --public

# 2. Inicijaliziraj git
cd "D:/Datamaks promo/datamaks-website"
git init
git add .
git commit -m "Initial commit - Datamaks website"

# 3. Push na GitHub
git remote add origin git@github.com:YOUR_USERNAME/datamaks-website.git
git push -u origin main

# 4. Uključi GitHub Pages
# Settings > Pages > Source: main branch > / (root)
```

### 4. Custom domena (datamaks.net)

DNS podešavanja kod registrara:
```
A     @    185.199.108.153
A     @    185.199.109.153
A     @    185.199.110.153
A     @    185.199.111.153
CNAME www  YOUR_USERNAME.github.io
```

Dodaj `CNAME` fajl u root:
```
datamaks.net
```

### 5. Google Search Console
1. Verifikuj sajt
2. Submituj sitemap.xml
3. Provjeri indeksiranje

## SEO Optimizacija

- ✅ Meta tags (title, description, keywords)
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Schema.org structured data
- ✅ Hreflang alternate language tags
- ✅ Sitemap.xml
- ✅ Robots.txt
- ✅ Semantic HTML5
- ✅ Mobile responsive
- ✅ Fast loading (no frameworks)

## Jezici

| Jezik | URL | Status |
|-------|-----|--------|
| Bosanski | datamaks.net/ | ✅ |
| English | datamaks.net/en/ | ✅ |
| Deutsch | datamaks.net/de/ | ✅ |

## Kontakt

**Datamaks d.o.o.**
- Email: info@datamaks.net
- Tel BiH: +387 65 469 565
- Tel AT: +43 667 797 0082
- Web: https://datamaks.net
