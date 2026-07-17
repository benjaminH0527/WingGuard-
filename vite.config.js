import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        diary: 'diary.html',
        home: 'home.html',
        about: 'about.html',
        story: 'story.html',
        protect: 'protect.html',
        birds: 'birds.html'
      }
    }
  }
});
