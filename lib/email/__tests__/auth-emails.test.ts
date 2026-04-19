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
  test("renderConfirmSignup embeds the confirm URL and brand", () => {
    const html = renderConfirmSignup({ confirmUrl: URL });
    expect(html).toContain(URL);
    expect(html).toContain("Confirm your email");
    expect(html).toContain("get that bread");
    expect(html).toMatch(/<!DOCTYPE html>/i);
  });

  test("renderMagicLink embeds the sign-in URL", () => {
    const html = renderMagicLink({ confirmUrl: URL });
    expect(html).toContain(URL);
    expect(html).toContain("Your sign-in link");
  });

  test("renderInvite embeds the invite URL", () => {
    const html = renderInvite({ confirmUrl: URL });
    expect(html).toContain(URL);
    expect(html).toContain("You&#39;re invited");
  });

  test("renderResetPassword embeds the reset URL", () => {
    const html = renderResetPassword({ confirmUrl: URL });
    expect(html).toContain(URL);
    expect(html).toContain("Reset your password");
  });

  test("renderChangeEmail shows new email and confirm URL", () => {
    const html = renderChangeEmail({ confirmUrl: URL, newEmail: "new@getthatbread.sg" });
    expect(html).toContain(URL);
    expect(html).toContain("new@getthatbread.sg");
    expect(html).toContain("Confirm your new email");
  });

  test("renderChangeEmail escapes the new email", () => {
    const html = renderChangeEmail({
      confirmUrl: URL,
      newEmail: "<script>alert(1)</script>@example.com",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("renderReauthentication displays the 6-digit token", () => {
    const html = renderReauthentication({ token: "482917" });
    expect(html).toContain("482917");
    expect(html).toContain("Verify it&#39;s you");
  });

  test("reauthentication escapes the token value", () => {
    const html = renderReauthentication({ token: "<b>x</b>" });
    expect(html).not.toContain("<b>x</b>");
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  test("all templates contain the brand footer", () => {
    for (const html of [
      renderConfirmSignup({ confirmUrl: URL }),
      renderMagicLink({ confirmUrl: URL }),
      renderInvite({ confirmUrl: URL }),
      renderResetPassword({ confirmUrl: URL }),
      renderChangeEmail({ confirmUrl: URL, newEmail: "x@y.sg" }),
      renderReauthentication({ token: "123456" }),
    ]) {
      expect(html).toContain("getthatbread.sg");
      expect(html).toContain("Singapore");
    }
  });
});
