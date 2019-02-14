import React from 'react';
import './App.css';
import Host from './Host';
import Client from './Client';

class App extends React.Component {

  constructor(){
    super();
    this.host = this.getUrlVars().host === "true";
  }

  getUrlVars() {
    let vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars
  } 



  renderContent() {
    return (
      <main className="App-content">
        {this.host ?
        <Host/>
        :<Client/>
        }
        
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
