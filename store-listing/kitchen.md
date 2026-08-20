# Play Store listing — SCK Kitchen (staff app)

Reference copy for the Play Console listing form. This app is a staff
tool, not a consumer product — worth double-checking whether it needs a
public listing at all versus internal-track distribution (see the build
plan's tradeoffs section) before spending review-cycle time on it.

## Title (30 char max)
SCK Kitchen

## Short description (80 char max)
Live order queue, menu, stock, and sales for SmartCloudKitchen staff.

## Full description (4000 char max)
SCK Kitchen is the line-side console for SmartCloudKitchen staff — built
for a mounted kitchen tablet, and usable from a phone too.

Sign in for your shift to see the live order queue for your kitchen,
scoped to your role: every cook sees the queue and can bump a ticket
through cooking, ready, and picked up; managers and owners can also edit
the menu (including 86'ing an item the moment you run out), track stock
levels, and see today's sales and customer feedback across every brand.

Every screen updates live — an order placed on the customer app appears
in the queue immediately, and a ticket bumped here updates that
customer's tracking screen the same way.

This app is intended for SmartCloudKitchen staff only.

## Category
Business

## Content rating questionnaire — suggested answers
- Violence / sexual content / profanity / controlled substances: none
- User-generated content: no (menu/stock edits are operational data, not
  user-generated content in the review sense)
- Shares location: no
- Digital purchases: none

## Data safety form
- Collected: staff email (for sign-in), which location/role an account
  is scoped to, the same order data the customer app collects (staff
  can view/manage it), and photos — staff can attach a dish photo when
  editing a menu item, uploaded to Supabase Storage
- Not collected: payment info, advertising ID, precise location
- Shared with third parties: no
- Encrypted in transit: yes (HTTPS/TLS to Supabase)
- Restricted to: staff accounts only — not a public signup flow
