import logo from './logo.svg';
import './App.css';
import Map from './components/map';
import Navbar from './components/navbar';
import MapWithMGRSOverlay from './components/mgrs';


function App() {
  return (
   <div>
    <Navbar />
    <MapWithMGRSOverlay />
   </div>
  );
}

export default App;
