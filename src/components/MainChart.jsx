import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Text, Label, Tag, Circle, Group } from "react-konva";
import firebaseApp from "../util/firebase";
import AxisY from "./AxisY";
import AxisX from "./AxisX";
import Dropdown from "./Dropdown";
import "./css/MainChart.css";

function vh(v) {
	var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	return (v * h) / 100;
}

function vw(v) {
	var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	return (v * w) / 100;
}

let height = vh(75),
	width = vw(90);

let images = [];

function getImages(persons) {
	const personsWithImages = persons.filter((person) => person.img);

	return new Promise((resolve) => {
		if (personsWithImages.length === 0) {
			resolve();
		}

		personsWithImages.forEach((person) => {
			const img = new Image();
			img.src = person.img;
			img.decode().then(() => {
				images.push({ person, img });

				if (personsWithImages.length === images.length) {
					resolve();
				}
			});
		});
	});
}

async function getPersonsFromFirebase(query) {
	const persons = await firebaseApp.getPersons(query);

	return persons;
}

async function listenToRealtime(team, setCircle, height, width) {
	const persons = await firebaseApp.listenToRealtime(team, setCircle, height, width);

	return persons;
}

async function updatePosition(id, x, y) {
	await firebaseApp.updatePosition(id, x, y);
}

async function updatePerson(id, person) {
	await firebaseApp.updatePerson(id, person);
}

async function getTeamsFromFirebase(team) {
	const teams = await firebaseApp.getTeams(team);

	return teams;
}

function removeDuplicateDates(array) {
	// Convert firebase timestamp to JS date
	array.map((person) => {
		person.mood.map((x) => {
			x.timestamp = x.timestamp.toDate();

			return { ...x };
		});

		return person;
	});
	let tempArr = [];
	array.forEach((person) => {
		tempArr = [];
		for (let i = 0; i < person.mood.length; i++) {
			if (person.mood[i]?.timestamp?.toDateString() !== person.mood[i + 1]?.timestamp?.toDateString()) {
				tempArr.push(person.mood[i]);
				if (i === person.mood.length - 1) {
					person.mood = tempArr;
				}
			}
		}
	});
}

function MainChart({ loading, team }) {
	const [circle, setCircle] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [subTeams, setSubTeams] = useState([]);
	const [dropdownSelection, setDropdownSelection] = useState("All");
	const firstRender = useRef(true);

	const circleRefs = useRef([]);

	const tooltipRef = useRef(null);
	const stageRef = useRef(null);
	const circleLayerRef = useRef(null);

	const textRef = useRef([]);

	function handleMouseOver(e) {
		document.body.style.cursor = "pointer";

		circleRefs.current[e.target.attrs.index].to({
			scaleX: 1.3,
			scaleY: 1.3,
		});
	}

	function handleMouseOut(e) {
		document.body.style.cursor = "default";
		tooltipRef.current.hide();

		circleRefs.current[e.target.attrs.index].to({
			scaleX: 1,
			scaleY: 1,
		});
	}

	function handleMouseMove(e) {
		//console.log(e.target)

		tooltipRef.current.position({
			x: e.target.x(),
			y: e.target.y() - 25,
		});

		tooltipRef.current.getText().text(circle[e.target.attrs.index].name);
		tooltipRef.current.show();
	}

	function handleClick(e) {
		// console.log(circleRefs)
		console.log(circle[e.target.attrs.index]);

		console.log(circleRefs.current[e.target.index].x(), circleRefs.current[e.target.index].y());
	}

	// Middle of dragging
	function handleDragMove(e) {
		// Restrain the circle inside the container
		if (circleRefs.current[e.target.attrs.index].y() <= 1) {
			circleRefs.current[e.target.attrs.index].y(1);
		}
		if (circleRefs.current[e.target.attrs.index].y() >= height - 10) {
			circleRefs.current[e.target.attrs.index].y(height - 10);
		}
		if (circleRefs.current[e.target.attrs.index].x() <= 1) {
			circleRefs.current[e.target.attrs.index].x(1);
		}
		if (circleRefs.current[e.target.attrs.index].x() >= width - 10) {
			circleRefs.current[e.target.attrs.index].x(width - 10);
		}

		// Make text inside the circle follow the circle
		if (textRef.current[e.target.attrs.index]) {
			textRef.current[e.target.attrs.index].x(circleRefs.current[e.target.attrs.index].x());
			textRef.current[e.target.attrs.index].y(circleRefs.current[e.target.attrs.index].y());
		}
	}

	function handleDragEnd(e) {
		console.log(`id: ${e.target.attrs.index}, x: ${Math.round((circleRefs.current[e.target.attrs.index].x() / width).toFixed(2) * 100)}, y: ${Math.abs(Math.round((circleRefs.current[e.target.attrs.index].y() / height).toFixed(2) * 100) - 100)}`);
		console.log(circleRefs.current[e.target.attrs.index].x(), circleRefs.current[e.target.attrs.index].y());
		console.log(circle[e.target.attrs.index]);

		updatePosition(
			circle[e.target.attrs.index].firebaseId,
			Math.round((circleRefs.current[e.target.attrs.index].x() / width).toFixed(2) * 100),
			Math.abs(Math.round((circleRefs.current[e.target.attrs.index].y() / height).toFixed(2) * 100) - 100)
		);
	}

	function handleDragStart(e) {
		tooltipRef.current.hide();
	}

	function handleCircleLayerMouseMove(e) {}

	function getDropdownValue(option) {
		// setCircle((circle) => {
		// 	const newArr = circle.filter((c) => c.subTeam === option.toUpperCase());

		// 	console.log(newArr);

		// 	return newArr;
		// });
		setDropdownSelection(option.toUpperCase());
	}

	useEffect(() => {
		listenToRealtime(team, setCircle.bind(this), height, width);

		getTeamsFromFirebase(team).then((teamFromFirebase) => {
			setSubTeams(...teamFromFirebase.map((t) => t.subTeams));
		});

		getPersonsFromFirebase(team).then((persons) => {
			removeDuplicateDates(persons);

			getImages(persons).then(() => {
				// console.log(persons);

				setCircle(() => {
					const newCircle = persons.map((person, idx) => {
						if (person.img) {
							//console.log(images.find((personImg) => personImg.person.details.displayName === person.details.displayName));
							let img = images.find((personImg) => personImg.person.details.displayName === person.details.displayName)?.img;

							return {
								id: idx,
								x: (person.mood[person.mood.length - 1].xStress * width) / 100,
								y: (person.mood[person.mood.length - 1].yMood * height) / 100,
								name: person.details.displayName,
								img: img,
								firebaseId: person.id,
								subTeam: person.subTeam,
							};
						}
						return {
							id: idx,
							x: (person.mood[person.mood.length - 1].xStress * width) / 100,
							y: (person.mood[person.mood.length - 1].yMood * height) / 100,
							name: person.details.displayName,
							img: "",
							firebaseId: person.id,
							subTeam: person.subTeam,
							color: person.details.defaultColor,
						};
					});
					return newCircle;
				});

				setIsLoading(false);
				loading(false);
			});

			circleRefs.current = circleRefs.current.slice(0, circleRefs.length);
			textRef.current = textRef.current.slice(0, textRef.length);

			function fitStageIntoParentContainer() {
				var container = document.querySelector("#container-parent");
				var containerWidth = container.offsetWidth;

				// but we also make the full scene visible
				// so we need to scale all objects on canvas
				var scale = containerWidth / width;

				//  height = vh(75);
				//  width = vw(90);

				stageRef.current.width(width);
				stageRef.current.height(height);
				stageRef.current.scale({ x: scale, y: scale });
			}

			if (stageRef.current) {
				fitStageIntoParentContainer();
			}

			// adapt the stage on any window resize
			window.addEventListener("resize", fitStageIntoParentContainer);

			persons.forEach((person) => {
				updatePerson(person.id, person);
			});
		});

		return () => {
			console.log("unmount");
		};
	}, []);

	useEffect(() => {
		if (!firstRender.current) {
			images = [];
			getPersonsFromFirebase(team).then((persons) => {
				if (!(dropdownSelection.toUpperCase() === "ALL")) {
					persons = persons.filter((person) => person.subTeam === dropdownSelection);
				}
				removeDuplicateDates(persons);
				getImages(persons).then(() => {
					// console.log(persons);
					setCircle(() => {
						const newCircle = persons.map((person, idx) => {
							//console.log(images);
							if (person.img) {
								//console.log(images.find((personImg) => personImg.person.details.displayName === person.details.displayName));
								let img = images.find((personImg) => personImg.person.details.displayName === person.details.displayName)?.img;
								return {
									id: idx,
									x: (person.mood[person.mood.length - 1].xStress * width) / 100,
									y: (person.mood[person.mood.length - 1].yMood * height) / 100,
									name: person.details.displayName,
									img: img,
									firebaseId: person.id,
									subTeam: person.subTeam,
								};
							}
							return {
								id: idx,
								x: (person.mood[person.mood.length - 1].xStress * width) / 100,
								y: (person.mood[person.mood.length - 1].yMood * height) / 100,
								name: person.details.displayName,
								img: "",
								firebaseId: person.id,
								subTeam: person.subTeam,
								color: person.details.defaultColor,
							};
						});
						return newCircle;
					});
					setIsLoading(false);
					loading(false);
				});
			});
		}

		firstRender.current = false;
	}, [dropdownSelection]);

	return (
		<div>
			<div id="container-parent" style={{ display: "flex" }}>
				<AxisY />
				{isLoading ? (
					<div>Loading</div>
				) : (
					<div>
						<div id="header">
							<p>How are you today?</p>
							<Dropdown options={subTeams} getDropdownValue={getDropdownValue} />
						</div>

						<Stage ref={stageRef} width={width} height={height} style={{ outline: "1px solid black", width: "90vw", height: "75vh" }}>
							{/* Circle Layer*/}
							<Layer ref={circleLayerRef} onMouseMove={handleCircleLayerMouseMove}>
								{circle.map((circle, i) => (
									<Group key={circle.id}>
										<Circle
											key={circle.id}
											x={circle.x}
											y={height - circle.y}
											ref={(el) => (circleRefs.current[i] = el)}
											width={65}
											height={65}
											fill={circle.img ? "" : circle.color}
											stroke="black"
											strokeWidth={1}
											draggable={true}
											onMouseOver={handleMouseOver}
											onMouseMove={handleMouseMove}
											onMouseOut={handleMouseOut}
											onClick={handleClick}
											onDragMove={handleDragMove}
											onDragStart={handleDragStart}
											onDragEnd={handleDragEnd}
											fillPatternImage={circle.img ? circle.img : ""}
											fillPatternOffset={{ x: 50, y: 50 }}
											fillPatternScale={{ x: 0.8, y: 0.8 }}
											index={circle.id}
										/>

										{!circle.img ? (
											<Text
												text={circle.name}
												ref={(el) => (textRef.current[i] = el)}
												x={circle.x}
												y={height - circle.y}
												offsetX={circle.name.length >= 6 ? 21 : circle.name.length > 4 ? 17 : 13}
												offsetY={4}
												align="center"
												verticalAlign="middle"
												fontFamily="Calibri"
												fontSize={15}
											/>
										) : null}
									</Group>
								))}
							</Layer>

							{/* Tooltip Layer*/}
							<Layer>
								<Label opacity={0.75} visible={false} listening={false} ref={tooltipRef}>
									<Tag fill="black" pointerDirection="down" pointerWidth={10} pointerHeight={9} lineJoin="round" shadowColor="black" shadowBlur={10} shadowOffsetX={10} shadowOffsetY={10} shadowOpacity={0.2} cornerRadius={5}></Tag>
									<Text text="" fontFamily="Calibri" fontSize={20} padding={6} fill="white"></Text>
								</Label>
							</Layer>
						</Stage>
					</div>
				)}
			</div>

			<AxisX />
		</div>
	);
}

export default MainChart;
