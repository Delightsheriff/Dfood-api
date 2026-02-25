/**
 * HTML email templates for DFood transactional emails.
 * All styles are inline for maximum email client compatibility.
 */

const baseWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">🍔 DFood</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Food delivery, made simple</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} DFood. All rights reserved.</p>
            <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;">You're receiving this because you have an account with DFood.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const welcomeEmailHtml = (name: string): string =>
  baseWrapper(`
    <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700;">Welcome to DFood, ${name}! 🎉</h2>
    <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
      We're thrilled to have you on board. Your account is all set and you're ready to explore
      hundreds of amazing restaurants near you.
    </p>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      Browse menus, track your orders in real time, and enjoy your favourite meals delivered right to your door.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background:#f97316;border-radius:8px;padding:14px 32px;">
          <span style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Start Ordering</span>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#9ca3af;font-size:13px;">Happy eating! 🍕</p>
  `);

export const otpEmailHtml = (otp: string): string =>
  baseWrapper(`
    <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700;">Your Password Reset Code</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      We received a request to reset your DFood password. Use the code below to proceed.
      This code expires in <strong>15 minutes</strong>.
    </p>
    <div style="background:#f9fafb;border:2px dashed #f97316;border-radius:12px;padding:32px;text-align:center;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your OTP code</p>
      <p style="margin:0;color:#111827;font-size:48px;font-weight:800;letter-spacing:12px;">${otp}</p>
    </div>
    <p style="margin:0 0 8px;color:#4b5563;font-size:14px;line-height:1.6;">
      Enter this code in the app to continue resetting your password.
    </p>
    <p style="margin:0;color:#ef4444;font-size:13px;">
      ⚠️ If you did not request a password reset, please ignore this email. Your account remains safe.
    </p>
  `);

export const passwordResetConfirmationHtml = (name: string): string =>
  baseWrapper(`
    <div style="text-align:center;margin:0 0 24px;">
      <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px;">✅</div>
      <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Password Reset Successfully</h2>
      <p style="margin:0;color:#6b7280;font-size:14px;">Hi ${name}, your password has been updated.</p>
    </div>
    <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
      Your DFood account password was successfully reset. You can now sign in with your new password.
    </p>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
      If you did not make this change, please contact our support team immediately.
    </p>
    <p style="margin:0;color:#9ca3af;font-size:13px;">Stay safe! — The DFood Team</p>
  `);

export const vendorWelcomeEmailHtml = (
  name: string,
  restaurantName: string,
): string =>
  baseWrapper(`
    <h2 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700;">Welcome aboard, ${name}! 🚀</h2>
    <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
      Congratulations! Your restaurant <strong style="color:#f97316;">${restaurantName}</strong> has been registered on DFood.
      Our team will review your profile and get you listed as soon as possible.
    </p>
    <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:4px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#92400e;font-size:14px;font-weight:600;">What happens next?</p>
      <ul style="margin:0;padding-left:20px;color:#78350f;font-size:14px;line-height:1.8;">
        <li>Our team reviews your restaurant details</li>
        <li>You'll receive confirmation once you're live</li>
        <li>Log in to your vendor dashboard to add photos and menu items</li>
      </ul>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:13px;">Welcome to the DFood family! 🍽️</p>
  `);
