import { useState, useEffect, useRef } from "react";
import firebaseApp from "../util/firebase";
import LoadingOverlay from "react-loading-overlay";
import "./scss/Admin.scss";

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
	const [addMemberColor, setAddMemberColor] = useState("");
	const [members, setMembers] = useState([]);

	function addMember(event) {
		event.preventDefault();
		// getTeamsFromFirebase()

		addPersonToFirebase({
			details: {
				displayName: addMemberText,
				defaultColor: addMemberColor,
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
			case "addColor":
				setAddMemberColor(event.target.value);
				console.log(event.target.value);
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

		setAddMemberColor(`#${Math.floor(Math.random() * 16777215).toString(16)}`);
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
				<>
					<div id="admin-header">
						<h1>Secret Admin Page</h1>
						<h4>*TODO: Add fields validation (such as empty / duplicate fields on submit)!</h4>
						<h4> So be careful when adding data for now :)</h4>
					</div>

					<div id="form-parent">
						<form onSubmit={addTeam} className="form">
							<h1 className="form__title">Add a Team</h1>

							<div className="form__group">
								<input onChange={(e) => handleInput("addTeam", e)} type="text" id="team-name" className="form__input" placeholder=" " />
								<label htmlFor="team-name" className="form__label">
									Team Name
								</label>
							</div>

							<button type="submit" className="form__button">
								Add Team
							</button>
						</form>

						<form onSubmit={addSubTeam} className="form">
							<h1 className="form__title">Add Sub-Team</h1>

							<div className="form__group">
								<input onChange={(e) => handleInput("addSubTeam", e)} type="text" id="sub-team" className="form__input" placeholder=" " />
								<label htmlFor="sub-team" className="form__label">
									Sub-Team Name
								</label>
							</div>

							<button type="submit" className="form__button">
								Add Sub-Team
							</button>
						</form>

						<form className="form">
							<h1 className="form__title">Manage Teams</h1>

							<div className="form__group">
								<select className="form__input dropdown" onChange={getSelectedTeam}>
									{teams.map((team) => {
										return <option value={team.team}>{team.team}</option>;
									})}
								</select>

								<label className="form__label">Team</label>
							</div>
						</form>

						<form onSubmit={addMember} className="form">
							<h1 className="form__title">Add Members</h1>

							<div className="form__group">
								<input onChange={(e) => handleInput("addMember", e)} type="text" placeholder=" " id="add-member" className="form__input" />
								<label htmlFor="add-member" className="form__label">
									Member Name
								</label>
							</div>

							<div className="form__group">
								<select ref={subTeamRef} onChange={subTeamChange} className="form__input dropdown">
									{teams
										?.find((team) => team.team === selectedTeam)
										?.subTeams?.map((subTeam) => {
											return <option value={subTeam}>{subTeam}</option>;
										})}
								</select>
							</div>

							<button type="submit" className="form__button">
								Add Member
							</button>
						</form>

						<form className="form">
							<h1 className="form__title">Add Display Color</h1>
							<p className="form__description"></p>

							<div className="form__group">
								<input onChange={(e) => handleInput("addColor", e)} type="color" placeholder=" " id="color-member" className="form__input" defaultValue={addMemberColor} />
								<label htmlFor="color-member" className="form__label">
									Display Color
								</label>
							</div>
						</form>

						<form className="form">
							<h1 className="form__title">Remove Members</h1>
							<p className="form__description">*Not yet functional</p>

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
				</>
			)}
		</div>
	);
}

export default Admin;
