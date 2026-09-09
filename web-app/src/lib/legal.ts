// PROF-06 / AUTH-03: canonical Terms of Use & Privacy Policy links, reused by
// Settings, auth/consent dialogs, purchase surfaces, and the site footer.
//
// RD confirmed 2026-09-09 that Perfect Corp's forwarder requires BOTH query
// parameters to select the right localized document. These are deliberately
// fixed to `eu_US`: Muse's product locale codes (enu/jpn/…) are not accepted by
// this endpoint, so do not substitute the active app locale here.
const LEGAL_FORWARD_URL = "https://www.perfectcorp.com/prog/ap/beauty-circle/forward.jsp";

export const TERMS_URL = `${LEGAL_FORWARD_URL}?locale=eu_US&type=terms`;
export const PRIVACY_URL = `${LEGAL_FORWARD_URL}?locale=eu_US&type=privacy-policy`;
