import { useState, useEffect, useRef } from "react";
import firebaseApp from "../util/firebase";
import LoadingOverlay from "react-loading-overlay";
import "./css/Admin.css";

LoadingOverlay.propTypes = undefined;

async function getTeamsFromFirebase() {
	const teams = await firebaseApp.getTeams();

	return teams;
}

async function getPersonsFromFirebase(query) {
	const persons = await firebaseApp.getPersons(query);

	return persons;
}

async function updateTeamsFromFirebase(payload, teamId) {
	await firebaseApp.updateTeam(payload, teamId);
}

async function addPersonToFirebase(payload) {
	await firebaseApp.addPerson(payload);
}

function getPhilippineTime() {
	const date = new Date();

	// convert to milliseconds, add local time zone offset and get UTC time in milliseconds
	const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;

	// time offset for Philippines is +8
	const timeOffset = 8;

	// create new Date object for a different timezone using supplied its GMT offset.
	const currentPhilippineTime = new Date(utcTime + 3600000 * timeOffset);

	return currentPhilippineTime;
}

// TODO: Try to refactor multiple forms onSubmit to one function

function Admin() {
	const [teams, setTeams] = useState([]);
	const [isLoading, setLoading] = useState(true);
	const [selectedTeam, setSelectedTeam] = useState(null);
	const [subTeam, setSubTeam] = useState("");
	const subTeamRef = useRef(null);
	const [addTeamText, setAddTeamText] = useState("");
	const [addSubTeamText, setAddSubTeamText] = useState("");
	const [addMemberText, setAddMemberText] = useState("");
	const [members, setMembers] = useState([]);

	function addMember(event) {
		event.preventDefault();
		// getTeamsFromFirebase()

		addPersonToFirebase({
			details: {
				displayName: addMemberText,
			},
			isActive: true,
			mood: [{ xStress: 50, yMood: 50, timestamp: getPhilippineTime() }],
			subTeam: subTeam.toUpperCase(),
			team: selectedTeam.toUpperCase(),
		});
	}

	function addTeam(event) {
		event.preventDefault();

		if (!teams.find((t) => t.team === addTeamText) && addTeamText) {
			firebaseApp.addTeam(addTeamText).then((teamId) => {
				setTeams([...teams, { team: addTeamText, id: teamId, subTeams: [] }]);

				// setTeams(t => {
				//     console.log(t)

				//     return t
				// })
			});
		} else {
			console.log("Team already exists");
		}
	}

	function addSubTeam(event) {
		event.preventDefault();

		setTeams((t) => {
			const newTeamArray = t.map((team) => {
				if (team.team === selectedTeam) {
					team.subTeams.push(addSubTeamText);

					if (team.subTeams.length === 1) {
						setSubTeam(addSubTeamText);
					}

					team.subTeams = [...new Set(team.subTeams)];
				}
				return team;
			});

			updateTeamsFromFirebase(newTeamArray.find((t) => t.team === selectedTeam).subTeams, newTeamArray.find((t) => t.team === selectedTeam).id);

			return newTeamArray;
		});
	}

	function handleInput(type, event) {
		switch (type) {
			case "addTeam":
				setAddTeamText(event.target.value.toUpperCase());
				break;
			case "addSubTeam":
				setAddSubTeamText(event.target.value);
				break;
			case "addMember":
				setAddMemberText(event.target.value);
				break;
			default:
				break;
		}

		console.log(type);
	}

	function getSelectedTeam(e) {
		setSelectedTeam(e.target.value);
		// setSubTeam(teams.find(t => t.team === e.target.value).subTeams[0])

		getPersonsFromFirebase(e.target.value).then((members) => {
			setMembers(members);

			setMembers((members) => {
				console.log(members);

				return members;
			});
		});
	}

	function removeMember(idx) {
		console.log(idx);
	}

	function subTeamChange(e) {
		setSubTeam(e.target.value);
	}

	useEffect(() => {
		getTeamsFromFirebase().then((teams) => {
			setTeams(teams);
			setSelectedTeam(teams[0].team);
			setSubTeam(teams[0].subTeams[0]);

			getPersonsFromFirebase(teams[0].team).then((members) => {
				setMembers(members);
				setLoading(false);
			});
		});
	}, []);

	useEffect(() => {
		if (subTeamRef.current) {
			setSubTeam(subTeamRef.current.value);
		} else {
			setSubTeam(teams[0]?.subTeams[0]);
		}
	}, [selectedTeam]);

	return (
		<div>
			{isLoading ? (
				<LoadingOverlay />
			) : (
				<div style={{ height: "100vh" }}>
					<div className="forms">
						<h3>Add a Team</h3>
						<form onSubmit={addTeam} id="manage-team-form">
							<input onChange={(e) => handleInput("addTeam", e)} type="text" name="name" placeholder="Team Name" />

							<button type="submit">Add Team</button>
						</form>
					</div>

					<div className="forms">
						<h3>Manage Teams</h3>
						<form>
							<select className="dropdown" onChange={getSelectedTeam}>
								{teams.map((team) => {
									return <option value={team.team}>{team.team}</option>;
								})}
							</select>
						</form>
					</div>

					<div className="forms">
						<form onSubmit={addSubTeam} className="member-form">
							<h6>Add Sub-Team</h6>

							<input onChange={(e) => handleInput("addSubTeam", e)} type="text" name="name" placeholder="Sub-Team Name" />

							<button type="submit">Add Sub-Team</button>
						</form>

						<form onSubmit={addMember} className="member-form">
							<h6>Add Members</h6>

							<input onChange={(e) => handleInput("addMember", e)} type="text" name="name" placeholder="Display Name" />

							<select ref={subTeamRef} onChange={subTeamChange} className="dropdown">
								{teams
									?.find((team) => team.team === selectedTeam)
									?.subTeams?.map((subTeam) => {
										return <option value={subTeam}>{subTeam}</option>;
									})}
							</select>

							<button type="submit">Add Member</button>
						</form>

						<form className="member-form">
							<h6>Remove Members</h6>

							<ul id="member-list">
								{members.map((member, idx) => {
									return (
										<div>
											<li>{member.details.displayName}</li>
											<span id="remove-member" onClick={() => removeMember(idx)}>
												X
											</span>
										</div>
									);
								})}
							</ul>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

export default Admin;
