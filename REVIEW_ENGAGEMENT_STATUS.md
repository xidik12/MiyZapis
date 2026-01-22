# Review Engagement Feature - Implementation Status

## ✅ Completed (Frontend)

### 1. Fixed Currency Display Issue
- **File:** `frontend/src/pages/customer/Dashboard.tsx`
- **Fix:** Removed `normalizeMixedCurrencyAmount()` call that was incorrectly converting $120 to $26.19
- **Result:** Customer dashboard now correctly shows total spent

### 2. Created Like/Dislike UI Components
- **Files Created:**
  - `frontend/src/components/icons/HandThumbUpIcon.tsx` - Thumbs up icon with filled/outline states
  - `frontend/src/components/icons/HandThumbDownIcon.tsx` - Thumbs down icon with filled/outline states
  - `frontend/src/components/icons/index.ts` - Exported new icons

### 3. Created Report Modal
- **File:** `frontend/src/components/reviews/ReviewReportModal.tsx`
- **Features:**
  - 6 predefined report reasons (spam, offensive, fake, harassment, personal_info, other)
  - Optional details textarea (500 char limit)
  - Proper validation and error handling
  - Internationalization support

### 4. Updated Review Card Component
- **File:** `frontend/src/components/reviews/ReviewCard.tsx`
- **Changes:**
  - Replaced "Helpful" button with "Like" button
  - Added "Dislike" button
  - Added "Report" button
  - Updated `ReviewCardData` interface to include:
    - `likeCount: number`
    - `dislikeCount: number`
    - `userReaction?: 'like' | 'dislike' | null`
  - Updated props from `onMarkHelpful` to `onReact` with reaction type
  - Added `onReport` handler
  - Visual feedback: Green for liked, red for disliked

### 5. Updated ReviewFeed Component
- **File:** `frontend/src/components/reviews/ReviewFeed.tsx`
- **Changes:**
  - Updated props to use `onReact` and `onReactToResponse`
  - Added `onReport` prop
  - Passes all handlers to ReviewCard components

### 6. Created Specialist Response Functionality
- **File:** `frontend/src/components/reviews/ReviewResponseModal.tsx`
- **Features:**
  - Modal for specialists to respond to reviews
  - Shows review preview
  - 1000 character limit for responses
  - Validation and error handling

---

## 🚧 In Progress

### Update Parent Components
Need to update these files to use the new handlers:

#### `frontend/src/pages/specialist/Reviews.tsx`
```typescript
// Replace handleMarkHelpful with:
const handleReact = async (reviewId: string, reaction: 'like' | 'dislike' | null) => {
  try {
    // Get current reaction from local state
    const review = reviews.find(r => r.id === reviewId);
    const prevReaction = review?.userReaction;

    // Optimistically update UI
    setReviews(prev => prev.map(r =>
      r.id === reviewId
        ? {
            ...r,
            userReaction: reaction,
            likeCount: reaction === 'like'
              ? (prevReaction === 'like' ? r.likeCount : r.likeCount + 1)
              : (prevReaction === 'like' ? r.likeCount - 1 : r.likeCount),
            dislikeCount: reaction === 'dislike'
              ? (prevReaction === 'dislike' ? r.dislikeCount : r.dislikeCount + 1)
              : (prevReaction === 'dislike' ? r.dislikeCount - 1 : r.dislikeCount)
          }
        : r
    ));

    // Persist to localStorage
    const reactionsKey = `review_reactions_${user?.id}`;
    const reactions = JSON.parse(localStorage.getItem(reactionsKey) || '{}');
    if (reaction) {
      reactions[reviewId] = reaction;
    } else {
      delete reactions[reviewId];
    }
    localStorage.setItem(reactionsKey, JSON.stringify(reactions));

    // Call backend API (when available)
    await reviewsService.reactToReview(reviewId, reaction);
  } catch (err: any) {
    console.error('Error reacting to review:', err);
    // Revert optimistic update on error
    loadReviews(); // Reload from server
  }
};

const handleReport = async (reviewId: string) => {
  setReportingReviewId(reviewId);
  setReportModalOpen(true);
};

const handleSubmitReport = async (reason: string, details?: string) => {
  try {
    await reviewsService.reportReview(reportingReviewId!, reason, details);
  } catch (error: any) {
    throw error; // Re-throw to let modal handle it
  }
};

// In transform reviews:
const transformedReviews: ReviewCardData[] = reviews.map(review => {
  // Load reactions from localStorage
  const reactionsKey = `review_reactions_${user?.id}`;
  const reactions = JSON.parse(localStorage.getItem(reactionsKey) || '{}');
  const userReaction = reactions[review.id] || null;

  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    tags: review.tags,
    isVerified: review.isVerified,
    likeCount: review.likeCount || 0, // from backend
    dislikeCount: review.dislikeCount || 0, // from backend
    userReaction, // from localStorage
    createdAt: review.createdAt,
    customer: review.customer,
    service: review.service,
    response: review.response
  };
});

// Update ReviewFeed props:
<ReviewFeed
  onReact={handleReact}
  onReactToResponse={handleReactToResponse}
  onReport={handleReport}
  // ... other props
/>

// Add report modal state and component:
const [reportModalOpen, setReportModalOpen] = useState(false);
const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);

{reportingReviewId && (
  <ReviewReportModal
    isOpen={reportModalOpen}
    onClose={() => {
      setReportModalOpen(false);
      setReportingReviewId(null);
    }}
    onSubmit={handleSubmitReport}
    reviewId={reportingReviewId}
  />
)}
```

#### `frontend/src/pages/customer/Reviews.tsx`
Similar updates as specialist page

---

## 📋 TODO - Backend Implementation

### 1. Database Migrations

#### Migration: `create_review_reactions_table`
```sql
CREATE TABLE review_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one reaction per user per review
  UNIQUE(review_id, user_id)
);

CREATE INDEX idx_review_reactions_review_id ON review_reactions(review_id);
CREATE INDEX idx_review_reactions_user_id ON review_reactions(user_id);
```

#### Migration: `create_review_reports_table`
```sql
CREATE TABLE review_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reported_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'offensive', 'fake', 'harassment', 'personal_info', 'other')),
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by_admin_id UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,

  -- Prevent duplicate reports from same user
  UNIQUE(review_id, reported_by_user_id)
);

CREATE INDEX idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX idx_review_reports_status ON review_reports(status);
CREATE INDEX idx_review_reports_created_at ON review_reports(created_at DESC);
```

#### Migration: `add_reaction_counts_to_reviews`
```sql
ALTER TABLE reviews
ADD COLUMN like_count INTEGER DEFAULT 0,
ADD COLUMN dislike_count INTEGER DEFAULT 0;

-- Create trigger to update counts
CREATE OR REPLACE FUNCTION update_review_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews
    SET like_count = (SELECT COUNT(*) FROM review_reactions WHERE review_id = NEW.review_id AND reaction_type = 'like'),
        dislike_count = (SELECT COUNT(*) FROM review_reactions WHERE review_id = NEW.review_id AND reaction_type = 'dislike')
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews
    SET like_count = (SELECT COUNT(*) FROM review_reactions WHERE review_id = OLD.review_id AND reaction_type = 'like'),
        dislike_count = (SELECT COUNT(*) FROM review_reactions WHERE review_id = OLD.review_id AND reaction_type = 'dislike')
    WHERE id = OLD.review_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE reviews
    SET like_count = (SELECT COUNT(*) FROM review_reactions WHERE review_id = NEW.review_id AND reaction_type = 'like'),
        dislike_count = (SELECT COUNT(*) FROM review_reactions WHERE review_id = NEW.review_id AND reaction_type = 'dislike')
    WHERE id = NEW.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_reactions_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON review_reactions
FOR EACH ROW
EXECUTE FUNCTION update_review_reaction_counts();
```

### 2. Backend API Routes

#### Reviews Service (`backend/src/services/reviews.service.ts`)
```typescript
// Add to ReviewsService class:

async reactToReview(reviewId: string, userId: string, reactionType: 'like' | 'dislike' | null) {
  if (reactionType === null) {
    // Remove reaction
    await this.prisma.reviewReaction.deleteMany({
      where: {
        reviewId,
        userId
      }
    });
    return { message: 'Reaction removed' };
  }

  // Upsert reaction (create or update)
  const reaction = await this.prisma.reviewReaction.upsert({
    where: {
      reviewId_userId: {
        reviewId,
        userId
      }
    },
    update: {
      reactionType
    },
    create: {
      reviewId,
      userId,
      reactionType
    }
  });

  return reaction;
}

async reportReview(reviewId: string, reportedByUserId: string, reason: string, details?: string) {
  // Check if already reported by this user
  const existing = await this.prisma.reviewReport.findUnique({
    where: {
      reviewId_reportedByUserId: {
        reviewId,
        reportedByUserId
      }
    }
  });

  if (existing) {
    throw new Error('You have already reported this review');
  }

  const report = await this.prisma.reviewReport.create({
    data: {
      reviewId,
      reportedByUserId,
      reason,
      details,
      status: 'pending'
    }
  });

  // TODO: Send notification to admin team

  return report;
}

// Update getSpecialistReviews to include reaction counts and user's reaction
async getSpecialistReviews(specialistId: string, userId?: string, filters?: any) {
  const reviews = await this.prisma.review.findMany({
    where: { specialistId },
    include: {
      reactions: userId ? {
        where: { userId }
      } : false,
      _count: {
        select: {
          reactions: true
        }
      }
    }
    // ... rest of query
  });

  return reviews.map(review => ({
    ...review,
    likeCount: review.likeCount || 0,
    dislikeCount: review.dislikeCount || 0,
    userReaction: review.reactions?.[0]?.reactionType || null
  }));
}
```

#### Reviews Controller (`backend/src/controllers/reviews.controller.ts`)
```typescript
// Add these endpoints:

@Post(':id/react')
@UseGuards(JwtAuthGuard)
async reactToReview(
  @Param('id') reviewId: string,
  @Body() dto: { reaction: 'like' | 'dislike' | null },
  @Req() req: any
) {
  const userId = req.user.id;
  const result = await this.reviewsService.reactToReview(reviewId, userId, dto.reaction);
  return {
    success: true,
    data: result,
    message: dto.reaction ? 'Reaction recorded' : 'Reaction removed'
  };
}

@Post(':id/report')
@UseGuards(JwtAuthGuard)
async reportReview(
  @Param('id') reviewId: string,
  @Body() dto: { reason: string; details?: string },
  @Req() req: any
) {
  const userId = req.user.id;
  const result = await this.reviewsService.reportReview(reviewId, userId, dto.reason, dto.details);
  return {
    success: true,
    data: result,
    message: 'Report submitted successfully'
  };
}
```

### 3. Frontend Services

#### `frontend/src/services/reviews.service.ts`
```typescript
// Add to ReviewsService class:

async reactToReview(reviewId: string, reaction: 'like' | 'dislike' | null): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>(
    `/reviews/${reviewId}/react`,
    { reaction }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to react to review');
  }

  return response.data;
}

async reportReview(reviewId: string, reason: string, details?: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>(
    `/reviews/${reviewId}/report`,
    { reason, details }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to report review');
  }

  return response.data;
}
```

### 4. Update Review Sorting

#### Backend: Add sorting by likes
```typescript
// In getSpecialistReviews():
const orderBy = filters.sortBy === 'likes'
  ? [{ likeCount: 'desc' }, { createdAt: 'desc' }]
  : filters.sortBy === 'helpful' // legacy
  ? [{ likeCount: 'desc' }, { createdAt: 'desc' }]
  : { [filters.sortBy]: filters.sortOrder };
```

#### Frontend: Update ReviewFilters
```typescript
// In frontend/src/components/reviews/ReviewFilters.tsx
// Change "Most Helpful" to "Most Liked"
<button
  onClick={() => handleSortChange('likes', 'desc')}
  className={...}
>
  Most Liked
</button>
```

---

## 🎯 Testing Checklist

### Frontend Testing
- [ ] Like button toggles correctly (green when liked)
- [ ] Dislike button toggles correctly (red when disliked)
- [ ] Clicking like while disliked switches to like (and vice versa)
- [ ] Like/dislike counts update immediately
- [ ] Report button opens modal
- [ ] Report modal validates required fields
- [ ] Report modal submits successfully
- [ ] Reactions persist in localStorage across page refresh
- [ ] Currency display shows correct amounts ($120, not $26.19)

### Backend Testing
- [ ] POST /reviews/:id/react creates new reaction
- [ ] POST /reviews/:id/react updates existing reaction
- [ ] POST /reviews/:id/react with null removes reaction
- [ ] Reaction counts update automatically via trigger
- [ ] POST /reviews/:id/report creates report
- [ ] Duplicate reports from same user are prevented
- [ ] GET /reviews returns like/dislike counts
- [ ] GET /reviews returns user's reaction if authenticated
- [ ] Sorting by likes works correctly

### Integration Testing
- [ ] Frontend reactions sync with backend
- [ ] localStorage fallback works when backend is unavailable
- [ ] Admin panel shows pending reports
- [ ] Reported reviews can be moderated
- [ ] Deleted reviews cascade delete reactions and reports

---

## 📝 Notes

- **LocalStorage Format**: `review_reactions_{userId}` stores `{ [reviewId]: 'like' | 'dislike' }`
- **Optimistic Updates**: UI updates immediately, backend call happens async
- **Error Handling**: Failed backend calls revert optimistic updates
- **Admin Moderation**: Reports are stored for admin review but not auto-hidden
- **Performance**: Reaction counts are cached in reviews table, updated via trigger

---

## 🚀 Deployment Steps

1. Run database migrations in order
2. Deploy backend with new endpoints
3. Deploy frontend with new components
4. Clear browser caches (reaction UI changes)
5. Monitor error logs for any issues
6. Test on staging before production
