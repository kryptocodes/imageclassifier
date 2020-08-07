import React, { useState, useRef, useEffect, useReducer } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";

const machine = {
  initial: "initial",
  states: {
    initial: { on: { next: "loadingModel" } },
    loadingModel: { on: { next: "modelReady" }, showText: true },
    modelReady: { on: { next: "imageReady" } },
    imageReady: { on: { next: "identifying" }, showImage: true },
    identifying: { on: { next: "complete" } },
    complete: { on: { next: "modelReady" }, showImage: true, showResults: true }
  }
};

const App = () => {
  const [results, setResults] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const [model, setModel] = useState(null);
  const imageRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    loadModel()
  }, [])

  const reducer = (state, event) =>
    machine.states[state].on[event] || machine.initial;

  const [appState, dispatch] = useReducer(reducer, machine.initial);
  const next = () => dispatch("next");

  const loadModel = async () => {
    next();
    const model = await mobilenet.load();
    setModel(model);
    next();
  };

  const identify = async () => {
    next();
    const results = await model.classify(imageRef.current);
    setResults(results);
    next();
  };

  const reset = async () => {
    setResults([]);
    next();
  };

  const upload = () => inputRef.current.click();

  const handleUpload = event => {
    const { files } = event.target;
    if (files.length > 0) {
      const url = URL.createObjectURL(event.target.files[0]);
      setImageURL(url);
      next();
    }
  };

  const actionButton = {
    initial: { action: loadModel, text: "Load Model" },
    loadingModel: { text: "Loading Model..." },
    modelReady: { action: upload, text: "Upload Image" },
    imageReady: { action: identify, text: "Guess" },
    identifying: { text: "Guessing..." },
    complete: { action: reset, text: "Reset" }
  };

  const { showImage, showResults, showText } = machine.states[appState];

  return (
    <div className="container">
      <h1 className="display-4">Image Classifier</h1>
      {showImage && <img src={imageURL} alt="upload-preview" ref={imageRef} />}
      <input
        type="file"
        onChange={handleUpload}
        ref={inputRef}
      />
      {showResults && (
        <ul>
          {results.map(({ className, probability }) => (
            <li key={className}>{`${className}: %${(probability * 100).toFixed(
              2
            )}`}</li>
          ))}
        </ul>
      )}
      <button className="btn btn-lg btn-outline-warning justify-content-center mt-5" onClick={actionButton[appState].action || (() => {})}>
        {actionButton[appState].text}
      </button>
      { showText && <div>Loading ML models please wait</div> }
    </div>
  );
}

export default App;
