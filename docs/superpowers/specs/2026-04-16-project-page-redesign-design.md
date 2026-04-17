# Project Page Redesign Design

Date: 2026-04-16
Topic: Kickstarter-style fundraising project page redesign for `app/projects/[slug]/page.tsx`

## Goal

Redesign the fundraising project page so it feels closer to Kickstarter in both functionality and hierarchy while fixing current regressions:

- Campaign information should render clearly and preserve project content.
- The page should use sticky section navigation instead of isolated tab panels.
- Campaign content should have stronger section hierarchy and better reading rhythm.
- Updates content should no longer feel squeezed or cramped.
- Creators should be able to add structured campaign content that actually appears on the public page.

## User-Approved Direction

The page will move from panel-based tab switching to a single long-form page with anchored sections:

- `Campaign`
- `Rewards`
- `FAQ`
- `Updates`
- `Comments`

The existing top navigation treatment will be retained conceptually, but it will become a sticky section nav that scrolls the page to sections and highlights the active section while the user reads.

## Current-State Findings

### Public page structure

The current route in `app/projects/[slug]/page.tsx` renders a two-column layout with:

- Main content column
- Sticky right rail funding widget
- `ProjectPageTabs` mounted inside the main content column

The `ProjectPageTabs` component currently:

- Stores active tab state client-side
- Conditionally renders campaign, rewards, FAQ, updates, and comments panels
- Parses campaign headings from `descriptionHtml`
- Uses `dangerouslySetInnerHTML` to render the campaign body

### Content authoring mismatch

The campaign content authoring path currently uses plain textarea input in creation and edit flows:

- `components/creation/Step1_BasicInfo.tsx`
- `components/project/EditProjectForm.tsx`

The public page expects rendered HTML structure, but the authoring experience is still effectively raw text. This mismatch is a contributor to the perception that project information is no longer appearing correctly or is not being expressed with enough hierarchy.

### Likely source of the cramped content feel

The current public campaign and updates areas are nested inside a boxed tab container and rendered with compact prose sizing (`prose-sm`) and dense card styling. That combination makes:

- Campaign content feel visually flattened
- Updates feel narrow and squeezed
- Content feel less substantial than a fundraising page should

## Proposed Experience

## 1. Page Architecture

Replace in-place tab switching with a long-form anchored page.

### Desktop

- Keep a two-column layout
- Left column contains the full project story and all sections in one flow
- Right column contains the sticky funding widget
- Sticky section nav appears above the story content and remains visible while scrolling

### Mobile

- Collapse to a single column
- Sticky section nav becomes horizontally scrollable
- Funding widget becomes inline
- Add repeated CTA treatment near the top and/or as a bottom action bar if needed

### Section order

The page should render in this order:

1. Hero/title/creator context
2. Cover media
3. Sticky section navigation
4. Campaign
5. Rewards
6. FAQ
7. Updates
8. Comments

## 2. Sticky Section Navigation

The current tab control will be redesigned into a scroll navigation component.

### Behavior

- Clicking a nav item smoothly scrolls to the matching section
- The URL hash updates to reflect the active section
- As the user scrolls, the active section is highlighted
- The nav remains visible beneath the page header
- Nav offsets must account for any existing sticky header and desktop sticky widget overlap

### Content

The nav labels remain:

- Campaign
- Rewards
- FAQ
- Updates
- Comments

Counts can remain on labels where useful, for example:

- `Rewards (3)`
- `Updates (4)`
- `Comments (12)`

## 3. Campaign Section Hierarchy

The `Campaign` section should become the editorial center of the page instead of just an HTML blob inside a tab panel.

### Structure

The section should include:

- A clear campaign section heading
- Optional subsection chips generated from campaign `H2/H3` headings
- The campaign body rendered with improved spacing and content rhythm

### Styling goals

- Increase visual separation between major headings and body text
- Use roomier content width and spacing
- Improve list, image, blockquote, and paragraph presentation
- Avoid the boxed, compressed feel of the current tab container

### Heading model

Campaign content should support:

- `H2` for major sections
- `H3` for sub-sections

These headings will drive:

- In-page subsection chips
- FAQ inference when headings are question-shaped
- Better scroll targets and deep-linking

## 4. Updates Section

The `Updates` section should remain on the main page but gain stronger layout and content rhythm.

### Changes

- Widen the readable update content area
- Increase update title prominence
- Improve date and visibility metadata clarity
- Reduce the cramped nested-card feeling
- Preserve backer-only update locking behavior

### Posting behavior

If the current user is the creator and the project is active, the update composer remains at the top of the `Updates` section rather than appearing inside a hidden panel.

## 5. FAQ Section

The FAQ section will remain lightweight for this pass.

### Initial behavior

- Infer FAQ items from campaign headings that look like questions
- Show those items in a dedicated FAQ section
- Clicking an FAQ item scrolls to the matching campaign answer in the campaign body

This preserves the existing inferred FAQ behavior while aligning it with the new anchored-page architecture.

## 6. Comments Section

The comments area remains on the same page and should preserve current functionality:

- Logged-in non-creators can ask questions or leave feedback when the campaign is active
- Creators can reply
- Logged-out users are prompted to log in

### UX improvement goals

- Keep the input clearly visible and not hidden behind tab switching
- Maintain readable conversation spacing
- Preserve creator/reply distinction visually

## 7. Funding Widget

The funding widget should remain sticky on desktop.

### Desktop

- Sticky right rail widget remains visible while reading
- Layout should avoid collision with sticky section navigation

### Mobile

- Funding widget becomes inline within the content flow
- Prioritize a clear “Back this project” CTA without a sidebar pattern

## 8. Campaign Authoring Model

Replace the plain textarea campaign content field with a constrained rich-text editor in project creation and edit flows.

### Why

This is the cleanest way to ensure creators can provide structured campaign content that renders properly on the public page without relying on implicit formatting rules.

### Supported first-pass blocks

- Paragraph
- Heading 2
- Heading 3
- Bulleted list
- Numbered list
- Quote
- Link
- Inline image

### Explicit non-goals for this pass

To keep the feature controlled and maintainable, do not add:

- Arbitrary font sizes
- Arbitrary colors
- Custom layout columns
- Arbitrary embed blocks

## 9. Data and Rendering Strategy

For this pass, keep the persistence model compatible with the current `full_description` field while improving the authoring interface.

### Strategy

- Author campaign content through a constrained rich-text editor
- Persist sanitized HTML into `full_description`
- Continue rendering sanitized HTML on the public page

This avoids a large schema redesign while immediately improving both authoring quality and public rendering fidelity.

## 10. Likely Root Causes to Address During Implementation

Implementation should explicitly investigate and fix:

- Why campaign information appears to be missing or visually flattened
- Why updates feel squeezed when entering the `Updates` area
- Whether the current boxed tab shell is constraining content width or typography
- Whether campaign HTML lacks reliable heading structure because authoring is plain textarea-based

## 11. Testing and Verification

## Functional verification

- Project page loads successfully for a live project
- Sticky section nav scrolls to correct sections
- Active section highlighting updates while scrolling
- URL hash updates correctly
- Rewards CTA still works
- Creator update posting still works
- Comments and creator replies still work
- FAQ links correctly scroll back to campaign answers

## Content verification

- Existing campaign content still renders
- Headings create valid subsection links
- Inline images display correctly within the campaign body
- Updates no longer appear cramped
- Campaign content reads comfortably on desktop and mobile

## Responsive verification

- Desktop: sticky nav and sticky funding widget coexist cleanly
- Tablet: layout remains readable without overlap
- Mobile: section nav is usable and funding CTA remains easy to access

## 12. Implementation Boundaries

This redesign should stay focused on the project page and its direct authoring surfaces:

- `app/projects/[slug]/page.tsx`
- `components/projects/ProjectPageTabs.tsx` or its replacement
- `components/projects/ProjectUpdatesFeed.tsx`
- Project creation/edit content inputs

Avoid unrelated refactoring unless required to support:

- Section navigation
- Campaign content rendering
- Rich-text authoring
- Layout readability

## 13. Recommended Implementation Shape

The implementation should be split into focused units:

- A page-level section model describing ids, labels, counts, and section visibility
- A sticky project section nav component
- A campaign content renderer with heading extraction and richer prose styling
- A redesigned updates section component
- A constrained campaign editor component reused in create/edit flows

This keeps layout, content parsing, and authoring concerns separate and easier to test.

## 14. Final Design Decisions

The following decisions have been explicitly chosen or assumed:

- Use a proper constrained rich-text editor instead of plain text formatting inference
- Use a single long-form anchored project page instead of panel-based tab switching
- Keep the funding widget sticky on desktop
- Use inline/mobile CTA treatment instead of a mobile sidebar
- Support inline campaign images in this pass
- Keep FAQ inference lightweight by deriving it from question-like headings initially
- Keep updates and comments on the same project page
