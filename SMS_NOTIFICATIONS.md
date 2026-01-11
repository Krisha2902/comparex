# Feature: SMS Notifications

## Goal
Provide instant price drop notifications via SMS to ensure users don't miss deals when away from their email.

## Implementation Details
1.  **SMS Service**: `backend/services/smsService.js` manages SMS delivery.
2.  **Cron Job Integration**: The price alert cron job now checks for a `userPhone` and sends an SMS notification alongside the email when an alert is triggered.
3.  **Template**: SMS messages are concise and include the product name, new price, and target price.

## Configuration (Required)
To enable real SMS delivery, add the following to your `.env` file:
```env
SMS_API_KEY=your_actual_key
SMS_API_SECRET=your_actual_secret
SMS_FROM_NUMBER=your_assigned_number
```

## Current State
- ✅ `smsService.js` implemented with a placeholder for providers (e.g., Twilio).
- ✅ Integrated into `priceAlertcron.js`.
- ✅ SMS logging enabled for local development.

## Future Enhancements
- Support for multiple SMS providers with failover.
- WhatsApp message integration.
- SMS opt-out/unsubscription management.
