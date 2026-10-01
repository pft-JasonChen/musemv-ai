import { beforeEach, describe, expect, it } from "vitest";
import { demoStore } from "@/lib/demoStore";
import { isNewSignup, markSignupGiftSeen } from "@/lib/signupGift";

describe("isNewSignup", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is true for the first sign-in on a browser, false once marked seen", () => {
    expect(isNewSignup()).toBe(true);
    markSignupGiftSeen();
    expect(isNewSignup()).toBe(false);
  });

  it("is always true while the demo panel's newSignup flag is on", () => {
    markSignupGiftSeen();
    demoStore.setFlag("newSignup", true);
    expect(isNewSignup()).toBe(true);
    demoStore.setFlag("newSignup", false);
    expect(isNewSignup()).toBe(false);
  });
});
