import  'apriori';
import Papa from 'csvto';
import {computedFrom} from 'aurelia-framework';
import {Promise} from 'bluebird';

const APPCONTAINER = new WeakMap();

export class App {
    constructor() 
    {
        this.item = "";
        this.selectedFile;
        this.items = [];
        this.selectedOptions = [];
        this.transactions = [];

        this.minSupport = 1;
        this.minConfidence = 1;

        this.resault = "";
        APPCONTAINER.set(App, this);
    }

    addItem() 
    {
        let itm = new Item(this.item);
        this.items.push(itm);
        this.item = "";
    }

    deleteItem(name) 
    {
        let index = 0;
        let indexOfItem = -1;
        this.items.forEach(function(itm) {
            if (itm.name === name) {
                indexOfItem = index;
                return;
            }
            index++;
        });

        if (indexOfItem > -1) {
            this.items.splice(indexOfItem, 1);
        }
    }

    importDataset() 
    {
        if(this.selectedFile)
            Papa.parse(this.selectedFile[0], {complete:this.complete});     
   
    }

    complete(result) 
    {        
        let index = 0;
        let header = [];
        let that = APPCONTAINER.get(App);
        that.clearAllTransactions();
        result.data.forEach(function(item) {
            if (index === 0) {
                header = item;
            } else {
                let colIndex = 0;
                var tempItem = "";
                item.forEach(function(col) {
                    tempItem += header[colIndex].replace(" ", "-") + "=" + col.replace(" ", "-") + " ";
                    colIndex++;
                });
                let trans = new Transaction(tempItem.substring(0, tempItem.length - 1));
                that.transactions.push(trans);
            }

            index++;
        });
    }

    addTransaction() 
    {
        let allName = "";
        this.selectedOptions.forEach(function(itm) {
            allName += itm.name + " ";
        });

        var trans = new Transaction(allName.substring(0,allName.length - 1));
        this.transactions.push(trans);
    }

    deleteTransaction(name) 
    {
        let index = 0;
        let indexOfTransaction = -1;
        this.transactions.forEach(function(itm) {
            if (itm.name === name) {
                indexOfTransaction = index;
                return;
            }
            index++;
        });

        if (indexOfTransaction > -1) {
            this.transactions.splice(indexOfTransaction, 1);
        }
    }

    clearAllTransactions() 
    {
        this.transactions = [];
    }

    proccessTransactions() 
    {
        let apriori = new Apriori(this.transactions);
        
        let that = this;
        apriori.run(that.minSupport, that.minConfidence).then(() => {
            that.resault = apriori.getAllMessage();
        });
    }
}

class Item {
    constructor(name) {
        this.name = name;
        this.select = false;
    }
}

class Transaction {
    constructor(name) {
        this.name = name;
    }
}