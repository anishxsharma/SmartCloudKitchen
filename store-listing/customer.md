# Play Store listing — SmartCloudKitchen (customer app)

Reference copy for the Play Console listing form. Character limits are
Google's; trim to fit if these run long once pasted in.

## Title (30 char max)
SmartCloudKitchen

## Short description (80 char max)
Four kitchens, one order. Watch it move from placed to on the way.

## Full description (4000 char max)
SmartCloudKitchen runs four virtual restaurant brands out of one kitchen
— Curry Line, Wok Theory, Bowl & Bird, and Slice Lab — cooked to order
and delivered together, even if you mix brands in one bag.

Browse the menu, add what you want, and check out — verify with a quick
text-message code or sign in with Google. Once it's in, watch it move
through the kitchen in real time: accepted, cooking, packed and ready,
on the way.
The status you see is the same one the kitchen is looking at, updated
the moment they bump your ticket.

After your order arrives, rate it — a quick star rating and an optional
note straight to the kitchen that made it.

## Category
Food & Drink

## Content rating questionnaire — suggested answers
- Violence: none
- Sexual content: none
- Profanity: none
- Controlled substances: none
- User-generated content: yes — order notes and feedback comments are
  free text a customer writes; not shown publicly, only to the fulfilling
  kitchen's staff
- Shares location: no
- Digital purchases: no in-app purchases; the app itself doesn't process
  payment yet (see the build plan's payment-integration note)

## Data safety form — matches the privacy policy
- Collected: phone number or email (whichever sign-in method used), order
  contents, delivery notes, feedback ratings/comments, device push token
  (optional, notification permission)
- Not collected: precise location, payment info, advertising ID,
  contacts, photos/media, browsing history
- Third-party services: Twilio (delivers the phone verification code;
  receives the phone number only), Google Sign-In (returns an email
  address for the "Sign in with Google" path) — not shared for
  advertising/marketing purposes
- Encrypted in transit: yes (HTTPS/TLS to Supabase)
- Users can request deletion: yes, via the contact in the privacy policy
