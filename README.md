# PARF Unified Tracker Site

Live at: https://fbqc.lancelotbiz.com/

## Structure

- `index.html` — The Guild Board (hub/menu page), the site's homepage
- `CNAME` — points this repo at fbqc.lancelotbiz.com (do not delete)
- `qc/` — Faire QC Tracker, live at /qc/

## Adding the next tracker (e.g. Punch List)

1. Create a new folder at the repo root, e.g. `punch-list/`
2. Drop in that tracker's files (index.html, manifest.json, sw.js, icons, etc.)
3. Check for any absolute paths (starting with `/`) inside its index.html — fix to relative (`./`) if found
4. If it has a manifest.json, confirm `start_url` and `scope` are relative (`"./index.html"`, `"./"`) not `"/"`
5. In the hub's index.html, find that tracker's card and:
   - change `href="#"` to `href="/punch-list/"`
   - change `<span class="status placeholder">Add link</span>` to `<span class="status live">Live</span>`
   - remove `target="_blank" rel="noopener"` since it's now an internal page, not an external tool
6. Commit, wait for the Pages rebuild, test both `/punch-list/` directly and the hub link

## Notes

- Each tracker keeps its own Firebase/EmailJS project — only the hosting URL changes, not the backend.
- If a tracker's original repo has its own CNAME file, don't copy it in — only the root CNAME should exist, shared by the whole site.
