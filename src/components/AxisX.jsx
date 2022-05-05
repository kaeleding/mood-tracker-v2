import React from "react";
import "./css/AxisX.css";

const images = [
  "https://i.imgur.com/N27hNq8.png",
  "https://i.imgur.com/lQd33I7.png",
  "https://i.imgur.com/L9xHtpu.png",
  "https://i.imgur.com/SKXg88i.png",
  "https://i.imgur.com/feExHBl.png",
];

function ChartXLabel() {
  return (
    <div>
      <div id="imageContainer">
        {images.map((image) => (
          <img src={image}></img>
        ))}
      </div>
      {/* <div id="labelContainer">
        <h1>Work Energy Level</h1>
      </div> */}
    </div>
  );
}

export default ChartXLabel;
