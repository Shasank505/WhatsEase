import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import '../../styles/chat.css';

function Header() {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">WhatsEase</h1>
      </div>

      <div className="header-right">
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">
            {isConnected ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="user-menu">
          <div className="user-avatar">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} />
            ) : (
              <div className="avatar-placeholder">
                {user?.username?.substring(0, 2).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <span className="user-name">{user?.username || 'User'}</span>
          <button
            onClick={handleLogout}
            className="btn-logout"
            title="Logout"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
              <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;