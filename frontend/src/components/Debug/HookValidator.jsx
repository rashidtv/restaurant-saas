import React from 'react';
import { useCustomer } from '../../hooks/useCustomer';

export const HookValidator = () => {
  const hook = useCustomer();
  
  const hookMethods = Object.keys(hook).filter(key => typeof hook[key] === 'function');
  const hookState = Object.keys(hook).filter(key => typeof hook[key] !== 'function');
  
  console.log('🔍 HOOK VALIDATION REPORT:');
  console.log('📋 Available Methods:', hookMethods);
  console.log('📊 Available State:', hookState);
  console.log('❌ Missing getCustomerOrders:', !hookMethods.includes('getCustomerOrders'));
  console.log('✅ Hook Structure:', hook);
  
  return null;
};