import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-center" 
        richColors 
        toastOptions={{
          className: "shadow-2xl border-0 rounded-2xl p-4 font-medium backdrop-blur-xl bg-background/90",
          style: {
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2)'
          }
        }} 
      />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
