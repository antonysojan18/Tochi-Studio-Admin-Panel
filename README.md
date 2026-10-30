# Tochi .dev Studio // Internship OS
### Internal Internship & Student Lifecycle Automation Engine
**Engineered for Tochi .dev Studio // Autonomous Systems & Digital Engineering**

![Theme](https://img.shields.io/badge/Theme-Warm_Ivory_%26_Burgundy-541228)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)
![MSME](https://img.shields.io/badge/MSME-Registered-541228)

---

## 🏛️ Executive Summary

**Tochi .dev Studio Internship OS** is an internal operations command center engineered for **Tochi .dev Studio**. It provides a clean, minimalist, high-velocity interface for student ingestion, smart sequence ID assignment, 4-stage lifecycle management, dynamic vector PDF generation with cryptographic QR verification, automated transactional emails with attachments, and 1-click WhatsApp messaging.

---

## 📄 1. Document Automation: Offer Letter & Certificate of Completion

### A. Certificate of Internship Completion
- **Visual Design:** Uses the official Tochi .dev Studio certificate template with dual-corner polygonal framing in deep burgundy on warm ivory.
- **Dynamic Fields:**
  - **Student Name:** In bold burgundy uppercase.
  - **Internship Domain:** Specific specialization track (e.g., AI Web Development, Automation, Gen UI/UX).
  - **Internship Duration:** Start Date to End Date.
  - **Certificate ID:** Auto-assigned sequence ID (e.g., `TCL-26Q4-WEB-0001`).
  - **Live Verification QR Code:** Real scanning QR code that directs live to `/verify?hash=...`.
  - **Signatory:** Founder, Tochi .dev Studio (Antony Sojan).
  - **Accreditation:** Ministry of MSME, Govt. of India (MSME Registered).

### B. Offer Letter Template
- **Logo:** Features the official `TOCHI /LABS` logo.
- **Branding:** Tochi .dev Studio.
- **Design:** Clean typography, spacious margins, warm ivory background, and deep burgundy accents without visual clutter.
- **Signatory:** **Antony Sojan, Founder** only.
- **Terms:** 4-week structured intensive schedule, scope, deliverables, and live verification QR code.

---

## 🔐 2. Authentication & Terminal Security

Protected routes like `/dashboard` require administrator authentication via Next.js Middleware.

### Credentials:
- **Username:** `Admin`
- **Password:** `antony.18`

### Security Measures:
- **HMAC-SHA256 Signed Session Tokens:** Stored in HTTP-only, `SameSite=Lax` cookies (`tochi_session`).
- **Timing-Safe Password Comparison:** Validated via `crypto.timingSafeEqual`.
- **Anti-Brute Force Protection:** Automatic lockout after 5 consecutive failed login attempts for 15 minutes.
- **Next.js Middleware:** Intercepts unauthenticated visits to `/dashboard` and redirects to `/login`.

---

## 🚀 3. Quickstart Guide

### 1. Start Development Server
```bash
npm run dev
```

### 2. Access the Terminal
- **Login Terminal:** [http://localhost:3000/login](http://localhost:3000/login)
  - **Username:** `Admin`
  - **Password:** `antony.18`
- **Command Center:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Public Verification:** [http://localhost:3000/verify](http://localhost:3000/verify)

---

## ☁️ 4. Vercel Deployment Guide

Deploying **Tochi .dev Studio OS** to Vercel takes less than 2 minutes:

### Step 1: Import Project into Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and select **`antonysojan18/Tochi-Studio-Admin-Panel`**.
3. Framework Preset: **Next.js** (auto-detected).
4. Root Directory: **`./`** (default).

### Step 2: Configure Environment Variables
In the Vercel project configuration screen, open the **Environment Variables** section and add the following keys (from your `.env.local`):

| Variable Name | Description | Example / Source |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://lfrgpiohvjilxkgvfdhr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJhbGciOi...` |
| `GMAIL_USER` | Official Gmail Account | `tochi.devstudio@gmail.com` |
| `GMAIL_APP_PASSWORD` | 16-character Google App Password | Generated from [Google App Passwords](https://myaccount.google.com/apppasswords) |
| `STUDIO_EMAIL` | Sender Email | `tochi.devstudio@gmail.com` |
| `STUDIO_FOUNDER` | Founder Signatory | `Antony Sojan` |
| `STUDIO_MSME_REG` | Accreditation Status | `MSME Registered` |
| `ADMIN_USERNAME` | Operator Username | `Admin` |
| `ADMIN_PASSWORD` | Operator Security Key | `antony.18` |
| `AUTH_SECRET` | 256-bit Random Secret Key | Generated string for HMAC tokens |

### Step 3: Deploy & Verify
1. Click **Deploy**. Vercel will build and assign a production URL (e.g., `https://tochi-studio-admin-panel.vercel.app`).
2. Log in at `/login` with your configured operator credentials.
3. Your database records from Supabase and direct Gmail dispatches will operate immediately.
