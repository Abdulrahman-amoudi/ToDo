# Original User Request

## 2026-08-24T13:26:52Z

# Teamwork Project Prompt — Draft

> Requested team: Full team

Fix the PDF upload and reading architecture in the Vibe Todos app to prevent extreme lag and Supabase statement timeouts caused by storing massive base64 PDFs directly in the database, and upgrade the viewing experience.

Working directory: d:\AI\جبنة\vibe-todos
Integrity mode: demo

## Requirements

### R1. Supabase Storage Migration
The application must upload PDF files to a Supabase Storage bucket named `media` and store only the public URL in the `vault_notes` database, rather than embedding the entire file as a base64 string. 

### R2. Automated Infrastructure Setup
The team must provide and execute a script (e.g., Node.js or SQL migration) that automatically creates the `media` storage bucket in the user's Supabase project and configures the necessary public access and RLS policies, ensuring it works out-of-the-box.

### R3. PDF Viewer UI Overhaul
The application's note reading interface must be upgraded to render the actual PDF document (allowing reading, scrolling, and interaction) rather than just dumping the extracted raw text, while still maintaining the AI quiz functionality alongside it.

## Acceptance Criteria

### Verification
- [ ] An automated test script (`scripts/verify-storage.js`) successfully uploads a mock file to the Supabase `media` bucket and retrieves a valid public URL without "Bucket not found" errors.
- [ ] An agent evaluator confirms that opening a PDF note in the UI renders the visual document (e.g. via an iframe or embedded viewer) and not just raw text.

## 2026-08-25T02:25:33Z

# Teamwork Project Prompt — Draft

> Requested team: Small, focused team

This is a single self-contained fix; keep it small and focused.

Fix the critical bugs in the PDF Note Viewer where annotations (highlights and text) fail to save upon refreshing the page, and resolve the layout issue where the PDF viewer does not stretch to fill the bottom of the screen (leaving the header/mascot awkwardly visible).

Working directory: d:\AI\جبنة\vibe-todos
Integrity mode: development

## Requirements

### R1. PDF Note Saving Stability
The application must correctly parse, persist, and retrieve PDF annotations (highlights and text boxes) to the Supabase backend. Edits made to a PDF must survive a full page refresh without being silently discarded due to parser errors or state lifecycle bugs.

### R2. Layout and Flex Constraints
When a user opens a PDF document, the layout must stretch to utilize all available vertical space. The PDF container must expand to reach the bottom of the viewport, and unrelated hero UI elements (such as the category header or Mascot) must not break the flexbox layout.

## Acceptance Criteria

### R1. Persistence
- [ ] An automated verification script successfully injects a mock annotation into a note's frontmatter, triggers the save operation, and successfully reads the exact same data back from the Supabase database without truncation or parsing errors.

### R2. Layout Integrity
- [ ] A DOM or component verification script confirms that when a `selectedNote` is active in `page.tsx`, the primary hero Mascot is no longer rendered and the NoteViewer wrapper inherits full height (`h-full` / `h-[100dvh]`) constraints.

## 2026-08-25T13:18:00Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Full team

Replace the internal `react-pdf` engine in `vibe-todos` with a more robust PDF rendering solution (e.g., a WebAssembly port of PDFium or an aggressively patched text-layer renderer) that flawlessly extracts right-to-left Arabic text for native text selection, while fully preserving the exact existing UI, toolbar, and custom React annotation tools.

Working directory: `d:\AI\جبنة\vibe-todos`
Integrity mode: development

## Requirements

### R1. Robust Arabic Text Recognition
Swap out the internal PDF rendering engine to solve the issue of misaligned, reversed, or skipped words in Arabic PDFs. The new engine must accurately extract and render right-to-left Arabic text layers to allow for flawless native browser text selection (for copying/pasting and highlighting).

### R2. UI and Annotation Tool Preservation
Keep the exact existing UI layout, toolbar, and React state logic in `PdfNotebookViewer.tsx`. The new viewer must support DOM overlays or a synced canvas so that the existing custom annotation tools (`onPointerDown` events, drawing freehand boxes, moving text notes) can be rendered directly on top of the PDF pages and remain perfectly synced when zooming or scrolling.

## Acceptance Criteria

### Verification of Arabic Text Extraction
- [ ] An agent-as-judge or programmatic script loads a complex Arabic PDF into the new viewer, simulates a text selection over an Arabic paragraph, and verifies that the extracted `window.getSelection().toString()` returns contiguous, correct Arabic words without skips or reversed characters.

### Verification of Tool Preservation
- [ ] An automated DOM check or agent-as-judge confirms that the existing React toolbar buttons (Pan, Cursor, Highlight, Text) are still fully functional and successfully update the local annotation state when drawing over the new PDF engine.

## 2026-08-25T14:20:09Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Small, focused team

This is a single self-contained fix; keep it small and focused. Refine the geometric clustering and DOM sorting algorithms in `src/lib/pdf/arabic-bidi.ts` to ensure that native browser text selection in `ArabicTextLayer` strictly respects column boundaries without drawing massively bloated horizontal selection boxes or jumping between columns unexpectedly.

Working directory: `d:\AI\جبنة\vibe-todos`
Integrity mode: development

## Requirements

### R1. Strict Horizontal Column Breaking
The clustering algorithm (`processPageTextContent`) must reliably break items into separate `ProcessedTextLine`s when a horizontal gap indicates a column boundary, even if the text elements share the same vertical baseline. This prevents the browser from rendering single `<span>` elements that stretch entirely across the page.

### R2. Transitive DOM Reading Order Sorting
The final array of `ProcessedTextLine`s must be sorted using a strictly transitive 2D spatial algorithm (e.g., column binning) that groups lines logically. For RTL documents, lines must be sorted into vertical columns right-to-left, and then top-to-bottom within those columns, preventing the native text selection from zig-zagging between left and right columns.

## Acceptance Criteria

### Verification of Column Breaking
- [ ] A programmatic unit test simulates text items with identical `top` values but a large horizontal gap (e.g., `left: 50` and `left: 400`), verifying that the output contains two distinct `ProcessedTextLine`s rather than one unified line.

### Verification of DOM Order Transitivity
- [ ] A test script feeds a simulated 2-column page layout (including a full-width header) to the sorting algorithm and verifies that the output strictly follows the correct logical RTL reading order without any horizontal interleaving of the two columns.

## 2026-08-27T02:57:06Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Full team

Perform a comprehensive architectural hardening and performance optimization of the Vibe Todos app to ensure zero data loss across local state and Supabase sync, and drastically improve speed. Resolve any lingering PDF viewer issues, and research/incorporate a Notion-style block editor (slash commands) to modernize the user experience.

Working directory: `d:\AI\جبنة\vibe-todos`
Integrity mode: development

## Requirements

### R1. Zero Data Loss Architecture
Harden the state management and Supabase synchronization pipelines. Ensure that PDF annotations are persisted across page changes/zooms, file uploads are robust and resilient, and database writes are queued or flushed properly so data is never lost if the app is closed quickly.

### R2. Extreme Performance Optimization ("Fast AF")
Eliminate UI lag. Optimize React render cycles and memoize expensive components (especially the PDF viewer engine). Ensure typing, highlighting, and scrolling interactions remain perfectly smooth without blocking the main browser thread.

### R3. Notion-Style Block Editor
Study the Notion application's UX and implement a rich block-based editor system. Users must be able to type `/` to open a slash-command menu to insert different types of blocks (e.g., text, headings, lists) seamlessly within their notes or todos.

### R4. PDF Viewer Bug Fixes
Identify and permanently resolve any remaining edge-case bugs in the custom PDF viewer and Arabic text clustering engine, ensuring a flawless and reliable annotation experience.

## Acceptance Criteria

### Verification of Reliability and Speed
- [ ] An automated stress test script simulates rapid typing, page switching, and file uploading, verifying that 100% of the data is successfully persisted to Supabase without any dropped frames or UI lockups.

### Verification of Notion UX
- [ ] An agent-as-judge visually confirms the successful implementation of a `/` slash-command block editor, verifying that typing `/` opens a functioning popup menu of block types that insert correctly into the document.

## 2026-09-09T09:39:36Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Creative team

Act as a company creative engineering team to execute a major visual overhaul of the Vibe Todos web application. Implement high-fidelity design systems using Google Stitch design tokens, revamp the Study Tab into a full-height immersive reading experience where all controls react dynamically to the active theme, resolve mascot state persistence and animation bugs, and enforce zero data loss across all user documents.

Working directory: `d:\AI\جبنة\vibe-todos`
Integrity mode: development

## Requirements

### R1. Zero Data Loss & Storage Integrity
Ensure that all existing and future user data—including books, PDFs, text notes, highlights, and annotations—remains 100% intact across all Supabase and local-first storage pipelines during and after the visual changes.

### R2. Mascot State Persistence & Animation Fixes
Fix the Bloub mascot state synchronization so that customizations (eye gaze direction, expressions, shapes, colors) strictly persist across full page reloads and tab switches. Fix the mascot animation pipeline so micro-interactions (such as the backflip) trigger reliably without visual glitches, state freezes, or reverting customization settings.

### R3. Universal Theme Remodeling & Study Tab Overhaul
Redesign the application's themes using bespoke Google Stitch design tokens and the `ui-ux-architect` standards. Overhaul the Study Tab into a full-height immersive workspace with auto-hiding sidebars and floating controls, ensuring that every panel, control, and background fully and dynamically adapts to the selected theme.

### R4. Stitch Design Integration & Concept Sign-Off
Leverage Google Stitch design tokens and screen layouts to construct the frontend interfaces. The team must formulate and record concrete visual proposals for the theme and layout overhaul before implementing code.

## Acceptance Criteria

### Data & State Verification
- [ ] An automated state persistence test confirms that changing the mascot's eyes, expression, shape, and color survives a browser page refresh without resetting to default.
- [ ] An automated database test confirms that existing notes, books, highlights, and annotations in Supabase and local storage are preserved with 100% integrity.

### Animation & Interaction Verification
- [ ] Automated interaction tests verify that triggering the mascot backflip executes cleanly from start to finish without console errors, CSS transform clipping, or resetting the mascot's persistent shape/eyes.

### Theme & Layout Verification
- [ ] An automated DOM inspection verifies that switching themes dynamically updates CSS variables and theme classes across all views, including every control and panel within the Study Tab.
- [ ] The Study Tab layout inherits full-height constraints (`100dvh` / `h-full`) with collapsible/auto-hiding sidebars and responsive floating controls.

## 2026-09-10T09:37:28Z

# Teamwork Project Prompt — Draft

> Requested team: Full company team (creative UI, UX architect, frontend developers, and pre-release QA test engineer)

Overhaul the Bloub Study application into a clean, spacious, distraction-free study environment featuring a full-height PDF and document reader with page-by-page note synchronization, collapsible library connected to the user's Obsidian Vault and real PDF uploads, and full pre-release test verification.

Working directory: d:\AI\جبنة\vibe-todos
Integrity mode: development

## Requirements

### R1. Clean, De-Cluttered Split Reader UI/UX
Completely remove the visual clutter, stacked metric cards, and crowded boxes. Implement a spacious, breathable split layout: a sleek collapsible library on the left, a prominent full-height reading canvas in the center, and a dedicated page-specific notepad on the right. Maintain the warm dark aesthetic with crisp typography and zero emojis (all SVG icons).

### R2. Authentic Obsidian Vault & PDF Upload Integration
Connect the document explorer directly to the user's authentic notes (Obsidian Vault / persistent storage) and support direct local PDF uploads via drag-and-drop or file selector. Eliminate synthetic placeholder text so the user's real study material is loaded and accessible.

### R3. High-Performance Arabic PDF Engine & Per-Page Notes
Ensure the PDF viewing engine renders real uploaded and stored PDFs with continuous scrolling, zooming, robust Arabic text selection, and annotation tools (highlighter box and text box). Bind the notepad strictly to the active PDF page number, ensuring notes and annotations persist reliably across page flips and refreshes.

### R4. Multi-Role Automated Testing & Verification
Implement and execute automated tests that verify:
1. PDF document loading, continuous multi-page scrolling, and zooming without UI freezes.
2. Note and annotation saving/retrieval per page without data loss.
3. Build compilation with 0 errors.

## Acceptance Criteria

### Aesthetic & Spatial Ergonomics
- [ ] Visual verification confirms that all crowded metric boxes and artificial stat cards are removed from the main study view, resulting in an open, full-height reading and note-taking workspace.
- [ ] Strict zero-emoji compliance: all indicators and actions use clean Lucide SVG icons.

### Data & PDF Engine Functionality
- [ ] Programmatic verification confirms a user can upload or open a real PDF file, scroll through multiple pages smoothly, and make annotations without errors.
- [ ] An automated test confirms that entering a note on Page X saves it specifically to Page X and reloads it accurately when returning to that page.
- [ ] The library connects to and displays authentic study items without dummy placeholder text.

### Pre-Deployment Quality Assurance
- [ ] The automated test suite passes with 0 failures before delivery.
- [ ] `npm run build` succeeds with exit code 0.

## 2026-10-15T17:48:11Z

# Teamwork Project Prompt

> Requested team: Small, focused team

This is a single self-contained fix; keep it small and focused. Replace the harsh shape-specific tap animations on Bloub with a fluid Grok-style morphing backflip (kinetic lines → square → circle) and a soft ambient dot constellation pulse matching the typing dots visual language.

Working directory: d:\AI\جبنة\vibe-todos
Integrity mode: development

## Requirements

### R1. Universal Grok Morphing Backflip
On tap/interaction, replace the harsh mechanical animations with a single, ultra-smooth acrobatic backflip:
- The mascot springs upward, smoothly morphs through kinetic lines, flips 360° transitioning from squarish geometry to a soft circle, and settles organically with silky spring easing (`cubic-bezier(0.16, 1, 0.3, 1)`) without violent edge-slamming or vertex collisions.
- Ensure consistent `transform-origin` and clean vertical physics across all sizes (hero mascot and settings preview).

### R2. Ambient Dot Constellation Particle Burst
Accompany the tap backflip with a soft constellation pulse of 6–8 glowing particle dots:
- Uses the same visual DNA (radii, soft drop-shadow glow, theme color tinting, and opacity easing) as the existing ambient and 3-dot Grok typing rhythm wave.
- The dots gently burst outward radially from the mascot upon tap impact, decelerate in an organic orbit, and dissolve/settle back gracefully as the mascot finishes its landing.

### R3. Preservation of Live Facial Micro-Animations & Typing Flow
- The 3-dot Grok typing rhythm wave (`grokDotWave`) and ambient levitating dots when typing must remain 100% untouched.
- Facial features (eyes/mouth/micro-animations like `mascotBlink`, laugh chortles, and sleep breathing) and horizontal RAF gaze tracking must remain fully functional and stable.

## Acceptance Criteria

### Kinetic & Visual Fidelity
- [ ] Tapping the mascot triggers the smooth acrobatic backflip morph (kinetic lines → square → circle) with zero harsh tumbling or vertex snapping.
- [ ] Tapping triggers the 6–8 dot constellation pulse in matching theme colors that seamlessly matches the aesthetic of the typing dots.
- [ ] Selecting shapes in the Settings tab triggers the new smooth morphing flip and particle burst cleanly.

### Verification & Robustness
- [ ] Automated test suite (`npm run verify`) passes with 12/12 suites green.
- [ ] Production build (`npm run build`) compiles with 0 errors.
