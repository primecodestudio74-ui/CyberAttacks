# HackAware Learning Module - Implementation Tracker

## Backend
- [x] Add authRequired middleware for JWT verification (no changes to existing auth routes).

- [ ] Create MongoDB learning models: Course, Module, Lesson, Quiz, Progress, Certificate, Achievement, Bookmark.
- [ ] Implement learning controllers + routes (courses listing/search, course details, lesson viewer, prev/next).
- [ ] Implement progress/quiz/bookmark/streak/certificates endpoints.
- [x] Mount learning routes in backend/server.js.


## Frontend
- [ ] Create Learning pages: dashboard, course listing, course details, lesson viewer.
- [ ] Create Learning components: course card, filters, lesson content renderer, quiz engine, progress/streak widgets, bookmark/certificate UI.
- [ ] Wire routes in frontend/src/routes/AppRoutes.jsx (lazy-loaded, protected).
- [ ] Minimal integration into CyberDashboard.jsx so Learning sidebar navigates to /dashboard/learning.

## Verification
- [ ] Start backend + frontend and validate end-to-end learning flow:
  - [ ] Browse/filter/search courses
  - [ ] Open lesson
  - [ ] Navigate prev/next
  - [ ] Complete lesson → progress + XP updated
  - [ ] Submit quiz → feedback + XP/progress updated
  - [ ] Bookmark lessons
  - [ ] View continue learning + overall progress

