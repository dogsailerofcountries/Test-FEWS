---
name: FEWS Hydrological Intelligence
colors:
  background: '#eef2f6'
  on-background: '#1a202c'
  surface: rgba(255, 255, 255, 0.75)
  on-surface: '#1a202c'
  surface-variant: '#ffffff'
  on-surface-variant: '#64748b'
  outline: rgba(226, 232, 240, 0.8)
  primary: '#0ea5e9'
  on-primary: '#ffffff'
  primary-container: 'linear-gradient(135deg, #0ea5e9, #3b82f6)'
  sidebar-surface: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
  on-sidebar: rgba(255, 255, 255, 0.9)
  error: '#ef4444'
  warning: '#f97316'
  caution: '#f59e0b'
  success: '#10b981'
  info: '#38bdf8'
  dark:
    background: '#0f172a'
    surface: rgba(30, 41, 59, 0.7)
    surface-variant: '#1e293b'
    on-background: '#f8fafc'
    on-surface: '#f8fafc'
    outline: rgba(51, 65, 85, 0.5)
  surface-dim: '#d6dae0'
  surface-bright: '#f6faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f4fa'
  surface-container: '#eaeef4'
  surface-container-high: '#e4e8ee'
  surface-container-highest: '#dee3e9'
  inverse-surface: '#2c3135'
  inverse-on-surface: '#edf1f7'
  outline-variant: '#bec8d2'
  surface-tint: '#006591'
  on-primary-container: '#003751'
  inverse-primary: '#89ceff'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#8a5100'
  on-tertiary: '#ffffff'
  tertiary-container: '#de8712'
  on-tertiary-container: '#4d2b00'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c9e6ff'
  primary-fixed-dim: '#89ceff'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#004c6e'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#ffb86e'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  dark-background: '#0f172a'
  dark-surface: rgba(30, 41, 59, 0.7)
  dark-surface-variant: '#1e293b'
  dark-on-background: '#f8fafc'
  dark-on-surface: '#f8fafc'
  dark-outline: rgba(51, 65, 85, 0.5)
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 2.2rem
    fontWeight: '700'
    letterSpacing: -0.02em
    lineHeight: '1.2'
  headline-md:
    fontFamily: Outfit
    fontSize: 1.8rem
    fontWeight: '600'
    letterSpacing: -0.02em
    lineHeight: '1.3'
  title-sm:
    fontFamily: Outfit
    fontSize: 1.1rem
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 0.95rem
    lineHeight: '1.6'
    fontWeight: '400'
  label-xs:
    fontFamily: Inter
    fontSize: 0.7rem
    fontWeight: '600'
    textTransform: uppercase
    letterSpacing: 0.15em
    lineHeight: '1.2'
rounded:
  sm: 6px
  md: 12px
  lg: 14px
  xl: 16px
  full: 20px
  DEFAULT: 0.5rem
spacing:
  unit: 8px
  container-padding: 32px
  card-gap: 24px
  grid-gap: 16px
  inline-xs: 4px
  inline-sm: 8px
  inline-md: 16px
  inline-lg: 24px
motion:
  standard: all 0.25s cubic-bezier(0.16, 1, 0.3, 1)
  entrance: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)
shadows:
  default: 0 10px 40px -10px rgba(0,0,0,0.08)
  hover: 0 20px 40px -15px rgba(0,0,0,0.12)
  dark: 0 10px 40px -10px rgba(0,0,0,0.3)
---

# FEWS Hydrological Intelligence - Design Specification

This document outlines the visual system for the modernized FEWS web platform, following the "Premium Glassmorphism" aesthetic.

## Look & Feel

The interface is designed to feel like a high-end command center. It uses a combination of deep backgrounds and translucent "glass" panels to create depth and hierarchy.

- **Atmospheric Clarity**: Use of `backdrop-filter: blur()` and semi-transparent backgrounds to keep the focus on data while maintaining a sense of space.
- **Geometric Precision**: Bold use of the **Outfit** typeface for headings and **Inter** for dense data ensures legibility and a modern, scientific character.
- **Operational Color Palette**: Colors are chosen not just for aesthetics but for their ability to convey status (Red/Orange/Yellow/Green) clearly against both light and dark backgrounds.

## Components

### Glass Cards
The primary container for all UI elements. They should have a subtle white border (on light mode) or dark border (on dark mode) to define their edges.

### Status Pills
Used throughout the app to indicate station and alert status. They use high-contrast text against low-opacity background colors of the same hue.

### Data Grid (Bento)
The dashboard uses an asymmetric grid to group related information, allowing for different visual weights between high-level stats and detailed lists.
