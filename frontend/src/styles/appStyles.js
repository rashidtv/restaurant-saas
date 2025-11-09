export const styles = {
  // App Layout
  app: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowX: 'hidden'
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    maxWidth: '100%',
    margin: '0 auto'
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  logoIcon: {
    fontSize: '2rem'
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column'
  },
  logoTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  logoSubtitle: {
    color: '#64748b',
    fontSize: '0.75rem',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  notificationBell: {
    position: 'relative',
    cursor: 'pointer',
    padding: '0.5rem'
  },
  bellIcon: {
    fontSize: '1.25rem'
  },
  notificationBadge: {
    position: 'absolute',
    top: '0',
    right: '0',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  },
  currencyDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#f1f5f9',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontWeight: '600',
    color: '#475569'
  },
  currencyIcon: {
    fontSize: '1rem'
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.875rem'
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  userName: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: '0.875rem'
  },
  userRole: {
    color: '#64748b',
    fontSize: '0.75rem'
  },
  mobileMenuButton: {
    display: 'none',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '30px',
    height: '21px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    '@media (max-width: 768px)': {
      display: 'flex'
    }
  },
  mobileMenuBar: {
    width: '100%',
    height: '3px',
    backgroundColor: '#374151',
    borderRadius: '2px',
    transition: 'all 0.3s ease'
  },
  appBody: {
    display: 'flex',
    minHeight: 'calc(100vh - 80px)'
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 0',
    transition: 'transform 0.3s ease',
    '@media (max-width: 768px)': {
      position: 'fixed',
      top: '80px',
      left: 0,
      height: 'calc(100vh - 80px)',
      transform: 'translateX(-100%)',
      zIndex: 999,
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
    }
  },
  sidebarOpen: {
    '@media (max-width: 768px)': {
      transform: 'translateX(0)'
    }
  },
  sidebarNav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0 1rem'
  },
  sidebarButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: '500',
    position: 'relative'
  },
  sidebarButtonActive: {
    backgroundColor: '#3b82f6',
    color: 'white'
  },
  sidebarIcon: {
    fontSize: '1.125rem'
  },
  sidebarLabel: {
    flex: 1,
    textAlign: 'left'
  },
  sidebarBadge: {
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '10px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    minWidth: '20px',
    textAlign: 'center'
  },
  sidebarStats: {
    padding: '1.5rem 1rem 0 1rem',
    borderTop: '1px solid #e2e8f0',
    marginTop: '1rem'
  },
  statItem: {
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '0.75rem'
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '0.25rem'
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500'
  },
  mainContent: {
    flex: 1,
    padding: '2rem',
    backgroundColor: '#f8fafc',
    overflow: 'auto',
    '@media (max-width: 768px)': {
      padding: '1rem'
    }
  },
  overlay: {
    display: 'none',
    position: 'fixed',
    top: '80px',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
    '@media (max-width: 768px)': {
      display: 'block'
    }
  },

  // Page Styles
  page: {
    maxWidth: '100%'
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '1rem',
      marginBottom: '1.5rem'
    }
  },
  pageTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: '0 0 0.5rem 0',
    '@media (max-width: 768px)': {
      fontSize: '1.5rem'
    }
  },
  pageSubtitle: {
    color: '#64748b',
    fontSize: '1.125rem',
    margin: 0,
    '@media (max-width: 768px)': {
      fontSize: '1rem'
    }
  }
};