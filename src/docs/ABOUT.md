# About Street Keeper

**Street Keeper** is a running companion application that transforms every run into visible, motivating progress across real streets. It connects to Strava, analyzes GPS activity data, and answers a simple but powerful question: **Which streets did you run on, and how much of each have you completed?**

---

## Core Value Proposition

Street Keeper's promise is to **turn every run into visible, motivating progress across real streets — and help runners know exactly where to run next.**

Unlike traditional fitness apps that focus on distance, pace, or calories, Street Keeper gamifies running by tracking street-level coverage. Every street becomes a checkpoint. Every run contributes to a larger goal. The app helps runners discover new routes, complete neighborhoods, and build a visual map of their running journey.

---

## Key Features

### 1. **Street-Level Progress Tracking**
- Automatically identifies which streets you've run based on GPS data from Strava
- Calculates completion percentage for each street (0–100%)
- Visual map showing completed streets (green), partially completed streets (yellow), and unrun streets (gray)
- Tracks progress across multiple geographic areas simultaneously

### 2. **Projects**
- Define custom geographic areas to track (circles with configurable radius: 100m to 50km)
- Each project shows total streets, completed streets, and overall progress percentage
- Create multiple projects for different neighborhoods, cities, or regions
- Archive and reactivate projects as needed

### 3. **Automatic Activity Sync**
- Seamless integration with Strava via OAuth
- Automatic webhook-based sync for new activities
- Manual sync option for immediate updates
- Processes activities in the background without user intervention

### 4. **Interactive Maps**
- Real-time map view centered on your location
- Street-level visualization with color-coded completion status
- Clickable street cards showing detailed stats (run count, completion percentage, first/last run dates)
- Street highlighting and map navigation for exploration

### 5. **GPX File Analysis**
- Upload GPX files for standalone street analysis
- Works without Strava connection for one-off route analysis
- Supports both V1 and V2 analysis engines

### 6. **Milestones & Goals**
- Set custom milestones (e.g., "Complete 50% of Portsmouth")
- Track progress toward goals
- Celebrate achievements with completion notifications
- Global and project-specific milestones

### 7. **Street Suggestions**
- AI-powered suggestions for "next run" routes
- Identifies streets that are almost complete (easy wins)
- Suggests nearby streets to explore
- Cluster analysis for efficient route planning

### 8. **Activity Heatmaps**
- Visualize activity density across project areas
- See where you run most frequently
- Identify gaps and opportunities for exploration

---

## Technical Architecture

Street Keeper is built as a modern, full-stack web application with a clear separation between frontend and backend.

### Frontend Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI library | 19.x |
| **TypeScript** | Language | 5.x |
| **Vite** | Build tool | 7.x |
| **Tailwind CSS** | Styling | 4.x |
| **React Router** | Routing | 6.x |
| **Leaflet** | Map rendering | Latest |

**Architecture:**
- Component-based architecture with reusable design system
- Context API for global state (authentication, preferences)
- Custom hooks for data fetching and geolocation
- Service layer for API communication
- Strict TypeScript typing throughout

**Design System:**
- 8px grid spacing system
- Four-level typography hierarchy
- Consistent button, card, and input components
- Mobile-first responsive design
- Accessibility-first (WCAG 2.1 AA compliance)

### Backend Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime | 20+ |
| **TypeScript** | Language | 5.x |
| **Express** | Web framework | 5.x |
| **Prisma** | ORM | 7.x |
| **PostgreSQL** | Database | Latest |
| **pg-boss** | Job queue | Latest |
| **Vitest** | Testing | 4.x |

**Architecture:**
- Three-layer architecture: Routes → Services → Data
- RESTful API design
- Background job processing for activity analysis
- External API integrations (Strava, Mapbox, Overpass)
- Comprehensive error handling and logging

---

## Data Models

### Core Entities

**User**
- Stores user account information
- Manages Strava OAuth tokens (access token, refresh token, expiration)
- Links to all user-generated data (projects, activities, progress)

**Project**
- Geographic area definition (circle: center lat/lng + radius)
- Snapshot of streets within the area
- Cached progress metrics (total streets, completed streets, percentage)
- Supports archiving and soft deletion

**Activity**
- Individual running activity from Strava
- Stores GPS track data (polyline or GPX)
- Links to projects via many-to-many relationship
- Tracks activity metadata (distance, duration, date)

**UserStreetProgress** (V1 Engine)
- One row per user per street
- Stores completion percentage (0–100%)
- Uses MAX rule: percentage only increases, never decreases
- Supports percentage-based progress tracking

**UserNodeHit** (V2 Engine)
- One row per user per OSM node hit
- Records when GPS point was within 25m of a map node
- Street completion derived at query time using 90% rule
- More accurate than V1, requires pre-seeded map data

**WayCache / NodeCache**
- Pre-computed OpenStreetMap data for V2 engine
- Stores street geometries, node coordinates, way-node relationships
- Enables offline processing after initial seed

---

## Analysis Engines

Street Keeper supports two distinct analysis engines, each with different trade-offs:

### V1 Engine: Overpass + Mapbox (Area-First)

**How it works:**
1. Queries Overpass API for streets in the activity area
2. Optionally uses Mapbox Map Matching to snap GPS trace to road network
3. Calculates which streets the path touched
4. Stores percentage completion per street in `UserStreetProgress`

**Characteristics:**
- ✅ No pre-seeding required
- ✅ Good for prototyping and small areas
- ✅ Works immediately after setup
- ❌ Slower per run (external API calls)
- ❌ Accuracy ~85% without Mapbox, ~98% with Mapbox
- ❌ Requires internet connection

**Best for:** Quick setup, small projects, development/testing

### V2 Engine: CityStrides-Style Node Proximity (Path-First)

**How it works:**
1. Pre-seeds local database with OSM map data (nodes, ways, edges)
2. For each GPS point, finds OSM nodes within 25m radius
3. Records node hits in `UserNodeHit` table
4. Computes street completion at query time: (nodes hit / total nodes) ≥ 90%

**Characteristics:**
- ✅ Highest accuracy (comparable to CityStrides)
- ✅ Can run fully offline after seeding
- ✅ No external API calls during analysis
- ✅ Consistent results across runs
- ❌ Requires PBF seed script for region
- ❌ Larger database footprint
- ❌ More complex setup

**Best for:** Production use, large projects, maximum accuracy

---

## External Integrations

### Strava API
- **OAuth 2.0** authentication flow
- **Webhook subscriptions** for automatic activity sync
- **Token refresh** mechanism for long-term access
- **Activity retrieval** for manual sync and analysis

### OpenStreetMap / Overpass API
- **Street geometry** queries for V1 engine
- **Real-time map data** without local storage
- **Open data** with no API key required

### Mapbox API (Optional)
- **Map Matching** service for GPS trace snapping
- **Improved accuracy** for V1 engine
- Requires API key and usage limits

### Leaflet Maps
- **Interactive map rendering** in frontend
- **Street polyline visualization**
- **User location tracking**
- **Map controls** (zoom, pan, fit bounds)

---

## Design Philosophy

Street Keeper is built around three core principles:

### 1. **Progress Must Feel Earned**
Accuracy matters. The system uses sophisticated GPS matching algorithms to ensure that progress reflects actual runs. No shortcuts, no approximations — just honest tracking of where you've been.

### 2. **Motivation Beats Precision**
While accuracy is important, emotional reward is paramount. The app prioritizes clear feedback, visual progress, and satisfying completion moments over perfect mathematical precision.

### 3. **Execution Matters**
Users need help *running the streets*, not just seeing gaps. Street Keeper provides actionable suggestions, route planning, and "next run" recommendations to turn data into action.

---

## User Experience

### Mobile-First Design
- Optimized for touch interactions
- 44px minimum touch targets
- Responsive layouts for all screen sizes
- Geolocation-based features

### Data-Driven Interface
- Typography hierarchy emphasizes metrics
- Numbers are visually dominant
- Progress bars paired with percentages
- Clear visual feedback for all actions

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios
- Semantic HTML structure

### Performance
- Lazy loading for map data
- Debounced search inputs
- Optimistic UI updates
- Efficient data caching
- Background job processing

---

## Development & Deployment

### Code Quality
- **TypeScript** strict mode throughout
- **ESLint** and **Prettier** for code consistency
- **Comprehensive documentation** (JSDoc, READMEs, guides)
- **Component-based architecture** with reusable patterns
- **Error handling** at every layer

### Testing
- **Vitest** for backend unit tests
- **Component testing** for frontend
- **Integration tests** for API endpoints
- **Manual testing flows** documented

### Deployment
- **Docker** containerization support
- **Environment-based configuration**
- **Database migrations** via Prisma
- **Background job workers** for async processing

---

## Roadmap & Future Features

### High Priority
1. **Streaks & Consistency** — Track consecutive days/weeks of running
2. **Post-Run Summary Cards** — Shareable achievement cards after each run
3. **Milestones & Badges** — Achievement system with visual rewards
4. **Next Run Suggestions** — AI-powered route recommendations

### Medium Priority
- **Social Features** — Compare progress with friends
- **Route Planning** — Build custom routes from street suggestions
- **Statistics Dashboard** — Comprehensive analytics and insights
- **Export Features** — Download progress data and maps

### Long-Term Vision
- **Multi-sport Support** — Cycling, walking, hiking
- **Garmin Integration** — Direct device sync
- **Offline Mode** — Full functionality without internet
- **Mobile Apps** — Native iOS and Android applications

---

## Open Source & Community

Street Keeper is built with open-source technologies and follows open-source best practices:

- **OpenStreetMap** for map data
- **Open data** principles where possible
- **Documentation-first** development
- **Community feedback** welcome

---

## Technical Specifications

### API Endpoints
- RESTful design with JSON responses
- Authentication via JWT tokens
- Rate limiting and error handling
- Comprehensive API documentation

### Database Schema
- **12 core tables** with clear relationships
- **Cascade deletes** for data integrity
- **Indexed queries** for performance
- **Migration system** for schema evolution

### Security
- **OAuth 2.0** for third-party authentication
- **Token encryption** for stored credentials
- **Input validation** at all layers
- **SQL injection** prevention via Prisma
- **CORS** configuration for frontend access

---

## Getting Started

For developers interested in contributing or understanding the codebase:

1. **Backend Setup**: See `backend/src/docs/GETTING_STARTED.md`
2. **Frontend Setup**: See `frontend/README.md`
3. **Architecture**: See `backend/src/docs/ARCHITECTURE.md`
4. **Coding Patterns**: See `backend/src/docs/CODING_PATTERNS.md` and `frontend/src/docs/CODING_PATTERNS.md`
5. **API Reference**: See `backend/src/docs/API_REFERENCE.md`

---

## Conclusion

Street Keeper represents a new approach to running motivation: instead of abstract metrics like distance or pace, it provides concrete, visual progress across real streets. Every run contributes to a larger map. Every street becomes a goal. The technical architecture supports this vision with accurate GPS matching, flexible analysis engines, and a user-friendly interface that makes progress tangible.

Whether you're exploring a new neighborhood, completing a city, or tracking progress across multiple projects, Street Keeper transforms running from exercise into exploration.

---

*Last updated: February 2026*
*Version: 1.0*
