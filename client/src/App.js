import "./App.css";
import { useState } from "react";
import CodeEditor from '@uiw/react-textarea-code-editor';
import axios from "axios";
function App() {
  const [code, setCode] = useState("");
  const [lng, setLng] = useState("cpp");
  const [res, setRes] = useState("");
  const [status, setStatus] = useState();
  const [jobId, setjobId] = useState();
  const handleSubmit = async () => {
    const payload = {
      lng,
      code,
    };
    let output;
    try {
      setjobId("");
      setStatus("");
      setRes("");
 
      output = await axios.post("http://localhost:5000/run", payload);
      // console.log(output);
      setRes(output.data.jobId);
      let intervalId = setInterval(async () => {
        const data = await axios.get("http://localhost:5000/status", {
          params: { id: output.data.jobId },
        });
        const { success, job, error } = data.data;
        console.log(data.data);
        if (success) {
          const { status: jobStatus, output: jobOutput } = job;
          setStatus(jobStatus);
          if (jobStatus === "pending") return;
          setRes(jobOutput);
          clearInterval(intervalId);
        } else {
          console.error(error);
          setStatus("Error : Please retry");
          clearInterval(intervalId);
          setRes(error);
        }
        // console.log(data);
      }, 2000);
    } catch (err) {
      if (err.response === undefined) {
        setRes("Error connecting to backend");
      } else {
        let errMsg = err.response.data.Error.stderr;
        if (errMsg === undefined) errMsg = err.response.data.Error.error;

        const errArr = errMsg.split(".");
        const errStr = errArr[errArr.length - 1];
        console.log(errStr);
        setRes(errStr);
      }
    }
  };
  return (
    <div className="App">
      <h1>Online Code Compiler</h1>
      <div >
        <select
          value={lng}
          onChange={(e) => {
            setLng(e.target.value);
          }}
        >
          <option value="cpp">C++</option>
          <option value="py">Python</option>
        </select>
      </div>
      <br />
      <div style={{
        display:"flex",
        justifyContent:"center",
        alignItems:"center"
      }}>
      <CodeEditor
      value={code}
      language={lng}
      placeholder="Write your code here"
      onChange={(evn) => setCode(evn.target.value)}
      padding={15}
      style={{
        width:"50%",
        height:500,
        fontSize: 12,
        backgroundColor: "#f5f5f5",
        fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
      }}
    />
    </div>
      {/* <textarea
        rows="20"
        cols="75"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
        }}
      >
        {" "}
      </textarea> */}
      <br />
      <button onClick={handleSubmit}>Submit</button>
      <h1>Output is</h1>
      <p>Status : {status}</p>
      <p>Job Id : {jobId}</p>
      <p>Output: {res}</p>
    </div>
  );
}

export default App;
