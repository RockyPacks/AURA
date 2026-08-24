# Requirements Document

## Introduction

AURA is an AI-powered personal stylist that understands what you own, what you like, where you you're going, and what you need — then proactively helps you decide what to wear, what to buy, and what to pack. This requirements document covers the complete product roadmap from MVP (Mobile-first web app with core AI capabilities) through 8 sprints to a full-featured personal styling platform, with mobile applications as a later phase.

## Glossary

- **AURA**: The AI personal stylist system
- **User**: Registered individual with their own wardrobe and preferences
- **Wardrobe**: Collection of clothing items owned by a user
- **Clothing Item**: Individual piece of clothing with metadata (category, color, style, etc.)
- **Outfit**: Combination of clothing items worn together, with semantic relationships
- **Outfit Generation**: AI process of creating compatible outfit combinations
- **Style Profile**: User's preferences, fashion choices, and learned patterns
- **Weather Integration**: External service providing location-based weather data
- **AI Clothing Recognition**: Computer vision system that analyzes clothing from images
- **Smart Shopping**: AI system that evaluates potential purchases against existing wardrobe
- **Travel Mode**: System that creates packing recommendations based on trip details

## Requirements

### Requirement 1: Authentication & User Management

**User Story:** As a new user, I want to create an account and log in, so that I can access my personal wardrobe and styling recommendations.

#### Acceptance Criteria

1. WHEN a new user provides valid registration information, THE System SHALL create an account and authenticate the user
2. WHEN a registered user provides valid credentials, THE System SHALL authenticate the user and return a secure session token
3. WHEN a user requests logout, THE System SHALL terminate their active session
4. WHERE password reset is requested, THE System SHALL initiate the password recovery flow
5. WHILE a user is authenticated, THE System SHALL maintain secure access to user-specific data
6. IF authentication fails due to invalid credentials, THEN THE System SHALL return a clear error message without revealing account existence

### Requirement 2: User Profile Management

**User Story:** As a user, I want to manage my personal profile and style preferences, so that AURA can provide personalized recommendations.

#### Acceptance Criteria

1. WHERE profile editing is enabled, THE System SHALL allow users to update: Name, Style preferences, Preferred colours, Sizes, Typical occasions, Location/weather preference, Style goals
2. WHEN profile information is updated, THE System SHALL persist changes and reflect them in recommendations
3. WHERE style preferences are configured, THE System SHALL allow selection of: Favorite colours, Avoided colours, Preferred formality range, Favorite brands, Fabric preferences, Aesthetic archetype
4. WHILE preferences are being set, THE System SHALL provide guidance and default suggestions
5. IF required profile information is missing, THEN THE System SHALL prompt completion before generating recommendations

### Requirement 3: Wardrobe Item Persistence

**User Story:** As a user, I want my wardrobe items to persist across sessions, so that I don't lose my clothing data.

#### Acceptance Criteria

1. WHEN a wardrobe item is created, THE System SHALL store it with a unique identifier and timestamps
2. WHEN a user requests their wardrobe, THE System SHALL return all items associated with their account
3. WHEN a wardrobe item is updated, THE System SHALL preserve its identifier and update only changed fields
4. WHEN a wardrobe item is deleted, THE System SHALL remove it from persistent storage
5. WHILE a user's session is active, THE System SHALL cache recently accessed wardrobe items for performance

### Requirement 4: Wardrobe Item Creation (Photo Upload)

**User Story:** As a user, I want to add clothing items by uploading photos, so that I can quickly populate my wardrobe.

#### Acceptance Criteria

1. WHEN a user uploads a clothing item photo, THE System SHALL accept common image formats (JPEG, PNG)
2. WHERE mobile upload is available, THE System SHALL allow photo capture directly from device camera
3. WHEN multiple items are selected for upload, THE System SHALL process each item individually
4. IF an uploaded image exceeds size limits, THEN THE System SHALL return an error with size requirements
5. WHILE images are uploading, THE System SHALL display progress indicators

### Requirement 5: Clothing Item Data Structure

**User Story:** As a developer, I want a standardized data structure for clothing items, so that AURA can consistently process wardrobe data.

#### Acceptance Criteria

1. EACH clothing item SHALL include: id, category, subcategory, primary color, secondary color, pattern, material, brand, silhouette, fit, formality score (1-10), seasonality, estimated value, condition, wear count, last worn date, favorite flag, image URL, timestamps
2. EACH category SHALL be one of: Tops, Bottoms, Outerwear, Shoes, Accessories, One-Piece
3. EACH seasonality SHALL be an array of: Spring, Summer, Autumn, Winter
4. EACH condition SHALL be one of: New, Excellent, Good, Worn
5. WHERE AI metadata is available, THE System SHALL include: confidence score, detected category, additional notes

### Requirement 6: Visual Wardrobe Display

**User Story:** As a user, I want to see my clothing in a visual grid layout, so that I can easily browse and manage my wardrobe.

#### Acceptance Criteria

1. WHERE wardrobe viewing is enabled, THE System SHALL display clothing items as visual cards with images
2. EACH visual card SHALL show: main image, item name, category, primary color, wear count, last worn date
3. WHEN viewport width changes, THE System SHALL adjust grid layout for mobile, tablet, and desktop
4. WHILE items are loading, THE System SHALL display placeholder content
5. IF no items exist, THE System SHALL show empty state with instructions to add items

### Requirement 7: Wardrobe Item Editing

**User Story:** As a user, I want to edit clothing item details, so that I can correct or enhance AI-generated metadata.

#### Acceptance Criteria

1. WHEN an item edit action is triggered, THE System SHALL present an editing interface with all editable fields
2. WHERE image replacement is allowed, THE System SHALL allow uploading a new photo
3. WHEN edits are saved, THE System SHALL update the item and refresh display
4. IF AI metadata exists, THE System SHALL show detected values with options to modify
5. WHILE editing, THE System SHALL validate field values against expected formats

### Requirement 8: Wardrobe Item Deletion

**User Story:** As a user, I want to remove clothing items from my wardrobe, so that I can keep my collection current.

#### Acceptance Criteria

1. WHEN item deletion is confirmed, THE System SHALL remove the item from persistent storage
2. BEFORE deletion, THE System SHALL prompt for confirmation
3. IF the item is referenced in saved outfits, THE System SHALL show affected outfits or ask for deletion confirmation
4. WHEN deletion completes, THE System SHALL update the wardrobe display
5. IF deletion fails, THEN THE System SHALL show error message with retry option

### Requirement 9: AI Clothing Recognition - Image Analysis

**User Story:** As a user, I want AI to analyze clothing from photos, so that I don't have to manually enter all details.

#### Acceptance Criteria

1. WHEN a clothing photo is uploaded, THE System SHALL send it to the AI recognition service
2. THE System SHALL return: category, subcategory, primary color, secondary color, pattern, material, style classification, formality score, season recommendations
3. EACH AI detection SHALL include a confidence score between 0 and 1
4. WHERE confidence is below threshold (e.g., 0.7), THE System SHALL highlight fields for user review
5. IF AI analysis fails, THEN THE System SHALL provide default values and allow manual editing

### Requirement 10: AI Clothing Recognition - User Correction

**User Story:** As a user, I want to correct AI-detected metadata, so that my wardrobe data is accurate.

#### Acceptance Criteria

1. WHERE AI metadata is displayed, THE System SHALL allow users to modify any detected value
2. WHEN a user makes corrections, THE System SHALL prioritize user input over AI suggestions
3. IF corrections are saved, THE System SHALL update the item and persist changes
4. WHILE corrections are being made, THE System SHALL show both AI suggestion and user-edited values
5. EACH correction SHALL be logged for model improvement (with user consent)

### Requirement 11: Clothing Categories & Taxonomy

**User Story:** As a developer, I want a comprehensive clothing taxonomy, so that items can be consistently classified.

#### Acceptance Criteria

1. EACH top-level category SHALL be one of: Tops, Bottoms, Outerwear, Shoes, Accessories, One-Piece
2. EACH subcategory SHALL follow standard fashion taxonomy (e.g., Tops: T-shirts, Shirts, Sweaters, Blouses, Dresses)
3. EACH pattern SHALL support: Solid, Striped, Polka Dot, Plaid, Floral, Geometric, Animal Print, Camouflage
4. EACH material SHALL support: Cotton, Wool, Silk, Linen, Polyester, Denim, Leather, Suede, Knock
5. EACH formality score SHALL be a number from 1 (loungewear) to 10 (black tie)

### Requirement 12: AI Outfit Generation - Request Handling

**User Story:** As a user, I want to ask AURA what to wear, so that I get personalized outfit recommendations.

#### Acceptance Criteria

1. WHEN an outfit generation request is received, THE System SHALL analyze: available wardrobe, weather conditions, occasion, user preferences, recent wear history
2. THE System SHALL generate multiple outfit options (minimum 3) ranked by compatibility score
3. EACH outfit SHALL include: item list, compatibility score, weather match score, formality score, explanation
4. WHERE user preferences exist, THE System SHALL prioritize items matching favorites and avoid avoided items
5. IF insufficient wardrobe items exist, THEN THE System SHALL show available options with clear limitations

### Requirement 13: AI Outfit Generation - Compatibility Scoring

**User Story:** As a user, I want AURA to understand clothing compatibility, so that recommended outfits actually work.

#### Acceptance Criteria

1. EACH outfit SHALL calculate compatibility based on: colour compatibility, style compatibility, occasion appropriateness, weather suitability, formality alignment
2. COLOUR compatibility SHALL consider: complementary colours (black+white, navy+white, orange+neutral), colour intensity matching
3. STYLE compatibility SHALL ensure: casual+casual, smart+smart, athletic+athletic combinations
4. OCCASION matching SHALL validate: work items for work occasions, formal items for formal occasions
5. WEATHER suitability SHALL match: warm items for cold weather, waterproof items for rain, breathable items for heat

### Requirement 14: AI Outfit Generation - Weather Integration

**User Story:** As a user, I want outfits to account for weather, so that I stay comfortable.

#### Acceptance Criteria

1. WHERE weather data is available, THE System SHALL integrate current and forecasted conditions
2. WEATHER conditions SHALL include: temperature, precipitation probability, wind speed, humidity, sky conditions
3. WHEN temperature changes significantly, THE System SHALL adjust outfit recommendations (layers, fabric choices)
4. IF rain is forecast, THE System SHALL prioritize waterproof shoes and consider rain-ready items
5. EACH temperature range SHALL have appropriate recommendations: Hot (>25°C), Warm (18-25°C), Cool (10-18°C), Cold (<10°C)

### Requirement 15: AI Outfit Generation - Explanation System

**User Story:** As a user, I want to understand why outfits were recommended, so that I can learn and trust AURA.

#### Acceptance Criteria

1. EACH outfit SHALL include an explanation paragraph describing key styling choices
2. EXPLANATIONS SHALL include: colour coordination, style cohesion, occasion suitability, weather considerations
3. WHERE user preferences influenced the outfit, THE System SHALL reference those preferences
4. THE System SHALL generate explanations dynamically based on actual items in the outfit
5. IF no explanation can be generated, THEN THE System SHALL provide generic compatibility reasoning

### Requirement 16: Outfit Saving & Management

**User Story:** As a user, I want to save outfits I like, so that I can wear them again later.

#### Acceptance Criteria

1. WHEN an outfit save action is triggered, THE System SHALL store the outfit with associated metadata
2. EACH saved outfit SHALL include: title, item IDs, created timestamp, wear count, rating history
3. WHERE outfit saving succeeds, THE System SHALL show confirmation and return saved outfit with ID
4. WHEN an outfit is deleted, THE System SHALL remove it from persistent storage
5. WHILE viewing saved outfits, THE System SHALL display: title, item count, last worn date, rating, photo preview

### Requirement 17: Outfit Rating & Feedback

**User Story:** As a user, I want to rate outfits, so that AURA can learn my preferences.

#### Acceptance Criteria

1. WHEN an outfit rating is submitted (👍/👎 or 1-5 stars), THE System SHALL record the feedback with timestamp
2. EACH rating SHALL be linked to the specific outfit and user
3. WHERE a rating is updated, THE System SHALL replace the previous rating for that outfit
4. RATINGS SHALL influence future outfit recommendations (positive ratings increase probability, negative decrease)
5. IF sufficient ratings exist, THE System SHALL show average rating and rating distribution

### Requirement 18: Outfit History Tracking

**User Story:** As a user, I want AURA to remember what I've worn, so that it can suggest rotation and new combinations.

#### Acceptance Criteria

1. WHEN an outfit is worn, THE System SHALL record the event with timestamp, weather, occasion, and feedback
2. EACH wear event SHALL be associated with the specific outfit and user
3. WHERE wear history exists, THE System SHALL track: most worn items, least worn items, recently worn items
4. THE System SHALL calculate: days since last worn per item, total wear count, seasonal usage patterns
5. IF wear data is sufficient, THE System SHALL identify: worn-out items, underused items, favourite combinations

### Requirement 19: Style Profile Learning

**User Story:** As a user, I want AURA to learn my style preferences, so that recommendations improve over time.

#### Acceptance Criteria

1. EACH style preference change SHALL trigger an update to the user's style profile
2. WHERE ratings are provided, THE System SHALL adjust item preference scores
3. IF certain categories are frequently rejected, THE System SHALL reduce future recommendations in those categories
4. WHILE learning phase continues (insufficient data), THE System SHALL show recommendations with "learning" indicator
5. THE System SHALL maintain: favourite colours/brands/silhouettes, avoided items, common/rarely worn patterns, rejected recommendations

### Requirement 20: Natural Language Stylist Interaction

**User Story:** As a user, I want to chat with AURA about my wardrobe, so that I can get contextual advice.

#### Acceptance Criteria

1. WHERE natural language input is accepted, THE System SHALL parse user requests for styling intent
2. EACH request SHALL support: "What goes with these shoes?", "Give me three outfits", "Make this more casual", "Help me pack for a trip"
3. WHERE context is available, THE System SHALL automatically include relevant wardrobe items
4. IF context is unclear, THE System SHALL ask clarifying questions
5. EACH response SHALL include: outfit suggestions, explanations, and related items

### Requirement 21: Daily AURA Recommendation

**User Story:** As a user, I want a daily recommended outfit, so that I can start my day without decision fatigue.

#### Acceptance Criteria

1. WHEN daily AURA is accessed, THE System SHALL generate a "today's look" recommendation
2. EACH daily recommendation SHALL include: weather conditions, temperature, recommended outfit, explanation
3. WHERE previous day's outfit exists, THE System SHALL suggest alternatives to avoid repetition
4. EACH recommendation SHALL show: "You haven't worn these [item] in [X] days"
5. IF weather has changed since yesterday, THE System SHALL adjust the recommendation accordingly

### Requirement 22: Weather Integration Data

**User Story:** As a developer, I want reliable weather data integration, so that outfit recommendations are weather-aware.

#### Acceptance Criteria

1. WHERE location is available, THE System SHALL fetch current weather using location coordinates or zip code
2. WEATHER data SHALL include: temperature (Celsius/Fahrenheit), conditions (Sunny/Rain/Cloudy/Snow/Windy), precipitation probability, humidity, wind speed
3. EACH weather fetch SHALL include: current conditions and forecast for the day
4. IF weather service is unavailable, THE System SHALL use cached data or default to mild conditions
5. WHERE location is not provided, THE System SHALL prompt for location or use a default

### Requirement 23: Shopping Intelligence - Item Upload

**User Story:** As a user, I want to upload potential purchases for AURA analysis, so that I can make informed buying decisions.

#### Acceptance Criteria

1. WHEN a shopping item photo is uploaded, THE System SHALL process it through AI clothing recognition
2. EACH shopping item SHALL be stored separately from wardrobe items but linked to user account
3. WHERE multiple items are uploaded, THE System SHALL process each independently
4. IF upload fails due to image quality, THEN THE System SHALL prompt for better photo
5. EACH shopping item SHALL include: image, detected metadata, price, estimated value, upload timestamp

### Requirement 24: Shopping Intelligence - Duplicate Detection

**User Story:** As a user, I want AURA to detect duplicates, so that I don't buy things I already own.

#### Acceptance Criteria

1. WHEN a shopping item is analyzed, THE System SHALL compare it against wardrobe and existing shopping items
2. DUPLICATE detection SHALL consider: category, color, pattern, style, brand, silhouette
3. EACH duplicate match SHALL include: similarity score, item reference, visual comparison
4. DUPLICATE risk SHALL be categorized: NONE, LOW, MEDIUM, HIGH based on match confidence
5. IF duplicates are found, THE System SHALL show: "You already own something similar" with item preview

### Requirement 25: Shopping Intelligence - Outfit Unlock Calculation

**User Story:** As a user, I want to know how many new outfits an item would enable, so that I can evaluate value.

#### Acceptance Criteria

1. WHEN outfit unlock calculation is triggered, THE System SHALL analyze: current wardrobe, item compatibility, colour combinations, style matching
2. EACH calculation SHALL estimate: minimum new outfits, maximum new outfits, average expected outfits
3. OUTFIT unlock shall consider: missing base items, missing statement pieces, colour gaps, style gaps
4. EACH estimate SHALL include: supporting reasoning (e.g., "This navy blazer unlocks 14 outfits with existing pants/shirts")
5. IF wardrobe is sparse, THE System SHALL show unlock potential with minimum item requirements

### Requirement 26: Shopping Intelligence - Buying Recommendation

**User Story:** As a user, I want a clear buy/don't buy recommendation, so that I can make confident purchasing decisions.

#### Acceptance Criteria

1. WHEN shopping analysis completes, THE System SHALL provide verdict: BUY, SKIP, or CONSIDER
2. EACH verdict SHALL include: clear statement (e.g., "Buy this" or "Skip this") with reasoning
3. EACH verdict SHALL include: cost-per-wear estimate, outfit unlocks, duplicate risk level
4. WHERE VERDICT is SKIP, THE System SHALL explain: why not and alternatives
5. EACH recommendation SHALL be saved with timestamp for future reference

### Requirement 27: Shopping Intelligence - Price Analysis

**User Story:** As a user, I want price validation, so that I can assess value.

#### Acceptance Criteria

1. WHERE price is provided, THE System SHALL validate against market range for similar items
2. EACH price analysis SHALL include: fair price estimate, over/under pay amount, percentage difference
3. IF price is significantly higher (>20% over market), THEN THE System SHALL flag for review
4. EACH price insight SHALL include: comparison items and their prices
5. PRICE analysis SHALL consider: brand premium, material quality, current market trends

### Requirement 28: Travel Mode - Trip Creation

**User Story:** As a user, I want to create travel trips, so that AURA can help me pack appropriately.

#### Acceptance Criteria

1. WHEN a new trip is created, THE System SHALL collect: destination, start date, end date, activities, weather preferences
2. EACH trip SHALL include: title, destination, dates, activity types, formal occasions, temperature range
3. WHERE destination is entered, THE System SHALL attempt to fetch expected weather
4. IF dates are invalid (end before start), THEN THE System SHALL show error with correction
5. EACH trip SHALL be stored with unique identifier and user association

### Requirement 29: Travel Mode - Packing Recommendations

**User Story:** As a user, I want packing recommendations, so that I don't forget essential items.

#### Acceptance Criteria

1. WHEN trip packing is requested, THE System SHALL generate: outfit recommendations, underwear/socks count, accessories, toiletries
2. EACH outfit recommendation SHALL match the trip's weather and activities
3. WHERE wardrobe items match trip requirements, THE System SHALL assign items to outfits
4. EACH missing item shall be identified and suggested for rental/purchase
5. Packing list SHALL be organized by day with visual outfit previews

### Requirement 30: Travel Mode - Daily Outfit Plan

**User Story:** As a user, I want day-by-day outfit planning, so that I can pack efficiently.

#### Acceptance Criteria

1. WHERE trip duration exceeds one day, THE System SHALL generate daily outfit plan
2. EACH day SHALL have: outfit (visual preview), occasion, weather context, packing status
3. THE System SHALL ensure variety across days (avoid wearing same outfit twice)
4. WHERE events are scheduled, THE System SHALL match outfits to event formality
5. EACH daily plan SHALL include: "What to pack" checklist with estimated space

### Requirement 31: Mobile Responsiveness - Responsive Design

**User Story:** As a user, I want AURA to work on my phone, so that I can manage my wardrobe anywhere.

#### Acceptance Criteria

1. WHERE mobile device is detected, THE System SHALL adapt layout for touch interaction
2. EACH major screen SHALL be usable with single-thumb operation
3. TOUCH targets SHALL be minimum 44x44 pixels for accessibility
4. WHERE viewport is under 768px, THE System SHALL use mobile navigation (bottom tab bar)
5. IMAGE uploads SHALL support mobile camera capture and photo library selection

### Requirement 32: Mobile Responsiveness - Touch Interactions

**User Story:** As a mobile user, I want intuitive touch gestures, so that I can navigate easily.

#### Acceptance Criteria

1. WHERE touch input is available, THE System SHALL support: tap, double-tap, long-press, swipe, pinch
2. SWIPE gestures SHALL enable: item navigation, outfit switching, category filtering
3. LONG-press SHALL trigger: edit, delete, save, share options
4. PINCH gestures SHALL control: image zoom, grid density adjustment
5. GESTURE feedback SHALL be visible (animations, haptic if supported)

### Requirement 33: API Security - Authentication

**User Story:** As a developer, I want secure API authentication, so that user data is protected.

#### Acceptance Criteria

1. EACH API endpoint requiring authentication SHALL verify valid session token
2. SESSION tokens SHALL expire after inactivity (maximum 24 hours)
3. WHEN a token is invalidated, THE System SHALL immediately terminate session access
4. AUTHENTICATION errors SHALL return 401 status code with no sensitive information
5. EACH authentication attempt SHALL be logged for security auditing

### Requirement 34: API Security - Data Protection

**User Story:** As a user, I want my data to be secure, so that I can trust AURA with personal information.

#### Acceptance Criteria

1. ALL API communications SHALL use HTTPS (TLS 1.3 minimum)
2. SENSITIVE data (passwords, tokens) SHALL never appear in logs or error messages
3. USER data SHALL be partitioned by account ID in all queries
4. EACH data access SHALL include audit logging of who accessed what and when
5. IF a security issue is detected, THE System SHALL alert administrators

### Requirement 35: API Security - Input Validation

**User Story:** As a developer, I want robust input validation, so that the system is protected from malformed requests.

#### Acceptance Criteria

1. EACH API endpoint SHALL validate input against expected schema
2. INVALID input SHALL return 400 status code with descriptive error message
3. LENGTH limits SHALL apply to all string inputs (minimum 1 character, maximum 10,000 characters)
4. FORMAT validation SHALL apply to: email addresses, dates, URLs, numeric ranges
5. IF validation rules change, THE System SHALL maintain backward compatibility

### Requirement 36: Performance & Scalability - Responsive UI

**User Story:** As a user, I want fast responses, so that my experience is smooth.

#### Acceptance Criteria

1. WHERE wardrobe list has fewer than 100 items, THE System SHALL load in under 1 second
2. WHERE outfit generation is requested, THE System SHALL return initial options in under 3 seconds
3. IMAGE upload and AI processing SHALL complete in under 10 seconds for single items
4. EACH user action SHALL have loading feedback within 200ms
5. IF processing exceeds expected time, THE System SHALL show progress indicator

### Requirement 37: Error Handling - Graceful Degradation

**User Story:** As a user, I want AURA to handle errors gracefully, so that I don't lose my work.

#### Acceptance Criteria

1. WHEN network connectivity is lost, THE System SHALL queue pending actions and retry automatically
2. IF AI services are unavailable, THE System SHALL use cached results or default recommendations
3. EACH error message SHALL be user-friendly with clear next steps
4. ERROR recovery options SHALL include: retry, cancel, edit, or contact support
5. ALL errors SHALL be logged with context for debugging

### Requirement 38: User Education - Onboarding

**User Story:** As a new user, I want guidance getting started, so that I can quickly see value.

#### Acceptance Criteria

1. WHERE first-time user is detected, THE System SHALL show onboarding tutorial
2. ONBOARDING SHALL cover: adding first items, asking for outfits, understanding AI features
3. EACH tutorial step SHALL include: visual demonstration, user practice, success confirmation
4. WHERE help is requested within app, THE System SHALL provide context-sensitive tips
5. ONBOARDING can be skipped but SHALL be available in settings

### Requirement 39: Data Export & Backup

**User Story:** As a user, I want to backup my data, so that I don't lose it if something happens.

#### Acceptance Criteria

1. WHERE data export is requested, THE System SHALL provide downloadable JSON backup
2. BACKUP data SHALL include: all wardrobe items, saved outfits, shopping items, wear history, preferences
3. EACH backup file SHALL be encrypted with user password (optional)
4. EXPORT process SHALL show progress and estimated completion time
5. BACKUP files SHALL be readable by AURA for import functionality

### Requirement 40: Analytics & Insights - Wardrobe Analytics

**User Story:** As a user, I want to understand my wardrobe, so that I can make better choices.

#### Acceptance Criteria

1. WHERE analytics are requested, THE System SHALL show: total items, total estimated value, utilization rate
2. EACH analytics page SHALL include: category breakdown, colour usage, most/least worn items
3. UTILIZATION rate SHALL calculate: percentage of items worn in last 30 days
4. EACH insight SHALL include: visual charts (bar, pie) and summary text
5. Analytics data SHALL be cached and update daily (not on every request)