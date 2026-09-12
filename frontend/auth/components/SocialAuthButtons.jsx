import React, { useState } from 'react';
import { useSignIn, useSignUp, useClerk } from '@clerk/react';

export const SocialAuthButtons = ({ mode = "signIn", onError }) => {
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const clerk = useClerk();
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleSocialAuth = async (strategy) => {
    setLoadingProvider(strategy);
    try {
      if (mode === "signUp") {
        if (!isSignUpLoaded || !signUp) {
          clerk.openSignUp();
          return;
        }
        await signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      } else {
        if (!isSignInLoaded || !signIn) {
          clerk.openSignIn();
          return;
        }
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      }
    } catch (err) {
      console.warn("OAuth redirect note:", err);
      // If direct strategy is not configured in Clerk dashboard, open Clerk's modal
      if (mode === "signUp" && clerk?.openSignUp) {
        clerk.openSignUp();
      } else if (clerk?.openSignIn) {
        clerk.openSignIn();
      }
      if (onError) {
        onError(err.errors?.[0]?.longMessage || err.message || "Opening authentication...");
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="social-auth-group">
      {/* Google Login */}
      <button
        type="button"
        className="btn-social btn-google"
        onClick={() => handleSocialAuth("oauth_google")}
        disabled={loadingProvider !== null}
        title="Continue with Google"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>{loadingProvider === "oauth_google" ? "Connecting Google..." : "Continue with Google"}</span>
      </button>

      {/* GitHub Login */}
      <button
        type="button"
        className="btn-social btn-github"
        onClick={() => handleSocialAuth("oauth_github")}
        disabled={loadingProvider !== null}
        title="Continue with GitHub"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#181717">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        <span>{loadingProvider === "oauth_github" ? "Connecting GitHub..." : "Continue with GitHub"}</span>
      </button>

      {/* LinkedIn Login */}
      <button
        type="button"
        className="btn-social btn-linkedin"
        onClick={() => handleSocialAuth("oauth_linkedin_oidc")}
        disabled={loadingProvider !== null}
        title="Continue with LinkedIn"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
        <span>{loadingProvider === "oauth_linkedin_oidc" ? "Connecting LinkedIn..." : "Continue with LinkedIn"}</span>
      </button>
    </div>
  );
};

export default SocialAuthButtons;
