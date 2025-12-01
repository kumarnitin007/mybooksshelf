# Code Refactoring Plan

## Current State
- `App.jsx`: 4598 lines - TOO LARGE
- Mixed concerns: UI, business logic, data fetching all in one file
- Inline components that should be separate
- Constants defined inline
- Utility functions mixed with component code

## Target Structure

```
src/
├── components/
│   ├── modals/
│   │   ├── LoginModal.jsx
│   │   ├── ProfileModal.jsx
│   │   ├── AddBookModal.jsx
│   │   ├── BookDetailsModal.jsx
│   │   ├── RecommendationsModal.jsx
│   │   ├── UserComparisonModal.jsx
│   │   ├── MoveBookModal.jsx
│   │   ├── LevelUpModal.jsx
│   │   └── AchievementModal.jsx
│   ├── layout/
│   │   ├── Header.jsx
│   │   └── UserStatsSection.jsx
│   ├── bookshelf/
│   │   ├── BookshelfDisplay.jsx
│   │   ├── BookCard.jsx
│   │   └── TableView.jsx
│   ├── AboutBookshelfModal.jsx
│   └── AvatarSelector.jsx
├── hooks/
│   ├── useBookshelfData.js
│   ├── useUserData.js
│   ├── useAuth.js
│   └── useGamification.js
├── utils/
│   ├── bookHelpers.js
│   ├── dateHelpers.js
│   └── contentFilter.js
├── constants/
│   ├── animalThemes.js
│   └── recommendations.js
├── services/ (already exists)
└── App.jsx (simplified main component)
```

## Refactoring Steps

1. ✅ Extract constants (animalThemes.js)
2. ✅ Extract utilities (bookHelpers.js, contentFilter.js)
3. ✅ Extract AvatarSelector component
4. ⏳ Extract modal components
5. ⏳ Extract layout components
6. ⏳ Extract bookshelf display components
7. ⏳ Extract custom hooks
8. ⏳ Update App.jsx to use extracted components
9. ⏳ Add comprehensive comments
10. ⏳ Remove unused code

## Progress
- [x] Constants extracted
- [x] Utilities extracted
- [x] AvatarSelector component created
- [ ] Modal components (8 components)
- [ ] Layout components (2 components)
- [ ] Bookshelf components (3 components)
- [ ] Custom hooks (4 hooks)
- [ ] App.jsx refactored
- [ ] Comments added
- [ ] Unused code removed

