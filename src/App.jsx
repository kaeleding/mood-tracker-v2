import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./views/HomePage";
import Admin from "./views/Admin";
import "./App.css";


function App() {
    return (
      <BrowserRouter>
        <Routes>
            <Route path="/:team" element={<HomePage/>}/>
            <Route path="/secret-admin-page" element={<Admin/>}/>
        </Routes>
      </BrowserRouter>
    );
  }
  
  export default App;
