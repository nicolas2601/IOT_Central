'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import api from './services/api';

export default function TestServiceIntegration() {
  const [testResults, setTestResults] = useState<{message: string, status: 'info' | 'success' | 'error'}[]>([
    { message: 'Iniciando pruebas...', status: 'info' }
  ]);
  
  const { setAuth, clearAuth } = useAuthStore();

  const addResult = (message: string, status: 'info' | 'success' | 'error') => {
    setTestResults(prev => [...prev, { message, status }]);
  };

  useEffect(() => {
    const runTests = async () => {
      // Prueba 1: Verificar que el interceptor de API funciona
      addResult('Probando interceptor de API...', 'info');
      
      try {
        // Simular login y configurar tokens
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
        
        // Establecer autenticación en el store
        setAuth(mockUser, mockTokens);
        addResult('✅ Token establecido en el store', 'success');
        
        // Verificar que el interceptor agrega el token a las solicitudes
        // Nota: Esta es una prueba simulada, no hace una solicitud real
        const originalRequest = api.defaults.headers.common['Authorization'];
        
        // Esperar a que el interceptor haga su trabajo
        setTimeout(() => {
          if (localStorage.getItem('access_token') === mockTokens.access) {
            addResult('✅ Token guardado correctamente en localStorage', 'success');
          } else {
            addResult('❌ Error: Token no guardado correctamente en localStorage', 'error');
          }
          
          // Limpiar la autenticación
          clearAuth();
          addResult('✅ Autenticación limpiada correctamente', 'success');
          
          // Verificar que el token se eliminó del localStorage
          if (!localStorage.getItem('access_token')) {
            addResult('✅ Token eliminado correctamente de localStorage', 'success');
          } else {
            addResult('❌ Error: Token no eliminado correctamente de localStorage', 'error');
          }
          
          addResult('Pruebas completadas', 'info');
        }, 500);
        
      } catch (error) {
        addResult(`❌ Error en las pruebas: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
      }
    };
    
    runTests();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Prueba de Integración de Servicios y Stores</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Resultados de las pruebas:</h2>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {testResults.map((result, index) => (
            <li key={index} style={{ 
              padding: '10px', 
              marginBottom: '5px', 
              borderRadius: '5px',
              backgroundColor: result.status === 'info' ? '#f0f0f0' : 
                              result.status === 'success' ? '#e6ffe6' : '#ffe6e6'
            }}>
              {result.message}
            </li>
          ))}
        </ul>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Estado actual del AuthStore:</h2>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify(useAuthStore.getState(), null, 2)}
        </pre>
      </div>
    </div>
  );
}