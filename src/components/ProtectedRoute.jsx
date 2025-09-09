// import { Navigate } from "react-router-dom";
// import { useUserAuth } from "../contexts/UserAuthContext";

// export default function ProtectedRoute({ children }) {
//   const { user } = useUserAuth();
//   console.log("ProtectedRoute user:", user); // <-- ADD THIS LINE
//   if (!user || !user.token) {
//     return <Navigate to="/login" />;
//   }
//   return children;
// }


import { Navigate } from "react-router-dom";
import { useUserAuth } from "../contexts/UserAuthContext";

export default function ProtectedRoute({ children }) {
  const { user, token } = useUserAuth();
  if (!user || !token) {
    return <Navigate to="/login" />;
  }
  return children;
}