import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import type { RootState, AppDispatch } from "../store/store";
import { logout } from "../store/authSlice";

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          ConnectSphere
        </Link>

        <nav className="navbar-links">
          <Link to="/" className="navbar-link">
            Home
          </Link>

          <Link to="/profile" className="navbar-link">
            Profile
          </Link>

          <span className="navbar-user">
            {user?.firstName}
          </span>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;