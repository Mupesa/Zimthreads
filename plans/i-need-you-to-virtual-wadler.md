# Zimthreads Website Plan

## Context
Build a full multi-page website for Zimthread Collective — a shoe cleaning, custom apparel & personalization brand. The reference image shows a complete desktop design with a public site and an admin dashboard. This project starts from a blank App.tsx in a React + Vite + Tailwind v4 scaffold.

## Aesthetic
- **Stance:** Swiss/editorial with sportswear grit — strict grid, bold display headings, minimal ornamentation
- **Palette:** Off-white (#F5F2EC) background, near-black (#1A1A1A) foreground, olive/military green (#4A5C2D) as primary/CTA, warm white cards
- **Fonts (Google Fonts):** Barlow Condensed (display/headings — bold, condensed, sporty) + Inter (body/UI)
- **Dark mode for admin dashboard**, light mode for public site

## Architecture

### Install
- `react-router` (for multi-page routing)

### File Structure
```
src/
  index.css          — Google Fonts @import + Tailwind + tokens
  App.tsx            — RouterProvider
  routes.ts          — createBrowserRouter
  pages/
    Home.tsx         — Hero, categories, services, why-choose
    Services.tsx     — Shoe cleaning, custom apparel, personalization
    Shop.tsx         — Product grid
    Booking.tsx      — 5-step booking flow
    Blog.tsx         — Blog listing
    About.tsx        — About page
    Contact.tsx      — Contact form
    admin/
      Dashboard.tsx  — Admin shell with sidebar
  components/
    Navbar.tsx       — Top nav with mobile hamburger
    Footer.tsx       — Footer
    admin/
      Sidebar.tsx    — Admin sidebar nav
      StatsCard.tsx  — Stat tile
      BookingTable.tsx — Recent bookings table
```

## Pages to Build

### Public Site
1. **Home** — Hero ("More Than Clean. It's Care."), trust badges, shoe category scroll, services grid (Shoe Cleaning / Custom Apparel / Personalization), why-choose section, CTA banner
2. **Services** — Expanded service cards with descriptions and pricing tiers
3. **Shop** — Product grid (cleaning kits, apparel, accessories)
4. **Booking** — 5-step wizard: Service → Details → Date & Time → Review → Confirmed
5. **Blog** — 3-column article grid
6. **About** — Brand story + team
7. **Contact** — Form + location/contact info

### Admin Dashboard (`/admin`)
- Sidebar: Dashboard, Bookings, Orders, Services, Products, Blog Posts, Customers, Settings, Logout
- Stats row: Total Bookings (128), Pending Bookings (18), Total Customers (342), Total Orders (95)
- Recent Bookings table: name, service, date/time, status badge (Pending/Confirmed)
- Quick Actions panel: New Booking, Add Product, New Blog Post, View Orders

## Responsive Behavior
- Mobile hamburger menu collapsing full-screen nav
- Service cards stack to 1 column on mobile
- Admin sidebar collapses to bottom tab bar on mobile
- Booking wizard adapts to single column on mobile

## CSS Tokens (in src/index.css)
```css
@theme inline {
  --color-brand-green: #4A5C2D;
  --color-brand-cream: #F5F2EC;
  --color-brand-dark: #1A1A1A;
}
```

## Fonts
Add to top of `src/index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
```

## Seed Data
- Realistic booking entries: John Doe (Deep Clean), Tinashe Moyo (Restore), Ashley R. (Clean), Brandon M. (Deep Clean)
- Realistic blog posts, product names, and service descriptions

## Verification
- Navigate all routes in the preview
- Check mobile layout at ~375px width
- Confirm booking wizard steps advance and complete
- Check admin dashboard stats and table render correctly
