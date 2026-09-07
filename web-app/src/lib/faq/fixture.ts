import type { FaqDocument } from "@/lib/api/schemas";

/**
 * The FAQ content, transcribed VERBATIM from the CMS sample RD supplied
 * (`ycm-faq-sample.json`, document id 2, language ENU).
 *
 * ── THIS IS A FIXTURE, NOT A SOURCE OF TRUTH ──────────────────────────────
 * When RD wires the real endpoint this whole file goes away: the shape below
 * is exactly what the API returns under `attributes`, so the swap is a
 * one-line change in `mock.ts` and nothing else moves. Generated rather than
 * hand-typed on purpose — 31 answers of hand-copied HTML is 31 chances to
 * introduce a typo that reads as a content bug later.
 *
 * ⚠️ THE CONTENT HAS KNOWN DEFECTS, AND THEY ARE THE CMS AUTHOR'S TO FIX —
 * do NOT "clean them up" here, or the next drop silently reverts you and the
 * fixture stops matching what the API actually serves:
 *   · every `webAnswer` is a byte-for-byte copy of its `iosAnswer`, so the
 *     WEB page currently says "Download from the App Store", "tap the + button"
 *     and "confirm payment through the App Store checkout" (ids 4, 6, 24)
 *   · id 26 lost its arrow glyphs: "youcammuse.ai  Account Settings
 *     Subscriptions  Cancel Plan" reads as a run-on
 *   · the domain is inconsistent — `youcammuse.ai` (ids 4, 26) vs
 *     `youcammuse.com` (ids 18, 20)
 *   · URLs and e-mail addresses are plain text, not `<a>` — which is why
 *     `renderAnswer` deliberately does not linkify (see its header)
 *   · every `androidAnswer` is null; there is no Android app yet
 */
export const FAQ_FIXTURE: FaqDocument = {
  id: 2,
  shortDescription: "YCM",
  publishedAt: null,
  isVisibleInListView: true,
  languages: { id: 18476, languages: "ENU" },
  appName: { id: 1, appName: "YCM" },
  status: { id: 78258, status: "Draft" },
  sections: [
  {
    id: 3,
    __component: "apps-page.section-category-faq",
    category: "Getting Started",
    categoryFaqList: [
      {
        id: 2,
        question: "What is YouCam Muse?",
        iosAnswer: "<p>YouCam Muse is an AI-powered music video and song creation and publishing platform available on iOS, and web. It lets you generate and publish original Music Videos (MVs) and Songs enhanced by AI — and share them with a growing community of creators.</p>",
        androidAnswer: null,
        webAnswer: "<p>YouCam Muse is an AI-powered music video and song creation and publishing platform available on iOS, and web. It lets you generate and publish original Music Videos (MVs) and Songs enhanced by AI — and share them with a growing community of creators.</p>",
      },
      {
        id: 3,
        question: "Which devices and platforms are supported?",
        iosAnswer: "<p>YouCam Muse is available on:</p><ul><li>iOS 15.0 and above (iPhone 8 or later recommended)</li><li>Modern web browsers (Chrome, Safari, Edge)</li></ul><p>For the best experience, we recommend using a device with at least 3 GB of RAM and a stable internet connection.</p>",
        androidAnswer: null,
        webAnswer: "<p>YouCam Muse is available on:</p><ul><li>iOS 15.0 and above (iPhone 8 or later recommended)</li><li>Modern web browsers (Chrome, Safari, Edge)</li></ul><p>For the best experience, we recommend using a device with at least 3 GB of RAM and a stable internet connection.</p>",
      },
      {
        id: 4,
        question: "How do I create an account?",
        iosAnswer: "<p>Download YouCam Muse from the App Store or visit youcammuse.ai. Tap \"Sign Up\" and register with your email address, or continue with your Apple or Google account. You can start creating content immediately after signing up —subscription plan is required for generating content.</p>",
        androidAnswer: null,
        webAnswer: "<p>Download YouCam Muse from the App Store or visit youcammuse.ai. Tap \"Sign Up\" and register with your email address, or continue with your Apple or Google account. You can start creating content immediately after signing up —subscription plan is required for generating content.</p>",
      },
      {
        id: 5,
        question: "What is the difference between the Free and Premium plans?",
        iosAnswer: "<p>The Free plan lets you explore content within platform. Premium unlocks MV and Song generation. See the Subscription & Premium section below for more details.</p>",
        androidAnswer: null,
        webAnswer: "<p>The Free plan lets you explore content within platform. Premium unlocks MV and Song generation. See the Subscription & Premium section below for more details.</p>",
      },
    ],
  },
  {
    id: 4,
    __component: "apps-page.section-category-faq",
    category: "Creating Music Videos (MV)",
    categoryFaqList: [
      {
        id: 6,
        question: "How do I create a Music Video (MV)?",
        iosAnswer: "<p>From the Home screen, tap the “+” button and select “Music Video (MV)”. Choose an MV type and a song, then describe your video idea with a text prompt or select from available templates. You can optionally upload a character photo and customize additional settings, including aspect ratio, video quality, MV title and author (displayed in the opening frames), subtitles, and watermark.</p><p>When ready, tap “Create Music Video” and choose either “Storyboard First” or “Create MV Directly.” The entire creation process typically takes about 5 minutes, depending on your network speed.</p>",
        androidAnswer: null,
        webAnswer: "<p>From the Home screen, tap the “+” button and select “Music Video (MV)”. Choose an MV type and a song, then describe your video idea with a text prompt or select from available templates. You can optionally upload a character photo and customize additional settings, including aspect ratio, video quality, MV title and author (displayed in the opening frames), subtitles, and watermark.</p><p>When ready, tap “Create Music Video” and choose either “Storyboard First” or “Create MV Directly.” The entire creation process typically takes about 5 minutes, depending on your network speed.</p>",
      },
      {
        id: 7,
        question: "Can I use my own music track in an MV?",
        iosAnswer: "<p>Yes. When adding a music track, tap \"My Music\" to import a track from your device. Please ensure you have the rights to use any music you upload. User-uploaded audio is subject to content moderation and copyright checking. Alternatively, choose from our royalty-free music library or use an AI-generated Song you created in YouCam Muse.</p>",
        androidAnswer: null,
        webAnswer: "<p>Yes. When adding a music track, tap \"My Music\" to import a track from your device. Please ensure you have the rights to use any music you upload. User-uploaded audio is subject to content moderation and copyright checking. Alternatively, choose from our royalty-free music library or use an AI-generated Song you created in YouCam Muse.</p>",
      },
      {
        id: 8,
        question: "Can I edit a published MV?",
        iosAnswer: "<p>Once an MV is published to the community feed, you cannot re-edit the video content. You can update the title, description, and cover photo from your profile → tap the post → \"Edit Post Details\". To make significant changes, you will need to delete the post and re-upload the revised version.</p>",
        androidAnswer: null,
        webAnswer: "<p>Once an MV is published to the community feed, you cannot re-edit the video content. You can update the title, description, and cover photo from your profile → tap the post → \"Edit Post Details\". To make significant changes, you will need to delete the post and re-upload the revised version.</p>",
      },
    ],
  },
  {
    id: 5,
    __component: "apps-page.section-category-faq",
    category: "AI Song Generation",
    categoryFaqList: [
      {
        id: 9,
        question: "What is AI Song generation?",
        iosAnswer: "<p>AI Song generation lets you create an original song from a text prompt — describe an idea, genre, or mood style, and our AI will compose and produce a full audio track for you in seconds. Generated Songs can be published directly to the community feed or used as the music track for your MV.</p>",
        androidAnswer: null,
        webAnswer: "<p>AI Song generation lets you create an original song from a text prompt — describe an idea, genre, or mood style, and our AI will compose and produce a full audio track for you in seconds. Generated Songs can be published directly to the community feed or used as the music track for your MV.</p>",
      },
      {
        id: 10,
        question: "How do I generate an AI Song?",
        iosAnswer: "<p>Tap the \"+\" button on the home screen → select \"AI Song\". Enter a text prompt describing the song you want (e.g., \"an upbeat K-pop track about summer memories\"). Choose a genre style if desired, then tap \"Generate\". Your song will be ready within 30–60 seconds.</p>",
        androidAnswer: null,
        webAnswer: "<p>Tap the \"+\" button on the home screen → select \"AI Song\". Enter a text prompt describing the song you want (e.g., \"an upbeat K-pop track about summer memories\"). Choose a genre style if desired, then tap \"Generate\". Your song will be ready within 30–60 seconds.</p>",
      },
      {
        id: 11,
        question: "Are there limits on how many AI MVs or AI Songs I can generate?",
        iosAnswer: "<p>No. Subscribers can create as many AI MVs and AI Songs as they like, as long as they have enough credits available for each creation.</p>",
        androidAnswer: null,
        webAnswer: "<p>No. Subscribers can create as many AI MVs and AI Songs as they like, as long as they have enough credits available for each creation.</p>",
      },
      {
        id: 12,
        question: "Can I use my AI-generated Song commercially or outside the app?",
        iosAnswer: "<p>Yes. If you’re a paid subscriber, you can use AI-generated songs created with YouCam Muse for lawful commercial purposes, including publishing, distributing, and monetizing them outside the app.</p><p>Commercial usage rights are subject to YouCam Muse’s Terms of Service and applicable third-party rights and laws.</p>",
        androidAnswer: null,
        webAnswer: "<p>Yes. If you’re a paid subscriber, you can use AI-generated songs created with YouCam Muse for lawful commercial purposes, including publishing, distributing, and monetizing them outside the app.</p><p>Commercial usage rights are subject to YouCam Muse’s Terms of Service and applicable third-party rights and laws.</p>",
      },
      {
        id: 13,
        question: "Why was my AI Song generation request rejected?",
        iosAnswer: "<p>Song generation prompts are reviewed by our text moderation system before the audio is generated. Prompts that contain explicit language, hate speech, instructions for harmful content, or descriptions of illegal activity will be rejected. If your prompt was rejected in error, try rephrasing it and avoid flagged terms. Repeated violations may result in temporary suspension of Song generation access.</p>",
        androidAnswer: null,
        webAnswer: "<p>Song generation prompts are reviewed by our text moderation system before the audio is generated. Prompts that contain explicit language, hate speech, instructions for harmful content, or descriptions of illegal activity will be rejected. If your prompt was rejected in error, try rephrasing it and avoid flagged terms. Repeated violations may result in temporary suspension of Song generation access.</p>",
      },
    ],
  },
  {
    id: 6,
    __component: "apps-page.section-category-faq",
    category: "Publishing & Community Feed",
    categoryFaqList: [
      {
        id: 14,
        question: "How do I publish my MV or Song?",
        iosAnswer: "<p>After completing your creation, go to My Creations and tap “More” to find the publishing option. Tap “Publish”, and your content will be submitted for moderation before being published.</p>",
        androidAnswer: null,
        webAnswer: "<p>After completing your creation, go to My Creations and tap “More” to find the publishing option. Tap “Publish”, and your content will be submitted for moderation before being published.</p>",
      },
      {
        id: 15,
        question: "How do I report inappropriate content or accounts?",
        iosAnswer: "<p>Go to the in-app profile → Send Feedback screen, describe the issue and upload a screenshot of the inappropriate content or account, and submit your report. Our support team will review your report, typically within 24 hours.</p>",
        androidAnswer: null,
        webAnswer: "<p>Go to the in-app profile → Send Feedback screen, describe the issue and upload a screenshot of the inappropriate content or account, and submit your report. Our support team will review your report, typically within 24 hours.</p>",
      },
    ],
  },
  {
    id: 7,
    __component: "apps-page.section-category-faq",
    category: "Account & Profile",
    categoryFaqList: [
      {
        id: 16,
        question: "How do I change my username or profile photo?",
        iosAnswer: "<p>Go to your Profile page → tap \"Edit Profile\" icon. You can update your nickname and profile photo. Changes are saved immediately and visible to other users right away.</p>",
        androidAnswer: null,
        webAnswer: "<p>Go to your Profile page → tap \"Edit Profile\" icon. You can update your nickname and profile photo. Changes are saved immediately and visible to other users right away.</p>",
      },
      {
        id: 17,
        question: "How do I delete my account?",
        iosAnswer: "<p>Go to Profile → Settings → Delete Account. You will be asked to confirm your identity and acknowledge that all content and data will be permanently deleted. This action cannot be undone. If you have an active subscription, cancel it first to avoid future charges (the subscription will not be cancelled automatically when you delete your account).</p>",
        androidAnswer: null,
        webAnswer: "<p>Go to Profile → Settings → Delete Account. You will be asked to confirm your identity and acknowledge that all content and data will be permanently deleted. This action cannot be undone. If you have an active subscription, cancel it first to avoid future charges (the subscription will not be cancelled automatically when you delete your account).</p>",
      },
      {
        id: 18,
        question: "Is my personal data safe?",
        iosAnswer: "<p>YouCam Muse is built by Perfect Corp., which complies with GDPR, CCPA, and other applicable data protection regulations. Your personal data is encrypted in transit and at rest. We do not sell personal data to third parties. Review our full Privacy Policy at youcammuse.com/privacy.</p>",
        androidAnswer: null,
        webAnswer: "<p>YouCam Muse is built by Perfect Corp., which complies with GDPR, CCPA, and other applicable data protection regulations. Your personal data is encrypted in transit and at rest. We do not sell personal data to third parties. Review our full Privacy Policy at youcammuse.com/privacy.</p>",
      },
    ],
  },
  {
    id: 8,
    __component: "apps-page.section-category-faq",
    category: "Content Moderation & Community Guidelines",
    categoryFaqList: [
      {
        id: 19,
        question: "What is the content publishing policy?",
        iosAnswer: "<p>All user-published Music Videos (MVs) and Songs go through an content moderation review before appearing in the community feed. Most content is approved within 24 hours. During weekend or peak hours, review times may extend to up to 2-3 days. If your content has been pending for more than 3 days, please contact our support team via in-app feedback. Content that violates our Community Guidelines will be rejected and you will be notified with the reason within app or web.</p>",
        androidAnswer: null,
        webAnswer: "<p>All user-published Music Videos (MVs) and Songs go through an content moderation review before appearing in the community feed. Most content is approved within 24 hours. During weekend or peak hours, review times may extend to up to 2-3 days. If your content has been pending for more than 3 days, please contact our support team via in-app feedback. Content that violates our Community Guidelines will be rejected and you will be notified with the reason within app or web.</p>",
      },
      {
        id: 20,
        question: "What content is not allowed on YouCam Muse?",
        iosAnswer: "<p>The following content is prohibited and will be removed:</p><ul><li>Nudity, sexual content, or content sexualising minors</li><li>Graphic violence, gore, or depictions of self-harm</li><li>Hate speech targeting race, ethnicity, religion, gender, sexual orientation, or disability</li><li>Content that promotes or glorifies illegal activity or dangerous substances</li><li>Spam, misleading information, or coordinated inauthentic behaviour</li><li>Copyrighted material used without permission</li></ul><p>Please review our full Community Guidelines at youcammuse.com/guidelines.</p>",
        androidAnswer: null,
        webAnswer: "<p>The following content is prohibited and will be removed:</p><ul><li>Nudity, sexual content, or content sexualising minors</li><li>Graphic violence, gore, or depictions of self-harm</li><li>Hate speech targeting race, ethnicity, religion, gender, sexual orientation, or disability</li><li>Content that promotes or glorifies illegal activity or dangerous substances</li><li>Spam, misleading information, or coordinated inauthentic behaviour</li><li>Copyrighted material used without permission</li></ul><p>Please review our full Community Guidelines at youcammuse.com/guidelines.</p>",
      },
      {
        id: 21,
        question: "Why was my content removed after it was published?",
        iosAnswer: "<p>Content can be removed after publication if it is reported by users and subsequently found to violate our Community Guidelines. You will receive an email with the specific policy that was violated. Removed content cannot be restored.</p>",
        androidAnswer: null,
        webAnswer: "<p>Content can be removed after publication if it is reported by users and subsequently found to violate our Community Guidelines. You will receive an email with the specific policy that was violated. Removed content cannot be restored.</p>",
      },
      {
        id: 22,
        question: "How do I appeal a content moderation decision?",
        iosAnswer: "<p>If you believe your content was removed in error, simply reply to the notification email with your User ID and the title or name of the creation. Our review team will assess your appeal within 3–5 business days.</p>",
        androidAnswer: null,
        webAnswer: "<p>If you believe your content was removed in error, simply reply to the notification email with your User ID and the title or name of the creation. Our review team will assess your appeal within 3–5 business days.</p>",
      },
      {
        id: 23,
        question: "What happens if I repeatedly violate Community Guidelines?",
        iosAnswer: "<p>Violations are tracked cumulatively. First violation: a warning. Second violation: temporary suspension of publishing privileges (72 hours). Third violation: 30-day suspension. Severe violations (e.g., CSAM, imminent harm) result in immediate and permanent account termination, regardless of prior history.</p>",
        androidAnswer: null,
        webAnswer: "<p>Violations are tracked cumulatively. First violation: a warning. Second violation: temporary suspension of publishing privileges (72 hours). Third violation: 30-day suspension. Severe violations (e.g., CSAM, imminent harm) result in immediate and permanent account termination, regardless of prior history.</p>",
      },
    ],
  },
  {
    id: 9,
    __component: "apps-page.section-category-faq",
    category: "Subscription & Premium",
    categoryFaqList: [
      {
        id: 24,
        question: "How do I buy more credits?",
        iosAnswer: "<p>Tap the crown icon (👑) anywhere in the app, or go to Profile →  Subscription Plan → Choose a Credit Pack. Then confirm payment through the App Store checkout.</p>",
        androidAnswer: null,
        webAnswer: "<p>Tap the crown icon (👑) anywhere in the app, or go to Profile →  Subscription Plan → Choose a Credit Pack. Then confirm payment through the App Store checkout.</p>",
      },
      {
        id: 25,
        question: "Can I use the same account and access my credits and projects on both the YouCam Muse app and web?",
        iosAnswer: "<p>Yes. When you sign in with the same account, your account, credit balance, and projects are synced across the YouCam Muse app and web, so you can easily switch between platforms and continue creating.</p><p>Please note that subscription cancellations and refunds must be handled through the original platform where you made the purchase. For example, if you subscribed through the app, cancellation or refund requests must be processed through the corresponding app store. If you subscribed on the web, they must be handled through the web purchase channel.</p>",
        androidAnswer: null,
        webAnswer: "<p>Yes. When you sign in with the same account, your account, credit balance, and projects are synced across the YouCam Muse app and web, so you can easily switch between platforms and continue creating.</p><p>Please note that subscription cancellations and refunds must be handled through the original platform where you made the purchase. For example, if you subscribed through the app, cancellation or refund requests must be processed through the corresponding app store. If you subscribed on the web, they must be handled through the web purchase channel.</p>",
      },
      {
        id: 26,
        question: "How do I cancel my subscription before the subscription renewal date?",
        iosAnswer: "<p>To cancel your YouCam Muse subscription:</p><ul><li>In-app: Go to Profile → Settings → Unsubscribe.</li><li>iOS: Go to Settings → [Your Name] → Subscriptions → YouCam Muse → Cancel Subscription.</li><li>Web: Log in at youcammuse.ai  Account Settings  Subscriptions  Cancel Plan.</li></ul><p>Cancellation takes effect at the end of your current billing period. You will retain Premium access until then.</p>",
        androidAnswer: null,
        webAnswer: "<p>To cancel your YouCam Muse subscription:</p><ul><li>In-app: Go to Profile → Settings → Unsubscribe.</li><li>iOS: Go to Settings → [Your Name] → Subscriptions → YouCam Muse → Cancel Subscription.</li><li>Web: Log in at youcammuse.ai  Account Settings  Subscriptions  Cancel Plan.</li></ul><p>Cancellation takes effect at the end of your current billing period. You will retain Premium access until then.</p>",
      },
      {
        id: 27,
        question: "Can I get a refund?",
        iosAnswer: "<p>Refund eligibility depends on the platform:</p><ul><li>iOS (App Store): Refunds are handled by Apple. Visit reportaproblem.apple.com within 90 days of purchase.</li><li>Web: Contact our support team at youcammuse_web@perfectcorp.com with your order ID and reason.</li></ul><p>Subscription charges are generally non-refundable after the billing period has begun unless required by applicable law.</p>",
        androidAnswer: null,
        webAnswer: "<p>Refund eligibility depends on the platform:</p><ul><li>iOS (App Store): Refunds are handled by Apple. Visit reportaproblem.apple.com within 90 days of purchase.</li><li>Web: Contact our support team at youcammuse_web@perfectcorp.com with your order ID and reason.</li></ul><p>Subscription charges are generally non-refundable after the billing period has begun unless required by applicable law.</p>",
      },
      {
        id: 28,
        question: "My subscription is active but Premium features are locked — what do I do?",
        iosAnswer: "<p>This is usually a sync issue. Try these steps:</p><ol><li>Sign out of YouCam Muse and sign back in.</li><li>On iOS: Go to Settings → [Your Name] → Subscriptions to confirm the subscription shows as Active.</li><li>If the issue persists, contact youcammuse_appfeedback@perfectcorp.com with your purchase receipt or order ID.</li></ol>",
        androidAnswer: null,
        webAnswer: "<p>This is usually a sync issue. Try these steps:</p><ol><li>Sign out of YouCam Muse and sign back in.</li><li>On iOS: Go to Settings → [Your Name] → Subscriptions to confirm the subscription shows as Active.</li><li>If the issue persists, contact youcammuse_appfeedback@perfectcorp.com with your purchase receipt or order ID.</li></ol>",
      },
    ],
  },
  {
    id: 10,
    __component: "apps-page.section-category-faq",
    category: "Technical Issues",
    categoryFaqList: [
      {
        id: 29,
        question: "The app keeps crashing — what should I do?",
        iosAnswer: "<p>Please try the following steps:</p><ol><li>Force-close the app and reopen it.</li><li>Check that your device has at least 1 GB of free storage space.</li><li>Update YouCam Muse to the latest version from the App Store.</li><li>Restart your device.</li><li>Uninstall and reinstall the app (your account and published content will not be affected).</li></ol><p>If the crash persists, please report it via Profile → Send Feedback, and include your device model and OS version.</p>",
        androidAnswer: null,
        webAnswer: "<p>Please try the following steps:</p><ol><li>Force-close the app and reopen it.</li><li>Check that your device has at least 1 GB of free storage space.</li><li>Update YouCam Muse to the latest version from the App Store.</li><li>Restart your device.</li><li>Uninstall and reinstall the app (your account and published content will not be affected).</li></ol><p>If the crash persists, please report it via Profile → Send Feedback, and include your device model and OS version.</p>",
      },
      {
        id: 30,
        question: "My video won't upload — what's wrong?",
        iosAnswer: "<p>The most common causes are:</p><ul><li>File format not supported (use MP4, MOV, or AVI)</li><li>Slow or unstable internet connection</li><li>Insufficient device storage</li></ul><p>Try switching from mobile data to Wi-Fi, or compress your video before uploading. If the error continues, contact our support team with the error message shown.</p>",
        androidAnswer: null,
        webAnswer: "<p>The most common causes are:</p><ul><li>File format not supported (use MP4, MOV, or AVI)</li><li>Slow or unstable internet connection</li><li>Insufficient device storage</li></ul><p>Try switching from mobile data to Wi-Fi, or compress your video before uploading. If the error continues, contact our support team with the error message shown.</p>",
      },
    ],
  },
  {
    id: 11,
    __component: "apps-page.section-category-faq",
    category: "Contact Us",
    categoryFaqList: [
      {
        id: 31,
        question: "How do I contact the YouCam Muse support team?",
        iosAnswer: "<p>In-app and web: Profile → Send Feedback</p><p>Response times are typically within 1 business day. Please include your account user ID, the device model and OS version, and a description of the issue (with screenshots if available).</p>",
        androidAnswer: null,
        webAnswer: "<p>In-app and web: Profile → Send Feedback</p><p>Response times are typically within 1 business day. Please include your account user ID, the device model and OS version, and a description of the issue (with screenshots if available).</p>",
      },
      {
        id: 32,
        question: "Where can I submit feedback or feature requests?",
        iosAnswer: "<p>We love hearing from our community! Submit feedback via:</p><ul><li>In-app and web: Profile → Send Feedback</li></ul><p>Feature requests and ideas from our community directly inform our product roadmap.</p>",
        androidAnswer: null,
        webAnswer: "<p>We love hearing from our community! Submit feedback via:</p><ul><li>In-app and web: Profile → Send Feedback</li></ul><p>Feature requests and ideas from our community directly inform our product roadmap.</p>",
      },
    ],
  },
  ],
};
