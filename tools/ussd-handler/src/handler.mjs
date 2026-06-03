/**
 * @fileoverview USSD Request Processor
 *
 * Parses MNO webhook payloads, manages sessions, routes menus,
 * verifies PINs, and returns formatted USSD responses.
 */

import { checkLockout, recordFailedAttempt, resetAttempts, verifyPin } from './auth.mjs';
import { config } from './config.mjs';
import { routeMenu, resolveLanguage, t  } from './menu.mjs';

/**
 * @typedef {object} UssdRequest
 * @property {string} sessionId
 * @property {string} phoneNumber E.164 format
 * @property {string} input Raw user input (menu selection or PIN)
 * @property {string} [networkCode] MNO identifier
 * @property {string} [countryCode] ISO country from MNO
 */

/**
 * @typedef {object} UssdResponse
 * @property {string} text
 * @property {boolean} end
 */

/**
 * Parse a raw USSD string into structured input.
 * Format: *384*<menu-code>*<param-1>*...*<pin>#
 *
 * @param {string} ussdString
 * @returns {{ sessionId: string, inputs: string[] }}
 */
export function parseUssdString(ussdString) {
  const clean = ussdString.replace(/^\*384/, '').replace(/#$/, '');
  const parts = clean.split('*').filter((p) => p.length > 0);
  return { sessionId: parts.join('-') || 'root', inputs: parts };
}

/**
 * Build a session ID from phone + normalized inputs.
 * @param {string} phone
 * @param {string[]} inputs
 * @returns {string}
 */
export function buildSessionId(phone, inputs) {
  const hash = inputs.slice(0, -1).join('-') || 'root';
  return `${phone.replace(/\+/g, '')}:${hash}`;
}

/**
 * Process a USSD request.
 *
 * @param {UssdRequest} request
 * @param {import('./session.mjs').SessionStore} store
 * @returns {Promise<UssdResponse>}
 */
export async function processUssdRequest(request, store) {
  const { sessionId, phoneNumber, input, countryCode = 'ZW' } = request;

  // Load or create session
  let session = await store.getSession(sessionId);
  if (!session) {
    session = {
      phone: phoneNumber,
      'menu-stack': 'root',
      'pin-attempts': '0',
      'preferred-lang': '',
      'selected-country': countryCode,
    };
  }

  const lang = resolveLanguage(session, countryCode);
  const currentMenu = session['menu-stack'] || 'root';

  // Check lockout before processing
  const lockout = checkLockout(session);
  if (lockout.locked) {
    return {
      text: t('lockedOut', lang, { minutes: lockout.remainingMinutes ?? config.pinLockoutMinutes }),
      end: true,
    };
  }

  // Route the menu
  const result = routeMenu(session, currentMenu, input, lang);

  // Handle PIN verification menus (simplified: any menu ending in -pin treats input as PIN)
  if (currentMenu.endsWith('-pin') && input.length >= 4) {
    const storedHash = session['pin-hash'];
    if (storedHash) {
      const valid = verifyPin(input, storedHash);
      if (!valid) {
        const updates = recordFailedAttempt(session);
        await store.setSession(sessionId, { ...session, ...updates });
        const attempts = Number(updates['pin-attempts'] ?? 0);
        const remaining = Math.max(0, config.maxPinAttempts - attempts);
        if (remaining === 0) {
          return {
            text: t('lockedOut', lang, { minutes: config.pinLockoutMinutes }),
            end: true,
          };
        }
        return {
          text: t('invalidPin', lang, { attempts: remaining }) + '\n' + t('enterPin', lang),
          end: false,
        };
      }
      // PIN correct — reset attempts and continue to next menu
      const reset = resetAttempts();
      session = { ...session, ...reset };
    }
  }

  // Build next session state
  const nextSession = {
    ...session,
    ...(result.sessionMutations ?? {}),
    'menu-stack': result.nextMenu ?? currentMenu,
    'last-active': String(Date.now()),
  };

  // If session is ending, delete it
  if (result.end) {
    await store.deleteSession(sessionId);
  } else {
    await store.setSession(sessionId, nextSession);
  }

  return { text: result.text, end: result.end ?? false };
}

