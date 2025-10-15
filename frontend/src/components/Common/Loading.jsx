import '../../styles/chat.css';

function Loading({ message = 'Loading...', fullScreen = false }) {
  return (
    <div className={`loading-container ${fullScreen ? 'loading-fullscreen' : ''}`}>
      <div className="loading-content">
        <div className="spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}

export default Loading;