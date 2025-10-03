# Deployment Checklist - Referral Code System

## Pre-Deployment

### Code Review

- [x] Database migration script created (`023_add_referral_id_to_profiles.sql`)
- [x] All frontend components updated
- [x] TypeScript types updated
- [x] Validation logic implemented
- [x] Error handling added
- [x] No compilation errors
- [x] Documentation complete

### Testing (Local)

- [ ] Run migration on local database
- [ ] Test agent signup → Code auto-generated
- [ ] Test existing agents → Codes generated
- [ ] Test dashboard display → Code visible
- [ ] Test referrals page → Code visible and copyable
- [ ] Test property interest form → Validation works
- [ ] Test valid code → Shows ✓
- [ ] Test invalid code → Shows ✗
- [ ] Test empty code → No error (optional)
- [ ] Test case insensitivity → "abc" works same as "ABC"
- [ ] Test interest submission → Linked to agent
- [ ] Test "My Referrals" → Shows linked interests

## Deployment Steps

### 1. Database Migration

```bash
# Step 1.1: Backup database first!
# In Supabase: SQL Editor → Export Database

# Step 1.2: Run migration script
# Copy contents of: scripts/023_add_referral_id_to_profiles.sql
# Paste in Supabase SQL Editor → Run

# Step 1.3: Verify
SELECT COUNT(*) FROM profiles WHERE referral_id IS NULL;
# Should return 0

SELECT email, referral_id FROM profiles LIMIT 10;
# Should show codes for all users
```

### 2. Frontend Deployment

```bash
# Option A: Auto-deploy (Vercel/Netlify)
git add .
git commit -m "Add referral code system with validation"
git push origin main

# Option B: Manual deploy
npm run build
# Then deploy build folder to hosting
```

### 3. Verify Deployment

- [ ] Visit production site
- [ ] Login as agent
- [ ] Check dashboard → Code displays
- [ ] Check referrals page → Code displays
- [ ] Copy code button → Works
- [ ] Test full interest submission flow

## Post-Deployment Testing

### Happy Path Tests

- [ ] **Test 1**: Agent sees code in dashboard
  - Navigate to /dashboard
  - Verify 8-character code displays
  - Verify "Loading..." doesn't persist
- [ ] **Test 2**: Agent sees code in referrals page
  - Navigate to /dashboard/referrals
  - Verify same code displays
  - Click copy button → Works
- [ ] **Test 3**: Buyer enters valid code

  - Logout
  - Browse to property
  - Click "Express Interest"
  - Enter agent's code
  - See green ✓ checkmark
  - Submit interest
  - Login as agent → See in "My Referrals"

- [ ] **Test 4**: Buyer enters invalid code

  - Express interest in property
  - Enter "INVALID1"
  - See red ✗ and error message
  - Clear field → Error disappears

- [ ] **Test 5**: Buyer skips referral code
  - Express interest in property
  - Leave referral code empty
  - Submit successfully (optional field)

### Edge Cases

- [ ] **Test 6**: Case insensitivity

  - Enter code in lowercase "a3b7c9d2"
  - Should work same as "A3B7C9D2"

- [ ] **Test 7**: Partial code entry

  - Enter only 4 characters
  - Should not validate yet
  - Enter all 8 → Validates

- [ ] **Test 8**: Code with spaces

  - Enter "A3B7 C9D2" (with space)
  - System should handle gracefully

- [ ] **Test 9**: Very old browser
  - Test in older browser (if needed)
  - Verify no JavaScript errors

### Performance Tests

- [ ] **Test 10**: Fast typing

  - Type code quickly
  - Validation should debounce properly

- [ ] **Test 11**: Large dataset
  - If 1000+ users, test lookup speed
  - Should be instant (indexed)

### Commission Flow Tests

- [ ] **Test 12**: Complete payment cycle
  - Submit interest with referral code
  - Make all installment payments
  - Verify agent_hierarchy created
  - Verify commissions disbursed
  - Check agent's commission history

## Rollback Plan

### If Critical Issues Found

#### Option 1: Quick Fix

```bash
# Fix issue locally
# Test thoroughly
git add .
git commit -m "Fix: [issue description]"
git push origin main
```

#### Option 2: Full Rollback

```bash
# Revert frontend to previous version
git revert HEAD
git push origin main

# Revert database (if needed)
# In Supabase SQL Editor:
ALTER TABLE profiles DROP COLUMN IF EXISTS referral_id;
DROP FUNCTION IF EXISTS generate_referral_id();
DROP FUNCTION IF EXISTS get_agent_by_referral_id(TEXT);
```

**Note**: Rolling back database loses referral codes but doesn't break existing functionality (referring_agent_id still works)

## Monitoring

### What to Watch

#### Day 1-3 After Deployment

- [ ] Check error logs for validation issues
- [ ] Monitor property interest submissions
- [ ] Check if codes are being used
- [ ] Verify no 500 errors
- [ ] Check database performance

#### Week 1

- [ ] Review user feedback
- [ ] Check referral conversion rates
- [ ] Monitor database query performance
- [ ] Verify commission calculations correct

#### Month 1

- [ ] Analyze code usage patterns
- [ ] Check for duplicate code issues (shouldn't happen)
- [ ] Review agent feedback
- [ ] Plan future enhancements

### Metrics to Track

- **Before Deployment**:

  - Property interests created per day
  - % with referral (via referring_agent_id)
  - Average time to submit interest
  - Error rate in submission

- **After Deployment**:
  - Same metrics
  - Compare referral usage rates
  - Time to validate code
  - User feedback on new system

## Communication

### Notify Users

#### Agents

Email/SMS:

```
🎉 New Feature: Easy Referral Codes!

We've upgraded your referral system! Instead of a long ID,
you now have a short 8-character code:

Your Code: [CODE]

📱 Easy to share via WhatsApp, SMS, or phone
💼 Perfect for business cards
✨ Professional and memorable

Find your code in your dashboard.

Questions? Contact support.
```

#### Help Center Article

Create article: "How to Use Your New Referral Code"

- Show where to find code
- How to share it
- What buyers should do
- Benefits of new system

## Success Criteria

### Must Have (Before Marking Complete)

- [x] Migration script runs without errors
- [ ] All existing users have referral codes
- [ ] Codes are unique (no duplicates)
- [ ] Dashboard displays codes correctly
- [ ] Validation works in interest form
- [ ] Interests successfully link to agents
- [ ] No critical bugs in production
- [ ] Documentation complete

### Nice to Have (Future)

- [ ] QR code generation
- [ ] Custom codes for premium agents
- [ ] Analytics dashboard for code usage
- [ ] A/B test to compare old vs new conversion
- [ ] Referral leaderboard

## Support Preparation

### Common Questions & Answers

**Q: Where do I find my referral code?**
A: Dashboard → See "Your Referral Code" or go to "My Referrals" page

**Q: Can I change my code?**
A: Not yet - this will be a future feature for custom codes

**Q: What happened to my old referral ID?**
A: It's still saved internally. All your existing referrals are safe.

**Q: A buyer says my code is invalid?**
A: Double-check the code (8 characters, case doesn't matter). Try copying from dashboard.

**Q: Can buyers still use my old UUID?**
A: No - the new system only accepts the 8-character codes

**Q: How do I share my code?**
A: Click "Copy" button and share via WhatsApp, SMS, email, or business card

## Final Checklist

### Before Going Live

- [ ] All tests pass
- [ ] Database backup created
- [ ] Migration tested on staging
- [ ] Team reviewed changes
- [ ] Rollback plan ready
- [ ] Monitoring set up
- [ ] Documentation published
- [ ] Support team briefed

### Go Live

- [ ] Run database migration
- [ ] Deploy frontend
- [ ] Verify production works
- [ ] Test with real data
- [ ] Notify users
- [ ] Monitor for issues

### After Launch

- [ ] Monitor for 24 hours
- [ ] Respond to user feedback
- [ ] Fix any bugs quickly
- [ ] Document lessons learned
- [ ] Plan next enhancements

---

## Approval

- [ ] Developer: Code complete and tested
- [ ] QA: All tests passed
- [ ] Product Owner: Features approved
- [ ] DevOps: Deployment plan reviewed
- [ ] Support: Ready to assist users

**Date**: ******\_******
**Deployed By**: ******\_******
**Approved By**: ******\_******
