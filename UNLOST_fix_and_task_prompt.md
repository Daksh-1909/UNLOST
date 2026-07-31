# UNLOST — Bug Fix, UI/UX Cleanup & Feature Prompt

You are working on **UNLOST**, a campus Lost & Found platform. Stack: Flask + MongoDB backend (`app.py`), with a **React + TypeScript + Tailwind + Framer Motion SPA** in `src/` (the active frontend) and a **legacy set of Jinja2 templates** in `templates/` (older server-rendered pages that duplicate the same routes/features). Fix everything listed below, then implement the tasks at the end. Do not break existing working functionality while fixing bugs.

---

## 1. Backend Bugs (`app.py` and related scripts)

1. **Weak/hardcoded secrets** — `app.config['SECRET_KEY'] = 'your_secret_key_here'` and the JWT secret fallback `'default_jwt_secret_key_change_in_production'` are hardcoded placeholders. Move both to required environment variables with no insecure default in production.
2. **Stack traces leak to users** — the global `@app.errorhandler(Exception)` returns `str(error)` and effectively exposes internals in the HTTP response. Return a generic error message to the client; keep `traceback.format_exc()` only in server logs.
3. **No CSRF protection** on the legacy Jinja form routes (`/login`, `/register`, `/report`, admin actions) that rely on session cookies.
4. **Unvalidated `ObjectId(item_id)` conversions** — `verify_claim`, `delete_item`, `recover_item`, `api_delete_item`, `api_recover_item`, `api_verify_claim` all call `ObjectId(item_id)` without a try/except. A malformed ID crashes into the generic 500 handler instead of returning a clean 400.
5. **Overly permissive claim verification (`check_match`)** — a single overlapping non-stopword keyword between the user's answer and the stored answer counts as a match. This makes the "security question" feature trivial to bypass and needs tightening (e.g., require higher similarity, or drop the "any token in common" branch).
6. **No rate-limiting** on `/verify_claim` / `/api/verify_claim` or login endpoints — allows brute-forcing security answers and passwords.
7. **Timezone inconsistency** — `build_items_filter`'s date filter and `/report`/`/api/report`'s `date_obj` use naive `datetime.strptime(...)`, while other timestamps (`deleted_at`, `date_created`, logs) use timezone-aware `datetime.now(timezone.utc)`. This can cause date-filter mismatches and comparison errors.
8. **Unused/dead JWT flow** — `/api/login` issues a JWT access token that nothing in the app ever verifies with `@jwt_required`. Either wire it up somewhere or remove it to avoid confusion.
9. **Image upload validation is extension-only** — `allowed_file()` only checks the file extension via `secure_filename`, with no MIME-type check or file-size limit. Also, if an upload fails `allowed_file()`, the request still succeeds silently with no image and no error returned to the frontend.
10. **Debug `print()` of Mongo connection URI** — `print(f" * DEBUG: Connection URI: {uri}")` in `app.py` prints the raw connection string (which may contain credentials) to console/logs. Replace with `logger.debug` and redact credentials, or remove entirely.
11. **Hardcoded default admin credentials** in `create_admin.py` (`admin@unlost.com` / `admin123`) — flag this so it's never run as-is against a real deployment; require credentials via env vars or CLI args instead.
12. **Repo hygiene** — `db_test.log`, `db_test_2.log`, `reflog.txt`, and the ad hoc `test_connection.py` / `test_db.py` debug scripts are committed to the repo root and shouldn't ship in the codebase; move to `.gitignore` or a `scripts/`+`docs` area, or delete.
13. **Duplicated logic** between `/report` & `/api/report`, `/admin/delete_item` & `/api/admin/delete`, `/admin/recover_item` & `/api/admin/recover` — refactor into shared helper functions so fixes don't need to be applied twice.
14. **Dual-frontend duplication risk** — the Jinja templates (`templates/*.html`) and the React SPA (`src/`) independently implement the same features (login, register, items, report, profile, admin). Confirm which is the source of truth going forward; any bug fixed in one must currently be fixed in the other too, which is itself a bug-prone setup worth resolving (e.g., deprecate the Jinja pages if the React SPA is the real frontend).

## 2. Frontend Bugs & Glitches (`src/`)

1. **`Profile.tsx` crash risk**: `user?.username.slice(0, 2)` — optional chaining only protects `user?.username`; if `user` is `null`/`undefined`, `.slice(0, 2)` is called on `undefined` and throws. Fix to `user?.username?.slice(0, 2)`.
2. **`Contact.tsx` doesn't actually send anything** — `handleContactSubmit` just runs a `setTimeout` and shows a fake "Message Sent" success state. No API call is made, so submitted messages go nowhere. Needs a real backend endpoint (e.g. `/api/contact`) or should be clearly disabled until implemented.
3. **No search debounce in `Items.tsx`** — the `useEffect` that calls `fetchItems()` fires on every keystroke in the search box, hitting `/api/items` on every character. Add a debounce (e.g. 300–400ms).
4. **`Home.tsx` fetches the entire item list then slices to 10 client-side** (`data.items.slice(0, 10)`), instead of asking the backend for a limited set — wasteful as data grows, and inconsistent with how the legacy Jinja `home()` route already limits to 10 server-side.
5. **Inconsistent status badge colors** — `Items.tsx` explicitly styles `Lost` / `Claimed` / `Found`, but `Home.tsx`'s badge logic only checks for `Lost` vs. "anything else" (so a `Claimed` item shows the same green as `Found`). Align status-color logic across both pages.
6. **Navbar icon duplication** — "Home" and "Items" both use the same `Search` icon in the nav list, so they're visually indistinguishable in the icon-only mobile view. Give Home its own icon.
7. **Invalid Tailwind class** — `Navbar.tsx` uses `hover:bg-slate-850`, which isn't a real Tailwind shade (default scale stops at 900/950) and will silently do nothing. Replace with a valid shade.
8. **`Report.tsx` security question/answer pairing isn't validated** — a user can fill in a security *question* without an *answer* (or vice versa), producing an item where the claim modal says "no security answer configured" despite a question being shown, which is confusing. Add matching validation (both filled or both empty).
9. **Image type mismatch between frontend and backend** — the file input in `Report.tsx` accepts `accept="image/*"` (any image type, e.g. `.webp`), but the backend only allows `png/jpg/jpeg/gif` and silently drops disallowed files without telling the user. Align the accepted types and surface a clear error if rejected.
10. **No pagination** on `/admin/logs`/`Admin.tsx` "Logs" tab or the items list — could become slow to load as data grows.
11. **Legacy templates vs. SPA visual mismatch** — `static/css/` (used by the Jinja templates) is a separate stylesheet from the Tailwind system used by the React SPA, so the "old" pages likely don't match the current color palette/design language at all (see Task 4 below).

## 3. Feature / Enhancement Tasks

1. **Enhance Smilo's (the chatbot's) responses.**
   > ⚠️ Note: I could not locate any "Smilo" chatbot component, route, or API integration anywhere in the current codebase (`app.py` or `src/`). Before this task can be scoped, please point to the file(s)/repo where Smilo actually lives (or confirm it needs to be built from scratch), and share what its current response logic/prompt looks like so it can be improved.

2. **Fix all bugs and glitches listed in sections 1 and 2 above.**

3. **Improve the visual polish of UI components where needed** — beyond fixing outright bugs, review spacing, hover states, empty/loading states, and modal/table responsiveness across `Home`, `Items`, `Report`, `Profile`, `Admin`, `Login`, `Register`, and `Contact` for consistency and polish, without introducing new colors (see Task 5).

4. **Restrict login to `@paruluniversity.ac.in` email addresses only.**
   - Enforce this on `/login`, `/api/login`, `/register`, `/api/register` (reject registration/login for any other domain).
   - Also enforce it on the Google OAuth flow (`/login/google` → `/auth/google/callback`): if the authenticated Google account's email is not on `@paruluniversity.ac.in`, deny access, log the user out/reject the session, and show a clear error instead of creating an account.
   - Show a clear, user-facing validation message on both the login and register forms (client-side hint + server-side enforcement) so users understand the restriction before submitting.

5. **Apply the Home page's color palette to every page and component — do not change the existing palette itself.**
   - Treat the palette currently used on `Home.tsx` / defined in `tailwind.config.js` and `index.css` (`#0f172a` background, indigo → purple → pink gradient accents, `glass-panel` / `glass-card` / `glass-input` utility classes, slate text tones) as the single source of truth.
   - Audit every page/component (`Login`, `Register`, `Items`, `Report`, `Profile`, `Admin`, `Contact`, `Navbar`, and the legacy Jinja templates/`static/css` if still in use) and bring any divergent colors, gradients, or ad hoc styles in line with this exact palette.
   - Do not introduce new colors, new gradients, or alter the existing indigo/purple/pink + slate/`#0f172a` palette — only reuse and consistently apply what's already defined.

---

**Execution order suggestion:** fix section 1 (backend) → section 2 (frontend) bugs first, then tackle tasks 3–5, and revisit task 1 (Smilo) once its source is located.
