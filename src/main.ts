import { createApp } from 'vue'
import './style.css'
import init from "wasm";
import App from './App.vue'

await init();
createApp(App).mount('#app')
