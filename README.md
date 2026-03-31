# https://aldo140.github.io/Starlings/


# Starlings Support Map - Developer Guide

This prototype is a working "Support Map" for Starlings Community. It is designed to allow youth impacted by family substance use to share anonymous notes of hope and coping strategies.

## 🛠 Tech Stack
- **Framework**: React 19
- **Styling**: Tailwind CSS (Utility-first)
- **Mapping**: Leaflet.js with CartoDB Light tiles
- **Icons**: Lucide React
- **UI Components**: Vaul (Bottom Sheets)
- **Geocoding**: Hybrid (Local JSON Index + OpenStreetMap Nominatim API)
- **Routing**: React Router 6 (HashRouter)

---

## 🏗 Key Architectural Decisions

### 1. Hybrid Geocoding (Performance First)
To avoid the latency and rate-limiting issues of third-party geocoding APIs, we use a two-tier system in `services/api.ts`:
- **Stage 1 (Instant)**: A local constant `CANADIAN_HUBS` containing the top 40+ Canadian cities by population. This provides zero-latency autocomplete for ~80% of users.
- **Stage 2 (Deep Search)**: If no local match is found, or as the user stops typing, a debounced call is made to the **Nominatim (OSM) API** filtered strictly to `countrycodes=ca` and `featuretype=settlement`.

### 2. Google Apps Script Backend & Offline Sync
The `apiService` interacts with a deployed Google Apps Script (`services/gas-backend.js`) to use Google Sheets as a database:
- **GET**: Fetches approved posts from the "Approved" tab in Google Sheets.
- **POST**: Validates against `BANNED_PATTERNS` natively and saves to a "Pending" tab.
- **Offline Reliability**: If a network failure occurs during submission, the client gracefully queues the post in `localStorage` and retries automatically when the connection is restored or upon application mount (`App.tsx`).

### 3. Performance Mapping
The map uses `preferCanvas: true` in the Leaflet configuration. This ensures that even with hundreds of markers, the browser renders them as a single canvas element rather than individual DOM nodes, keeping the "Fly To" animations smooth on mobile devices.

---

## 🚦 Feature Logic

### Moderation Workflow (Map & Resources)
1. **Submission Options**: Users can submit a "Note of Hope" or "Recommend a Resource" directly from the map sharing view (`/share`). 
   - **Location-Based**: If they attach a city to a Note or a Resource, it is plotted geographically on the map.  
   - **Global Resources**: If a recommended resource has no specific city attachment (like a book or podcast), it bypasses the map and is queued for the global "Resources" tab.
2. **Auto-Flagging**: The `BANNED_PATTERNS` regex automatically checks for URLs, emails, phone numbers, and crisis keywords across map notes.
3. **Storage & Privacy Shielding**: Submissions are sent directly via a `POST` request to the "Pending" tab in the Google Sheet. This intentionally acts as a privacy shield for the 1-year pilot; no identifiable IP tracking data is stored alongside the Google Sheet submission. If offline, they are queued locally until connection is restored.
4. **Approval**: A moderator drops into the Google Sheet to move the row to an "Approved" tab, which the frontend then fetches for either Posts or Resources.

### Safety & Crisis
The app features a persistent **Crisis Banner**. Per the Starlings policy, the `ShareView` requires explicit agreement to three safety checks (Age, Anonymity, and Moderation) before the "Share Note" button becomes active.

---

## 📂 Project Structure
- `App.tsx`: Main entry point configuring HashRouter routes and offline sync listeners.
- `types.ts`: TypeScript interfaces for Posts and Locations.
- `constants.tsx`: Global configuration, ICONS, and Mock Data.
- `services/api.ts`: All data fetching, offline queuing, and geocoding logic.
- `services/gas-backend.js`: The Google Apps Script deployed as a Web App to interface between the frontend and Google Sheets.
- `components/`:
    - `Layout.tsx`: Main responsive layout shell containing the navigation and footer.
    - `Map.tsx`: The Leaflet JS implementation and custom marker logic.
    - `PostCard.tsx`: Reusable UI component for rendering individual notes.
- `views/`:
    - `Landing.tsx`: High-conversion hero page.
    - `MapView.tsx`: The interactive dual-view (Sidebar + Map).
    - `ShareView.tsx`: The multi-step submission form with city autocomplete.
    - `ResourcesView.tsx`: Displays curated resources (Websites, Videos, Publications).
    - `AddResourceView.tsx`: Form for recommending new resources to the community.
    - `Guidelines.tsx`: Details community rules and safety policies.

---

## 🚀 How to expand this
- **Database Migration**: Currently uses Google Sheets. For high traffic, migrate the GAS backend to a structured database like PostgreSQL or Supabase.
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
