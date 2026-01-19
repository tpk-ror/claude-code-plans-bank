# PromptFlow: 20 New Features Specification

## Project Context

PromptFlow is a platform for sharing Claude Code sessions - "GitHub for AI-assisted coding." The existing 20 features cover: auth, conversation viewing, post management, search, profiles, likes, comments, Q&A, collections, and mind maps.

These 20 NEW features focus on: community engagement, creator tools, learning features, and platform intelligence.

---

## Feature Specifications

### F021: Follow System

```json
{
  "id": "F021",
  "name": "Follow System",
  "description": "Allow users to follow other developers and see their content",
  "status": "pending",
  "priority": 1,
  "dependencies": [],

  "context": "Currently users can view profiles but can't follow/subscribe to creators. This is foundational for community engagement and powers the activity feed.",

  "implementation_requirements": [
    "Create follows table in Supabase with follower_id, following_id, created_at",
    "Add follow/unfollow button to user profile pages",
    "Show follower/following counts on profiles",
    "Create /api/follow endpoint for follow actions",
    "Add 'Following' tab to user profile showing who they follow",
    "Implement optimistic UI for follow button"
  ],

  "acceptance_criteria": [
    "User can follow another user from their profile",
    "User can unfollow a user they're following",
    "Profile shows accurate follower/following counts",
    "Cannot follow yourself",
    "Follow state persists across page refreshes"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/follow.test.ts",
      "cases": [
        "createFollow creates relationship correctly",
        "removeFollow deletes relationship",
        "getFollowerCount returns accurate count"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/follow.spec.ts",
      "cases": [
        "clicking Follow button changes state to Following",
        "following count increments after follow",
        "unfollowing removes from Following list"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_follows.sql",
    "src/lib/components/FollowButton.svelte",
    "src/routes/api/follow/+server.ts",
    "tests/unit/follow.test.ts",
    "tests/e2e/follow.spec.ts"
  ],

  "files_to_modify": [
    "src/routes/user/[username]/+page.svelte",
    "src/lib/types/index.ts"
  ],

  "database_changes": {
    "new_tables": ["follows"],
    "new_columns": [],
    "triggers": ["update_follower_counts on follow/unfollow"]
  }
}
```

---

### F022: Activity Feed

```json
{
  "id": "F022",
  "name": "Activity Feed",
  "description": "Timeline of actions from users you follow",
  "status": "pending",
  "priority": 1,
  "dependencies": ["F021"],

  "context": "With the follow system in place, users need a way to see what people they follow are doing. This drives engagement and return visits.",

  "implementation_requirements": [
    "Create activity_events table storing: user_id, event_type, target_id, metadata, created_at",
    "Insert events on: new post, Q&A response, comment, like, fork",
    "Create /feed page showing chronological activity from followed users",
    "Implement infinite scroll for feed",
    "Add filter toggles: posts, Q&A, comments, all",
    "Show event cards with appropriate formatting per type"
  ],

  "acceptance_criteria": [
    "Feed shows activities from followed users only",
    "Activities appear in reverse chronological order",
    "Each activity type displays appropriately (post card, comment preview, etc.)",
    "Filter buttons work correctly",
    "Empty state shown when following no one",
    "Infinite scroll loads more activities"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/activity.test.ts",
      "cases": [
        "createActivityEvent inserts correct data",
        "getActivityFeed returns only followed users activities",
        "filterActivities correctly filters by type"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/feed.spec.ts",
      "cases": [
        "feed shows followed users activities",
        "filtering by posts shows only posts",
        "scrolling loads more items"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_activity_events.sql",
    "src/routes/feed/+page.svelte",
    "src/routes/feed/+page.server.ts",
    "src/lib/components/ActivityCard.svelte",
    "src/lib/components/ActivityFeed.svelte"
  ],

  "files_to_modify": [
    "src/lib/types/index.ts",
    "src/routes/+layout.svelte (add Feed nav link)"
  ]
}
```

---

### F023: Notifications System

```json
{
  "id": "F023",
  "name": "Notifications System",
  "description": "In-app notifications for comments, likes, follows, and Q&A responses",
  "status": "pending",
  "priority": 1,
  "dependencies": [],

  "context": "Users have no way to know when someone interacts with their content. Notifications are essential for engagement.",

  "implementation_requirements": [
    "Create notifications table: id, user_id, type, message, target_url, is_read, created_at",
    "Create notification on: new follower, comment on your post, like on your post, answer to your question, reply to your comment",
    "Add notification bell icon to header with unread count badge",
    "Create notifications dropdown showing recent notifications",
    "Create /notifications page for full notification history",
    "Implement mark as read (single and all)",
    "Add notification preferences in settings"
  ],

  "acceptance_criteria": [
    "Bell shows unread count",
    "Clicking notification navigates to relevant page",
    "Mark as read updates badge count",
    "Mark all as read clears all unread",
    "Notifications page shows full history with pagination",
    "Can toggle notification types in settings"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/notifications.test.ts",
      "cases": [
        "createNotification inserts correctly",
        "getUnreadCount returns accurate number",
        "markAsRead updates is_read to true"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/notifications.spec.ts",
      "cases": [
        "notification badge shows correct count",
        "clicking notification marks it read and navigates",
        "mark all as read clears badge"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_notifications.sql",
    "src/lib/components/NotificationBell.svelte",
    "src/lib/components/NotificationDropdown.svelte",
    "src/routes/notifications/+page.svelte",
    "src/routes/api/notifications/+server.ts",
    "src/routes/api/notifications/read/+server.ts"
  ],

  "files_to_modify": [
    "src/lib/components/Header.svelte",
    "src/routes/settings/+page.svelte"
  ]
}
```

---

### F024: Post Drafts

```json
{
  "id": "F024",
  "name": "Post Drafts",
  "description": "Save incomplete posts and resume editing later",
  "status": "pending",
  "priority": 2,
  "dependencies": [],

  "context": "The post creation wizard (F009) is multi-step. Users may abandon mid-process. Drafts reduce friction and lost work.",

  "implementation_requirements": [
    "Add is_draft boolean column to posts table",
    "Save draft automatically every 30 seconds during editing",
    "Show 'Saving...' and 'Saved' indicators",
    "Add 'Drafts' section to user profile/dashboard",
    "Allow resuming draft from any step of wizard",
    "Publish button changes draft to published",
    "Delete draft option"
  ],

  "acceptance_criteria": [
    "Partial post saves as draft automatically",
    "User can see their drafts in dashboard",
    "Clicking draft resumes from last edited step",
    "Publishing draft makes it public",
    "Draft can be deleted without publishing",
    "Draft list shows last edited timestamp"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/drafts.test.ts",
      "cases": [
        "saveDraft creates draft with is_draft=true",
        "publishDraft sets is_draft=false",
        "getDrafts returns only is_draft=true posts"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/drafts.spec.ts",
      "cases": [
        "leaving wizard mid-step saves draft",
        "draft appears in drafts list",
        "resuming draft restores form state"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_drafts.sql",
    "src/routes/dashboard/drafts/+page.svelte",
    "src/lib/components/DraftsList.svelte",
    "src/lib/components/DraftCard.svelte"
  ],

  "files_to_modify": [
    "src/routes/create/+page.svelte",
    "src/lib/types/index.ts"
  ]
}
```

---

### F025: Author Analytics Dashboard

```json
{
  "id": "F025",
  "name": "Author Analytics Dashboard",
  "description": "Track post performance, views, engagement metrics",
  "status": "pending",
  "priority": 2,
  "dependencies": [],

  "context": "Authors have no visibility into how their content performs. Analytics motivate creators and help them improve.",

  "implementation_requirements": [
    "Create post_views table: post_id, viewer_id (nullable for anon), created_at",
    "Track view on post detail page load",
    "Create /dashboard/analytics route",
    "Show aggregate stats: total views, total likes, total comments",
    "Show per-post breakdown with sparkline charts",
    "Show views over time (last 7/30/90 days)",
    "Show top performing posts",
    "Show recent activity (who viewed, liked, commented)"
  ],

  "acceptance_criteria": [
    "Dashboard shows accurate view/like/comment totals",
    "Time series chart shows daily views",
    "Per-post table is sortable by metrics",
    "Can filter date range",
    "Data updates in near real-time"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/analytics.test.ts",
      "cases": [
        "recordView inserts view record",
        "getViewsByDay aggregates correctly",
        "getTopPosts returns sorted by views"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/analytics.spec.ts",
      "cases": [
        "viewing post increments view count",
        "analytics page shows correct totals",
        "date filter changes displayed data"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_post_views.sql",
    "src/routes/dashboard/analytics/+page.svelte",
    "src/routes/dashboard/analytics/+page.server.ts",
    "src/lib/components/AnalyticsChart.svelte",
    "src/lib/components/PostMetricsTable.svelte"
  ],

  "files_to_modify": [
    "src/routes/post/[id]/+page.svelte (add view tracking)"
  ]
}
```

---

### F026: Session Comparison Tool

```json
{
  "id": "F026",
  "name": "Session Comparison Tool",
  "description": "Compare two Claude Code sessions side-by-side",
  "status": "pending",
  "priority": 2,
  "dependencies": [],

  "context": "Learning value increases dramatically when comparing how different developers solve the same or similar problems. This is a unique differentiator.",

  "implementation_requirements": [
    "Create /compare route with two session picker",
    "Split-pane layout with synchronized scrolling option",
    "Highlight similarities/differences in approach",
    "Show session metadata comparison (languages, files, duration)",
    "Allow deep linking to comparison (share compare URL)",
    "Add 'Compare' button on post pages to select for comparison"
  ],

  "acceptance_criteria": [
    "Can select two sessions to compare",
    "Sessions display side-by-side",
    "Sync scroll option works",
    "URL is shareable with both session IDs",
    "Works on mobile (stacked view)"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/compare.test.ts",
      "cases": [
        "parseCompareUrl extracts both session IDs",
        "calculateSimilarity returns percentage"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/compare.spec.ts",
      "cases": [
        "selecting two sessions shows comparison view",
        "sync scroll moves both panels together",
        "comparison URL loads correct sessions"
      ]
    }
  ],

  "files_to_create": [
    "src/routes/compare/+page.svelte",
    "src/routes/compare/+page.server.ts",
    "src/lib/components/ComparisonView.svelte",
    "src/lib/components/SessionPicker.svelte"
  ],

  "files_to_modify": [
    "src/routes/post/[id]/+page.svelte (add Compare button)"
  ]
}
```

---

### F027: Code Snippet Library

```json
{
  "id": "F027",
  "name": "Code Snippet Library",
  "description": "Extract and save reusable code snippets from sessions",
  "status": "pending",
  "priority": 2,
  "dependencies": [],

  "context": "Sessions contain valuable code that users want to reuse. A snippet library makes sessions actionable.",

  "implementation_requirements": [
    "Create snippets table: id, user_id, post_id, code, language, title, description, tags, created_at",
    "Add 'Save Snippet' button to code blocks in conversation viewer",
    "Create /snippets page showing user's saved snippets",
    "Add search/filter by language and tags",
    "Copy-to-clipboard functionality",
    "Show source session link",
    "Public/private snippet visibility"
  ],

  "acceptance_criteria": [
    "Can save any code block as snippet",
    "Snippets show in personal library",
    "Can search snippets by keyword",
    "Can filter by language",
    "Copy button works",
    "Link to source session is clickable"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/snippets.test.ts",
      "cases": [
        "createSnippet inserts correctly",
        "searchSnippets returns matching results",
        "getSnippetsByLanguage filters correctly"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/snippets.spec.ts",
      "cases": [
        "clicking Save Snippet opens modal",
        "saved snippet appears in library",
        "copy button copies code to clipboard"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_snippets.sql",
    "src/routes/snippets/+page.svelte",
    "src/lib/components/SnippetCard.svelte",
    "src/lib/components/SaveSnippetModal.svelte",
    "src/routes/api/snippets/+server.ts"
  ],

  "files_to_modify": [
    "src/lib/components/CodeBlock.svelte (add Save button)"
  ]
}
```

---

### F028: Learning Paths

```json
{
  "id": "F028",
  "name": "Learning Paths",
  "description": "Curated sequences of sessions for structured learning",
  "status": "pending",
  "priority": 3,
  "dependencies": [],

  "context": "Collections are unordered. Learning paths provide structured progression through related content, positioning PromptFlow as a learning platform.",

  "implementation_requirements": [
    "Create learning_paths table: id, author_id, title, description, difficulty, estimated_time, is_published",
    "Create path_posts table: path_id, post_id, order, notes",
    "Create /paths browse page",
    "Create path detail page with progress tracking",
    "Track user progress: completed posts, percentage done",
    "Allow users to 'Enroll' in a path",
    "Path creator can add custom notes between posts"
  ],

  "acceptance_criteria": [
    "Can create a learning path with ordered posts",
    "Path shows progress percentage for enrolled users",
    "Completing a post updates progress",
    "Path overview shows estimated time, difficulty",
    "Users can browse and enroll in public paths"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/paths.test.ts",
      "cases": [
        "createPath creates path with posts",
        "updateProgress marks post complete",
        "getPathProgress returns percentage"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/paths.spec.ts",
      "cases": [
        "enrolling in path shows in My Paths",
        "completing post updates progress bar",
        "path creator can reorder posts"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_learning_paths.sql",
    "src/routes/paths/+page.svelte",
    "src/routes/paths/[id]/+page.svelte",
    "src/routes/paths/create/+page.svelte",
    "src/lib/components/PathCard.svelte",
    "src/lib/components/PathProgress.svelte"
  ],

  "files_to_modify": [
    "src/lib/types/index.ts"
  ]
}
```

---

### F029: User Badges & Reputation

```json
{
  "id": "F029",
  "name": "User Badges & Reputation",
  "description": "Recognition system with badges and reputation scores",
  "status": "pending",
  "priority": 3,
  "dependencies": [],

  "context": "Users have no recognition for contributions. Gamification increases engagement and creates visible expertise hierarchy.",

  "implementation_requirements": [
    "Create badge_definitions table: id, name, description, icon, criteria",
    "Create user_badges table: user_id, badge_id, earned_at",
    "Create reputation scoring: points from likes received, answers accepted, posts created",
    "Award badges automatically via triggers/functions",
    "Display badges on profile and post cards",
    "Create badges showcase page",
    "Add reputation score to profiles"
  ],

  "badge_examples": [
    "First Post - Published first session",
    "Helpful - Answer accepted on Q&A",
    "Trending - Post reached 100 likes",
    "Prolific - Published 10 posts",
    "Teacher - Created 3 learning paths"
  ],

  "acceptance_criteria": [
    "Badges appear on user profiles",
    "Badges earned automatically when criteria met",
    "Reputation score visible on profile",
    "Badge notification sent when earned",
    "Leaderboard shows top users by reputation"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/badges.test.ts",
      "cases": [
        "awardBadge creates user_badge record",
        "checkBadgeCriteria returns true when met",
        "calculateReputation returns correct score"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/badges.spec.ts",
      "cases": [
        "publishing first post awards First Post badge",
        "badge appears on profile after earned",
        "reputation score updates after receiving like"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_badges.sql",
    "src/routes/leaderboard/+page.svelte",
    "src/lib/components/BadgeDisplay.svelte",
    "src/lib/components/ReputationScore.svelte"
  ],

  "files_to_modify": [
    "src/routes/user/[username]/+page.svelte",
    "src/lib/components/PostCard.svelte"
  ]
}
```

---

### F030: Advanced Search Filters

```json
{
  "id": "F030",
  "name": "Advanced Search Filters",
  "description": "Enhanced search with date ranges, popularity filters, and saved searches",
  "status": "pending",
  "priority": 3,
  "dependencies": [],

  "context": "Current search (F012) is basic. Power users need advanced filtering for discovery in a growing content library.",

  "implementation_requirements": [
    "Add date range picker (last week, month, year, custom)",
    "Add popularity filters: minimum likes, minimum views, minimum forks",
    "Add author reputation filter",
    "Add 'Similar to this post' search from any post",
    "Create saved_searches table for logged-in users",
    "Add 'Save this search' button",
    "Show saved searches in sidebar"
  ],

  "acceptance_criteria": [
    "Date range filter shows posts from selected period",
    "Popularity filters exclude posts below threshold",
    "Saved searches appear in search sidebar",
    "Clicking saved search applies all filters",
    "Filters combine correctly (AND logic)",
    "Clear all filters button works"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/search.test.ts",
      "cases": [
        "buildSearchQuery includes date filters",
        "buildSearchQuery includes popularity filters",
        "saveSearch persists filters correctly"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/search.spec.ts",
      "cases": [
        "selecting date range filters results",
        "combining filters narrows results",
        "saving and loading search works"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_saved_searches.sql",
    "src/lib/components/AdvancedSearchFilters.svelte",
    "src/lib/components/SavedSearches.svelte"
  ],

  "files_to_modify": [
    "src/routes/search/+page.svelte",
    "src/routes/search/+page.server.ts"
  ]
}
```

---

### F031: Draft Auto-Save with Versioning

```json
{
  "id": "F031",
  "name": "Draft Auto-Save with Versioning",
  "description": "Automatic saving with version history and restore capability",
  "status": "pending",
  "priority": 3,
  "dependencies": ["F024"],

  "context": "Building on drafts feature, add version history so users never lose work and can revert mistakes.",

  "implementation_requirements": [
    "Create post_versions table: id, post_id, content_snapshot, created_at",
    "Auto-save creates version every 5 minutes (or on significant change)",
    "Show 'Last saved' timestamp in editor",
    "Create version history panel in editor",
    "Allow viewing previous versions",
    "Restore previous version option",
    "Limit to last 10 versions per post"
  ],

  "acceptance_criteria": [
    "Editor shows 'Saving...' then 'Saved at HH:MM'",
    "Version history shows list of saves",
    "Can preview any previous version",
    "Restoring version updates current draft",
    "Old versions auto-pruned beyond limit"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/versions.test.ts",
      "cases": [
        "createVersion snapshots current state",
        "getVersionHistory returns ordered versions",
        "restoreVersion updates post with snapshot"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/versions.spec.ts",
      "cases": [
        "auto-save creates version after timeout",
        "version history shows previous saves",
        "restoring version updates editor"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_post_versions.sql",
    "src/lib/components/VersionHistory.svelte",
    "src/lib/components/AutoSaveIndicator.svelte"
  ],

  "files_to_modify": [
    "src/routes/create/+page.svelte"
  ]
}
```

---

### F032: Bulk Post Management

```json
{
  "id": "F032",
  "name": "Bulk Post Management",
  "description": "Select and manage multiple posts at once",
  "status": "pending",
  "priority": 4,
  "dependencies": [],

  "context": "Power users with many posts need efficient management. Individual actions don't scale.",

  "implementation_requirements": [
    "Add checkbox selection to post list in dashboard",
    "Add bulk action toolbar: delete, archive, change visibility",
    "Add bulk tag editor",
    "Add bulk category change",
    "Confirm dialog for destructive actions",
    "Show progress for bulk operations"
  ],

  "acceptance_criteria": [
    "Can select multiple posts with checkboxes",
    "Select all checkbox works",
    "Bulk delete removes all selected",
    "Bulk tag add/remove works",
    "Progress indicator shows during operation",
    "Undo available for 10 seconds after bulk delete"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/bulk.test.ts",
      "cases": [
        "bulkDelete removes all specified posts",
        "bulkUpdateTags adds tags to all posts",
        "bulkArchive sets archived=true on all"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/bulk.spec.ts",
      "cases": [
        "selecting posts enables bulk actions",
        "bulk delete shows confirmation",
        "bulk tag edit updates all selected"
      ]
    }
  ],

  "files_to_create": [
    "src/lib/components/BulkActionToolbar.svelte",
    "src/lib/components/SelectablePostList.svelte",
    "src/routes/api/posts/bulk/+server.ts"
  ],

  "files_to_modify": [
    "src/routes/dashboard/+page.svelte"
  ]
}
```

---

### F033: Publication Scheduling

```json
{
  "id": "F033",
  "name": "Publication Scheduling",
  "description": "Schedule posts to publish at a future date/time",
  "status": "pending",
  "priority": 4,
  "dependencies": ["F024"],

  "context": "Creators want to plan content calendars, publish at optimal times, and batch content creation.",

  "implementation_requirements": [
    "Add scheduled_publish_at column to posts table",
    "Add date/time picker to publish step of wizard",
    "Create scheduled_posts view in dashboard",
    "Implement cron job or edge function to publish scheduled posts",
    "Show scheduled posts with countdown",
    "Allow editing/canceling scheduled posts"
  ],

  "acceptance_criteria": [
    "Can set future publish date during creation",
    "Scheduled posts show in separate dashboard section",
    "Post auto-publishes at scheduled time",
    "Can edit scheduled time before publication",
    "Can cancel scheduled and return to draft"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/scheduling.test.ts",
      "cases": [
        "schedulePost sets scheduled_publish_at",
        "getScheduledPosts returns future-dated posts",
        "publishScheduledPosts publishes due posts"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/scheduling.spec.ts",
      "cases": [
        "setting publish date saves correctly",
        "scheduled post appears in scheduled section",
        "canceling schedule returns to drafts"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_scheduling.sql",
    "supabase/functions/publish-scheduled/index.ts",
    "src/lib/components/DateTimePicker.svelte",
    "src/lib/components/ScheduledPosts.svelte"
  ],

  "files_to_modify": [
    "src/routes/create/+page.svelte",
    "src/routes/dashboard/+page.svelte"
  ]
}
```

---

### F034: Session Redaction Tool

```json
{
  "id": "F034",
  "name": "Session Redaction Tool",
  "description": "Automatically detect and redact sensitive data before publishing",
  "status": "pending",
  "priority": 4,
  "dependencies": [],

  "context": "Sessions may contain API keys, passwords, or personal info. Redaction prevents accidental exposure.",

  "implementation_requirements": [
    "Create pattern-based detector for: API keys, passwords, emails, phone numbers, env vars",
    "Highlight detected sensitive data in preview",
    "One-click redact all detected items",
    "Manual redaction tool (select text to redact)",
    "Store redaction positions in metadata",
    "Display redacted content as [REDACTED] or blur",
    "Allow author to undo redaction during editing"
  ],

  "acceptance_criteria": [
    "Auto-detects common secrets patterns",
    "Detected items highlighted in yellow",
    "Redact All button processes all detected",
    "Manual selection can redact any text",
    "Redacted text not visible to viewers",
    "Original still stored for author only"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/redaction.test.ts",
      "cases": [
        "detectSecrets finds API key patterns",
        "detectSecrets finds email addresses",
        "applyRedactions replaces text correctly"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/redaction.spec.ts",
      "cases": [
        "uploading session with secrets shows warnings",
        "redact all removes all highlighted items",
        "published post shows [REDACTED] text"
      ]
    }
  ],

  "files_to_create": [
    "src/lib/utils/secretDetector.ts",
    "src/lib/components/RedactionTool.svelte",
    "src/lib/components/RedactedText.svelte"
  ],

  "files_to_modify": [
    "src/routes/create/+page.svelte",
    "src/lib/components/ConversationViewer.svelte"
  ]
}
```

---

### F035: Content Export

```json
{
  "id": "F035",
  "name": "Content Export",
  "description": "Download sessions as PDF, Markdown, or embeddable format",
  "status": "pending",
  "priority": 4,
  "dependencies": [],

  "context": "Users want to save sessions locally, share outside platform, or embed in blogs/docs.",

  "implementation_requirements": [
    "Add Export button to post detail page",
    "Generate PDF with: title, metadata, conversation, code highlighting",
    "Generate Markdown transcript",
    "Generate embeddable iframe code",
    "Create /api/export/[format] endpoint",
    "PDF should include mind map if exists"
  ],

  "acceptance_criteria": [
    "PDF downloads with proper formatting",
    "Markdown export preserves code blocks",
    "Embed code generates working iframe",
    "Export respects redactions",
    "Large sessions don't timeout"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/export.test.ts",
      "cases": [
        "generateMarkdown produces valid markdown",
        "generatePdf returns PDF buffer",
        "generateEmbed produces valid HTML"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/export.spec.ts",
      "cases": [
        "clicking PDF download triggers download",
        "markdown export contains all messages",
        "embed code renders in iframe"
      ]
    }
  ],

  "files_to_create": [
    "src/routes/api/export/pdf/+server.ts",
    "src/routes/api/export/markdown/+server.ts",
    "src/routes/embed/[id]/+page.svelte",
    "src/lib/utils/pdfGenerator.ts",
    "src/lib/components/ExportModal.svelte"
  ],

  "files_to_modify": [
    "src/routes/post/[id]/+page.svelte"
  ]
}
```

---

### F036: Content Moderation System

```json
{
  "id": "F036",
  "name": "Content Moderation System",
  "description": "Flag, review, and moderate inappropriate content",
  "status": "pending",
  "priority": 4,
  "dependencies": [],

  "context": "As platform grows, need to handle inappropriate content, spam, and abuse.",

  "implementation_requirements": [
    "Add Report button to posts, comments, Q&A",
    "Create content_flags table: id, content_type, content_id, reporter_id, reason, status",
    "Create admin moderation queue page",
    "Moderator actions: dismiss, warn author, hide content, ban user",
    "Email notification to author on action",
    "Appeal process for hidden content",
    "Auto-hide content with multiple flags"
  ],

  "acceptance_criteria": [
    "Users can report content with reason",
    "Reports appear in moderation queue",
    "Moderator can take action on reports",
    "Hidden content shows 'content removed' message",
    "Author notified of moderation action",
    "Appeals route through same queue"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/moderation.test.ts",
      "cases": [
        "createFlag inserts report correctly",
        "hideContent sets hidden=true",
        "autoHideThreshold triggers at N flags"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/moderation.spec.ts",
      "cases": [
        "report button submits flag",
        "moderator can dismiss or act on flag",
        "hidden content shows removed message"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_moderation.sql",
    "src/routes/admin/moderation/+page.svelte",
    "src/lib/components/ReportButton.svelte",
    "src/lib/components/ModerationQueue.svelte"
  ],

  "files_to_modify": [
    "src/lib/components/PostCard.svelte",
    "src/lib/components/Comment.svelte"
  ]
}
```

---

### F037: Code Review Requests

```json
{
  "id": "F037",
  "name": "Code Review Requests",
  "description": "Request community code reviews on sessions",
  "status": "pending",
  "priority": 4,
  "dependencies": [],

  "context": "Authors can get feedback beyond comments. Structured code review improves quality and learning.",

  "implementation_requirements": [
    "Add 'Request Review' button to posts",
    "Create code_reviews table: post_id, reviewer_id, status, verdict, comments",
    "Create review interface with inline comments on code blocks",
    "Reviewer can: approve, request changes, comment only",
    "Show review status badge on post",
    "Author can mark review as addressed",
    "Reviewers earn reputation for reviews"
  ],

  "acceptance_criteria": [
    "Author can request review on any post",
    "Reviewers see posts requesting review",
    "Reviewer can leave inline comments",
    "Review verdict shows on post",
    "Author notified of review completion",
    "Multiple reviews aggregated"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/codeReview.test.ts",
      "cases": [
        "requestReview creates review request",
        "submitReview saves verdict and comments",
        "getReviewStatus returns aggregated verdict"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/codeReview.spec.ts",
      "cases": [
        "request review button creates request",
        "reviewer can add inline comment",
        "submitting review shows badge on post"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_code_reviews.sql",
    "src/routes/reviews/+page.svelte",
    "src/lib/components/ReviewInterface.svelte",
    "src/lib/components/InlineComment.svelte",
    "src/lib/components/ReviewBadge.svelte"
  ],

  "files_to_modify": [
    "src/routes/post/[id]/+page.svelte"
  ]
}
```

---

### F038: Collaborator System

```json
{
  "id": "F038",
  "name": "Collaborator System",
  "description": "Add co-authors to posts for collaborative sessions",
  "status": "pending",
  "priority": 5,
  "dependencies": [],

  "context": "Pair programming and team sessions involve multiple people. Recognition should be shared.",

  "implementation_requirements": [
    "Add collaborators JSONB column to posts table",
    "Collaborator picker during post creation",
    "Collaborators shown on post detail page",
    "Collaborators can edit post",
    "Post appears on all collaborators' profiles",
    "Notification when added as collaborator",
    "Collaborator can leave/decline"
  ],

  "acceptance_criteria": [
    "Can add users as collaborators during creation",
    "Collaborators displayed with author",
    "Collaborators have edit access",
    "Post shows on collaborator profiles",
    "Can remove collaborator",
    "Invited user can accept/decline"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/collaborators.test.ts",
      "cases": [
        "addCollaborator updates post correctly",
        "removeCollaborator removes from array",
        "canEditPost returns true for collaborators"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/collaborators.spec.ts",
      "cases": [
        "adding collaborator sends notification",
        "collaborator can edit post",
        "post shows on collaborator profile"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_collaborators.sql",
    "src/lib/components/CollaboratorPicker.svelte",
    "src/lib/components/CollaboratorList.svelte"
  ],

  "files_to_modify": [
    "src/routes/create/+page.svelte",
    "src/routes/post/[id]/+page.svelte",
    "src/lib/types/index.ts"
  ]
}
```

---

### F039: Platform Statistics Dashboard

```json
{
  "id": "F039",
  "name": "Platform Statistics Dashboard",
  "description": "Public analytics showing platform-wide trends and stats",
  "status": "pending",
  "priority": 5,
  "dependencies": [],

  "context": "Public stats demonstrate platform value, attract new users, and provide interesting insights.",

  "implementation_requirements": [
    "Create /stats public page",
    "Show totals: sessions, users, questions, answers",
    "Show trending: languages, frameworks, categories",
    "Show activity over time charts",
    "Show top contributors leaderboard",
    "Cache stats with periodic refresh",
    "Add interesting insights (avg session length, most common tools)"
  ],

  "acceptance_criteria": [
    "Stats page loads quickly (cached)",
    "Totals are accurate",
    "Charts show meaningful trends",
    "Leaderboard shows top 10 users",
    "Data refreshes periodically",
    "Mobile-friendly layout"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/stats.test.ts",
      "cases": [
        "calculatePlatformStats returns all metrics",
        "getTrendingLanguages returns sorted list",
        "cacheStats stores correctly"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/stats.spec.ts",
      "cases": [
        "stats page displays all sections",
        "charts render without error",
        "leaderboard shows clickable profiles"
      ]
    }
  ],

  "files_to_create": [
    "src/routes/stats/+page.svelte",
    "src/routes/stats/+page.server.ts",
    "src/lib/components/PlatformStats.svelte",
    "src/lib/components/TrendingChart.svelte"
  ],

  "files_to_modify": [
    "src/routes/+layout.svelte (add Stats nav link)"
  ]
}
```

---

### F040: Intelligent Content Recommendations

```json
{
  "id": "F040",
  "name": "Intelligent Content Recommendations",
  "description": "Personalized post recommendations based on user activity",
  "status": "pending",
  "priority": 5,
  "dependencies": ["F025"],

  "context": "With view/interaction data, can provide personalized discovery. This improves engagement and content discovery.",

  "implementation_requirements": [
    "Create recommendations table: user_id, post_id, score, reason, created_at",
    "Generate recommendations based on: viewed posts, liked posts, followed users, similar tags/languages",
    "Add 'Recommended for You' section on homepage (logged in users)",
    "Add 'Similar Sessions' section on post detail",
    "Refresh recommendations daily or on activity",
    "Show recommendation reason (e.g., 'Because you liked X')"
  ],

  "acceptance_criteria": [
    "Logged-in users see personalized recommendations",
    "Recommendations relevant to user interests",
    "Reason shown explains recommendation",
    "'Similar Sessions' shows related posts",
    "New users get popular/trending fallback",
    "Recommendations update as user interacts"
  ],

  "test_requirements": [
    {
      "type": "unit",
      "file": "tests/unit/recommendations.test.ts",
      "cases": [
        "generateRecommendations creates scored list",
        "getSimilarPosts returns related posts",
        "recommendationReason formats correctly"
      ]
    },
    {
      "type": "e2e",
      "file": "tests/e2e/recommendations.spec.ts",
      "cases": [
        "homepage shows recommendations for logged-in user",
        "recommendation shows reason text",
        "similar sessions section shows on post page"
      ]
    }
  ],

  "files_to_create": [
    "supabase/migrations/xxx_recommendations.sql",
    "supabase/functions/generate-recommendations/index.ts",
    "src/lib/components/RecommendedPosts.svelte",
    "src/lib/components/SimilarSessions.svelte"
  ],

  "files_to_modify": [
    "src/routes/+page.svelte",
    "src/routes/post/[id]/+page.svelte"
  ]
}
```

---

## Summary: Feature Priorities

| Priority | Features | Theme |
|----------|----------|-------|
| 1 | F021-F023 | Community Foundation (Follow, Feed, Notifications) |
| 2 | F024-F027 | Creator Tools & Learning (Drafts, Analytics, Compare, Snippets) |
| 3 | F028-F031 | Engagement & Quality (Paths, Badges, Search, Versioning) |
| 4 | F032-F037 | Power Features (Bulk, Schedule, Redact, Export, Moderation, Reviews) |
| 5 | F038-F040 | Advanced (Collaborators, Platform Stats, Recommendations) |

---

## Implementation Notes

1. **Start with F021-F023** - These form the engagement foundation
2. **Each feature is independent** unless dependencies noted
3. **Database migrations are cumulative** - run in order
4. **Tests should run before marking complete**
5. **Features build on existing UI patterns** from original 20 features
