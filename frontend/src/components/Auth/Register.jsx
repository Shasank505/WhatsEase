import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth.css';

function Register() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.username || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    // Updated: Match backend validation (6 characters minimum)
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Username validation (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username must contain only letters, numbers, and underscores');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting signup form...');
      
      await signup({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        full_name: formData.fullName || formData.username
      });
      
      console.log('Signup successful, redirecting to login...');
      
      // Show success message and redirect
      alert('Account created successfully! Please login.');
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Extract detailed error message
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      // Handle specific validation errors
      if (errorMessage.includes('uppercase')) {
        errorMessage = 'Password must contain at least one uppercase letter';
      } else if (errorMessage.includes('lowercase')) {
        errorMessage = 'Password must contain at least one lowercase letter';
      } else if (errorMessage.includes('digit')) {
        errorMessage = 'Password must contain at least one digit';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ overflowY: 'auto', height: '100vh' }}>
      <div className="auth-box" style={{ margin: '2rem auto' }}>
        <div className="auth-header">
          <h1 className="auth-title">WhatsEase</h1>
          <p className="auth-subtitle">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message" role="alert" style={{ 
              whiteSpace: 'pre-line',
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c33'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="form-input"
              required
              autoComplete="email"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username <span className="required">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username (letters, numbers, _ only)"
              className="form-input"
              required
              autoComplete="username"
              disabled={loading}
              pattern="[a-zA-Z0-9_]+"
              title="Username must contain only letters, numbers, and underscores"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fullName" className="form-label">
              Full Name <span className="optional">(optional)</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="form-input"
              autoComplete="name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className="form-input"
              required
              minLength={6}
              autoComplete="new-password"
              disabled={loading}
            />
            <small className="form-hint">At least 6 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="form-input"
              required
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Creating Account...
              </>
            ) : (
              'SIGN UP'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-link-text">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;