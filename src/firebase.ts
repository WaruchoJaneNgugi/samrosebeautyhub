import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyBGmYt-3wXYuHUsLfd8-YaHdupbB-5AU_M',
  authDomain: 'samrosebeatyhub.firebaseapp.com',
  projectId: 'samrosebeatyhub',
  storageBucket: 'samrosebeatyhub.firebasestorage.app',
  messagingSenderId: '1032248809052',
  appId: '1:1032248809052:web:e59569f8e82c29c645f899',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
