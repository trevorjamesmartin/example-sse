import React, { useState, useRef } from "react";
import SendMessage from "./SendMessage";
import Message from "./Message";
import { decodeString } from "./b64Utils";
import Axios from "axios";

const StreamEvents = (props) => {
  const [token, setToken] = useState("test");
  const [eventSource, setEventSource] = useState();
  const [toggle, setToggle] = useState(false);
  const [data, setData] = useState(["click connect!"]);
  const bottomRef = useRef();
  const [ctr, setCtr] = useState(0);
  const updateDisplay = (msgs) => {
    setCtr(ctr + 1);
    // const o = msgs.forEach((item) => JSON.parse(item.message));
    setData(
      msgs.map((strItem, index) => {
        const { date, message, token } = JSON.parse(decodeString(strItem));
        // console.log(strItem);
        return <Message key={index} u={token} ts={date} message={message} />;
      })
    );
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const updateToken = (e) => {
    e.preventDefault();
    setToken(e.target.value);
  };

  const startStopEvents = (b) => {
    if (b) {
      if (eventSource) {
        // if already open, close handle
        eventSource.close();
      }
      console.log("start events");
      const es = new EventSource(
        `${process.env.REACT_APP_API}/stream/listen/${token}/${Date.now()}`
      ); // open stream
      es.onmessage = (e) => {
        // console.log(e);
        if (e.data.length > 5) {
          console.log("message received");
          updateDisplay(JSON.parse(e.data)); // process events
        } else {
          switch (e.data) {
            case "1":
              console.log("heart-beat");
              break;
            case "2":
              console.log("refresh");
              ///update/:token/:timestamp
              Axios.get(
                `${
                  process.env.REACT_APP_API
                }/stream/update/${token}/${Date.now()}`
              );
              break;
            default:
              console.log("ping");
          }
        }
      };
      setEventSource(es); // store handle
      setToggle(true);
    } else {
      console.log("stop events");
      if (eventSource) {
        eventSource.close(); // close stream
      }
      setEventSource(undefined); // remove handle
      setToggle(false);
    }
  };

  return (
    <div {...props}>
      <h2>HTML5 Server Sent Events</h2>
      <input value={token} onChange={updateToken} />
      <button
        onClick={() => startStopEvents(!toggle)}
        style={{
          backgroundColor: toggle ? "grey" : "green",
          color: "white",
          padding: "1ch",
          borderRadius: "5px"
        }}
      >
        {!toggle ? "connect" : "disconnect"}
      </button>
      <div
        style={{
          height: "40ch",
          width: "80ch",
          overflowX: "hidden",
          backgroundColor: "blue",
          color: "white",
          borderRadius: "10px",
          padding: "5px"
        }}
      >
        <div>
          {data}
          <div ref={bottomRef} />
        </div>
      </div>
      <SendMessage token={token} isConnected={toggle && ctr > 0} />
    </div>
  );
};

export default StreamEvents;
