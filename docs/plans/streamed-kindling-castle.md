# TShirtGen App Store Launch Plan

## Current Status: ~85% Ready

Your app is well-prepared for launch:
- ✅ Bundle IDs configured (com.tshirtgen.app)
- ✅ EAS build profiles (dev, preview, production)
- ✅ Privacy Policy & Terms of Service
- ✅ App icons and splash screens
- ✅ Screenshot generation tooling
- ✅ Deep linking configured
- ✅ Apple App Store Connect ID: 6746427041
- ✅ Apple Developer Account ready
- ✅ Google Play Developer Account ready
- ✅ Domain live (tshirtgen.com) with policies accessible

---

## Phase 1: Final Pre-Submission Setup

### App Store Connect (Apple)
- [ ] Verify ASC App ID (6746427041) matches your app
- [ ] Create app listing if not exists
- [ ] EAS will handle certificates/provisioning automatically

### Google Play Console
- [ ] Create app listing in Google Play Console
- [ ] Add service account JSON to EAS for automated submissions (optional - can submit manually)
- [ ] Set up Google Play App Signing

---

## Phase 2: Pre-Submission Checklist

### App Configuration
- [ ] Verify version number strategy (currently 1.0.0)
- [ ] Set production environment variables in Supabase
- [ ] Configure production Stripe keys (currently test mode)
- [ ] Test all critical flows on production build

### Legal & Compliance
- [ ] Verify Privacy Policy URL is live (tshirtgen.com/policies/privacy-policy.html)
- [ ] Verify Terms of Service URL is live
- [ ] Prepare Support URL/email (support@tshirtgen.com)
- [ ] Complete COPPA compliance (app requires age 13+)

### Content Rating
- [ ] Complete IARC questionnaire (International Age Rating Coalition)
- [ ] Declare in-app purchases (subscription, t-shirt purchases)
- [ ] Declare user-generated content handling

---

## Phase 3: App Store Assets

### Screenshots (Need 6-8 per platform)
Current: 4 screens (Login, Generate, Closet, Profile)

Recommended additions:
- [ ] Cart/checkout flow
- [ ] Mockup preview gallery
- [ ] Order confirmation
- [ ] Share screen

Commands to generate:
```bash
npm run store:capture:web      # Capture screenshots
npm run store:frame            # Add device frames
npm run store:all              # Generate everything
```

### App Preview Video (Optional but recommended)
- 15-30 second demo showing:
  1. Enter a prompt
  2. AI generates design
  3. Preview mockups
  4. Add to cart

### Marketing Copy (Templates exist at .claude/skills/app-store-assets/marketing-copy.md)

**iOS App Store:**
- App Name (30 char): "TShirtGen - AI Design & Print"
- Subtitle (30 char): "Create Custom T-Shirts with AI"
- Keywords (100 char): "tshirt,design,ai,custom,print,art,fashion,create,generator,mockup"
- Description: Ready in marketing-copy.md

**Google Play:**
- Short description (80 char): Ready
- Full description (4000 char): Ready
- Feature graphic: ✅ Already generated

---

## Phase 4: Build & Submit

### iOS Build & Submit
```bash
# Build production binary
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios
```

### Android Build & Submit
```bash
# Build production AAB
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

---

## Phase 5: Store Submission (Manual Steps)

### iOS App Store Submission
1. Log into App Store Connect
2. Select your app (ID: 6746427041)
3. Fill in:
   - App Information (name, category, age rating)
   - Pricing (free with in-app purchases)
   - Screenshots (6.9" iPhone required, iPad optional)
   - Description, keywords, support URL
   - Privacy policy URL
4. Submit build from TestFlight
5. Submit for review

**Review time:** Typically 24-48 hours

### Google Play Store Submission
1. Log into Google Play Console
2. Complete store listing:
   - App details
   - Graphics (screenshots, feature graphic)
   - Categorization (Shopping or Lifestyle)
3. Complete content rating questionnaire
4. Set up pricing (free + in-app purchases)
5. Select countries for distribution
6. Submit for review

**Review time:** Typically 1-3 days (can be longer for new apps)

---

## Phase 6: Post-Launch

### Monitoring
- [ ] Set up Sentry alerts (already integrated)
- [ ] Monitor app store reviews
- [ ] Track crash reports
- [ ] Monitor Stripe dashboard for payments

### Updates
- [ ] Plan version 1.1.0 features based on feedback
- [ ] Respond to user reviews
- [ ] A/B test store listing (Google Play)

---

## Critical Files to Review

| File | Purpose |
|------|---------|
| `app.json` | App configuration, bundle IDs |
| `eas.json` | Build profiles, submit config |
| `.claude/skills/app-store-assets/marketing-copy.md` | Store descriptions |
| `public/policies/privacy-policy.html` | Required for both stores |
| `public/policies/terms-of-service.html` | Required for Apple |
| `assets/store-screenshots/` | Screenshots and feature graphic |

---

## Estimated Timeline (Direct to Public)

| Phase | Duration |
|-------|----------|
| ~~Account setup~~ | ✅ Done |
| Asset preparation | 1-2 days |
| Build & submit | 1 day |
| Review period | 1-7 days |
| **Total** | **3-10 days** |

---

## Quick Start Commands

```bash
# 1. Generate/refresh screenshots (if needed)
npm run store:all

# 2. Build both platforms
eas build --platform all --profile production

# 3. Submit to both stores
eas submit --platform ios
eas submit --platform android
```

---

## Pre-Launch Checklist

Before running builds:
- [ ] Ensure production Stripe keys are set in Supabase secrets
- [ ] Test a full purchase flow on a staging/preview build
- [ ] Verify all deep links work (share, reset-password, checkout)
- [ ] Check Sentry is receiving errors properly
- [ ] Review screenshots are up-to-date with current UI
