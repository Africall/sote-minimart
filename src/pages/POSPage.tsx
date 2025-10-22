
// This is a legacy file that redirects to the CashierPosPage
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const POSPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/cashier-pos');
  }, [navigate]);

  return null;
};

export default POSPage;
