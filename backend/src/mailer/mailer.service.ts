import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

// Define the OrderDetails interface to avoid 'any' usage
interface OrderDetails {
  id: string;
  items: { name: string; price: number; quantity: number }[];
  totalAmount: number;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(
    private readonly mailerService: NestMailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (typeof this.mailerService.sendMail === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await this.mailerService.sendMail({
          to,
          subject: 'Welcome to Shopie',
          template: 'welcome.ejs',
          context: {
            name,
            appName: 'Shopie',
            link:
              this.configService.get<string>('APP_LOGIN_URL') ||
              'http://localhost:3000/login',
          },
        });
      }
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error: unknown) {
      this.logger.error(
        'Error sending welcome email:',
        (error as Error)?.message || error,
      );
    }
  }

  // Use the OrderDetails interface instead of 'any'
  async sendOrderConfirmationEmail(
    to: string,
    orderDetails: OrderDetails,
    userName: string,
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (typeof this.mailerService.sendMail === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await this.mailerService.sendMail({
          to,
          subject: 'Order Confirmation',
          template: 'checkout.ejs',
          context: {
            orderId: orderDetails.id,
            items: orderDetails.items,
            total: orderDetails.totalAmount,
            user: { name: userName },
            appName: 'Shopie',
            link:
              this.configService.get<string>('APP_URL') ||
              'http://localhost:3000',
            supportEmail: this.configService.get<string>('SUPPORT_EMAIL') || '',
          },
        });
      }
      this.logger.log(`Order confirmation email sent to ${to}`);
    } catch (error: unknown) {
      this.logger.error(
        'Error sending order confirmation email:',
        (error as Error)?.message || error,
      );
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    try {
      this.logger.log(`Attempting to send password reset email to ${to}`);
      this.logger.log(`Reset token: ${resetToken}`);

      // Check if mailer service is properly configured
      if (!this.mailerService) {
        this.logger.error('Mailer service is not properly initialized');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (typeof this.mailerService.sendMail === 'function') {
        const appResetUrl = this.configService.get<string>('APP_RESET_URL');
        this.logger.log(`APP_RESET_URL from config: ${appResetUrl}`);

        // Always include the token in the URL
        const baseUrl = appResetUrl || 'http://localhost:4200/reset-password';
        const resetUrl = `${baseUrl}?token=${resetToken}`;
        this.logger.log(`Final reset URL: ${resetUrl}`);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await this.mailerService.sendMail({
          to,
          subject: 'Password Reset Request',
          template: 'reset-password.ejs',
          context: {
            resetToken,
            appName: 'Shopie',
            link: resetUrl,
          },
        });

        this.logger.log(`Password reset email sent successfully to ${to}`);
      } else {
        this.logger.error('sendMail method is not available on mailer service');
      }
    } catch (error: unknown) {
      this.logger.error(
        'Error sending password reset email:',
        (error as Error)?.message || error,
      );
      this.logger.error('Full error details:', error);
      throw error; // Re-throw to see the error in the auth service
    }
  }
}
