import { createApp } from 'vue'
import App from './App.vue'
import './main.css'

// testing
// setTimeout(() => {
//   console.log("Attaching pointer listeners after mount");
//   document.addEventListener("pointermove", e => console.log("MOVE", e.clientX));
//   document.addEventListener("pointerdown", e => console.log("DOWN", e.clientX));
// }, 0);

createApp(App).mount('#app')
