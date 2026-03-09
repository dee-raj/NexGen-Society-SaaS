import nodemailer from 'nodemailer';
import { config } from '../../config';
import { logger } from '../../config/logger';

export class EmailService {
    private static transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS,
        },
    });

    /**
     * Send a generic email.
     */
    static async sendEmail(to: string, subject: string, html: string): Promise<void> {
        try {
            // If any SMTP config is missing, just log and return in dev
            if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
                logger.warn({ to, subject }, 'SMTP not fully configured. Email skipped (logged below).');
                logger.info('--- EMAIL LOG (SMTP MISSING) ---');
                logger.info(`To: ${to}`);
                logger.info(`Subject: ${subject}`);
                logger.info(`Content: ${html}`);
                logger.info('--------------------------------');
                return;
            }

            await this.transporter.sendMail({
                from: config.EMAIL_FROM,
                to,
                subject,
                html,
            });

            logger.info({ to, subject }, 'Email sent successfully');
        } catch (error) {
            logger.error({ error, to, subject }, 'Failed to send email');
            // We don't throw here to avoid breaking the core business process
            // but in production you might want more robust error handling
        }
    }

    /**
     * Send password reset email.
     */
    static async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
        const subject = 'Reset Your Password - NexGen Society';
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset Request</h2>
                <p style="color: #475569; line-height: 1.6;">You requested a password reset for your NexGen Society account. Click the button below to set a new password. This link will expire in 1 hour.</p>
                <div style="margin: 32px 0;">
                    <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link: <br/> ${resetUrl}</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
                <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `;

        await this.sendEmail(email, subject, html);
    }

    /**
     * Send society approval/welcome email.
     */
    static async sendSocietyApprovedEmail(
        email: string,
        societyName: string,
        adminName: string,
        tempPassword: string
    ): Promise<void> {
        const subject = `Welcome to NexGen Society - ${societyName} Approved!`;
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                <h2 style="color: #0f172a; margin-bottom: 16px;">Society Registration Approved!</h2>
                <p style="color: #475569; line-height: 1.6;">Hello ${adminName},</p>
                <p style="color: #475569; line-height: 1.6;">Great news! Your request for <strong>${societyName}</strong> has been approved. You can now log in to your dashboard to complete the setup.</p>
                <div style="margin: 32px 0;">
                    <a href="${config.FRONTEND_URL}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Login to Dashboard</a>
                </div>
                <p style="color: #64748b; font-size: 14px;">Use your registered email and the temporary password system generated for you to log in.</p>
                <p style="color: #64748b; font-size: 14px;">Temporary Password: ${tempPassword}</p>
                <p style="color: #64748b; font-size: 14px;">You can change your password after logging in.</p>
                <p style="color: #64748b; font-size: 14px;">If you have any questions, please contact us at ${config.SUPPORT_EMAIL}.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
                <p style="color: #94a3b8; font-size: 12px;">NexGen Society SaaS - Empowering Communities</p>
            </div>
        `;

        await this.sendEmail(email, subject, html);
    }
}
