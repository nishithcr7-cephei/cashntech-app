/**
 * Role Constants for CashnTech Loan Management System
 * Defines the app roles used for UI customization.
 */

export type AppRole =
  | 'anchor_maker'
  | 'anchor_checker'
  | 'dealer_maker'
  | 'dealer_checker';

export const ROLE_LABELS: Record<AppRole, string> = {
  anchor_maker: 'Anchor Maker',
  anchor_checker: 'Anchor Checker',
  dealer_maker: 'Dealer Maker',
  dealer_checker: 'Dealer Checker',
};

export const ROLE_HEADER_COLORS: Record<AppRole, { bg: string; border: string }> = {
  anchor_maker: { bg: '#FFE9E9', border: 'rgba(227, 6, 19, 0.5)' },
  anchor_checker: { bg: '#FFD9D9', border: 'rgba(227, 6, 19, 0.45)' }, // More visible pink
  dealer_maker: { bg: '#FFE8D6', border: 'rgba(227, 6, 19, 0.4)' }, // Peach/orange tint
  dealer_checker: { bg: '#FFD4B3', border: 'rgba(227, 6, 19, 0.4)' }, // Lighter peach for checker
};

// Role-specific button colors for SelectRoleScreen
export const ROLE_BUTTON_COLORS: Record<AppRole, { bg: string; border: string; text: string }> = {
  anchor_maker: { bg: '#FFE9E9', border: '#FFD9D9', text: '#E30613' },
  anchor_checker: { bg: '#FFD9D9', border: '#FFC4C4', text: '#E30613' }, // Darker pink
  dealer_maker: { bg: '#FFE8D6', border: '#FFD4B3', text: '#E30613' }, // Peach/orange tint
  dealer_checker: { bg: '#FFD4B3', border: '#FFC4A3', text: '#E30613' }, // Lighter peach tint
};
