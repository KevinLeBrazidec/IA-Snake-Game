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
        // this.trainTab.push({input: data, output: outputObject});
        this.onFinishLoads(test);
    }

    //On entraine notre IA avec les exercices du fichier dataTraining
    onFinishLoads(test){
      var datas = {};
      datas[0] = test;
      this.net.train(this.trainTab);
      let value = this.net.run(datas[0]);
      console.log("VALUE: ", JSON.stringify(value));
    }

    //On inscrit dans la memoire que la decision etait correcte
    trainWhileRunning(jsonConfiguration, jsonDecision){
      this.net.train([{input: jsonConfiguration, output: jsonDecision}]);
    }

    //Prend en parametre un JSON du type de dataTraining.js pour retourner un choix
    runParcours(jsonObject){
      return this.net.run(jsonObject);
    }
}
