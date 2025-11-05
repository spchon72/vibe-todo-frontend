import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // 환경 변수에서 배포된 백엔드 주소 추출
  const deployedBackend = env.VITE_API_BASE_URL
  
  // 환경 변수가 설정되어 있으면 직접 요청 (프록시 불필요)
  // 환경 변수가 없으면 로컬 백엔드용 프록시 사용
  const proxyConfig = deployedBackend && deployedBackend.startsWith('http') ? undefined : {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
  
  return {
    plugins: [react()],
    server: {
      proxy: proxyConfig
    }
  }
})
