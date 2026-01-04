# Starlings Support Map - Developer Guide

This prototype is a working "Support Map" for Starlings Community. It is designed to allow youth impacted by family substance use to share anonymous notes of hope and coping strategies.

## 🛠 Tech Stack
- **Framework**: React 19
- **Styling**: Tailwind CSS (Utility-first)
- **Mapping**: Leaflet.js with CartoDB Light tiles
- **Icons**: Lucide React
- **Geocoding**: Hybrid (Local JSON Index + OpenStreetMap Nominatim API)
- **Routing**: React Router 6 (HashRouter)

---

## 🏗 Key Architectural Decisions

### 1. Hybrid Geocoding (Performance First)
To avoid the latency and rate-limiting issues of third-party geocoding APIs, we use a two-tier system in `services/api.ts`:
- **Stage 1 (Instant)**: A local constant `CANADIAN_HUBS` containing the top 40+ Canadian cities by population. This provides zero-latency autocomplete for ~80% of users.
- **Stage 2 (Deep Search)**: If no local match is found, or as the user stops typing, a debounced call is made to the **Nominatim (OSM) API** filtered strictly to `countrycodes=ca` and `featuretype=settlement`.

### 2. Mock Backend & Google Sheets Strategy
The `apiService` currently simulates a backend using `localStorage`:
- **GET**: Combines `MOCK_POSTS` with any approved posts in `localStorage`.
- **POST**: Validates against `BANNED_PATTERNS` (Regex for safety) and saves to a `pending` key.
- **Integration Path**: To move to a real Google Sheets backend, replace the `fetch` calls in `apiService` with a library like `google-spreadsheet` or a simple Google Apps Script Web App URL.

### 3. Performance Mapping
The map uses `preferCanvas: true` in the Leaflet configuration. This ensures that even with hundreds of markers, the browser renders them as a single canvas element rather than individual DOM nodes, keeping the "Fly To" animations smooth on mobile devices.

---

## 🚦 Feature Logic

### Moderation Workflow
1. **Submission**: Users fill out guided prompts.
2. **Auto-Flagging**: The `BANNED_PATTERNS` regex automatically checks for URLs, emails, phone numbers, and crisis keywords.
3. **Storage**: In this prototype, posts are stored locally. In production, these go to a "Pending" tab in Google Sheets.
4. **Approval**: A moderator moves the row to an "Approved" tab, which the frontend then fetches.

### Safety & Crisis
The app features a persistent **Crisis Banner**. Per the Starlings policy, the `ShareView` requires explicit agreement to three safety checks (Age, Anonymity, and Moderation) before the "Share Note" button becomes active.

---

## 📂 Project Structure
- `types.ts`: TypeScript interfaces for Posts and Locations.
- `constants.tsx`: Global configuration, ICONS, and Mock Data.
- `services/api.ts`: All data fetching and geocoding logic.
- `components/Map.tsx`: The Leaflet implementation and marker logic.
- `views/`:
    - `Landing.tsx`: High-conversion hero page.
    - `MapView.tsx`: The interactive dual-view (Sidebar + Map).
    - `ShareView.tsx`: The multi-step submission form with city autocomplete.

---

## 🚀 How to expand this
- **Real Backend**: Implement a `POST` request to a Google Apps Script in `apiService.submitPost`.
- **Analytics**: Add privacy-preserving analytics (like Plausible) to track map engagement without IP tracking.
- **Filtering**: Expand the `useMemo` filter in `MapView.tsx` to allow filtering by the specific "What Helped" tags.

## ⚠️ Important for Devs
- **Leaflet CSS**: The Leaflet CSS is loaded via CDN in `index.html`. If moving to a production build system, ensure the icon assets are handled correctly.
- **Geocoding Limits**: Nominatim has a strict usage policy. Always keep the debouncing in `ShareView` above 500ms and use the local `CANADIAN_HUBS` index for common queries.
- **2xl breakpoint (1536px)**: Landing page floating images (the tilted photo cards flanking the hero text) only render at `2xl` to avoid overlapping the core message on smaller desktops.

---

## 🌐 Deploying to GitHub Pages

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Initial Setup

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save the settings

3. **Deploy automatically**:
   - The GitHub Actions workflow will automatically build and deploy on every push to `main` or `master`
   - Your site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Manual Deployment

If you want to test the build locally:
```bash
npm run build
npm run preview  # Preview the production build locally
```

### Important Notes

- **HashRouter**: This project uses `HashRouter` which is perfect for GitHub Pages (no server-side routing needed)
- **Base Path**: The build automatically configures the base path based on your repository name
- **Automatic**: Every push to the main branch triggers a new deployment
- **Build Artifacts**: The built files are in the `dist/` folder (gitignored)

### Troubleshooting

- If your site shows a blank page, check the browser console for errors
- Ensure GitHub Actions has permission to deploy (Settings → Actions → General → Workflow permissions)
- The deployment URL format is: `https://YOUR_USERNAME.github.io/REPO_NAME/`
