import React from 'react'

/* ================================================================
   ICONS — Inline SVG components matching Around theme icons
   ================================================================ */

export function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      < circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg >
  );
}

export function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      < path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg >
  );
}

export function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      <line x1="5" y1="12" x2="19" y2="12" />
      < polyline points="12 5 19 12 12 19" />
    </svg >
  );
}

export function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      <line x1="19" y1="12" x2="5" y2="12" />
      < polyline points="12 19 5 12 12 5" />
    </svg >
  );
}

export function IconArrowUp({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" >
      <line x1="12" y1="19" x2="12" y2="5" />
      < polyline points="5 12 12 5 19 12" />
    </svg >
  );
}

export function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" >
      < polyline points="20 6 9 17 4 12" />
    </svg >
  );
}

export function IconLogin({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      < path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      < polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg >
  );
}

export function IconShare({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      < circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /> <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg >
  );
}

export function IconComment({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      < path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg >
  );
}

export function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" >
      < path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg >
  );
}

export function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      < rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      < path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg >
  );
}

export function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" >
      < path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
      < circle cx="4" cy="4" r="2" />
    </svg >
  );
}

/* Benefit SVG Icons */
export function BenefitSupportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 40 40" fill="currentColor" >
      < path d="M37.805 15.6567L34.6717 15.2583C34.4133 14.4633 34.095 13.6967 33.7233 12.9683L35.6583 10.4767C36.4417 9.46833 36.35 8.045 35.455 7.17833L32.83 4.55333C31.955 3.65 30.5317 3.56 29.5217 4.34167L27.0333 6.27667C26.305 5.905 25.5383 5.58667 24.7417 5.32833L24.3433 2.2C24.1933 0.945 23.1283 0 21.8667 0H18.1333C16.8717 0 15.8067 0.945 15.6567 2.195L15.2583 5.32833C14.4617 5.58667 13.695 5.90333 12.9667 6.27667L10.4767 4.34167C9.47 3.56 8.04667 3.65 7.17833 4.545L4.55333 7.16833C3.65 8.045 3.55833 9.46833 4.34167 10.4783L6.27667 12.9683C5.90333 13.6967 5.58667 14.4633 5.32833 15.2583L2.2 15.6567C0.945 15.8067 0 16.8717 0 18.1333V21.8667C0 23.1283 0.945 24.1933 2.195 24.3433L5.32833 24.7417C5.58667 25.5367 5.905 26.3033 6.27667 27.0317L4.34167 29.5233C3.55833 30.5317 3.65 31.955 4.545 32.8217L7.17 35.4467C8.04667 36.3483 9.46833 36.4383 10.4783 35.6567L12.9683 33.7217C13.6967 34.095 14.4633 34.4133 15.2583 34.67L15.6567 37.7967C15.8067 39.055 16.8717 40 18.1333 40H21.8667C23.1283 40 24.1933 39.055 24.3433 37.805L24.7417 34.6717C25.5367 34.4133 26.3033 34.095 27.0317 33.7233L29.5233 35.6583C30.5317 36.4417 31.955 36.35 32.8217 35.455L35.4467 32.83C36.35 31.9533 36.4417 30.5317 35.6583 29.5217L33.7233 27.0317C34.0967 26.3033 34.415 25.5367 34.6717 24.7417L37.7983 24.3433C39.0533 24.1933 39.9983 23.1283 39.9983 21.8667V18.1333C40 16.8717 39.055 15.8067 37.805 15.6567ZM20 28.3333C15.405 28.3333 11.6667 24.595 11.6667 20C11.6667 15.405 15.405 11.6667 20 11.6667C24.595 11.6667 28.3333 15.405 28.3333 20C28.3333 24.595 24.595 28.3333 20 28.3333Z" />
    </svg >
  );
}

export function BenefitPrivacyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 40 40" fill="currentColor" >
      < path d="M37.0833 13.3335H2.91669C1.31669 13.3335 0 14.6502 0 16.2502V37.0835C0 38.6835 1.31669 40.0002 2.91669 40.0002H37.0834C38.6834 40.0002 40.0001 38.6835 40.0001 37.0835V16.2502C40 14.6502 38.6833 13.3335 37.0833 13.3335ZM35 21.2502V32.0835C35 33.6835 33.7 35.0002 32.0833 35.0002H22.9167C21.3 35.0002 20 33.6835 20 32.0835V21.2502C20 19.6502 21.3 18.3335 22.9167 18.3335H32.0834C33.7 18.3335 35 19.6502 35 21.2502ZM15.4167 27.5002H6.25C5.56669 27.5002 5 26.9335 5 26.2502C5 25.5669 5.56669 25.0002 6.25 25.0002H15.4167C16.1 25.0002 16.6667 25.5669 16.6667 26.2502C16.6667 26.9335 16.1 27.5002 15.4167 27.5002ZM16.6667 31.2502C16.6667 31.9335 16.1 32.5002 15.4167 32.5002H6.25C5.56669 32.5002 5 31.9335 5 31.2502C5 30.5669 5.56669 30.0002 6.25 30.0002H15.4167C16.1 30.0002 16.6667 30.5669 16.6667 31.2502ZM15.4167 22.5002H6.25C5.56669 22.5002 5 21.9335 5 21.2502C5 20.5669 5.56669 20.0002 6.25 20.0002H15.4167C16.1 20.0002 16.6667 20.5669 16.6667 21.2502C16.6667 21.9335 16.1 22.5002 15.4167 22.5002Z" />
      < path d="M37.0859 0H16.2526C14.6443 0 13.3359 1.30835 13.3359 2.91669V7.08339C13.3359 8.69173 14.6443 10.0001 16.2526 10.0001H37.0859C38.6943 10 40.0026 8.69165 40.0026 7.08331V2.91669C40.0026 1.30835 38.6943 0 37.0859 0Z" />
      < path d="M5 10C7.76142 10 10 7.76142 10 5C10 2.23858 7.76142 0 5 0C2.23858 0 0 2.23858 0 5C0 7.76142 2.23858 10 5 10Z" />
    </svg >
  );
}

export function BenefitDataIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 40 40" fill="currentColor" >
      < path d="M1.11125 25.5903H5.55542C6.16903 25.5903 6.66667 26.0876 6.66667 26.7012V37.8124C6.66667 38.426 6.16903 38.9237 5.55542 38.9237H1.11125C0.49764 38.9237 0 38.426 0 37.8124V26.7012C0 26.0876 0.49764 25.5903 1.11125 25.5903Z" />
      < path d="M12.2202 16.7012H16.6648C17.2784 16.7012 17.776 17.1988 17.776 17.8124V37.8124C17.776 38.426 17.2784 38.9237 16.6648 38.9237H12.2202C11.6066 38.9237 11.1094 38.426 11.1094 37.8124V17.8124C11.1094 17.1988 11.6066 16.7012 12.2202 16.7012Z" />
      < path d="M23.33 21.146H27.7746C28.3882 21.146 28.8854 21.6436 28.8854 22.2572V37.8127C28.8854 38.4263 28.8854 38.9239 27.7746 38.9239H23.33C22.7164 38.9239 22.2188 38.4263 22.2188 37.8127V22.2572C22.2188 21.6436 22.7164 21.146 23.33 21.146Z" />
      < path d="M34.4472 14.479H38.8914C39.505 14.479 40.0026 14.9766 40.0026 15.5903V37.8123C40.0026 38.4259 39.505 38.9236 38.8914 38.9236H34.4472C33.8336 38.9236 33.3359 38.4259 33.3359 37.8123V15.5903C33.3359 14.479 33.8336 14.479 34.4472 14.479Z" />
      < path d="M36.6667 1.146C34.8267 1.14803 33.3354 2.63932 33.3333 4.47933C33.3378 4.84228 33.4021 5.20199 33.5238 5.54378L27.9614 8.85026C27.2314 8.07593 26.1731 7.70076 25.1184 7.84196C24.0633 7.98315 23.1413 8.62362 22.6404 9.56274L17.7344 7.13273C17.7584 6.98991 17.7726 6.84587 17.7779 6.70142C17.7804 5.35213 16.9694 4.13468 15.7235 3.6167C14.4775 3.09912 13.0424 3.38354 12.0882 4.33732C11.1336 5.2911 10.8484 6.72583 11.3656 7.97217L5.00163 12.7215C4.49707 12.4208 3.9209 12.2605 3.33333 12.2572C1.49251 12.2572 0 13.7493 0 15.5906C0 17.4314 1.49251 18.9239 3.33333 18.9239C5.17415 18.9239 6.66667 17.4314 6.66667 15.5906C6.66382 15.1894 6.58813 14.7926 6.44328 14.4187L12.8707 9.62174C14.128 10.3228 15.6962 10.1173 16.7301 9.11556L22.3092 11.8788C22.6811 13.5353 24.2399 14.647 25.9273 14.459C27.6147 14.271 28.8908 12.844 28.8888 11.146C28.8888 11.0614 28.87 10.9816 28.8639 10.8986L34.9137 7.302C35.4382 7.63363 36.0457 7.81063 36.6667 7.81266C38.5075 7.81266 40 6.32015 40 4.47933C40 2.63851 38.5075 1.146 36.6667 1.146Z" />
    </svg >
  );
}