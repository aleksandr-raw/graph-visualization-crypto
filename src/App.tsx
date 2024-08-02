import React from 'react';
import './App.css';
import {useGetMessagesMutation} from "./store/api";

function App() {
    const [address, setAddress] = React.useState('')
    const [getMessages, messages] = useGetMessagesMutation()


    return (
        <div className="App">
            <input type="text" onChange={(e) => setAddress(e.target.value)} value={address}/>
            <button onClick={() => getMessages(address)}>Get messages</button>
        </div>
    );
}

export default App;
