import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const oldConfig = {
  projectId: "gen-lang-client-0745529210",
  apiKey: "AIzaSyAwFuZOKUUOYujJNxDFUYnFdVvX2rZoJms",
  authDomain: "gen-lang-client-0745529210.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-2532edae-ec74-4245-879c-48e2a740b378"
};

const oldApp = initializeApp(oldConfig);
const oldDb = getFirestore(oldApp, oldConfig.firestoreDatabaseId);

async function run() {
  const snapshot = await getDocs(collection(oldDb, "services"));
  console.log(`Docs found: ${snapshot.size}`);
  snapshot.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
  
  // also check without custom database id just in case?
  const defaultDb = getFirestore(oldApp, "(default)");
  const snapshot2 = await getDocs(collection(defaultDb, "services"));
  console.log(`Default Docs found: ${snapshot2.size}`);
  snapshot2.forEach(doc => {
    console.log("default", doc.id, "=>", doc.data());
  });
  
  process.exit(0);
}

run().catch(console.error);
