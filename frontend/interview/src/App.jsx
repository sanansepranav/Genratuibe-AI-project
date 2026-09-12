import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes.jsx";
import { AuthProvider } from "@auth/auth.context.jsx";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";

function App() {
  return (
    <AuthProvider>
      <header className="clerk-nav-header">
        <div className="clerk-nav-container">
          <div className="clerk-nav-brand">
            <span className="clerk-badge">🔐 Clerk Auth</span>
          </div>
          <div className="clerk-nav-actions">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="clerk-btn clerk-btn-signin">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="clerk-btn clerk-btn-signup">Sign Up</button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <div className="clerk-user-badge">
                <UserButton afterSignOutUrl="/" showName />
              </div>
            </Show>
          </div>
        </div>
      </header>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
