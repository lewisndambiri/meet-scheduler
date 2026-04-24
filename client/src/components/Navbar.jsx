import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">📅 MeetScheduler</Link>
      <ul className="navbar-links">
        <li><Link to="/" className={isActive('/')}>Dashboard</Link></li>
        <li><Link to="/create" className={isActive('/create')}>New Event</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;