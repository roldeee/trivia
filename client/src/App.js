import React from 'react';
import './App.css';
import Host from './Host';
import Client from './Client';
import { BrowserRouter as Router, Route} from 'react-router-dom';

class App extends React.Component {

  renderContent() {
    return (
      <main className="App-content">
        <Router>
          <Route exact path="/" component={Client}/>
          <Route path="/host" component={Host}/>
        </Router> 
      </main>
    );
  }

  render() {
    return (
      <div className="App">
          {this.renderContent()}        
      </div>
    );
  }
}

export default App;
