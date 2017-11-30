import * as firebase from "firebase";

var config = {
  apiKey: "AIzaSyAhKXIU7QySd5GYGQ936dGHAtVMaTGqBX4",
  authDomain: "emarktodoor.firebaseapp.com",
  databaseURL: "https://emarktodoor.firebaseio.com",
  projectId: "emarktodoor",
  storageBucket: "emarktodoor.appspot.com",
  messagingSenderId: "463267260304"
};
firebase.initializeApp(config);

class CrudFirebase<T> {
  path: string;
  object: T;

  constructor(path: string) {
    this.path = path;

  }

  setObject() {}

  writeUserData(object: T, id: string) {
    var newPostKey = firebase.database().ref(this.path).push().key;
    var newPath = `${this.path}\\${newPostKey}`
    console.log(newPostKey);
    firebase
      .database()
      .ref(newPath)
      .set({
          id: object
      })
  }
}


export interface Sample {
  name: string;
  age: number;
  id: number
}

var test = new CrudFirebase<Sample>("sample");
test.writeUserData({
  id: 1001,
  name: "Chaminga",
  age: 14
}, 'Order1000');
