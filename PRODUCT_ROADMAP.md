# Yawmiyyati — Product Roadmap & Enhancement Ideas

> This file is a living log of future product ideas. Add ideas here as they come.
> Do not delete old ideas — mark them with a status instead.

---

## STATUS KEY
- 💡 Idea — not yet planned
- 🗓 Planned — approved for a future version
- 🔨 In Progress — currently being built
- ✅ Done — shipped
- ❌ Dropped — decided against

---

## PHASE 2 IDEAS (Post-1K Users)

### 💡 IDEA-001 — Multi-Language Support (Hindi, Urdu, Indonesian)
**What:** Add 3 new languages to the app UI — Hindi, Urdu, and Bahasa Indonesia
**Why:** Opens the product to the 3 largest Muslim-majority populations outside the Arab world:
- Indonesia: ~230M Muslims (largest Muslim country globally)
- Pakistan/India: ~400M combined Urdu/Hindi-speaking Muslims
**Effort:** High — requires full i18n pass on all UI strings + RTL handling for Urdu
**Dependencies:** Existing i18n system (English/Arabic already in place) needs extending
**Notes:** Urdu is RTL like Arabic — reuse existing RTL layout. Hindi and Indonesian are LTR.

---

### 💡 IDEA-002 — Daily Diary (Personal Reflection Notes)
**What:** A private daily note/diary feature — users write their thoughts, reflections, or intentions each day
**Why:** Deepens daily engagement beyond tracking. Creates emotional attachment to the app.
Complements the existing prayer/dhikr tracking with a reflective layer.
**Effort:** Medium — text entry, per-day storage, simple list view
**Notes:**
- Keep it private by default (not shareable)
- Consider linking to the daily log (same date as prayer record)
- Could be a premium feature to increase conversion
- Could add prompts/questions to guide reflection ("What are you grateful for today?")

---

### 💡 IDEA-003 — Islamic Knowledge Index (Hadith & Sunnah Platform)
**What:** A searchable library of Hadith and Sunnah content that users can browse, save, and share
**Why:** Adds deep value beyond habit tracking. Positions Yawmiyyati as a full Islamic companion, not just a tracker.
Shareable content drives organic referrals back to the website.
**Effort:** Very High — requires content licensing or open-source Hadith database integration,
search infrastructure, and a sharing/attribution system
**Dependencies:**
- Hadith database (consider: sunnah.com API, hadith-api on GitHub, or licensed content)
- Reference attribution system (every shared item links back to yawmiyyati.com)
- User sharing flow (copy link, WhatsApp share, social share)
**Notes:**
- Attribution to yawmiyyati.com on every shared piece = organic growth channel
- Could be a separate tab in the app ("Learn" or "مكتبة")
- Consider allowing users to save favorites and build personal collections

---

## PHASE 1 IDEAS (Approved — Building Now or Next)

### 🔨 IDEA-004 — Marketing Landing Page
**What:** Public-facing homepage at yawmiyyati.com for non-users. Signup → straight into app.
**Status:** In planning

### 🔨 IDEA-005 — Onboarding Flow
**What:** First-time user personalization flow (commitment preferences, age, acquisition channel)
**Status:** In planning

### 🔨 IDEA-006 — Referral System
**What:** Refer 5 friends who sign up → get 1 month premium free
**Status:** In planning

### 🔨 IDEA-007 — Admin Dashboard Enhancements
**What:** 4-tab admin panel for t.mabrouk@outlook.com:
- Subscription status reports
- Change user subscription (free ↔ premium)
- Create & assign offers
- Generate promo serial codes
**Status:** In planning

---

## CHANGELOG
- 2026-05-28: Initial roadmap created. Ideas 001–003 logged from founder session.
  Ideas 004–007 approved for Phase 1 build.
