import { Button as REButton, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { brand } from './brand';

/**
 * Primitive components for emails. Each is a thin styled wrapper over a
 * @react-email/components primitive, so the visual language stays consistent
 * across every template.
 */

export function Heading({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <Text style={{ ...headingStyle, ...style }}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <Text style={{ ...bodyTextStyle, ...style }}>{children}</Text>;
}

export function Subtle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <Text style={{ ...subtleStyle, ...style }}>{children}</Text>;
}

export function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ paddingTop: 8, paddingBottom: 4 }}>
      <REButton href={href} style={primaryButtonStyle}>
        {children}
      </REButton>
    </Section>
  );
}

export function Inset({ children }: { children: React.ReactNode }) {
  return <Section style={insetStyle}>{children}</Section>;
}

export function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
      <tbody>
        <tr>
          <td style={statLabelStyle}>{label}</td>
          <td style={statValueStyle}>{value}</td>
        </tr>
      </tbody>
    </table>
  );
}

export function Divider() {
  return <Hr style={dividerStyle} />;
}

const headingStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: 28,
  fontWeight: 800,
  lineHeight: 1.2,
  letterSpacing: '-0.02em',
  color: brand.ink,
};

const bodyTextStyle: React.CSSProperties = {
  margin: '0 0 18px 0',
  fontSize: 16,
  lineHeight: 1.65,
  color: brand.ink,
};

const subtleStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: 15,
  lineHeight: 1.6,
  color: brand.inkMuted,
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: brand.crust,
  color: '#FFFFFF',
  padding: '14px 24px',
  borderRadius: 10,
  fontSize: 16,
  fontWeight: 700,
  textDecoration: 'none',
  letterSpacing: '-0.005em',
};

const insetStyle: React.CSSProperties = {
  backgroundColor: brand.surfaceOverlay,
  borderRadius: 10,
  padding: '16px 18px',
  margin: '4px 0 20px',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 14,
  color: brand.inkMuted,
  paddingTop: 7,
  paddingBottom: 7,
  width: '50%',
};

const statValueStyle: React.CSSProperties = {
  fontSize: 15,
  color: brand.ink,
  fontWeight: 700,
  textAlign: 'right',
  paddingTop: 7,
  paddingBottom: 7,
};

const dividerStyle: React.CSSProperties = {
  borderColor: brand.border,
  margin: '20px 0',
};
