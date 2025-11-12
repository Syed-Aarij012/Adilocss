# Booking Synchronization Test Checklist

## Prerequisites
✅ Backend connected (Supabase credentials in .env)
✅ Dev server running (npm run dev)
✅ Admin account created
✅ At least one user account

## Test Scenarios

### ✅ Test 1: User Creates Booking
**Steps:**
1. Log in as regular user
2. Go to "Book Appointment"
3. Select service, professional, date, and time
4. Complete booking
5. Go to "My Bookings" → Should see the new booking

**Admin Check:**
6. Log in as admin
7. Go to Admin Dashboard → Bookings tab
8. **Expected:** New booking appears in the list
9. Go to Calendar tab
10. **Expected:** Booking appears in the correct time slot for the professional

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 2: Admin Updates Booking Date/Time
**Steps:**
1. Log in as admin
2. Go to Bookings tab
3. Find a booking and click "Edit"
4. Change the date to tomorrow
5. Change the time to 2:00 PM
6. Click "Save Changes"

**Check Admin Views:**
7. Bookings list → **Expected:** Shows new date/time
8. Calendar tab → **Expected:** Booking moved to new date/time slot

**Check User View:**
9. Log in as the user who made the booking
10. Go to "My Bookings"
11. **Expected:** Booking shows updated date and time

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 3: Admin Changes Booking Status
**Steps:**
1. Log in as admin
2. Find a "pending" booking
3. Click "Confirm" button
4. **Expected:** Status changes to "confirmed" immediately

**Check Sync:**
5. Go to Calendar tab
6. **Expected:** Booking shows blue "confirmed" color
7. Log in as user
8. Go to "My Bookings"
9. **Expected:** Status badge shows "confirmed"

**Complete the Booking:**
10. Log in as admin
11. Click "Complete" on the booking
12. **Expected:** Dashboard revenue increases
13. **Expected:** Calendar shows green "completed" color
14. **Expected:** User sees "completed" status

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 4: Admin Cancels Booking
**Steps:**
1. Log in as admin
2. Find a booking
3. Click "Cancel" button
4. **Expected:** Status changes to "cancelled"

**Check Sync:**
5. Calendar tab → **Expected:** Shows gray "cancelled" color
6. User's "My Bookings" → **Expected:** Shows "cancelled" badge
7. Try to book the same time slot as a user
8. **Expected:** Time slot is now available again

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 5: Real-Time Updates (No Refresh)
**Setup:**
1. Open two browser windows side by side
2. Window 1: Admin logged in (Bookings tab)
3. Window 2: User logged in (My Bookings page)

**Test:**
4. In Window 1 (Admin): Change a booking's time
5. **Expected:** Window 2 (User) updates automatically without refresh
6. In Window 1 (Admin): Mark booking as completed
7. **Expected:** Window 2 (User) shows "completed" status automatically

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 6: Calendar Professional View
**Steps:**
1. Log in as admin
2. Go to Calendar tab
3. Create 3 bookings for different professionals at the same time
4. **Expected:** Each booking appears in its professional's column
5. Change one booking to a different professional
6. **Expected:** Booking moves to the new professional's column

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 7: Multiple Bookings Same Day
**Steps:**
1. Create 3 bookings for the same professional on the same day
   - 10:00 AM
   - 12:00 PM
   - 2:00 PM
2. Check Calendar
3. **Expected:** All 3 bookings appear in correct time slots
4. Update middle booking (12:00 PM) to 4:00 PM
5. **Expected:** Calendar shows booking moved to 4:00 PM slot

**Result:** ✅ Pass / ❌ Fail

---

### ✅ Test 8: Revenue Calculation
**Steps:**
1. Note current total revenue in dashboard
2. Create a booking for a £45 service
3. Mark it as "completed"
4. **Expected:** Revenue increases by £45
5. Cancel a completed booking
6. **Expected:** Revenue stays the same (cancelled bookings don't affect revenue)

**Result:** ✅ Pass / ❌ Fail

---

## Common Issues & Solutions

### Issue: Changes don't appear
**Solution:** 
- Check browser console for errors
- Verify .env file has correct Supabase credentials
- Ensure Supabase real-time is enabled

### Issue: Calendar doesn't update
**Solution:**
- Check that booking has professional_id
- Verify date format is correct (YYYY-MM-DD)
- Check console for "Calendar: Booking changed" message

### Issue: User doesn't see updates
**Solution:**
- Ensure user is logged in
- Check that booking belongs to the user
- Verify user_id matches in database

---

## Success Criteria

All tests should pass with:
- ✅ Instant updates (no page refresh needed)
- ✅ Consistent data across all views
- ✅ Correct date/time display everywhere
- ✅ Proper status colors in calendar
- ✅ Accurate revenue calculations
- ✅ Real-time synchronization working

---

## Notes

- Real-time updates may take 1-2 seconds to propagate
- Browser console should show "Booking changed" messages
- All views read from the same database table
- Changes are permanent and affect all users
