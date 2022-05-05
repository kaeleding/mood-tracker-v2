import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDoc, getDocs, doc, updateDoc, onSnapshot, arrayUnion, arrayRemove, query, where, setDoc } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyApgkcfOmayL7aSe6hk8yWk4i6xgbxw0oA",
	authDomain: "mood-tracker-65ea3.firebaseapp.com",
	projectId: "mood-tracker-65ea3",
	storageBucket: "mood-tracker-65ea3.appspot.com",
	messagingSenderId: "911722608065",
	appId: "1:911722608065:web:9e9313eabb2ee7ef2c2b40",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let globalX, globalY;

const firebaseApp = {
	getPersons: async function getPersons(team) {
		team = team.toUpperCase();

		const personsRef = collection(db, "Persons");

		const q = query(personsRef, where("team", "==", team));
		const teamQuery = await getDocs(q);
		// const personsSnapshot = await getDocs(personsRef);

		const personsList = teamQuery.docs.map((doc) => {
			return { ...doc.data(), id: doc.id };
		});
		// teamQuery.forEach((doc) => {
		//   // doc.data() is never undefined for query doc snapshots
		//   console.log(doc.id, " => ", doc.data());
		// });
		return personsList;
	},

	addPerson: async function addPerson(payload) {
		const personsRef = doc(collection(db, "Persons"));
		payload.id = personsRef._key.path.segments[1];
		await setDoc(personsRef, payload);
	},

	updatePerson: async function updatePerson(id, person) {
		const personRef = doc(db, "Persons", id);

		await updateDoc(personRef, {
			...person,
		});
	},

	updatePosition: async function updatePosition(id, x, y) {
		globalX = x;
		globalY = y;
		const personRef = doc(db, "Persons", id);
		// const personSnap = await getDoc(personRef);

		const date = new Date();

		// convert to milliseconds, add local time zone offset and get UTC time in milliseconds
		const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;

		// time offset for Philippines is +8
		const timeOffset = 8;

		// create new Date object for a different timezone using supplied its GMT offset.
		var currentPhilippineTime = new Date(utcTime + 3600000 * timeOffset);

		// if (personSnap.exists()) {
		// 	if (personSnap.data().mood[personSnap.data().mood.length - 1].timestamp.toDate().getDate() === currentPhilippineTime.getDate()) {
		// 		const sameDateEntry = personSnap.data().mood.pop();

		// 		await updateDoc(personRef, {
		// 			mood: arrayRemove(sameDateEntry),
		// 		});
		// 	}
		// }

		await updateDoc(personRef, {
			mood: arrayUnion({
				xStress: x,
				yMood: y,
				timestamp: currentPhilippineTime,
			}),
		});
	},

	listenToRealtime: async function listenToRealtime(team, setCircle, height, width) {
		const q = query(collection(db, "Persons"), where("team", "==", team.toUpperCase()));

		const unsubscribe = onSnapshot(q, (snapshot) => {
			snapshot.docChanges().forEach((change) => {
				if (change.type === "added") {
					// console.log("New", change.doc.data());
				}
				if (change.type === "modified") {
					console.log(globalX, globalY);

					const changedPerson = change.doc.data();

					if (changedPerson.mood.length === 0) {
						return;
					}

					const lastMove = changedPerson.mood[changedPerson.mood.length - 1];

					// if (lastMove.xStress !== globalX && lastMove.yMood !== globalY) {
					// 	return;
					// }

					setCircle((persons) => {
						// console.log(persons);

						const newArr = persons.map((person) => {
							if (person.name === changedPerson.details.displayName) {
								person.x = (lastMove.xStress * width) / 100;
								person.y = (lastMove.yMood * height) / 100;
							}

							return person;
						});

						return newArr;
					});

					globalX = null;
					globalY = null;
				}
				if (change.type === "removed") {
					console.log("Removed", change.doc.data());
				}
			});
		});

		return unsubscribe;
	},

	getTeams: async function getTeams(team) {
		const teamsRef = collection(db, "Teams");

		let q = null;

		if (team) {
			q = query(teamsRef, where("team", "==", team.toUpperCase()));
		}

		const teamsSnapshot = await getDocs(team ? q : teamsRef);

		const teamsList = teamsSnapshot.docs.map((doc) => {
			return { ...doc.data(), id: doc.id };
		});

		return teamsList;
	},

	addTeam: async function addTeam(teamName) {
		const ref = doc(collection(db, "Teams"));
		const teamRef = await setDoc(ref, { team: teamName, subTeams: [] });

		// Weird syntax to get the id of the newly created team from firebase
		return ref._key.path.segments[1];
	},

	updateTeam: async function updateTeam(payload, teamId) {
		const teamRef = doc(collection(db, "Teams"), teamId);

		await updateDoc(teamRef, {
			subTeams: payload,
		});
	},
};

export default firebaseApp;
