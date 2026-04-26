import { describe, expect, test } from "vitest";
import {
  renderChangeEmail,
  renderConfirmSignup,
  renderInvite,
  renderMagicLink,
  renderReauthentication,
  renderResetPassword,
} from "../auth-emails";

const URL = "https://getthatbread.sg/auth/confirm?token_hash=abc123&type=signup&next=%2Fdashboard";

describe("auth email render functions", () => {
  test("renderConfirmSignup embeds the confirm URL and brand", async () => {
    const html = await renderConfirmSignup({ confirmUrl: URL });
    expect(html).toContain(URL);
    expect(html).toContain("Confirm your email");
    expect(html).toContain("get that bread");
    expect(html).toMatch(/<!DOCTYPE html>/i);
  });

  test("renderMagicLink embeds the sign-in URL", async () => {
    const html = await renderMagicLink({ confirmUrl: URL });
    expect(html).toContain(URL);
    expect(html).toContain("Your sign-in link");
  });

  test("renderInvite embeds the invite URL", async () => {
    const html = await renderInvite({ confirmUrl: URL });
    expect(html).toContain(URL);
    expect(html).toContain("You're invited");
  });

  test("renderResetPassword embeds the reset URL", async () => {
    const html = await renderResetPassword({ confirmUrl: URL });
    expect(html).toContain(URL);
    expect(html).toContain("Reset your password");
  });

  test("renderChangeEmail shows new email and confirm URL", async () => {
    const html = await renderChangeEmail({ confirmUrl: URL, newEmail: "new@getthatbread.sg" });
    expect(html).toContain(URL);
    expect(html).toContain("new@getthatbread.sg");
    expect(html).toContain("Confirm your new email");
  });

  test("renderChangeEmail escapes the new email", async () => {
    const html = await renderChangeEmail({
      confirmUrl: URL,
      newEmail: "<script>alert(1)</script>@example.com",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  test("renderReauthentication displays the 6-digit token", async () => {
    const html = await renderReauthentication({ token: "482917" });
    expect(html).toContain("482917");
    expect(html).toContain("Verify it's you");
  });

  test("reauthentication escapes the token value", async () => {
    const html = await renderReauthentication({ token: "<b>x</b>" });
    expect(html).not.toContain("<b>x</b>");
  });

  test("all templates contain the brand footer", async () => {
    const htmls = await Promise.all([
      renderConfirmSignup({ confirmUrl: URL }),
      renderMagicLink({ confirmUrl: URL }),
      renderInvite({ confirmUrl: URL }),
      renderResetPassword({ confirmUrl: URL }),
      renderChangeEmail({ confirmUrl: URL, newEmail: "x@y.sg" }),
      renderReauthentication({ token: "123456" }),
    ]);
    for (const html of htmls) {
      expect(html).toContain("getthatbread.sg");
      expect(html).toContain("Singapore");
    }
  });
});
