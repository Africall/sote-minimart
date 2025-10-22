import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

const Index = () => {
  const { profile, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Index: useEffect triggered', { loading, isAuthenticated, profile: profile?.role });
    
    if (!loading) {
      if (!isAuthenticated) {
        console.log('Index: Not authenticated, redirecting to login');
        navigate('/login');
      } else if (profile?.role) {
        console.log('Index: User authenticated with role:', profile.role);
        const role = profile.role;
        
        switch (role) {
          case 'admin':
            console.log('Index: Redirecting admin to dashboard');
            navigate('/dashboard');
            break;
          case 'inventory':
            console.log('Index: Redirecting inventory to inventory');
            navigate('/inventory');
            break;
          case 'cashier':
            console.log('Index: Redirecting cashier to POS');
            navigate('/cashier-pos');
            break;
          case 'accountant':
            console.log('Index: Redirecting accountant to reports');
            navigate('/reports');
            break;
          default:
            console.log('Index: Unknown role, redirecting to login');
            navigate('/login');
        }
      } else if (isAuthenticated && !profile) {
        console.log('Index: Authenticated but no profile yet, waiting...');
      }
    } else {
      console.log('Index: Still loading...');
    }
  }, [loading, isAuthenticated, navigate, profile]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-4">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-2xl font-bold">SOTE MINIMART</h1>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
