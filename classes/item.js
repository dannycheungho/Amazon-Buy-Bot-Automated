class Item {

    constructor(item) {
        this.name = item.name;
        this.code = item.code;
        this.price = item.price;
        this.selected = item.selected;
        this.aws = item.aws;
       // this.bought = item.bought;
    }

    get fullName () {
        return `${this.name} (${this.code})`;
    }

    get column () {
        return `[${this.code}] ${this.name}`;
    }

}

module.exports = Item;
