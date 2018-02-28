import brain from 'brain.js';
import listReactFiles from 'list-react-files'
import dataTraining from './roads/dataTraining.js'

const fs = require('fs');
const path = require('path');

export default class Agent{

  constructor(){
    console.log("create agent ...");
    this.net = new brain.NeuralNetwork();
    this.trainTab= [];
    this.trainParcours();
    this.nbrFiles= 0;
  }

  get_TrainTab(){
    return this.trainTab;
  }

  //Faire un fichier qui contient une liste de situation Json et train l'IA
  //On boucle dessus et on ajoute dans le tableau
  trainParcours(){
    let test = "";
    var datas = {};
    dataTraining.forEach((element, index) => {
      var outputObject = {};
      outputObject[element.name] = 1;
      datas[index] = element.configuration;
      test = element.configuration;
      this.trainTab.push({input: datas[index], output: outputObject});
    })
    this.trainingSession(this.trainTab);
  }

  //On entraine notre IA avec les exercices present dans dataTraining et generes dans App.js
  trainingSession(trainTab){
    this.net.train(trainTab);
  }

  //Prend en parametre un JSON du type de dataTraining.js pour retourner un choix
  runParcours(jsonObject){
    return this.net.run(jsonObject);
  }
}
