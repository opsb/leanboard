DomHelpers = {
  hasClass: function(element, className) {
    return element.className.indexOf(className) !== -1;
  },

  addClass: function(element, className) {
    if (!DomHelpers.hasClass(element, className)) {
      element.className += " " + className;
    }
  },

  removeClass: function(element, className) {
    if (DomHelpers.hasClass(element, className)) {
      element.className = element.className.replace(className, "").replace(/\s+/, " ");
    }
  }
}

Utils = {
  debounce: function(func, threshold, execAsap) {
    var timeout;
    return function debounced () {
      var obj = this, args = arguments;
      function delayed () {
        if (!execAsap)
          func.apply(obj, args);
        timeout = null;
      };

      if (timeout)
        clearTimeout(timeout);
      else if (execAsap)
        func.apply(obj, args);

      timeout = setTimeout(delayed, threshold || 100);
    };
  },

  asInteger: function(text) {
    return text && parseInt(text);
  }
}

var config = { attributes: true, childList: true, characterData: true };


function parseMaxCards(text) {
  const match = /\(max (\d+)\)/.exec(text);
  return match && match[1] && parseInt(match[1])
}

function parseCardCount(text) {
  return parseInt(text);
}

function addListener(element, callback) {
  if (!element) return;

  const observer = new MutationObserver(callback);
  observer.observe(element, config);

  return observer;
}

function addListeners(elements, callback) {
  if (!elements) return;

  const observer = new MutationObserver(callback);
  elements.forEach(element => observer.observe(element, config));

  return observer;
}

class List {
  constructor(element) {
    this.element = element;
  }

  subscribe() {
    const cardCounter = this.element.querySelector(':scope .js-num-cards');
    const title = this.element.querySelector(':scope h2');

    this._listener = addListeners([title, cardCounter], () => this._update());
    this._update();
  }

  unsubscribe() {
    this._listener.disconnect();
  }

  _update() {
    const element = this.element;
    const cardCounter = element.querySelector(':scope .js-num-cards');
    const maxCards = parseMaxCards(element.querySelector(':scope h2').innerHTML);
    const cardCount = parseCardCount(cardCounter.innerHTML);

    if (!maxCards) return;

    if (cardCount > maxCards) {
      DomHelpers.addClass(element, "leanboard-overloaded");
    } else {
      DomHelpers.removeClass(element, "leanboard-overloaded");
    }
  }
}

class Board {
  subscribe() {
    this._subscribeToLists();
  }

  unsubscribe() {
    this._unsubscribeFromLists();
  }

  _subscribeToLists() {
    const listElements = document.querySelectorAll(".list");
    this._lists = [];

    for(var i = 0; i < listElements.length; i++) {
      this._lists[i] = new List(listElements[i]);
    }

    this._lists.forEach(list => list.subscribe());
  }

  _unsubscribeFromLists() {
    this._lists.forEach(list => list.unsubscribe());
    this._lists = [];
  }
}

class Trello {
  subscribeToCurrentBoard() {
    const contentElement = document.querySelector('#content');
    addListener(contentElement, () => this._switchBoard());
  }

  _switchBoard() {
    if (this.currentBoard) this.currentBoard.unsubscribe();

    const board = new Board();
    board.subscribe();

    this.currentBoard = board;
  }
}

const trello = new Trello();
trello.subscribeToCurrentBoard();
