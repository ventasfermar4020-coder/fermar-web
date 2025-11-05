# Email System Setup Instructions

This document explains how to configure the Resend email system that has been implemented in your e-commerce application.

## Overview

The application now sends two types of emails after a successful purchase:

1. **Owner Notification Email** - Sent to the business owner with complete order details
2. **Customer Confirmation Email** - Sent to the customer confirming their purchase and informing them that tracking information will be sent when available

## Setup Steps

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (includes 3,000 emails/month for free)
3. Verify your email address

### 2. Get Your API Key

1. Log in to your Resend dashboard
2. Go to **API Keys** section
3. Click **Create API Key**
4. Give it a name (e.g., "Fermar Production")
5. Select the appropriate permissions (sending emails)
6. Copy the API key (you won't be able to see it again!)

### 3. Configure Environment Variables

Add the following environment variables to your `.env` file:

```env
RESEND_API_KEY=re_your_api_key_here
OWNER_EMAIL=your-email@example.com
```

**Important:**
- `RESEND_API_KEY` - Your Resend API key from step 2
- `OWNER_EMAIL` - The email address where you want to receive new order notifications

### 4. Domain Configuration (Optional but Recommended)

By default, emails are sent from `onboarding@resend.dev`. To send from your own domain:

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `fermar.com`)
4. Add the DNS records shown by Resend to your domain's DNS settings
5. Wait for verification (usually a few minutes)
6. Update the email templates to use your domain:
   - In `app/api/webhooks/stripe/route.ts`, change:
     - `from: "Notificaciones <onboarding@resend.dev>"` → `from: "Notificaciones <orders@yourdomain.com>"`
     - `from: "Fermar <onboarding@resend.dev>"` → `from: "Fermar <orders@yourdomain.com>"`

## How It Works

### Order Flow

1. Customer completes payment through Stripe
2. Stripe sends webhook to your application
3. Order is created in the database
4. Two emails are sent automatically:

#### Owner Email Contains:
- Order ID and total amount
- Customer contact information (email and phone)
- Shipping address (for physical products)
- Complete list of products ordered
- Link to admin panel to manage the order
- Reminder to update tracking number when available

#### Customer Email Contains:
- Order confirmation with order number
- Complete order summary with products and total
- Shipping address confirmation (for physical products)
- Message that tracking number will be sent when package is received by shipping service
- Download links and activation codes (for digital products)
- Contact information

### Digital vs Physical Products

The email system automatically detects product types:

- **Physical Products:**
  - Stock is decremented
  - Customer email mentions tracking number will be sent
  - Owner email includes shipping address and reminder to add tracking

- **Digital Products:**
  - Stock is NOT decremented (unlimited downloads)
  - Customer email focuses on download links and activation codes
  - Owner email notes it's a digital order with no shipping needed

## Testing

### Local Testing

1. Make sure you have the environment variables set
2. Run the development server: `npm run dev`
3. Run Stripe webhook listener: `npm run stripe:listen`
4. Make a test purchase
5. Check console logs for email sending confirmations
6. Check your inbox (both owner and customer emails)

### Test Checklist

- [ ] Owner receives email with order details
- [ ] Customer receives confirmation email
- [ ] Physical product orders mention tracking number
- [ ] Digital product orders show download links
- [ ] Email formatting looks good on mobile and desktop
- [ ] All links work correctly

## Email Templates

The email templates are located in:

- **Owner Email:** `src/emails/owner-new-order.ts`
- **Customer Email:** `src/emails/customer-order-confirmation.ts`

You can customize these templates to match your brand:
- Update colors (currently using Tailwind color palette)
- Add your logo
- Modify text and messaging
- Add social media links
- Include promotional content

## Troubleshooting

### Emails Not Sending

1. **Check environment variables:**
   ```bash
   # Make sure these are set
   echo $RESEND_API_KEY
   echo $OWNER_EMAIL
   ```

2. **Check Resend dashboard:**
   - Log in to Resend
   - Go to **Logs** section
   - Look for failed email attempts and error messages

3. **Check application logs:**
   - Look for console messages starting with 📧
   - Check for error messages in webhook handler

### Emails Going to Spam

1. **Verify your domain** in Resend (see Domain Configuration above)
2. **Add SPF and DKIM records** provided by Resend
3. **Avoid spammy content** in email templates
4. **Test email deliverability** using mail-tester.com

### Common Errors

- **"Invalid API key"** - Double-check your `RESEND_API_KEY`
- **"Invalid email address"** - Check `OWNER_EMAIL` format
- **"Rate limit exceeded"** - Free tier has limits, upgrade if needed
- **"Domain not verified"** - Using custom domain without verification

## Cost Information

**Resend Pricing (as of 2025):**
- **Free Tier:** 3,000 emails/month, 100 emails/day
- **Pro Tier:** $20/month for 50,000 emails/month
- Additional emails: $1 per 1,000 emails

For most small e-commerce sites, the free tier is sufficient.

## Next Steps (Optional Enhancements)

Consider implementing these additional features:

1. **Shipping Confirmation Email**
   - Send when tracking number is added
   - Include tracking link to carrier website

2. **Order Status Updates**
   - Email when order status changes
   - Notify on delivery

3. **Email Templates**
   - Use React Email for better template management
   - Add more sophisticated designs

4. **Marketing Emails**
   - Newsletter signups
   - Promotional campaigns
   - Abandoned cart reminders

## Support

- **Resend Documentation:** [resend.com/docs](https://resend.com/docs)
- **Resend Support:** [resend.com/support](https://resend.com/support)
- **Code Location:** Check the following files for email implementation:
  - `src/lib/email.ts` - Email client
  - `src/emails/` - Email templates
  - `app/api/webhooks/stripe/route.ts` - Email sending logic
  - `src/env.ts` - Environment variable validation

---

**Important Security Notes:**

- Never commit your `.env` file to version control
- Keep your Resend API key secret
- Regularly rotate API keys for security
- Monitor email logs for suspicious activity
