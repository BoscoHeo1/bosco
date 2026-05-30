import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";

const oldConfig = {
  projectId: "gen-lang-client-0745529210",
  apiKey: "AIzaSyAwFuZOKUUOYujJNxDFUYnFdVvX2rZoJms",
  authDomain: "gen-lang-client-0745529210.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-2532edae-ec74-4245-879c-48e2a740b378"
};

const newConfig = {
  projectId: "bosco-school-life",
  apiKey: "AIzaSyAc21ukIRMeTZZ-dPHYVbY6c2gDW5d5TIQ",
  authDomain: "bosco-school-life.firebaseapp.com",
};

const oldApp = initializeApp(oldConfig, "oldApp");
const newApp = initializeApp(newConfig, "newApp");

const oldDb = getFirestore(oldApp, oldConfig.firestoreDatabaseId);
const newDb = getFirestore(newApp);

async function migrate() {
  console.log("Fetching old services...");
  const oldServicesSnapshot = await getDocs(collection(oldDb, "services"));
  console.log(`Found ${oldServicesSnapshot.size} services.`);
  
  for (const oldDoc of oldServicesSnapshot.docs) {
    const data = oldDoc.data();
    console.log(`Migrating: ${data.name}`);
    await setDoc(doc(newDb, "services", oldDoc.id), data);
  }
  
  console.log("Migration complete!");
}

migrate().catch(console.error).finally(() => process.exit(0));
