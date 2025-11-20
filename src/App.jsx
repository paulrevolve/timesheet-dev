// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";

// function App() {
//   if (import.meta.env.VITE_CHECK === "production") {
//     console.log = () => {};
//     console.info = () => {};
//     console.warn = () => {};
//     console.error = () => {};
//   }

//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/login" element={<Login />} />
//         <Route path="/dashboard/*" element={<Dashboard />} />
//         <Route path="*" element={<Navigate to="/login" />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function ProtectedRoute({ children }) {
  const userInfo = localStorage.getItem("currentUser");
  const isAuthenticated = !!userInfo;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* If you have other protected routes, wrap them similarly */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
