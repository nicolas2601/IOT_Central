'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';

// Este componente es solo para probar la funcionalidad del authStore
export default function TestAuthStore() {
  const [testResult, setTestResult] = useState<string>('Ejecutando pruebas...');
  const [testStatus, setTestStatus] = useState<'running' | 'success' | 'error'>('running');
  
  // Obtener funciones y estado del authStore
  const { 
    user, 
    isAuthenticated, 
    setAuth, 
    clearAuth 
  } = useAuthStore();

  useEffect(() => {
    // Función para ejecutar las pruebas
    const runTests = () => {
      try {
        // Prueba 1: Verificar estado inicial
        if (isAuthenticated !== false || user !== null) {
          throw new Error('El estado inicial del authStore no es correcto');
        }
        
        // Prueba 2: Probar setAuth
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          company_name: 'Test Company',
          role: 'user' as const
        };
        
        const mockTokens = {
          access: 'mock-access-token',
          refresh: 'mock-refresh-token'
        };
        
        setAuth(mockUser, mockTokens);
        
        // Verificar que el estado se actualizó correctamente
        setTimeout(() => {
          const storeAfterSet = useAuthStore.getState();
          
          if (!storeAfterSet.isAuthenticated) {
            throw new Error('isAuthenticated no se actualizó correctamente');
          }
          
          if (storeAfterSet.user?.email !== 'test@example.com') {
            throw new Error('El usuario no se actualizó correctamente');
          }
          
          // Prueba 3: Probar clearAuth
          clearAuth();
          
          setTimeout(() => {
            const storeAfterClear = useAuthStore.getState();
            
            if (storeAfterClear.isAuthenticated !== false || storeAfterClear.user !== null) {
              throw new Error('clearAuth no funcionó correctamente');
            }
            
            // Si llegamos aquí, todas las pruebas pasaron
            setTestStatus('success');
            setTestResult('✅ Todas las pruebas pasaron correctamente. El authStore funciona como se esperaba.');
          }, 100);
        }, 100);
        
      } catch (error) {
        setTestStatus('error');
        setTestResult(`❌ Error en las pruebas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    };
    
    runTests();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Prueba del AuthStore</h1>
      
      <div style={{ 
        padding: '15px', 
        borderRadius: '5px',
        backgroundColor: testStatus === 'running' ? '#f0f0f0' : 
                         testStatus === 'success' ? '#e6ffe6' : '#ffe6e6',
        marginTop: '20px'
      }}>
        <h2>Resultado de las pruebas:</h2>
        <p>{testResult}</p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Estado actual del AuthStore:</h2>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify({
            isAuthenticated,
            user
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}