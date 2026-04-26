import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { brand } from './brand';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getthatbread.sg';

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
}

/**
 * Shared chrome for every transactional email.
 *
 * - 600px-wide centered card on a warm cream background (mimics the site's
 *   --color-surface-raised tint).
 * - Branded header: bread icon + "get that bread" wordmark, left-aligned.
 *   Text wordmark (not an image) so it always renders even with images
 *   blocked by default.
 * - Footer: site link + reply hint + small print. No social icons until we
 *   commit to a presence on those channels.
 *
 * `preview` shows in the inbox preview line — keep it under ~90 chars and
 *   write it like a subject's natural continuation.
 */
export function EmailLayout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head>
        {/* Opt out of aggressive dark-mode inversion in clients that respect
            this (Gmail web, Outlook web, newer Apple Mail). Apple Mail iOS
            ignores it. */}
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header card — dark brown with rounded corners */}
          <Section style={headerStyle}>
            <table
              cellPadding={0}
              cellSpacing={0}
              style={{ borderCollapse: 'collapse', margin: '0 auto' }}
            >
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'middle', paddingRight: 12 }}>
                    <Text style={headerTextStyle}>
                      <span style={{ color: brand.crust }}>lets go</span> get that bread
                    </Text>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <Img
                      src={`${APP_URL}/bread-icon.png`}
                      alt=""
                      width="32"
                      height="32"
                      style={{ display: 'block' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Card */}
          <Section style={cardStyle}>{children}</Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              <Link href={APP_URL} style={footerLinkStyle}>
                getthatbread.sg
              </Link>
              {' · '}
              Singapore&apos;s reward-based crowdfunding platform
            </Text>
            <Text style={footerSmallStyle}>
              Reply to this email to reach our team. We read every message.
            </Text>
            <Hr style={footerRuleStyle} />
            <Text style={footerSmallStyle}>
              You&apos;re receiving this because you have an account at{' '}
              <Link href={APP_URL} style={footerLinkStyle}>
                getthatbread.sg
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: brand.surfaceRaised,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  color: brand.ink,
  WebkitFontSmoothing: 'antialiased',
};

const containerStyle: React.CSSProperties = {
  margin: '0 auto',
  padding: '32px 16px 48px',
  maxWidth: 600,
};

const headerStyle: React.CSSProperties = {
  paddingTop: 24,
  paddingBottom: 24,
  textAlign: 'center',
  backgroundColor: brand.headerBg,
  borderRadius: 12,
  border: `1px solid ${brand.headerBg}`,
  marginBottom: 12,
};

const wordmarkStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.01em',
  color: brand.headerText, // white text on dark header
};

const headerTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.01em',
  color: brand.headerText, // white text on dark header
};

const cardStyle: React.CSSProperties = {
  backgroundColor: brand.surface,
  border: `1px solid ${brand.border}`,
  borderRadius: 12,
  padding: '36px 32px',
};

const footerStyle: React.CSSProperties = {
  paddingTop: 28,
  paddingBottom: 4,
  textAlign: 'center',
};

const footerTextStyle: React.CSSProperties = {
  margin: '0 0 6px 0',
  fontSize: 13,
  color: brand.inkMuted,
  lineHeight: 1.5,
  textAlign: 'center',
};

const footerSmallStyle: React.CSSProperties = {
  margin: '0 0 6px 0',
  fontSize: 12,
  color: brand.inkSubtle,
  lineHeight: 1.5,
  textAlign: 'center',
};

const footerLinkStyle: React.CSSProperties = {
  color: brand.crust,
  textDecoration: 'none',
  fontWeight: 600,
};

const footerRuleStyle: React.CSSProperties = {
  borderColor: brand.border,
  margin: '16px 0 12px',
};

const letsGoStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.01em',
  color: brand.crust, // orange accent
};
