import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes.jsx";
import { AuthProvider } from "@auth/auth.context.jsx";
import AuthNotificationToast from "@auth/components/AuthNotificationToast.jsx";

function App() {
  return (
    <AuthProvider>
      <AuthNotificationToast />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
