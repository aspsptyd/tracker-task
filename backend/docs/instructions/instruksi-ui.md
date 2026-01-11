# ⏰ Time Tracker App — Modern UI Implementation Guide
## Using shadcn-ui + Tailwind CSS

## ROLE
You are a senior frontend engineer.
Build a modern, clean, and production-ready UI for a Time Tracker web application using:
- React
- Tailwind CSS
- shadcn-ui components

Focus on UX, layout hierarchy, accessibility, and clean code.

---

## DESIGN GOALS
- Modern productivity app look
- Minimalist, clean, whitespace-driven layout
- Card-based UI
- Responsive (mobile-first)
- Dark mode ready (shadcn default)

---

## TECH STACK
- React (App Router or Pages Router is acceptable)
- Tailwind CSS
- shadcn-ui
- lucide-react icons

---

## PAGE STRUCTURE

### Main Layout
- Centered container
- Max width: `max-w-5xl`
- Padding: `p-6`
- Vertical spacing: `space-y-6`


On desktop:
- Use grid layout: `grid-cols-3`
- Task List spans 2 columns
- Detail panel spans 1 column

On mobile:
- Stack vertically

---

## HEADER SECTION

### Content
- Title: "Time Tracker"
- Subtitle: "Track your focus and productivity"
- Primary CTA button: "+ New Task"

### Components
- Button (shadcn)
- Optional Separator

### Styling
- Title: `text-3xl font-bold tracking-tight`
- Subtitle: `text-sm text-muted-foreground`

---

## CREATE TASK FLOW

### UX RULE
Do NOT show inline form.
Use a modal dialog instead.

### Components
- Dialog
- Input (Task Title)
- Textarea (Description)
- Button

### Behavior
- Clicking "+ New Task" opens modal
- Autofocus on title input
- Submit button disabled if title is empty

---

## TASK LIST SECTION

### Layout
- Vertical list of cards
- Each task rendered as a Card

### Task Card Content
- Task title (bold)
- Meta info: total time + session count
- Progress bar (optional)
- View button (right aligned)

### Components
- Card
- Badge
- Button
- Progress

### Styling
- Hover effect: subtle background
- Cursor pointer
- Transition enabled

Example:
- Badge secondary → session count
- Badge outline → status

---

## TASK DETAIL PANEL

### Content
- Selected task title
- Quick stats (3 mini cards):
  - Total time
  - Number of sessions
  - Average session duration

### Layout
- Grid: `grid-cols-3`
- Gap: `gap-2`

---

## ADD SESSION FORM

### Components
- Select (Task selector)
- Date Picker (Start time)
- Date Picker (End time)
- Button

### UX RULES
- Disable submit if end < start
- Show calculated duration before submit
- Button shows loading state when submitting

---

## TYPOGRAPHY SYSTEM

| Element | Class |
|------|------|
| Page title | `text-3xl font-bold` |
| Section title | `text-xl font-semibold` |
| Card title | `text-base font-medium` |
| Body text | `text-sm text-muted-foreground` |

---

## INTERACTIONS & FEEDBACK

Must include:
- Hover transitions
- Button loading spinner
- Empty state for task list
- Skeleton loader while loading data

---

## THEMING
- Use default shadcn theme
- Enable CSS variables
- Support dark mode automatically

---

## CODE QUALITY RULES
- Use reusable components
- No inline styles
- Clean component separation
- Meaningful variable names
- Accessible labels and aria attributes

---

## OPTIONAL ENHANCEMENTS (IF TIME ALLOWS)
- Dark mode toggle
- Weekly summary chart
- Keyboard shortcut for new task
- Search & filter tasks

---

## FINAL OUTPUT EXPECTATION
- Fully working UI
- Clean React component structure
- shadcn-ui components used consistently
- Tailwind utility classes only
- Ready for backend integration
