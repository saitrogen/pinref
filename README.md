# Pinref 📌

> **Pinterest Reference Moodboard & Single-Glance Vision System for AI Agents and Humans.**

Pinref turns Pinterest into an automated visual reference engine. Instead of returning raw links or flooding context windows with dozens of individual images, Pinref downloads a batch of high-resolution references and compiles them into a **single, numbered composite contact sheet (`contact_sheet.jpg`)**.

An AI agent inspects the entire batch in a **single vision pass**, reviews options by index (`#1`–`#12`), and zooms in only on chosen items.

---

## ⚡ Quickstart

```bash
# Search for references & build contact sheet
pinref search "cyberpunk character design" --count 12

# Find deeper variations of an image you liked
pinref similar "1057008975051301499"

# Inspect metadata of a single Pin
pinref pin "893049801158256972"
```

---

## 🖼️ How the Single-Glance Vision System Works

```text
User Query: "Find cyberpunk character references"
                      │
                      ▼
            [Pinterest Tier-1 API]
                      │ (Fast JSON in ~1s)
                      ▼
         [Download Concurrently]
          01_<id>.jpg, 02_<id>.jpg ...
                      │
                      ▼
        [Generate Contact Sheet (Sharp)]
          contact_sheet.jpg (#1 to #12)
                      │
                      ▼
           [Agent 1-Pass Vision]
     Agent inspects contact_sheet.jpg
      "I recommend #2 for cyberware"
                      │
                      ▼
             [Zoom in on #2]
       Agent views 02_<id>.jpg only
```

---

## 📁 Output Artifacts

Every search generates a self-contained folder under `references/<query-slug>/`:
- `contact_sheet.jpg`: Single high-resolution composite image with numbered badges (`#1` to `#12`), Pin IDs, and dominant color swatches.
- `gallery.html`: Interactive local web viewer with copy-to-clipboard buttons and full-size lightbox.
- `01_<id>.jpg`, `02_<id>.jpg`...: Original high-resolution images.
- `metadata.json`: Machine-readable mapping of index, Pin IDs, and remote CDN URLs.

---

## 🤖 Agent Skill Integration

Pinref includes a dedicated Skill ([skills/pinref/SKILL.md](./skills/pinref/SKILL.md)) following Antigravity customization guidelines:
- Teaches the agent to run `pinref search` when design inspiration is requested.
- Mandates calling `view_file` on `contact_sheet.jpg` first to save vision tokens.
- Defines index-based communication (`#1` through `#12`) between agent and human.
- Enables seamless branching via `pinref similar <pinId>`.

---

## 🛠️ Commands

| Command | Action |
| :--- | :--- |
| `pinref search <query> [-c 12] [-o ./path]` | Search & build contact sheet |
| `pinref similar <pinId> [-c 12]` | Fetch similar variations matching a Pin |
| `pinref pin <pinId>` | Inspect title, description, and direct image URL |
| `pinref "<query>"` | Quick shortcut for search |
