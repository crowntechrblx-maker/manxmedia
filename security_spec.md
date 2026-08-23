# Firebase Security Specifications

## Data Invariants
1. Admins are strictly identified by the email `crowntechrblx@gmail.com` with `email_verified == true`.
2. Anyone can read fully published photos (`isPublished == true`) via queries.
3. Only the admin can read unpublished or draft photos.
4. Anyone can read categories.
5. Only the admin can create, update, or delete categories and photos.
6. Anyone can create messages, but cannot read, update, or delete them. Only the admin can read and delete messages.
7. Any document write must adhere strictly to the schema (no shadow fields, correct types/sizes).

## The Dirty Dozen Payloads
1. **Unauthenticated Photo Write:** Guest trying to create a photo. (Reject)
2. **Shadow Field Injection:** Admin submitting a photo with a `maliciousRole` field. (Reject via `hasAll`/Size)
3. **Draft Read by Guest:** Unauthorized user querying `isPublished == false` photos. (Reject)
4. **Invalid Type Update:** Admin changing `isFeatured` to a string instead of boolean. (Reject)
5. **ID Poisoning:** Document ID > 128 characters or containing invalid chars. (Reject)
6. **Email Spoofing:** User with `crowntechrblx@gmail.com` but `email_verified == false` trying to write. (Reject)
7. **Orphaned Categories:** Admin updating a category with an unrecognized string instead of `number` for `order`. (Reject)
8. **Contact Form Spoofing:** Creating a message with missing fields. (Reject)
9. **Message Reading:** Guest trying to fetch messages. (Reject)
10. **Admin Deletion by Guest:** Guest trying to delete a photo. (Reject)
11. **Denial of Wallet (Huge String):** Admin setting `description` to a 50KB string. (Reject)
12. **Timestamp Forging:** Admin submitting `createdAt` not equal to `request.time`. (Reject)
