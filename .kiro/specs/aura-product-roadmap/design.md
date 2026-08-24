# Technical Design Document

## AURA Product Roadmap

*Version: 1.0 | Date: 2026-08-18*

---

## Overview

This document outlines the technical architecture for AURA, an AI-powered personal stylist system that understands what users own, their preferences, destinations, and needs—then proactively helps them decide what to wear, buy, and pack.

### Architecture Overview

AURA follows a modular, scalable architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend Layer                            │
│  • React Web Application (Mobile-first)                            │
│  • Mobile Responsive Components                                    │
│  • Context-Aware UI (Weather, Occasion, Mood)                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API Gateway Layer                          │
│  • Express.js RESTful API                                          │
│  • Request Validation & Rate Limiting                              │
│  • Authentication & Session Management                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
       ┌──────────────────────┴──────────────────────┐
       ▼                                             ▼
┌─────────────────────┐                    ┌─────────────────────┐
│     Core Backend    │                    │   AI Services Layer   │
│  • Wardrobe CRUD    │                    │   • Vision AI         │
│  • Outfit Engine    │                    │   • Outfit Gen AI     │
│  • Weather Service  │                    │   • Shopping AI       │
│  • Analytics Engine │                    │   • Travel Planner AI │
└─────────────────────┘                    └─────────────────────┘
       │                                             │
       └──────────────────────┬──────────────────────┘
                              ▼
                    ┌─────────────────────┐
                    │   Data Persistence  │
                    │   • JSON Storage    │
                    │   • User Data       │
                    │   • Wear History    │
                    └─────────────────────┘
```

### Design Philosophy

1. **Mobile-First**: All components designed for touch-first interaction
2. **AI-Augmented**: Human-in-the-loop with AI suggestions and corrections
3. **Gradual Enhancement**: Core functionality works without AI; enhancements added when available
4. **Offline-First**: Local caching and queue-based sync for unreliable connections
5. **Privacy-First**: User data owned and controlled by the user

---

## Architecture

### Frontend Architecture

**Technology Stack:**
- React 19 with TypeScript
- Vite as build tool
- Tailwind CSS 4 for styling
- Lucide React for icons
- Motion (Framer Motion fork) for animations

**Key Components:**
- `AuraConsumerApp.tsx` - Main application shell with tab navigation
- `Navbar.tsx` - Persistent navigation header
- `Phase1ValidationView.tsx` - Strategy mode interface

**Mobile-First Design Patterns:**
- Bottom tab navigation for mobile (5 primary tabs)
- Floating action buttons for primary actions
- Swipe gestures for item navigation
- Touch-optimized targets (minimum 44x44 pixels)
- Progressive disclosure for complex forms

### Backend Architecture

**Technology Stack:**
- Node.js 22 with TypeScript
- Express.js for REST API
- Google GenAI SDK for Gemini integration
- File-based JSON storage for persistence

**Layered Architecture:**
1. **API Layer** - Request validation, authentication, response formatting
2. **Service Layer** - Business logic, AI orchestration, data aggregation
3. **Persistence Layer** - JSON file I/O, caching, data migration

**Core Modules:**
- `store.ts` - Wardrobe CRUD, wear events, analytics
- `aiEngine.ts` - Vision analysis, outfit generation, shopping analysis
- `server.ts` - Express server, API routes, error handling

### Data Persistence

**Storage Model:**
- Single JSON file (`aura_database.json`) for simplicity
- Atomic write operations (write to temp, then rename)
- In-memory caching for performance
- Schema versioning for future migrations

**Data Partitioning:**
```
{
  "version": 1,
  "user": { "id", "name", "preferences" },
  "wardrobe": [ ... ],
  "wearEvents": [ ... ],
  "shoppingHistory": [ ... ],
  "updatedAt": "ISO8601"
}
```

---

## Components and Interfaces

### API Endpoints

#### Wardrobe Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wardrobe` | List all wardrobe items |
| GET | `/api/wardrobe/:id` | Get single item details |
| POST | `/api/wardrobe` | Create new item |
| PATCH | `/api/wardrobe/:id` | Update item |
| DELETE | `/api/wardrobe/:id` | Delete item |

#### AI Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze-wardrobe-image` | Upload and analyze garment |
| POST | `/api/generate-outfits` | Generate outfit recommendations |
| POST | `/api/swap-item` | Swap item in existing outfit |
| POST | `/api/analyze-shopping-item` | Analyze potential purchase |

#### Events & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wear-event` | Log outfit wear event |
| GET | `/api/wear-events` | Get wear history |
| GET | `/api/profile-analytics` | Get user analytics |

#### Shopping Intelligence
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze-shopping-item` | Analyze shopping candidate |

### Data Flow Diagrams

#### Outfit Generation Flow
```
User Request → Context Parsing → Wardrobe Filtering
                                      │
                                      ▼
                              Scoring Algorithm
                                      │
                                      ▼
                          AI Synthesis (if available)
                                      │
                                      ▼
                            Top Candidates Returned
```

#### Garment Ingestion Flow
```
Photo Upload → Base64 Encoding → AI Vision Analysis
                                         │
                                         ▼
                              Metadata Extraction
                                         │
                                         ▼
                          User Review & Editing
                                         │
                                         ▼
                             Wardrobe Addition
```

---

## Data Models

### WardrobeItem

```typescript
interface WardrobeItem {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  category: GarmentCategory;     // Tops, Bottoms, Outerwear, etc.
  subcategory: string;           // e.g., "Blazer", "Jeans"
  colorPrimary: string;          // Hex or color name
  colorSecondary?: string;
  pattern: string;               // Solid, Striped, etc.
  material: string;              // Fabric composition
  brand: string | null;
  silhouette?: string;
  fit?: string;
  formalityScore: number;        // 1-10 scale
  seasonality: string[];         // ["Spring", "Summer", "Fall", "Winter"]
  estimatedValueUSD: number;
  condition: 'New' | 'Excellent' | 'Good' | 'Worn';
  timesWorn: number;
  lastWorn?: string | null;
  isDirty?: boolean;
  status?: GarmentStatus;
  imageUrl?: string;
  dateAdded: string;
  createdAt?: string;
  updatedAt?: string;
  aiMetadata?: {
    confidence: number;
    detectedCategory?: string;
    notes?: string;
  };
}
```

### ContextInput (for Outfit Generation)

```typescript
interface ContextInput {
  temperature: string;           // e.g., "18°C"
  weather: 'Sunny' | 'Rain' | 'Cloudy' | 'Snow' | 'Windy';
  occasion: 'Work Pitch' | 'Casual Coffee' | 'Evening Dinner' | 
            'Weekend Travel' | 'Gym & Active';
  mood: 'Confident' | 'Relaxed' | 'Bold' | 'Understated' | 'Creative';
  location: string;
  formalityPreference: number;   // 1-10
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening';
}
```

### GeneratedOutfit

```typescript
interface GeneratedOutfit {
  id: string;
  title: string;
  explanation: string;
  itemIds: string[];
  items?: WardrobeItem[];
  formalityScore: number;
  weatherMatchScore: number;     // 0-100
  confidenceScore: number;       // 0-100
  whyReasons: string[];
  heroImageUrl?: string;
}
```

---

## AI/ML Service Architecture

### AI Services Overview

AURA leverages Google's Gemini AI models for intelligent clothing analysis:

**Models Used:**
- `gemini-2.5-flash` - Primary model for vision and text generation

### Vision AI (Garment Recognition)

**Function:** `analyzeGarmentImage(imageBase64, mimeType)`

**Process:**
1. User uploads garment photo
2. Image encoded as Base64
3. Sent to Gemini Vision with structured prompt
4. Response parsed into `AnalyzedGarmentResult`
5. User reviews and edits AI suggestions
6. Item saved to wardrobe

**Prompt Engineering:**
- Strict JSON schema output
- Brand identification threshold (only if logo clearly visible)
- Confidence score between 0.50-0.99
- Graceful fallback for AI unavailability

### Outfit Generation AI

**Function:** `generateOutfitsFromWardrobe(context)`

**Algorithm:**
1. Filter clean wardrobe items
2. Generate candidate combinations (top × bottom × shoes ± outerwear)
3. Score each combination based on:
   - Formality alignment (target vs. actual)
   - Weather suitability (warmth, waterproofing)
   - Recent wear avoidance (healthy rotation)
   - Color harmony indicators
4. Use AI to synthesize editorial explanations
5. Return top 3-4 ranked outfits

**Fallback Strategy:**
- If AI unavailable, use deterministic scoring
- Ensure at least 1 valid outfit returned

### Shopping Intelligence AI

**Function:** `analyzeShoppingItem(name, priceUSD, category, imageBase64?)`

**Analysis:**
1. Duplicate detection (category + color + pattern + brand matching)
2. Outfit unlock estimation (combinations with existing wardrobe)
3. Price validation against market estimates
4. Verdict generation: BUY / SKIP / CONSIDER
5. Cost-per-wear calculation

---

## Authentication and Security

### Authentication Strategy

**Current Implementation (Phase 1):**
- Session-based authentication via cookies
- Simple API key for AI services (Gemini API key)
- No user accounts yet (single-user demo)

**Future State (Production):**
- OAuth 2.0 with Google/Facebook authentication
- JWT for API tokens
- Refresh token rotation
- Session management with Redis

### Security Requirements

**API Security:**
- HTTPS/TLS 1.3 minimum
- Input validation on all endpoints
- Rate limiting (100 requests/hour per IP)
- SQL injection prevention (not applicable - JSON storage)
- XSS prevention (React handles this)

**Data Protection:**
- User data partitioning (multi-tenant aware)
- No sensitive data in logs
- Audit logging for data access
- Security incident alerting

### Implementation Plan

| Sprint | Authentication Features |
|--------|------------------------|
| 1 | Session tokens, AI API key integration |
| 2 | User sign-up with email verification |
| 3 | OAuth 2.0 integration |
| 4 | Role-based access control |
| 5+ | Multi-factor authentication |

---

## Weather Integration

### Weather Service Architecture

**External Service:** OpenWeatherMap or similar

**Data Fetched:**
- Current temperature (Celsius/Fahrenheit)
- Weather conditions (Sunny, Rain, Cloudy, Snow, Windy)
- Precipitation probability
- Humidity percentage
- Wind speed
- Forecast for the day

**Integration Points:**
1. User location capture (prompt or default)
2. Geocoding location to coordinates
3. Fetch current weather + forecast
4. Cache weather data (15-minute TTL)
5. Use in outfit generation and daily recommendations

**Fallback Strategy:**
- If weather service unavailable, use cached data
- If no cached data, default to "Mild" conditions
- Always show weather status in UI

---

## Mobile Responsiveness Strategy

### Responsive Design breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 768px | Bottom tab nav, single column |
| Tablet | 768px - 1024px | 2-column grid, sidebar nav |
| Desktop | > 1024px | 3-column grid, full nav |

### Touch Interaction Design

**Gesture Support:**
- **Tap** - Select item, open details
- **Double-tap** - Quick action (like, save)
- **Long-press** - Context menu (edit, delete, share)
- **Swipe** - Navigate items, switch outfits
- **Pinch** - Image zoom

**Touch Target Requirements:**
- Minimum 44x44 pixels
- Adequate spacing between targets
- Visual feedback on interaction

### Mobile Optimization

**Performance:**
- Image lazy loading
- Virtual scrolling for large lists
- Debounced search
- Local storage caching

**Offline Support:**
- Queued actions (sync when online)
- Local-only mode when offline
- Conflict resolution strategy

---

## Technology Stack

### Frontend Stack

| Component | Technology | Reason |
|-----------|------------|--------|
| Framework | React 19 | Modern UI, hooks, strong typing |
| Build Tool | Vite | Fast dev server, optimized builds |
| Styling | Tailwind CSS 4 | Utility-first, mobile-first |
| Icons | Lucide React | Minimal, consistent icon set |
| Animations | Motion | Declarative animations |
| Type System | TypeScript | Type safety, IDE support |

### Backend Stack

| Component | Technology | Reason |
|-----------|------------|--------|
| Runtime | Node.js 22 | JavaScript ecosystem, strong AI support |
| Framework | Express.js | Minimal, flexible, mature |
| AI SDK | Google GenAI | Gemini integration, structured output |
| Language | TypeScript | Type safety, better DX |
| Storage | File-based JSON | Simple, portable, versionable |

### AI/ML Stack

| Component | Technology | Reason |
|-----------|------------|--------|
| Vision Model | Gemini 2.5 Flash | Fast, accurate, cost-effective |
| Text Model | Gemini 2.5 Flash | Consistent model, strong prompting |
| API Client | `@google/genai` | Official SDK, TypeScript support |

---

## Deployment Considerations

### Current (Phase 1)

**Environment:** Local development / Cloud Run

**Configuration:**
- `.env` file for API keys
- Docker containerization for portability
- Static file serving for frontend

### Production (Phase 2+)

**Infrastructure:**
- Cloud Run for backend (autoscaling)
- Cloud Storage for static assets
- Cloud CDN for performance
- Cloud Logging for monitoring

**CI/CD Pipeline:**
- GitHub Actions for builds
- Automated deployment to Cloud Run
- Automatic rollback on failure
- Feature flag management

**Database (Phase 2+):**
- Firebase Firestore or Supabase
- User authentication with Firebase Auth
- Real-time sync with Firestore
- Row-level security policies

---

## Testing Strategy

### Unit Tests

**Coverage Areas:**
- Wardrobe CRUD operations
- Outfit scoring algorithms
- Shopping analysis logic
- Weather data processing
- AI response parsing

**Test Framework:**
- Vitest or Jest
- 100+ iterations for property-based tests
- Integration tests for external services

### Integration Tests

**Coverage Areas:**
- API endpoint responses
- AI service integration
- File system operations
- User data persistence

**Test Approach:**
- Mock external services (AI, weather)
- Real file system operations
- Database state assertions

### End-to-End Tests

**Coverage Areas:**
- Complete user flows
- Mobile responsive layouts
- Touch gesture behavior
- Authentication flows

**Test Framework:**
- Playwright or Cypress
- Real browser testing
- Visual regression testing

### Testing by Requirement Type

| Requirement Type | Test Strategy | Example |
|-----------------|---------------|---------|
| CRUD Operations | Example-based tests | Create, read, update, delete |
| AI Integration | Integration tests with mocks | Gemini API call + response |
| Performance SLAs | Load testing | Response time < 3s for outfit gen |
| Security | Security scanning | SQL injection, XSS, auth bypass |
| Mobile UI | Visual regression | Layout on 320px, 768px, 1024px |

### Property-Based Testing Assessment

**PBT NOT Recommended For:**
1. Infrastructure operations (file I/O, API calls)
2. Configuration validation (schema, types)
3. UI rendering (layout, styling)
4. External service integration (weather, AI API)
5. Authentication flows (token generation, validation)

**PBT Appropriate For:**
1. Outfit scoring algorithms (various inputs → expected scoring)
2. Duplicate detection logic (similarity thresholds)
3. Data serialization/deserialization (round-trip validation)

---

## Performance Optimization

### Frontend Optimization

**Techniques:**
- Code splitting by route
- Image lazy loading with placeholders
- Virtual scrolling for long lists
- Debounced search input
- Request caching with localStorage

**Metrics:**
- First Contentful Paint < 1s
- Time to Interactive < 2s
- Largest Contentful Paint < 2.5s

### Backend Optimization

**Techniques:**
- In-memory caching for wardrobe
- Response compression (gzip)
- Query optimization (filter before map)
- AI response caching (short TTL)

**Metrics:**
- API response time < 2s (p95)
- Outfit generation < 3s
- Image analysis < 10s

### Database Optimization

**Current (Phase 1):**
- File-based JSON with in-memory cache
- Atomic writes (temp file + rename)
- No optimization needed for < 1000 items

**Future (Phase 2+):**
- Indexed queries (Firestore, Supabase)
- Query pagination
- Indexes on frequent lookup fields

---

## Error Handling

### Error Categories

1. **Network Errors** - Retry with exponential backoff
2. **AI Service Errors** - Fallback to deterministic logic
3. **Validation Errors** - 400 response with details
4. **Persistence Errors** - Queue for later retry
5. **Authentication Errors** - 401 with logout trigger

### User-Facing Errors

**Error Message Criteria:**
- Clear and actionable
- No technical jargon
- Suggest recovery options
- Don't reveal internal details

**Examples:**
- "Unable to connect. Check your internet connection."
- "AI service temporarily unavailable. Showing basic recommendations."
- "Item not found. Please refresh the page."

---

## User Education & Onboarding

### Onboarding Flow

**Step 1: Welcome**
- Brief welcome message
- Core feature overview
- Skip/Continue choice

**Step 2: Add First Items**
- Visual guide to photo upload
- AI metadata review
- Success confirmation

**Step 3: Ask for Outfits**
- Demonstrate context selection
- Show first outfit generation
- "Wear this look" action

**Step 4: Learn Loop**
- Explain rating system
- Show improvement over time
- "You're learning!" indicator

### In-App Help

**Context-Sensitive Tips:**
- Hover tooltips for unfamiliar terms
- First-use hints for new features
- FAQ link in footer

---

## Analytics & Insights

### Analytics Dashboard

**Wardrobe Analytics:**
- Total items and estimated value
- Utilization rate (% worn in last 30 days)
- Category breakdown (visual chart)
- Color usage distribution
- Most/least worn items
- Cleaning status (clean/in wash)

**Style Insights:**
- Primary aesthetic archetype
- Most worn colors
- Formality range patterns
- Brand preferences
- Seasonal usage patterns

### Data Retention

**Current:**
- User data retained indefinitely
- No automatic deletion

**Future:**
- 1-year retention policy
- "Right to be forgotten" compliance
- Audit log retention (90 days)

---

## Roadmap & Implementation Phases

### Phase 1 (Current) - MVP Foundation

**Timeline:** 2-3 weeks

**Deliverables:**
- Wardrobe CRUD operations
- Basic outfit generation
- AI image analysis
- Shopping intelligence
- Analytics dashboard

**Done Criteria:**
- All Phase 1 requirements implemented
- Unit test coverage > 80%
- Mobile responsive layouts
- Basic AI integration

### Phase 2 - Authentication & Multi-User

**Timeline:** 3-4 weeks

**Deliverables:**
- User sign-up and login
- OAuth 2.0 integration
- Cloud database (Firestore)
- Multi-user support
- Session management

### Phase 3 - Advanced AI Features

**Timeline:** 4-5 weeks

**Deliverables:**
- Natural language chat interface
- Advanced style learning
- Style profile optimization
- Personalized recommendations

### Phase 4 - Travel Mode

**Timeline:** 2-3 weeks

**Deliverables:**
- Trip creation and management
- Packing recommendations
- Daily outfit planning
- Weather-based packing lists

### Phase 5 - Shopping Intelligence

**Timeline:** 3-4 weeks

**Deliverables:**
- Shopping cart functionality
- Price tracking and alerts
- Duplicate detection improvements
- Outfit unlock calculations

### Phase 6 - Mobile Apps

**Timeline:** 8-12 weeks

**Deliverables:**
- iOS native app (SwiftUI)
- Android native app (Jetpack Compose)
- Push notifications
- Offline-first mobile experience
- App store publishing

### Phase 7-8 - Enterprise Features

**Timeline:** 12-16 weeks

**Deliverables:**
- Team/stylist collaboration
- Brand partnerships
- Premium features
- API access for developers

---

## Conclusion

This design document provides a comprehensive technical blueprint for AURA's product roadmap. The architecture prioritizes:

1. **User Experience** - Mobile-first, intuitive, beautiful
2. **AI-Augmented** - Powerful insights, human-in-the-loop
3. **Scalable** - Modular design, cloud-native
4. **Secure** - Privacy-first, secure by default
5. **Pragmatic** - Phase 1 MVP focused on core value

The phased approach allows for rapid iteration and validation, with each phase building on the previous foundations while expanding capabilities and user base.
                                         │
                                         ▼
                          User Review & Editing
                                         │
                                         ▼
                             Wardrobe Addition
```

---

## Correctness Properties

**Property-based testing is NOT appropriate for AURA's core features.**

This document uses property-based testing for features where it makes sense, but AURA's core functionality consists primarily of:

### Property 1: Wardrobe Persistence
**Validates: Requirements 3, 4, 7, 8**
- WHEN a wardrobe item is created, THEN it MUST be retrievable with the same data
- WHEN a wardrobe item is updated, THEN the update MUST be reflected in subsequent reads
- WHEN a wardrobe item is deleted, THEN it MUST NOT appear in subsequent reads

### Property 2: Outfit Compatibility Scoring
**Validates: Requirements 12, 13, 14**
- WHERE two items have compatible colors, THEN their outfit compatibility score MUST be higher than incompatible colors
- WHERE items have matching formality levels, THEN their outfit compatibility score MUST be higher than mismatched levels
- WHERE items have matching style categories, THEN their outfit compatibility score MUST be higher than mismatched styles

### Property 3: Duplicate Detection Accuracy
**Validates: Requirements 23, 24**
- WHERE an item matches existing wardrobe by category, color, and pattern, THEN the duplicate detection score MUST exceed threshold
- WHERE an item differs significantly from existing items, THEN the duplicate detection score MUST be below threshold
- DUPLICATE detection MUST consider: category, color, pattern, style, brand, silhouette

### Property 4: Weather-Based Outfit Selection
**Validates: Requirements 14, 22**
- WHERE temperature is below 10°C, THEN outfit recommendations MUST include warm outerwear items
- WHERE temperature is above 25°C, THEN outfit recommendations MUST exclude heavy fabrics
- WHERE precipitation probability exceeds 50%, THEN outfit recommendations MUST include waterproof footwear

### Recommended Testing Strategy

| Area | Test Type | Rationale |
|------|-----------|-----------|
| Wardrobe CRUD | Property-based tests | Data persistence properties are universal |
| AI Integration | Integration tests with mocks | Test our API integration, not the AI service itself |
| Outfit Scoring | Property-based tests | Compatibility scoring properties are algorithmic |
| Weather Integration | Integration tests | Test API call, caching, and fallback behavior |
| UI Components | Snapshot/visual regression | Layout and rendering are not algorithmic properties |
| Security | Security scanning, example tests | Configuration and validation requirements |
| Performance | Load testing | Measure response times, not algorithmic properties |

---

## Error Handling

### Error Categories

1. **Network Errors** - Retry with exponential backoff
2. **AI Service Errors** - Fallback to deterministic logic
3. **Validation Errors** - 400 response with details
4. **Persistence Errors** - Queue for later retry
5. **Authentication Errors** - 401 with logout trigger

### User-Facing Errors

**Error Message Criteria:**
- Clear and actionable
- No technical jargon
- Suggest recovery options
- Don't reveal internal details

**Examples:**
- "Unable to connect. Check your internet connection."
- "AI service temporarily unavailable. Showing basic recommendations."
- "Item not found. Please refresh the page."
