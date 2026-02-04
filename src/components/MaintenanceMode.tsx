import { useSettings } from '@/contexts/SettingsContext';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const MaintenanceMode = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If maintenance mode is enabled and user is not on admin page
    if (settings.maintenance_mode && !location.pathname.startsWith('/admin')) {
      navigate('/maintenance');
    }
  }, [settings.maintenance_mode, location.pathname, navigate]);

  return <>{children}</>;
};