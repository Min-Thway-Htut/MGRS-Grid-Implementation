import logo from './logo.svg';
import './App.css';
import Map from './components/map';
import Navbar from './components/navbar';
import MapWithMGRSOverlay from './components/mgrs';
import SecondMap from './components/secondMap';

function App() {
  return (
   <div>
    <Navbar />
    <SecondMap />
   </div>
  );
}

export default App;
