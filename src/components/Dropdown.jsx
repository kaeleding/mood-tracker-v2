import React, { useState, useEffect } from "react";
// import "./Dropdown.css";

export default function Dropdown({ options, getDropdownValue }) {
	const [selectedOption, setSelectedOption] = useState([]);
	// useEffect(() => {
	// 	handleChange("All");
	// }, []);

	//   function handleChange(event) {
	//     typeof event === "string"
	//       ? dropdownValue(event)
	//       : dropdownValue(event.target.value);
	//   }

	function changedSelection(e) {
		getDropdownValue(e.target.value);
		// showMenu(e.target.value);
	}

	useEffect(() => {
		setSelectedOption(() => {
			const newArr = ["All", ...options];

			return newArr;
		});
	}, []);

	return (
		<>
			<form>
				<select id="dropdown" onChange={changedSelection}>
					{selectedOption.map((option) => {
						return <option value={option}>{option}</option>;
					})}
				</select>
			</form>
		</>
	);
}
