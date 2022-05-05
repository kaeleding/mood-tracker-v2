import { useState } from "react";
import MainChart from "../components/MainChart";
import LoadingOverlay from "react-loading-overlay";
import { useParams } from "react-router-dom";

LoadingOverlay.propTypes = undefined

function HomePage() {
    const [loading, setLoading] = useState(true);
    const { team } = useParams();
    return (
      <div id="app">
        <LoadingOverlay active={loading} spinner>
          <MainChart loading={setLoading} team={team}/>
        </LoadingOverlay>
      </div>
    );
  }
  
  export default HomePage;
