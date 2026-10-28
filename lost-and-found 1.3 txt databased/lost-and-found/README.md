# FindIt — Lost & Found Platform (React + Node.js)

A multi-organization lost-and-found platform. Any organization (college,
university, hospital, company, etc.) can register; once approved by the
super-admin, its members (students / staff / patients / employees) can create
accounts under that organization and post lost or found items with a photo.
Anyone who finds their item can view the poster's contact info (after
logging in) and reach out directly.

## What's inside

This is a **full-stack** project with 3 parts, matching your 3 requirements:

1. **Main Site** (public) — browse organizations, browse lost/found items,
   post an item, view item details & contact info. Logged-in users get an
   **OLX-style** experience:
   - **My Items** (`/my-items`) — every item a user has posted, with Edit,
     Mark Resolved and Delete actions.
   - **Edit Item** (`/items/:id/edit`) — update title/description/category/
     contact info, replace or remove the photo. Only the original poster
     can edit or delete their own item (enforced on the backend too).
   - **My Profile** (`/profile`) — edit name, phone, bio, address/city/
     state, profile photo, and change password.
   - **Advanced organization search** — every organization has a rich
     profile: description, full address, city, district, state, pincode,
     website and logo. `/organizations` lets a visitor filter by type,
     city, district and state, and free-text search across name +
     description + location, so an organization is easy to find.
   - **Help & Tutorials** (`/help`) — a FAQ covering every part of the
     site (finding an org, signing up, posting/editing items, contact
     visibility, chat, organization dashboard, admin approval), ending
     with a support email for anything else — set via `SUPPORT_EMAIL`
     in the backend `.env`.
   - **Chat with poster** — from any item's detail page, a logged-in
     member can click **Chat with poster** to open a direct, private,
     item-linked conversation with whoever posted it (member-to-member
     only — organizations/admin don't take part). **Messages** in the
     navbar lists every conversation with an unread badge; messages
     refresh automatically every few seconds without needing sockets.

2. **Organization Panel** — register (with description/location/website),
   log in, and get a full dashboard:
   - **Overview** — member/item stat cards + activity charts (lost vs
     found over the last 14 days, open vs resolved split).
   - **Items** — every item posted under the org, with search, category,
     status and date-range filters, sorting, and delete.
   - **Members** — every registered member, searchable by name/email/city.
   - **Organization Profile** — edit description, full address/city/
     district/state/pincode, phone, website, and upload/remove a logo —
     this is exactly what shows up in public search results.

3. **Super Admin Panel** — approve / reject / delete organizations, and:
   - **Overview** — platform-wide stats + growth charts (organizations/
     users/items over 14 days), organizations-by-type breakdown, top
     organizations by items posted, approval-status split.
   - **Organizations** — advanced filters (status, type, city, state,
     free text), click a row to expand full details (email, phone,
     website, full address, description), approve/reject/delete.
   - **Members** — every user on the platform, searchable and filterable
     by organization, with remove.
   - **Items** — every item on the platform, searchable and filterable by
     category/status/organization, for moderation.
2. **Organization Panel** — an organization registers/logs in and gets a
   dashboard: stats, all items posted under it, all its members.
3. **Super Admin Panel** — approve / reject / delete organizations, and see
   platform-wide stats. This is the account that decides which organizations
   go live on the main site.

**Database:** No SQL/Mongo — data is stored as JSON inside plain `.txt`
files under `backend/data/` (`organizations.txt`, `users.txt`, `items.txt`,
`admin.txt`). **Photos** are saved to `backend/uploads/` and served as static
files. This matches your requirement of a file-system based "database".

```
lost-and-found/
├── backend/                 Node.js + Express API
│   ├── data/                 <-- your "database" (.txt files, auto-created)
│   ├── uploads/               <-- uploaded item photos (auto-created)
│   ├── middleware/            auth (JWT) + photo upload (multer)
│   ├── routes/                authRoutes, itemRoutes, orgRoutes, adminRoutes
│   ├── utils/                 fileDb.js (the file-based DB engine)
│   └── server.js
└── frontend/                 React (Vite) app
    └── src/
        ├── pages/             Home, OrgSelect, OrgItems, ItemDetail,
        │                      Login/Register (user), OrgLogin/OrgRegister/
        │                      OrgDashboard, AdminLogin/AdminDashboard
        ├── components/        Navbar, ItemCard, ProtectedRoute
        └── context/           AuthContext (stores logged-in role + token)
```

## How the file-based "database" works

`backend/utils/fileDb.js` treats each `.txt` file as one table:

- `readTable(name)` — reads and JSON-parses the whole file
- `insert(name, record)` — appends a record with a generated `id` + `createdAt`
- `updateById` / `removeById` / `findById` / `findMany` — usual CRUD
- Writes are queued per-file so two simultaneous requests can't corrupt data

You can literally open `backend/data/organizations.txt` in a text editor and
read/edit the data — it's a real, human-readable file, just like you asked.

## Setup & run

**Requirements:** Node.js 18+ installed on your machine.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev        # or: npm start
```

The server starts on **http://localhost:5000**. On first run it prints a
default super-admin login to the console, e.g.:

```
Default super-admin created -> username: "admin", password: "admin123"
```

Use that to log in at the Admin Panel. You can change it later by editing
`backend/data/admin.txt` (or by changing `.env` before the very first run).

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Opens on **http://localhost:5173**. It auto-proxies `/api` and `/uploads`
requests to the backend (see `vite.config.js`), so just run both and use
the frontend URL.

## Typical flow to test everything

1. Go to `/org/register` → register e.g. "ABC College" (type: college).
   It stays **pending**.
2. Go to `/admin/login`, log in with the printed default admin creds.
3. In the Admin Panel, **Approve** "ABC College".
4. Go to `/org/login` and log in as that organization → see its (empty)
   dashboard.
5. Go to `/register` (the main site's user signup) → select "ABC College"
   from the dropdown → create a student/staff account.
6. Log in as that user → click **+ Post Item** → post a lost or found item
   with a photo.
7. Go to `/organizations` → open "ABC College" → see the item in the public
   list. Contact info is hidden until you're logged in.
8. Click **My Items** in the navbar → try **Edit** (change text, swap or
   remove the photo), **Mark Resolved**, and **Delete**.
9. Click **My Profile** → update your name/phone, or change your password.

## New API routes (search, editing, profiles & dashboards)

| Method | Route | Who | Purpose |
|---|---|---|---|
| GET | `/api/items/organizations` | public | Search organizations — `q`, `type`, `city`, `district`, `state` |
| GET | `/api/items/organizations/filters` | public | Distinct city/district/state/type values, for filter dropdowns |
| GET | `/api/items` | public | List items for one org — `orgId`, `category`, `status`, `q`, `sort`, `dateFrom`, `dateTo` |
| GET | `/api/items/mine` | user | List only items I posted |
| PUT | `/api/items/:id` | user (owner) | Edit my item; `photo` file to replace, or `removePhoto=true` |
| PUT | `/api/items/:id/resolve` | user (owner) | Mark my item as resolved |
| DELETE | `/api/items/:id` | user (owner) / org / admin | Delete an item (also deletes its photo file) |
| GET/PUT | `/api/user/me` | user | View/edit my profile (name, phone, bio, address/city/state, photo, password) |
| GET/PUT | `/api/org/me` | org | View/edit org profile (description, full location, website, phone, logo) |
| GET | `/api/org/items` | org | Org's items — filters + sort + date range |
| GET | `/api/org/users` | org | Org's members — searchable |
| GET | `/api/org/stats` / `/api/org/analytics` | org | Dashboard stat cards + 14-day activity charts |
| GET | `/api/admin/organizations` | admin | All organizations — filters: `status`, `type`, `city`, `state`, `q` |
| GET | `/api/admin/users` | admin | All users — filterable by `orgId`, searchable |
| DELETE | `/api/admin/users/:id` | admin | Remove a user account |
| GET | `/api/admin/items` | admin | All items — filterable by `orgId`, `category`, `status`, searchable |
| GET | `/api/admin/stats` / `/api/admin/analytics` | admin | Platform stat cards + growth charts + top organizations |
| GET | `/api/meta` | public | Site metadata (currently: the support contact email for the Help page) |
| POST | `/api/chat/start` | user | Start/resume a conversation about one item with its poster |
| GET | `/api/chat/conversations` | user | My conversations, with unread counts, newest activity first |
| GET | `/api/chat/unread-count` | user | Total unread messages, for the navbar badge |
| GET | `/api/chat/conversations/:id/messages` | user (participant) | A conversation's messages (also marks it read for me) |
| POST | `/api/chat/conversations/:id/messages` | user (participant) | Send a message |

Set `SUPPORT_EMAIL` in `backend/.env` to whatever address you want shown at
the bottom of the Help page for "contact the company".

## Notes / things you can extend later

- Passwords are hashed with bcrypt; sessions use JWT (7-day expiry).
- Contact info on an item is visible to any logged-in account (user, org,
  or admin) — you can tighten this to "same organization only" if you want.
- Users can mark their own item **resolved**; org admins and users can
  delete items (with photo cleanup from `/uploads`).
- To move to a real database later, you'd only need to rewrite
  `utils/fileDb.js` — every route file talks to it through the same
  `insert/findById/findMany/updateById/removeById` functions.
