import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const newConfig = {
  projectId: "bosco-school-life",
  apiKey: "AIzaSyAc21ukIRMeTZZ-dPHYVbY6c2gDW5d5TIQ",
  authDomain: "bosco-school-life.firebaseapp.com",
};

const newApp = initializeApp(newConfig);
const newDb = getFirestore(newApp);

async function run() {
  const snapshot = await getDocs(collection(newDb, "services"));
  console.log(`Docs found: ${snapshot.size}`);
  snapshot.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
  
  process.exit(0);
}

run().catch(console.error);
