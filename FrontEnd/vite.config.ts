import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Thêm envPrefix để Vite nhận diện các biến môi trường có tiền tố REACT_APP_
  envPrefix: ['VITE_', 'REACT_APP_'],
})
